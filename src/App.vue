<template>
    <div id="app">
        <router-view />
        <div id="errorMessageContainer" ref="errorMessageContainer">
            <div id="errorMessage" ref="errorMessage">
                {{ errorMessage }}
                <div id="closeIcon" @click="hideError()"></div>
            </div>
        </div>
    </div>
</template>

<script lang="ts">
    import { Component, Vue, Ref } from "vue-property-decorator";
    import HomeComponent from "./components/home/HomeComponent.vue";
    import firebase from 'firebase/app';
    import 'firebase/database';
    import 'firebase/storage';

    @Component({
        components: {
            HomeComponent,
        },
    })
    export default class App extends Vue {
        @Ref("errorMessage") errorMessageDiv!: HTMLElement;

        errorMessage: string = "";

        beforeMount() {
            console.info('AppComponent : beforeMount');
            firebase.database().goOnline();
        }

        mounted() {
            console.info('AppComponent : mounted');
            this.$root.$on("errorMessage", (errorCode: string) => {
                console.log('AppComponent : errorMessage : ' + errorCode);
                switch (errorCode) {
                    case "User_Online": {
                        this.errorMessage = "User is already online";
                        break;
                    }
                    case "No_Connection": {
                        this.errorMessage = "Connection Error";
                        break;
                    }
                    case "No_Data_Fetch": {
                        this.errorMessage = "Couldn't get info for user " + this.$store.state.name;
                        break;
                    }
                    case "No_Get_Group": {
                        this.errorMessage = "Couldn't get groups for user " + this.$store.state.name;
                        break;
                    }
                    case "No_Update_Group_Info": {
                        this.errorMessage = "Couldn't update group info";
                        break;
                    }
                    case "No_Group_Info": {
                        this.errorMessage = "Couldn't get group info";
                        break;
                    }
                    case "No_Group": {
                        this.errorMessage = "Group doesn't exist";
                        break;
                    }
                    case "Group_Exists": {
                        this.errorMessage = "Group already exist's";
                        break;
                    }
                    case "No_Member_Info": {
                        this.errorMessage = "Couldn't get member info";
                        break;
                    }
                    case "No_Update_Message": {
                        this.errorMessage = "Couldn't update message";
                        break;
                    }
                    case "No_Get_Message": {
                        this.errorMessage = "Couldn't get messages";
                        break;
                    }
                    case "No_Shared_File": {
                        this.errorMessage = "Couldn't download a shared file";
                        break;
                    }
                    case "No_Shared_File_Info": {
                        this.errorMessage = "Couldn't get a shared file info";
                        break;
                    }
                    case "No_File_Update": {
                        this.errorMessage = "Couldn't update file info";
                        break;
                    }
                    case "No_Create_Group": {
                        this.errorMessage = "Couldn't create group";
                        break;
                    }
                    case "No_Group_Name": {
                        this.errorMessage = "Please enter group name";
                        break;
                    }
                    case "No_File_Store": {
                        this.errorMessage = "Couldn't store file on device";
                        break;
                    }
                    case "No_Delete_User": {
                        this.errorMessage = "Couldn't delete user from pending";
                        break;
                    }
                    default: break;
                }
                this.showError();
            });
        }

        showError() {
            this.errorMessageDiv.style.right = "2vh";
            setTimeout(() => {
                this.hideError();
            }, 5000);
        }

        hideError() {
            this.errorMessageDiv.style.right = "-110%";
        }
        
        beforeDestroy() {
            console.info('AppComponent : destroying');
        }
    }
</script>

<style>
    html,
    body {
        margin: 0;
        padding: 0;
    }
    #app {
        position: absolute;
        width: 100%;
        height: 100%;
        font-family: "Avenir", Helvetica, Arial, sans-serif;
        -webkit-font-smoothing: antialiased;
        -moz-osx-font-smoothing: grayscale;
        overflow: hidden;
    }
    #errorMessageContainer {
        position: absolute;
        top: 2vh;
        right: 0;
    }
    #errorMessage {
        position: relative;
        right: -110%;
        display: flex;
        padding-left: 2vh;
        padding-right: 2vh;
        padding-top: 0.5vh;
        padding-bottom: 0.5vh;
        font-size: 0.9em;
        border-radius: 999px;
        background-color: rgb(235, 235, 235);
        box-shadow: 0 0 3px 0.5px black;
        color: rgb(255, 115, 21);
        transition: right 0.3s linear;
    }
    #closeIcon {
        position: relative;
        height: 1em;
        width: 1em;
        background-position: center;
        background-repeat: no-repeat;
        background-size: 80%;
        background-image: url("assets/icons/close.png");
        margin-left: 2vh;
        cursor: pointer;
    }
</style>
