<template>
    <div id="newgroupContainer">
        <div id="textContainer">Create new group</div>
        <input
            spellcheck="false"
            placeholder="group name"
            id="inputGroup"
            v-model="groupName"
            @keyup="keyUp($event)"
        />
        <div @click="createGroup()" id="createButton">Create</div>
        <img
            ref="createGroupLoading"
            id="createGroupLoading"
            src="../../../assets/icons/loadingIcon.gif"
            width="32"
            height="32"
            class="loadingIcon"
        />
    </div>
</template>

<script>
    import firebase from 'firebase/app';
    import 'firebase/database';
    import 'firebase/storage';

    export default {
        name: "newgroup-component",
        data: () => {
            return {
                groupName: "",
                name: "",
                possible: "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789",
                isCreating: false,
            };
        },
        methods: {
            keyUp(e) {
                if (e.keyCode == 13) {
                    this.createGroup();
                }
            },
            startCreateLoading() {
                console.log('NewGroupComponent : startCreateLoading');
                this.$refs.createGroupLoading.style.opacity = "1";
                this.isCreating = true;
            },
            stopCreateLoading() {
                console.log('NewGroupComponent : stopCreateLoading');
                this.$refs.createGroupLoading.style.opacity = "0";
                this.isCreating = false;
            },
            createGroup() {
                if (this.isCreating) return;
                this.startCreateLoading();
                console.log('NewGroupComponent : createGroup');
                var id = this.generateID(10);
                if (this.groupName != null && this.groupName != "") {
                    console.log('NewGroupComponent : createGroup : fetching groupsIds/{groupName}');
                    firebase.database().ref("groupIds/" + this.groupName).once("value")
                        .then((snapshot) => {
                            if (snapshot.val()) {
                                this.stopCreateLoading();
                                console.log('NewGroupComponent : createGroup : group already exists');
                                this.$root.$emit("errorMessage", "Group_Exists");
                            } else {
                                console.log('NewGroupComponent : createGroup : updating groups');
                                firebase.database().ref("groups")
                                    .update({
                                        [id]: {
                                            name: this.groupName,
                                            members: [this.name],
                                            id: id,
                                        },
                                    })
                                    .then(() => {
                                        console.log('NewGroupComponent : createGroup : groups updated');
                                        console.log('NewGroupComponent : createGroup : fetching users/{name}/groups');
                                        firebase.database().ref("users/" + this.name + "/groups")
                                            .once("value")
                                            .then((data) => {
                                                var index = 0;
                                                if (data.val()) {
                                                    index = data.val().length;
                                                }
                                                console.log('NewGroupComponent : createGroup : updating users/{name}/groups');
                                                firebase.database().ref("users/" + this.name + "/groups")
                                                    .update({
                                                        [index]: id,
                                                    })
                                                    .then(() => {
                                                        console.log('NewGroupComponent : createGroup : users/{name}/groups updated');
                                                        console.log('NewGroupComponent : createGroup : fetching groupsIds/{groupName}');
                                                        firebase.database().ref("groupIds/" + this.groupName)
                                                            .once("value")
                                                            .then((snapshot) => {
                                                                    if (snapshot.val()) {
                                                                        this.$root.$emit("errorMessage","Group_Exists");
                                                                    } else {
                                                                        console.log('NewGroupComponent : createGroup : updating groupsIds');
                                                                        firebase.database().ref("groupIds")
                                                                            .update({[this.groupName]: id})
                                                                            .then(() => {
                                                                                console.log('NewGroupComponent : createGroup : groupsIds updated');
                                                                                this.$store.state.groups[id] = {
                                                                                    name: this.groupName,
                                                                                    members: [this.name],
                                                                                    id: id,
                                                                                };
                                                                                this.stopCreateLoading();
                                                                                console.log('NewGroupComponent : createGroup : emitting \'selectGroup\'');
                                                                                this.$root.$emit("selectGroup");
                                                                                this.$router.push(
                                                                                    {
                                                                                        path: "/chat/groups",
                                                                                    }
                                                                                );
                                                                            })
                                                                            .catch((error) => {
                                                                                    this.$root.$emit("errorMessage", "No_Create_Group");
                                                                                    this.stopCreateLoading();
                                                                                    console.log(error);
                                                                                });
                                                                    }
                                                            })
                                                            .catch((error) => {
                                                                this.$root.$emit("errorMessage","No_Group_Info");
                                                                this.stopCreateLoading();
                                                                console.log(error);
                                                            });
                                                    })
                                                    .catch((error) => {
                                                        this.$root.$emit("errorMessage","No_Create_Group");
                                                        this.stopCreateLoading();
                                                        console.log(error);
                                                    });
                                            })
                                            .catch((error) => {
                                                this.$root.$emit("errorMessage","No_Group_Info");
                                                this.stopCreateLoading();
                                                console.log(error);
                                            });
                                    })
                                    .catch((error) => {
                                        this.$root.$emit("errorMessage", "No_Create_Group");
                                        this.stopCreateLoading();
                                        console.log(error);
                                    });
                            }
                        })
                        .catch((error) => {
                            this.$root.$emit("errorMessage", "No_Group_Info");
                            this.stopCreateLoading();
                            console.log(error);
                        });
                } else {
                    this.$root.$emit("errorMessage", "No_Group_Name");
                    this.stopCreateLoading();
                }
            },
            generateID(length) {
                var id = "";
                for (var i = 0; i < length; i++) {
                    id += this.possible.charAt(Math.floor(Math.random() * this.possible.length));
                }
                return id;
            },
        },
        beforeMount() {
            console.info('NewGroupComponent : beforeMount');
            this.name = this.$store.state.name;
        },
        beforeDestroy() {
            console.info('NewGroupComponent : destroying');
        },
    };
</script>

<style>
    #newgroupContainer {
        position: relative;
        width: 100%;
        height: 100%;
        display: flex;
        flex-direction: column;
        justify-content: center;
        align-items: center;
    }
    #textContainer {
        text-align: center;
        font-size: 2.5em;
        color: rgb(124, 124, 124);
        margin-bottom: 2vh;
    }
    #inputGroup {
        border: none;
        border-radius: 999px;
        padding-left: 2vh;
        padding-right: 2vh;
        padding-top: 1vh;
        padding-bottom: 1vh;
        margin-bottom: 2vh;
        text-align: center;
        font-size: 1.2em;
        border: 1px solid gray;
    }
    #inputGroup:focus {
        outline: none;
    }
    #createButton {
        padding-left: 4vh;
        padding-right: 4vh;
        padding-top: 1vh;
        padding-bottom: 1vh;
        border-radius: 999px;
        background-color: rgb(138, 255, 200);
        color: rgb(46, 46, 46);
        cursor: pointer;
        font-weight: bold;
        border: 1px solid green;
        margin-bottom: 2vh;
    }
    #createGroupLoading {
        opacity: 0;
    }
</style>
