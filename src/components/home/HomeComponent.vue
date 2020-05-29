<template>
    <div id="homeContainer">
        <div ref="logoContainer" id="logoContainer" transition>
            <div id="logoText">OpenChat</div>
        </div>
        <div ref="divider" id="divider"></div>
        <div ref="navContainer" id="navContainer">
            <nav-component
                @startchat="launch($event)"
                ref="navComponent"
            ></nav-component>
        </div>
    </div>
</template>

<script>
    import NavigationComponent from "./navigation/NavigationComponent.vue";
    import firebase from 'firebase/app';
    import 'firebase/database';
    import 'firebase/storage';

    export default {
        components: { "nav-component": NavigationComponent },
        name: "home-component",
        data() {
            return {
                name: null,
                fetch: false,
            };
        },
        methods: {
            welcomeAnimation() {
                console.info('HomeComponent : welcomeAnimation');
                if (typeof this.$refs.navContainer != "undefined" && typeof this.$refs.logoContainer != "undefined" && typeof this.$refs.divider != "undefined") {
                    this.$refs.navContainer.style.left = "31%";
                    this.$refs.navContainer.style.width = "69%";
                    this.$refs.logoContainer.style.left = "0";
                    this.$refs.divider.style.left = "30%";
                }
            },
            launch(name) {
                console.log('HomeComponent : launch : ' + name);
                if (name) {
                    if (this.$store.state.name == name && this.$store.state.groups != {}) {
                        console.log('HomeComponent : launch : same user name');
                        console.log('HomeComponent : launch : checking firebase connection');
                        firebase.database().ref(".info/connected")
                            .on("value", (snap) => {
                                if (snap.val() === true) {
                                    console.log('HomeComponent : launch : firebase connected');
                                    this.$refs.navComponent.stopLoadingIcon();
                                    if (this.fetch) {
                                        this.$router.push({
                                            name: "chat",
                                            params: {
                                                name: this.$store.state.name,
                                                fetch: true,
                                            },
                                        });
                                    } else {
                                        this.$router.push({
                                            name: "chat",
                                            params: {
                                                name: this.$store.state.name,
                                                fetch: false,
                                            },
                                        });
                                    }
                                } else {
                                    console.log('HomeComponent : launch : firebase not connected');
                                    this.$refs.navComponent.stopLoadingIcon();
                                    this.$root.$emit("errorMessage","No_Connection");
                                }
                            });
                    } else {
                        this.$store.state.name = name;
                        console.log('HomeComponent : launch : new/different user name');
                        console.log('HomeComponent : launch : sending \'start\' signal');
                        this.$store.state.socket.emit("start", {
                            name: name,
                        });
                    }
                } else {
                    this.$refs.navComponent.stopLoadingIcon();
                }
            },
        },
        mounted() {
            console.info('HomeComponent : mounted');
            setTimeout(() => {
                this.welcomeAnimation();
            }, 1000);

            this.$store.state.socket.on("startStatus", (data) => {
                console.log('HomeComponent : mounted : got \'startStatus\' signal');
                if (data.status) {
                    console.log('HomeComponent : mounted : signal is true');
                    console.log('HomeComponent : mounted : checking firebase connection');
                    firebase.database().ref(".info/connected")
                        .on("value", (snap) => {
                            if (snap.val() === true) {
                                console.log('HomeComponent : mounted : firebase connected');
                                console.log('HomeComponent : mounted : fetching users/{name}');
                                firebase.database().ref("users/" + this.$store.state.name).once("value")
                                    .then((snapshot) => {
                                        if (snapshot.val() == null && data.status) {
                                            console.log('HomeComponent : mounted : user not in database');
                                            this.fetch = false;
                                            this.$refs.navComponent.stopLoadingIcon();
                                            this.$router.push({
                                                name: "chat",
                                                params: {
                                                    name: this.$store.state
                                                        .name,
                                                    fetch: false,
                                                },
                                            });
                                        } else if (snapshot.val() && data.status) {
                                            console.log('HomeComponent : mounted : user in database');
                                            this.fetch = true;
                                            this.$refs.navComponent.stopLoadingIcon();
                                            this.$router.push({
                                                name: "chat",
                                                params: {
                                                    name: this.$store.state.name,
                                                    fetch: true,
                                                },
                                            });
                                        }
                                    })
                                    .catch((error) => {
                                        this.$root.$emit("errorMessage", "No_Data_Fetch");
                                        console.log(error);
                                        this.$refs.navComponent.stopLoadingIcon();
                                    });
                            } else {
                                console.log('HomeComponent : mounted : firebase not connected');
                                this.$root.$emit("errorMessage", "No_Connection");
                                this.$refs.navComponent.stopLoadingIcon();
                            }
                        });
                } else {
                    console.log('HomeComponent : mounted : user is already online');
                    this.$root.$emit("errorMessage", "User_Online");
                    this.$refs.navComponent.stopLoadingIcon();
                }
            });

            this.$store.state.socket.on("refresh", () => {
                console.log('HomeComponent : mounted : got \'refresh\' signal');
                console.log('HomeComponent : mounted : fetching users/{name}/groups');
                firebase.database().ref("users/" + this.$store.state.name + "/groups").once("value")
                    .then((data) => {
                        if (data.val()) {
                            var groupIds = data.val();
                            var promises = [];
                            for (var i = 0; i < groupIds.length; i++) {
                                promises.push(firebase.database().ref("groups/" + groupIds[i]).once("value"));
                            }
                            console.log('HomeComponent : mounted : fetching every group info');
                            Promise.all(promises)
                                .then((snapshots) => {
                                    if (snapshots) {
                                        console.log('HomeComponent : mounted : got all group info');
                                        var groups = {};
                                        for (var i = 0; i < snapshots.length; i++) {
                                            groups[snapshots[i].key] = snapshots[i].val();
                                        }
                                        this.$store.state.groups = groups;
                                        console.log('HomeComponent : mounted : emitting \'refresh\'');
                                        this.$root.$emit("refresh");
                                    }
                                })
                                .catch((error) => {
                                    this.$root.$emit("errorMessage", "No_Group_Info");
                                    console.log(error);
                                });
                        }
                    })
                    .catch((error) => {
                        this.$root.$emit("errorMessage", "No_Group_Info");
                        console.log(error);
                    });
            });
        },
    };
</script>

<style>
    #homeContainer {
        display: flex;
        position: relative;
        width: 100%;
        height: 100%;
    }
    #logoContainer {
        position: absolute;
        display: flex;
        flex-direction: column;
        justify-content: center;
        align-items: center;
        left: -31%;
        top: 0;
        width: 30%;
        height: 100%;
        background-image: linear-gradient(
            rgb(205, 255, 172),
            #49ff80,
            rgb(111, 250, 255)
        );
        z-index: 5;
        transition: left 0.4s ease-out;
    }
    #logoText {
        font-size: 4em;
        color: rgb(85, 85, 85);
    }
    #logoTagLine {
        margin-top: 2vh;
    }
    #divider {
        position: absolute;
        left: -1%;
        top: 0;
        width: 1%;
        height: 100%;
        background-color: rgb(182, 255, 45);
        box-shadow: 3px 0px 3px 0px rgb(94, 94, 94);
        z-index: 5;
        transition: left 0.4s ease-out;
    }
    #navContainer {
        position: absolute;
        display: flex;
        flex-direction: column;
        justify-content: center;
        align-items: center;
        left: 0;
        top: 0;
        width: 100%;
        height: 100%;
        background-image: linear-gradient(
            to right,
            rgb(196, 233, 30),
            rgb(255, 213, 97),
            rgb(255, 253, 154)
        );
        transition: left 0.4s ease-out, width 0.4s ease-out;
    }
    #fadeDiv {
        z-index: 10;
        pointer-events: none;
        position: absolute;
        width: 100%;
        height: 100%;
        opacity: 0;
        transition: opacity 0.3s linear;
    }
    input[type="text"] {
        margin: 0;
        padding: 0;
    }
</style>
