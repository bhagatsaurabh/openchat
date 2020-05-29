const express = require("express");
const bodyParser = require("body-parser");
var cors = require("cors");
var history = require('connect-history-api-fallback');
var http = require("http");
var io = require("socket.io");
var firebase = require("firebase");

firebase.initializeApp(<Your Firebase API Key);

var app = express();
const port = process.env.PORT || "8000";
app.set("port", port);
app.use(bodyParser.json());
app.use(cors());

// API Routes Start

// API Routes End

const staticFiles = express.static("client");
app.use(staticFiles);
app.use(
    history({
        disableDotRule: true
    })
);

app.get('/', function (req, res) {
    res.render(path.join(__dirname + '/client/index.html'));
});

const server = http.createServer(app);

io = io(server);

var users = {};

function storeFileInPending(member, data) {
    return new Promise((resolve, reject) => {
        firebase.database().ref("users/" + member + "/pending")
            .update({
                [data.message.fileId]: data.message.fileName,
            })
            .then(() => {
                io.to(users[member]).emit("receiveMessage", {
                    message: data.message,
                    groupId: data.groupId,
                });
                resolve();
            })
            .catch((error) => {
                reject(error);
            });
    });
}

io.on("connection", (socket) => {
    socket.on("start", (data) => {
        if (users[data.name]) {
            socket.emit("startStatus", {
                status: false,
                message: "Already Online",
            });
        } else {
            users[data.name] = socket.id;
            socket.emit("startStatus", {
                status: true,
                message: "",
            });
            console.log("Check In : " + data.name);
        }
    });

    socket.on("broadcastMessage", (data) => {

        var receivingMembers = [...data.members];
        if (receivingMembers.indexOf(data.name) != -1) {
            receivingMembers.splice(receivingMembers.indexOf(data.name), 1);
        }

        if (data.message.fileId == null) {
            for (var member of receivingMembers) {
                if (users[member]) {
                    io.to(users[member]).emit("receiveMessage", {
                        message: data.message,
                        groupId: data.groupId,
                    });
                }
            }
        } else {
            receivingMembersClone = [...receivingMembers];
            receivingMembers = { ...receivingMembers };
            var pendingMembers = {};
            Object.keys(receivingMembers).forEach((key) => {
                pendingMembers[receivingMembers[key]] = key;
            });
            firebase.database().ref("pending/" + data.message.fileId)
                .set(pendingMembers)
                .then(() => {
                    for (var member of receivingMembersClone) {
                        storeFileInPending(member, data)
                            .catch((error) => {
                                console.log(error);
                            });
                    }
                })
                .catch((error) => {
                    console.log(error);
                });
        }
    });

    socket.on("joinedAgroup", (data) => {
        for (var member of data.members) {
            if (users[member]) {
                io.to(users[member]).emit("refresh", {});
            }
        }
    });

    socket.on("disconnect", () => {
        var keys = Object.keys(users);
        for (var i = 0; i < keys.length; i++) {
            if (users[keys[i]] == socket.id) {
                console.log("Check Out : " + keys[i]);
                delete users[keys[i]];
                break;
            }
        }
    });
});

server.on("error", (error) => {
    console.log(error);
});

server.on("listening", () => {
    console.log("Listening on port " + app.get("port") + "...");
});

server.listen(port);
