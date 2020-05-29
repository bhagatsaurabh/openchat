<template>
    <div id="navContainer">
        <div id="navMenu">
            <router-link class="navItem" id="navHome" tag="div" to="/"
                >Home</router-link
            >
            <div @click="toggleCred($event)" class="navItem" id="navChat">
                Chat
                <div id="credContainer" ref="credContainer">
                    <input
                        spellcheck="false"
                        placeholder="name"
                        id="nameInput"
                        type="text"
                        ref="nameInput"
                    />
                    <div @click="startChat()" id="chatButton">Check In</div>
                    <img
                        src="../../../assets/icons/loadingIcon.gif"
                        width="32"
                        height="32"
                        id="loadingIcon"
                        ref="loadingIcon"
                    />
                </div>
            </div>
            <router-link class="navItem" id="navAbout" tag="div" to="/about"
                >About</router-link
            >
        </div>
        <div id="description">Chat with anyone, anywhere, fast</div>
    </div>
</template>

<script>
    import { Component, Vue } from "vue-property-decorator";

    @Component({
        name: "nav-component",
        data: () => {
            return {
                chatCredOpen: false,
                isLoading: false,
            };
        },
        methods: {
            startChat() {
                console.log('NavComponent : startChat');
                if (this.$refs.nameInput.value == '') return;
                if (this.isLoading) return;
                this.startLoadingIcon();
                console.log('NavComponent : startChat : user is \'' + this.$refs.nameInput.value + '\'');
                console.log('NavComponent : emitting \'startChat\'');
                this.$emit("startchat", this.$refs.nameInput.value);
            },
            toggleCred(e) {
                if (e.target.id == "navChat") {
                    if (!this.chatCredOpen) {
                        this.$refs.credContainer.style.pointerEvents = "all";
                        this.$refs.credContainer.style.opacity = "1";
                        this.$refs.credContainer.style.top = "13vh";
                    } else {
                        this.$refs.credContainer.style.pointerEvents = "none";
                        this.$refs.credContainer.style.opacity = "0";
                        this.$refs.credContainer.style.top = "7vh";
                    }
                    this.chatCredOpen = !this.chatCredOpen;
                }
            },
            startLoadingIcon() {
                console.log('NavComponent : startLoading');
                this.$refs.loadingIcon.style.opacity = "1";
                this.isLoading = true;
            },
            stopLoadingIcon() {
                console.log('NavComponent : stopLoading');
                this.$refs.loadingIcon.style.opacity = "0";
                this.isLoading = false;
            },
        },
        mounted() {
            console.info('NavComponent : mounted');
        },
        beforeDestroy() {
            console.info('NavComponent : destroying');
        },
    })
    export default class App extends Vue {}
</script>

<style>
    #navMenu {
        position: relative;
        display: flex;
        flex-direction: row;
        justify-content: space-evenly;
        align-items: center;
        width: 80%;
        padding-left: 1vh;
        padding-right: 1vh;
        border: 1px solid grey;
        border-radius: 999px;
    }
    .navItem {
        position: relative;
        padding: 2vh;
        cursor: pointer;
        font-weight: bold;
        flex-grow: 1;
        text-align: center;
        transition: box-shadow 0.2s linear, background-color 0.2s linear,
            opacity 0.2s linear;
    }
    .navItem:hover {
        box-shadow: 0px 0px 5px 1px;
        background-color: rgb(224, 224, 224);
        opacity: 0.7;
    }
    #description {
        margin-top: 2vh;
    }
    #navHome {
        border-radius: 15px 0 0 15px;
    }
    #navAbout {
        border-radius: 0 15px 15px 0;
    }
    #navChat:hover {
        opacity: 0.8;
    }

    #credContainer {
        position: absolute;
        pointer-events: none;
        opacity: 0;
        top: 7vh;
        left: 0;
        right: 0;
        width: 100%;
        display: flex;
        justify-content: center;
        align-items: center;
        flex-direction: column;
        transition: opacity 0.3s linear, top 0.3s linear;
    }

    input[type="text"] {
        margin: 0;
        padding: 0;
    }
    #nameInput {
        border: none;
        padding-left: 4vh;
        padding-right: 4vh;
        border-radius: 999px;
        padding-top: 1vh;
        padding-bottom: 1vh;
        text-align: center;
    }
    #nameInput:focus {
        outline: none;
    }
    #chatButton {
        display: flex;
        position: relative;
        margin-top: 4vh;
        width: 10vh;
        height: 3vh;
        cursor: pointer;
        justify-content: center;
        align-items: center;
        padding-left: 3vh;
        padding-right: 3vh;
        color: black;
        font-weight: bold;
        padding-top: 1vh;
        padding-bottom: 1vh;
        border-radius: 999px;
        background-color: rgb(209, 209, 209);
        border: 2px solid black;
        margin-bottom: 2vh;
    }
    #loadingIcon {
        opacity: 0;
    }
</style>
