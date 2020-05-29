<template>
    <div id="messagingContainer">
        <input
            @change="fileSelected($event)"
            ref="attachFile"
            id="attachFile"
            type="file"
        />
        <div id="header">
            <div id="groupheaderIcon"></div>
            <div id="groupheaderInfo">
                <div id="groupHeaderName">
                    {{ this.$store.state.groups[id].name }}
                </div>
                <div id="groupHeaderMembers">
                    <div
                        class="memberName"
                        v-for="(member, index) in this.$store.state.groups[id].members"
                        :key="index">
                        {{
                            (index == 0 ? "" : ", ") + member
                        }}
                    </div>
                </div>
            </div>
        </div>
        <div ref="messagesContainer" id="messagesContainer">
            <div id="messages">
                <message-component
                    v-for="(message, index) in this.$store.state.groups[id].messages"
                    :key="index"
                    :message="message"
                ></message-component>
            </div>
        </div>
        <div id="footer">
            <div id="composeContainer">
                <input
                    @keyup="keyUp($event)"
                    placeholder="Write here..."
                    type="text"
                    v-model="composeText"
                    id="composeText"/>
            </div>
            <div @click="sendNew(null, null)" id="sendContainer">
                Send
                <img
                    ref="sendLoading"
                    id="sendLoading"
                    src="../../../../assets/icons/loadingIcon.gif"
                    width="20"
                    height="20"/>
            </div>
            <div @click="openDialog()" id="attachContainer">
                <div id="attachIcon"></div>
            </div>
        </div>
    </div>
</template>

<script>
    import Message from "./message/Message.vue";
    import firebase from 'firebase/app';
    import 'firebase/database';
    import 'firebase/storage';

    export default {
        components: { "message-component": Message },
        name: "messaging-component",
        data: () => {
            return {
                composeText: "",
                isSending: false,
                possible: "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789",
            };
        },
        props: ["group", "id"],
        methods: {
            fileSelected(event) {
                if (typeof event.target.files[0] != "undefined") {
                    console.log('MessagingComponent : fileSelected : ' + event.target.files[0].name);
                    let fileId = this.generateID(10);
                    console.log('MessagingComponent : fileSelected : saving in local');
                    this.$store.state.db.transaction("file", "readwrite").objectStore("file").put(event.target.files[0], fileId)
                        .onsuccess = (event2) => {
                            console.log('MessagingComponent : fileSelected : file saved in local');
                            console.log('MessagingComponent : fileSelected : sending...');
                            this.sendNew(fileId, event.target.files[0]);
                        };
                } else {
                    this.stopSendLoading();
                }
            },
            openDialog() {
                this.startSendLoading();
                this.$refs.attachFile.click();
            },
            sendNew(fileId, file) {
                if ((this.composeText == "" || this.composeText.trim() == "" || this.isSending) && fileId == null)
                    return;
                this.isSending = true;
                this.startSendLoading();
                console.log('MessagingComponent : sendNew : ' + this.composeText + ' ' + fileId + ' ' + ((file != null) ? file.name : ''));
                console.log('MessagingComponent : sendNew : fetching groups/{groupId}/messasges');
                firebase.database().ref("groups/" + this.id + "/messages").once("value")
                    .then((data) => {
                        var index = 0;
                        if (data.val()) {
                            index = data.val().length;
                        }
                        console.log('MessagingComponent : sendNew : updating groups/{groupId}/messages');
                        firebase.database().ref("groups/" + this.id + "/messages")
                            .update({
                                [index]: {
                                    from: this.$store.state.name,
                                    message: this.composeText,
                                    fileId: fileId,
                                    fileName: file != null ? file.name : null,
                                    fileType: file != null ? file.type : null,
                                },
                            })
                            .then(() => {
                                console.log('MessagingComponent : sendNew : groups/{groupId}/messages updated');
                                if (fileId != null) {
                                    console.log('MessagingComponent : sendNew : message contains file');
                                    console.log('MessagingComponent : sendNew : storing file on server');
                                    firebase.storage().ref("file/" + fileId).put(file)
                                        .on("state_changed", (progress) => {},
                                        (error) => {
                                            console.log(error);
                                            this.$root.$emit("errorMessage", "No_File_Store");
                                            this.isSending = false;
                                        }, () => {
                                            console.log('MessagingComponent : sendNew : file stored on server');
                                            console.log('MessagingComponent : sendNew : fetching groups/{groupId}/members');
                                            firebase.database().ref("groups/" + this.id + "/members").once("value")
                                                .then((snapshot) => {
                                                    console.log('MessagingComponent : sendNew : sending \'broadcastMessage\' signal');
                                                    this.$store.state.socket.emit("broadcastMessage",
                                                        {
                                                            name: this.$store.state.name,
                                                            groupId: this.id,
                                                            members: snapshot.val(),
                                                            message: {
                                                                from: this.$store.state.name,
                                                                message: this.composeText,
                                                                fileId: fileId,
                                                                fileName: (file != null ? file.name : null),
                                                                fileType: (file != null ? file.type : null),
                                                            },
                                                        });
                                                        this.composeText = '';
                                                    })
                                                    .catch((error) => {
                                                        this.$root.$emit("errorMessage", "No_Member_Info");
                                                        this.stopSendLoading();
                                                        console.log(error);
                                                    });

                                            if (!this.group.messages) {
                                                this.group.messages = [];
                                            }
                                            if (!this.$store.state.groups[this.id].messages) {
                                                this.$store.state.groups[this.id].messages = [];
                                            }
                                            this.$store.state.groups[this.id].messages.push({
                                                from: this.$store.state.name,
                                                message: this.composeText,
                                                fileId: fileId,
                                                fileName: (file != null ? file.name : null),
                                                fileType: (file != null ? file.type : null),
                                            });
                                            this.$forceUpdate();

                                            setTimeout(() => {
                                                this.scrollToEnd();
                                            }, 50);

                                            console.log('MessagingComponent : sendNew : emitting \'updateRecent\'');
                                            this.$root.$emit('updateRecent');
                                            this.isSending = false;
                                            this.stopSendLoading();
                                        });
                                } else {
                                    console.log('MessagingComponent : sendNew : simple message');
                                    console.log('MessagingComponent : sendNew : fetching grousp/{groupId}/members');
                                    firebase.database().ref("groups/" + this.id + "/members").once("value")
                                        .then((snapshot) => {
                                            console.log('MessagingComponent : sendNew : sending \'broadcastMessage\' signal');
                                            this.$store.state.socket.emit("broadcastMessage",
                                                {
                                                    name: this.$store.state.name,
                                                    groupId: this.id,
                                                    members: snapshot.val(),
                                                    message: {
                                                        from: this.$store.state.name,
                                                        message: this.composeText,
                                                        fileId: fileId,
                                                        fileName: (file != null ? file.name : null),
                                                        fileType: (file != null ? file.type : null),
                                                    },
                                                });
                                            this.composeText = '';
                                        })
                                        .catch((error) => {
                                            this.$root.$emit("errorMessage", "No_Member_Info");
                                            this.stopSendLoading();
                                            console.log(error);
                                        });

                                    if (!this.group.messages) {
                                        this.group.messages = [];
                                    }
                                    if (!this.$store.state.groups[this.id].messages) {
                                        this.$store.state.groups[this.id].messages = [];
                                    }
                                    this.$store.state.groups[this.id].messages.push({
                                        from: this.$store.state.name,
                                        message: this.composeText,
                                        fileId: fileId,
                                        fileName: (file != null ? file.name : null),
                                        fileType: (file != null ? file.type : null),
                                    });
                                    this.$forceUpdate();

                                    setTimeout(() => {
                                        this.scrollToEnd();
                                    }, 50);

                                    console.log('MessagingComponent : sendNew : emitting \'updateRecent\'');
                                    this.$root.$emit('updateRecent');
                                    this.isSending = false;
                                    this.stopSendLoading();
                                }
                            })
                            .catch((error) => {
                                this.$root.$emit("errorMessage", "No_Update_Message");
                                console.log(error);
                                this.stopSendLoading();
                                this.isSending = false;
                            });
                    })
                    .catch((error) => {
                        this.$root.$emit("errorMessage", "No_Get_Message");
                        console.log(error);
                        this.stopSendLoading();
                        this.isSending = false;
                    });
            },
            scrollToEnd() {
                this.$refs.messagesContainer.scrollTop = this.$refs.messagesContainer.scrollHeight;
            },
            keyUp(e) {
                if (e.keyCode == 13) {
                    this.sendNew(null, null);
                }
            },
            startSendLoading() {
                console.log('MessagingComponent : startSendLoading');
                this.$refs.sendLoading.style.opacity = "1";
                this.sendLoading = true;
            },
            stopSendLoading() {
                console.log('MessagingComponent : stopSendLoading');
                this.$refs.sendLoading.style.opacity = "0";
                this.sendLoading = false;
            },
            generateID(length) {
                var id = "";
                for (var i = 0; i < length; i++) {
                    id += this.possible.charAt(Math.floor(Math.random() * this.possible.length));
                }
                return id;
            },
        },
        mounted() {
            console.info('MessagingComponent : mounted');
            this.$root.$on("updateMessages", () => {
                console.log('MessagingComponent : mounted : got \'updateMessages\' signal');
                this.$forceUpdate();
                setTimeout(() => {
                    this.scrollToEnd();
                }, 50);
            });
        },
        updated() {
            this.scrollToEnd();
        },
        beforeDestroy() {
            console.info('MessagingComponent : destroying');;
        },
    };
</script>

<style>
    #messagingContainer {
        position: relative;
        width: 100%;
        height: 100%;
    }
    #header {
        position: absolute;
        height: 12%;
        width: 100%;
        box-shadow: 0 8px 6px -6px;
        z-index: 3;
    }
    #groupheaderIcon {
        position: absolute;
        height: 100%;
        width: 10vh;
        background-image: url("../../../../assets/icons/multiple-users-silhouette.png");
        background-position: center;
        background-repeat: no-repeat;
        background-size: 50%;
        opacity: 0.6;
    }
    #groupheaderInfo {
        position: absolute;
        left: 10vh;
        width: calc(100% - 10vh);
        height: 100%;
    }
    #groupHeaderName {
        display: flex;
        position: absolute;
        width: 100%;
        height: 60%;
        font-size: 1.3em;
        justify-content: flex-start;
        align-items: center;
    }
    #groupHeaderMembers {
        position: absolute;
        top: 60%;
        width: 100%;
        height: 40%;
        font-size: 0.9em;
        display: flex;
        flex-direction: row;
        justify-content: flex-start;
        align-items: center;
    }
    #messagesContainer {
        position: absolute;
        top: 12%;
        height: 78%;
        width: 100%;
        z-index: 2;
        overflow-y: auto;
        padding: 2vh;
        box-sizing: border-box;
    }
    #footer {
        position: absolute;
        width: 100%;
        height: 10%;
        top: 90%;
        box-shadow: 0 -5px 5px -5px;
        z-index: 3;
    }
    #composeContainer {
        position: absolute;
        height: 100%;
        width: 80%;
    }
    input[type="text"] {
        margin: 0;
        padding: 0;
    }
    #composeText {
        position: absolute;
        width: 90%;
        left: 5%;
        height: 80%;
        top: 10%;
        border: none;
        box-sizing: border-box;
        padding-left: 4vh;
        padding-right: 4vh;
        border-radius: 999px;
        background-color: unset;
        border: 1px solid gray;
    }
    #composeText:focus {
        outline: none;
    }
    #sendContainer {
        position: absolute;
        height: 100%;
        width: 10%;
        left: 80%;
        display: flex;
        justify-content: center;
        align-items: center;
        background-color: rgb(202, 202, 202);
        cursor: pointer;
        transition: background-color 0.2s linear;
    }
    #sendContainer:hover {
        background-color: rgb(150, 150, 150);
    }
    #attachContainer {
        position: absolute;
        height: 100%;
        width: 10%;
        left: 90%;
        display: flex;
        justify-content: center;
        align-items: center;
        background-color: rgb(202, 202, 202);
        cursor: pointer;
        border-left: 1px solid rgb(100, 100, 100);
        transition: background-color 0.2s linear;
    }
    #attachContainer:hover {
        background-color: rgb(150, 150, 150);
    }
    #attachIcon {
        position: absolute;
        width: 30%;
        padding-bottom: 30%;
        background-position: center;
        background-repeat: no-repeat;
        background-size: 80%;
        background-image: url("../../../../assets/icons/attachIcon.png");
    }
    .memberName {
        color: rgb(85, 85, 85);
    }
    #messages {
        bottom: 2vh;
    }
    #sendLoading {
        position: absolute;
        left: calc(-10% - 20px);
        top: calc(50% - 10px);
        opacity: 0;
        pointer-events: none;
    }
    #attachFile {
        position: absolute;
        visibility: hidden;
        pointer-events: none;
    }
</style>
