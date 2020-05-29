<template>
    <div id="groupsContainer">
        <div id="groupsListContainer">
            <div id="searchContainer">
                <div id="searchIcon"></div>
                <div id="searchInput">
                    <input
                        spellcheck="false"
                        placeholder="Join group"
                        type="text"
                        @keyup="search()"
                        v-model="searchText"
                        id="searchText"
                    />
                </div>
                <div @click="addGroup()" id="addGroupIcon">
                    <img
                        ref="joinLoading"
                        id="joinLoading"
                        src="../../../assets/icons/loadingIcon.gif"
                        width="20"
                        height="20"
                    />
                    <div class="tooltipText">Join</div>
                </div>
            </div>
            <div id="groupsList">
                <div id="groupsListReference">
                    <grouplistitem
                        v-for="(group, index) in groups"
                        :id="group.id"
                        :group="group"
                        :key="index"
                    ></grouplistitem>
                </div>
            </div>
        </div>
        <div id="messagingArea">
            <router-view></router-view>
        </div>
    </div>
</template>

<script>
    import GroupListItem from "./GroupListItem.vue";
    import firebase from 'firebase/app';
    import 'firebase/database';
    import 'firebase/storage';

    export default {
        components: { grouplistitem: GroupListItem },
        name: "groups-component",
        data: () => {
            return {
                searchText: "",
                groups: {},
                isJoining: false,
            };
        },
        methods: {
            startJoinLoading() {
                console.log('GroupsComponent : startJoinLoading');
                this.$refs.joinLoading.style.opacity = "1";
                this.joinLoading = true;
            },
            stopJoinLoading() {
                console.log('GroupsComponent : stopJoinLoading');
                this.$refs.joinLoading.style.opacity = "0";
                this.joinLoading = false;
            },
            addGroup() {
                if (this.isJoining || this.searchText == '') return;
                this.startJoinLoading();
                console.log('GroupsComponent : addGroup');
                console.log('GroupsComponent : addGroup : fetching groupIds/{groupName}');
                firebase.database().ref("groupIds/" + this.searchText).once("value")
                    .then((data) => {
                        if (data.val()) {
                            console.log('GroupsComponent : addGroup : fetching groups/{groupId}');
                            firebase.database().ref("groups/" + data.val()).once("value")
                                .then((snapshot) => {
                                    console.log('GroupsComponent : addGroup : fetching groups/{groupId}/members');
                                    firebase.database().ref("groups/" + data.val() + "/members").once("value")
                                        .then((members) => {
                                            var index = 0;
                                            if (members.val()) {
                                                index = members.val().length;
                                            }
                                            console.log('GroupsComponent : addGroup : updating groups/{groupId}/members');
                                            firebase.database().ref("groups/" + data.val() + "/members")
                                                .update({
                                                    [index]: this.$store.state.name,
                                                })
                                                .then(() => {
                                                    console.log('GroupsComponent : addGroup : groups/{groupId}/members updated');
                                                    console.log('GroupsComponent : addGroup : fetching users/{name}/groups');
                                                    firebase.database().ref("users/" + this.$store.state.name + "/groups").once("value")
                                                        .then((groups) => {
                                                            var groupIndex = 0;
                                                            if (groups.val()) {
                                                                groupIndex = groups.val().length;
                                                            }
                                                            console.log('GroupsComponent : addGroup : updating users/{name}/groups');
                                                            firebase.database().ref("users/" + this.$store.state.name + "/groups")
                                                                .update({
                                                                    [groupIndex]: data.val(),
                                                                })
                                                                .then(() => {
                                                                    console.log('GroupsComponent : addGroup : users/{name}/groups updated');
                                                                    this.$store.state.groups[data.val()] = snapshot.val();
                                                                    this.$store.state.groups[data.val()].members.push(
                                                                        this.$store.state.name
                                                                    );
                                                                    this.searchText = "";
                                                                    this.$forceUpdate();
                                                                    this.stopJoinLoading();
                                                                    this.search();
                                                                    console.log('GroupsComponent : addGroup : sending \'joinedAgroup\' signal');
                                                                    this.$store.state.socket.emit("joinedAgroup", 
                                                                        {
                                                                            members: snapshot.val().members,
                                                                        });
                                                                })
                                                                .catch((error) => {
                                                                        this.$root.$emit("errorMessage", "No_Update_Group_Info");
                                                                        this.stopJoinLoading();
                                                                        console.log(error);
                                                                });
                                                        })
                                                        .catch((error) => {
                                                            this.$root.$emit("errorMessage", "No_Get_Group");
                                                            this.stopJoinLoading();
                                                            console.log(error);
                                                        });
                                                })
                                                .catch((error) => {
                                                    this.$root.$emit("errorMessage", "No_Get_Group");
                                                    this.stopJoinLoading();
                                                    console.log(error);
                                                });
                                        });
                                })
                                .catch((error) => {
                                    this.$root.$emit("errorMessage","No_Group_Info");
                                    this.stopJoinLoading();
                                    console.log(error);
                                });
                        } else {
                            this.$root.$emit("errorMessage", "No_Group");
                            this.stopJoinLoading();
                            console.log(error);
                        }
                    })
                    .catch((error) => {
                        this.$root.$emit("errorMessage", "No_Group_Info");
                        this.stopJoinLoading();
                        console.log(error);
                    });
            },
            search() {
                if (this.searchText == "") {
                    this.groups = this.$store.state.groups;
                } else {
                    this.groups = [];
                    for (let group in this.$store.state.groups) {
                        if (this.$store.state.groups[group].name.includes(this.searchText))
                            this.groups.push(this.$store.state.groups[group]);
                    }
                }
            },
        },
        beforeMount() {
            console.info('GroupsComponent : beforeMount');
            this.groups = this.$store.state.groups;

            this.$root.$on("refresh", () => {
                console.log('GroupsComponent : beforeMount : got \'refresh signal\'');
                this.groups = this.$store.state.groups;
            });
        },
        beforeDestroy() {
            console.info('GroupsComponent : destroying');
        },
    };
</script>

<style>
    #groupsContainer {
        position: relative;
        width: 100%;
        height: 100%;
    }
    #groupsListContainer {
        display: flex;
        flex-direction: column;
        position: absolute;
        width: 25%;
        height: 100%;
        left: 0;
        top: 0;
        border-right: 2px solid gray;
        box-sizing: border-box;
        z-index: 4;
    }
    #searchContainer {
        position: relative;
        margin-top: 5vh;
        margin-bottom: 2vh;
        margin-left: 1vh;
        margin-right: 1vh;
        height: 5%;
        border-radius: 999px;
        border: 1px solid black;
        display: flex;
        flex-direction: row;
    }
    #searchIcon {
        position: absolute;
        width: 25%;
        height: 100%;
        background-image: url("../../../assets/icons/search.png");
        background-position: center;
        background-repeat: no-repeat;
        background-size: 20%;
    }
    #searchInput {
        position: absolute;
        width: 50%;
        height: 100%;
        left: 25%;
        display: flex;
    }
    #addGroupIcon {
        position: absolute;
        width: 25%;
        height: 100%;
        left: 75%;
        display: flex;
        background-image: url("../../../assets/icons/add.png");
        background-position: center;
        background-repeat: no-repeat;
        background-size: 20%;
        cursor: pointer;
        border-radius: 999px;
    }
    #addGroupIcon:hover {
        box-shadow: 0 0 3px 0.5px;
    }
    #addGroupIcon:hover .tooltipText {
        opacity: 1;
    }
    input[type="text"] {
        padding: 0;
        margin: 0;
    }
    #searchText {
        flex-grow: 1;
        width: 100%;
        border: none;
        box-sizing: border-box;
        background-color: unset;
    }
    #searchText:focus {
        outline: none;
    }
    #groupsList {
        position: relative;
        height: 95%;
        overflow: auto;
        display: flex;
        flex-direction: column;
        justify-content: flex-start;
        align-items: center;
        box-sizing: border-box;
    }
    #groupsListReference {
        position: absolute;
        width: 100%;
    }
    #messagingArea {
        position: absolute;
        left: 25%;
        height: 100%;
        top: 0;
        width: 75%;
    }
    .tooltipText {
        position: absolute;
        display: flex;
        justify-content: center;
        align-items: center;
        padding-left: 1vh;
        padding-right: 1vh;
        left: 110%;
        top: 20%;
        height: 60%;
        border-radius: 999px;
        background-color: rgb(160, 160, 160);
        color: black;
        font-size: 0.8em;
        opacity: 0;
        transition: opacity 0.2s linear;
        pointer-events: none;
    }
    #joinLoading {
        position: absolute;
        left: calc(-15% - 20px);
        top: calc(50% - 10px);
        opacity: 0;
        pointer-events: none;
    }
</style>
