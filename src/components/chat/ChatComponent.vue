<template>
    <div id="chatContainer">
        <div id="container">
            <chatnav-component
                @sidebarChange="sidebarControl($event)"
            ></chatnav-component>
            <div ref="chatArea" id="chatArea">
                <router-view></router-view>
                <div ref="loadingGroupsContainer" id="loadingGroupsContainer">
                    <img
                        src="../../assets/icons/loadingIcon.gif"
                        width="40"
                        height="40"
                    />
                </div>
            </div>
        </div>
        <div id="mainFooter"></div>
    </div>
</template>

<script>
    import ChatNavComponent from "./chatnav/ChatNavComponent.vue";
    import firebase from 'firebase/app';
    import 'firebase/database';
    import 'firebase/storage';

    export default {
        components: { "chatnav-component": ChatNavComponent },
        name: "chat-component",
        data: () => {
            return {
                isGroupsFetched: false,
                isPendingFetched: false,
            };
        },
        methods: {
            sidebarControl(status) {
                if (status) {
                    this.$refs.chatArea.style.left = "3.5%";
                    this.$refs.chatArea.style.width = "96.5%";
                } else {
                    this.$refs.chatArea.style.left = "0";
                    this.$refs.chatArea.style.width = "100%";
                }
            },
            showLoadingGroups() {
                console.log('ChatComponent : showLoading');
                this.$refs.loadingGroupsContainer.style.pointerEvents = "all";
                this.$refs.loadingGroupsContainer.style.opacity = "1";
            },
            hideLoadingGroups() {
                if (this.isGroupsFetched && this.isPendingFetched) {
                    console.log('ChatComponent : hideLoading');
                    this.$refs.loadingGroupsContainer.style.pointerEvents = "none";
                    this.$refs.loadingGroupsContainer.style.opacity = "0";
                }
            },
            blobRequest(url, fileId, fileName) {
                console.log('ChatComponent : blobRequest : ' + url + ' ' + fileId);
                return new Promise((resolve, reject) => {
                    let xhr = new XMLHttpRequest();
                    xhr.responseType = "blob";
                    xhr.addEventListener("load", (event) => {
                        console.log('ChatComponent : blobRequest : got response ' + xhr.status);
                        if (xhr.status >= 200 && xhr.status < 300) {
                            resolve({
                                data: xhr.response,
                                fileId: fileId,
                                fileName: fileName,
                            });
                        } else {
                            reject({
                                status: xhr.status,
                                statusText: xhr.statusText,
                            });
                        }
                    });
                    xhr.addEventListener("error", (error) => {
                        reject({
                            status: xhr.status,
                            statusText: xhr.statusText,
                        });
                    });
                    xhr.open("GET", url);
                    console.log('ChatComponent : blobRequest : sending');
                    xhr.send();
                });
            },
            fetchFileAndStore(fileId, fileName) {
                console.log('ChatComponent : fetchFileAndStore : ' + fileId + ' ' + fileName);
                return new Promise((resolve, reject) => {
                    console.log('ChatComponent : fetchFileAndStore : fetching file url');
                    firebase.storage().ref("file/" + fileId).getDownloadURL()
                        .then((url) => {
                            console.log('ChatComponent : fetchFileAndStore : got url');
                            this.blobRequest(url, fileId, fileName)
                                .then((fileData) => {
                                    console.log('ChatComponent : fetchFileAndStore : got blob data');
                                    let newFile = new File([fileData.data], fileName);

                                    console.log('ChatComponent : fetchFileAndStore : saving to local');
                                    this.$store.state.db.transaction("file", "readwrite").objectStore("file")
                                        .put(newFile, fileId)
                                        .onsuccess = (event2) => {
                                            console.log('ChatComponent : fetchFileAndStore : file saved to local');
                                            resolve({
                                                fileId: fileId,
                                                fileName: fileName,
                                            });
                                    };
                                })
                                .catch((error) => {
                                    reject({
                                        error: error.statusText,
                                        fileId: fileId,
                                        fileName: fileName,
                                    });
                                });
                        })
                        .catch((error) => {
                            reject({
                                error: error,
                                fileId: fileId,
                                fileName: fileName,
                            });
                        });
                });
            },
            deleteUserFromPending(fileId) {
                console.log('ChatComponent : deleteUserFromPending : ' + fileId);
                return new Promise((resolve, reject) => {
                    console.log('ChatComponent : deleteUserFromPending : removing from users/{name}/pending/{fileId}');
                    firebase.database().ref("users/" + this.$store.state.name + "/pending/" + fileId).remove()
                    .then(() => {
                        console.log('ChatComponent : deleteUserFromPending : removing from pending/{fileId}/{name}');
                        firebase.database().ref("pending/" + fileId + "/" + this.$store.state.name).remove()
                            .then(() => {
                                console.log('ChatComponent : deleteUserFromPending : checking if all users received');
                                firebase.database().ref("pending/" + fileId).once("value")
                                    .then((sn) => {
                                        if (sn.val() == null) {
                                            console.log('ChatComponent : deleteUserFromPending : all users received');
                                            console.log('ChatComponent : deleteUserFromPending : deleting file from server');
                                            firebase.storage().ref("file/" + fileId).delete()
                                            .then(() => {
                                                console.log('ChatComponent : deleteUserFromPending : file deleted');
                                            })
                                            .catch((error) => {
                                                console.log('ChatComponent : deleteUserFromPending : file already deleted');
                                            });
                                        }
                                    })
                                    .catch((error) => {
                                        reject(error);
                                    });
                            })
                            .catch((error) => {
                                reject(error);
                            });
                    })
                    .catch((error) => {
                        reject(error);
                    });
                });
            }
        },
        props: ["name", "fetch"],
        mounted() {
            console.info('ChatComponent : mounted');
            this.$store.state.socket.on("receiveMessage", (data) => {
                console.log('ChatComponent : mounted : got \'receiveMessage\' signal');
                if (!this.$store.state.groups[data.groupId].messages) {
                    this.$store.state.groups[data.groupId].messages = [];
                }
                if (data.message.fileId != null) {
                    console.log('ChatComponent : mounted : message contains file');
                    // fetch from cloud and store
                    console.log('ChatComponent : mounted : fetching and storing');
                    this.fetchFileAndStore(data.message.fileId, data.message.fileName)
                        .then(() => {
                            console.log('ChatComponent : mounted : fetch and store success');
                            this.$store.state.groups[data.groupId].messages.push(data.message);
                            console.log('ChatComponent : mounted : emitting \'updateMessages\'');
                            this.$root.$emit("updateMessages");
                            console.log('ChatComponent : mounted : emitting \'updateRecent\'');
                            this.$root.$emit("updateRecent");
                            console.log('ChatComponent : mounted : deleting user from pending');
                            this.deleteUserFromPending(data.message.fileId)
                                .catch((error) => {
                                    this.$root.$emit("errorMessage", "No_Delete_User");
                                    console.log(error);
                                });
                        })
                        .catch((errorData) => {
                            this.$root.$emit("errorMessage", "No_Shared_File");
                            console.log(errorData.error);
                        });
                } else {
                    console.log('ChatComponent : mounted : simple message');
                    this.$store.state.groups[data.groupId].messages.push(data.message);
                    console.log('ChatComponent : mounted : emitting \'updateMessages\'');
                    this.$root.$emit("updateMessages");
                    console.log('ChatComponent : mounted : emitting \'updateRecent\'');
                    this.$root.$emit("updateRecent");
                }
            });

            if (fetch) {
                console.log('ChatComponent : mounted : HomeComponent told to fetch data');
                this.showLoadingGroups();
                console.log('ChatComponent : mounted : fetching users/{name}/groups');
                firebase.database().ref("users/" + this.name + "/groups").once("value")
                    .then((data) => {
                        if (data.val()) {
                            var groupIds = data.val();
                            var promises = [];
                            for (var i = 0; i < groupIds.length; i++) {
                                promises.push(firebase.database().ref("groups/" + groupIds[i]).once("value"));
                            }
                            console.log('ChatComponent : mounted : fetching all group info');
                            Promise.all(promises)
                                .then((snapshots) => {
                                    if (snapshots) {
                                        var groups = {};
                                        for (var i = 0; i < snapshots.length; i++) {
                                            groups[snapshots[i].key] = snapshots[i].val();
                                        }
                                        this.$store.state.groups = groups;
                                        console.log('ChatComponent : mounted : got all group info');
                                        this.isGroupsFetched = true;
                                        this.hideLoadingGroups();
                                    }
                                })
                                .catch((error) => {
                                    this.isGroupsFetched = true;
                                    this.$root.$emit("errorMessage", "No_Get_Group");
                                    this.hideLoadingGroups();
                                });
                        } else {
                            this.isGroupsFetched = true;
                            this.hideLoadingGroups();
                        }
                    })
                    .catch((error) => {
                        this.isGroupsFetched = true;
                        this.$root.$emit("errorMessage", "No_Get_Group");
                        this.hideLoadingGroups();
                    });
            }

            this.showLoadingGroups();
            console.log('ChatComponent : mounted : fetching users/{name}/pending');
            firebase.database().ref("users/" + this.$store.state.name + "/pending").once("value")
                .then((snap) => {
                    if (snap.val() == null) {
                        console.log('ChatComponent : mounted : no pending files');
                        this.isPendingFetched = true;
                        this.hideLoadingGroups();
                    } else {
                        console.log('ChatComponent : mounted : pending files');
                        var fileIds = Object.keys(snap.val());
                        var fileNames = Object.values(snap.val());

                        this.isPendingFetched = true;
                        this.hideLoadingGroups();

                        for (var i = 0; i < fileIds.length; i++) {
                            this.fetchFileAndStore(fileIds[i], fileNames[i])
                                .then((fileData) => {
                                    this.$root.$emit(fileData.fileId);
                                    this.deleteUserFromPending(fileData.fileId)
                                        .catch((error) => {
                                            this.isPendingFetched = true;
                                            this.$root.$emit("errorMessage", "No_File_Update");
                                            this.hideLoadingGroups();
                                            console.log(error);
                                        });
                                })
                                .catch((errorData) => {
                                    this.isPendingFetched = true;
                                    this.$root.$emit("errorMessage", "No_Shared_File");
                                    this.hideLoadingGroups();
                                    console.log(errorData);
                                });
                        }
                    }
                })
                .catch((error) => {
                    this.isPendingFetched = true;
                    this.$root.$emit("errorMessage", "No_Shared_File_Info");
                    this.hideLoadingGroups();
                    console.log(error);
                });
        },
        beforeDestroy() {
            console.info('ChatComponent : destroying');
        },
    };
</script>

<style>
    #chatContainer {
        position: absolute;
        width: 100%;
        height: 100%;
    }
    #container {
        position: absolute;
        width: 100%;
        height: 99%;
    }
    #mainFooter {
        position: absolute;
        z-index: 6;
        width: 100%;
        height: 1%;
        top: 99%;
        background-color: gray;
        box-shadow: 0 0 3px 0.5px;
    }
    #leftSidebar {
        position: absolute;
        left: 0;
        display: flex;
        flex-direction: column;
        justify-content: flex-start;
        align-items: center;
        width: 3.5%;
        height: 100%;
        background-image: linear-gradient(
            rgb(167, 130, 255),
            rgb(137, 154, 255),
            rgb(159, 209, 255)
        );
        box-shadow: 0px 0px 4px 2px rgb(99, 99, 99);
        transition: left 0.2s linear;
        z-index: 5;
    }
    #chatArea {
        position: absolute;
        left: 3.5%;
        top: 0;
        width: 96.5%;
        height: 100%;
        background-color: #eee;
        transition: left 0.2s linear, width 0.2s linear;
    }
    #sidebarControl {
        position: absolute;
        left: 100%;
        top: 0;
        width: 6vh;
        height: 4vh;
        cursor: pointer;
        background-color: rgb(202, 202, 202);
        box-shadow: 2px 2px 2px 0.5px rgb(124, 124, 124);
    }
    #sidebarControlIcon {
        position: relative;
        width: 100%;
        height: 100%;
        background-image: url("../../assets/icons/left-arrow.png");
        background-position: center;
        background-repeat: no-repeat;
        background-size: 35%;
        transition: transform 0.2s linear;
    }
    .leftSidebarItem {
        position: relative;
        width: 100%;
    }
    .leftSidebarItem:after {
        content: "";
        display: block;
        padding-bottom: 100%;
    }
    .sidebarIcon {
        position: absolute;
        width: 100%;
        height: 100%;
        cursor: pointer;
        background-position: center;
        background-repeat: no-repeat;
        background-size: 50%;
        opacity: 0.6;
    }
    .sidebarIcon:hover {
        box-shadow: 0px 0px 4px 2px;
    }
    #newGroupIcon {
        background-image: url("../../assets/icons/round-add-button.png");
    }
    #groupsIcon {
        background-image: url("../../assets/icons/multiple-users-silhouette.png");
    }
    #loadingGroupsContainer {
        position: absolute;
        width: 100%;
        height: 100%;
        pointer-events: none;
        opacity: 0;
        display: flex;
        justify-content: center;
        align-items: center;
    }
</style>
