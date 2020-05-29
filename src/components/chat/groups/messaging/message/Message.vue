<template>
    <div
        :class="{ right: message.from == this.$store.state.name }"
        class="message"
    >
        <div class="messageContent">
            <div v-if="!fromMe" class="messageFrom">{{ message.from }}</div>
            <div v-if="message.message != ''" class="messageText">
                {{ message.message }}
            </div>
            <div
                :class="{ floatRight: fromMe }"
                :style="{ 'background-image': 'url(\'' + imageURL + '\')' }"
                v-if="haveFile && message.fileId != null && message.fileType.includes('image')"
                :title="message.fileName"
                class="imageContainer"
            ></div>
            <div
                @click="fileClicked()"
                :class="{ floatRight: fromMe }"
                v-if="haveFile && message.fileId != null && !message.fileType.includes('image')"
                :title="message.fileName"
                class="fileContainer"
            ></div>
            <div
                title="File not found on device"
                :class="{ floatRight: fromMe }"
                v-if="message.fileId != null && !haveFile"
                class="noFileContainer"
            ></div>
        </div>
    </div>
</template>

<script>
    export default {
        name: "message-component",
        data: () => {
            return {
                fromMe: false,
                haveFile: false,
                imageURL: "",
            };
        },
        props: ["message"],
        methods: {
            fileClicked() {
                this.$store.state.db.transaction("file").objectStore("file").get(this.message.fileId)
                    .onsuccess = (event) => {
                        var element = document.createElement("a");
                        element.setAttribute("href", window.URL.createObjectURL(event.target.result));
                        element.setAttribute("download", this.message.fileName);
                        element.click();
                    };
            },
        },
        beforeMount() {
            if (this.$store.state.name == this.message.from) this.fromMe = true;
            var request = this.$store.state.db.transaction("file", "readwrite").objectStore("file").count(this.message.fileId);
            request.onsuccess = () => {
                this.haveFile = request.result > 0;
                if (this.haveFile) {
                    if (this.message.fileId != null && this.message.fileType.includes("image")) {
                        this.$store.state.db.transaction("file").objectStore("file").get(this.message.fileId)
                            .onsuccess = (event) => {
                                this.imageURL = window.URL.createObjectURL(event.target.result);
                            };
                    }
                }
            };
        },
        mounted() {
            if (this.message.fileId != null && !this.haveFile) {
                this.$root.$on(this.message.fileId, () => {
                    if (this.message.fileType.includes("image")) {
                        this.$store.state.db.transaction("file").objectStore("file").get(this.message.fileId)
                            .onsuccess = (event) => {
                                this.imageURL = window.URL.createObjectURL(event.target.result);
                            };
                    }
                    this.haveFile = true;
                });
            }
        },
    };
</script>

<style>
    .message {
        position: relative;
        width: 100%;
        display: flex;
        flex-direction: row;
        margin-bottom: .5vh;
    }
    .messageContent {
        padding: 1.5vh;
        padding-top: 1vh;
        border-radius: 5px;
        display: flex;
        flex-direction: column;
        background-color: rgb(201, 201, 201);
        display: block;
    }
    .right {
        justify-content: flex-end;
    }
    .messageFrom {
        font-weight: bold;
        font-size: 0.8em;
        margin-bottom: 0.5em;
    }
    .imageContainer {
        position: relative;
        width: 6em;
        height: 6em;
        background-position: center;
        background-repeat: no-repeat;
        background-size: 80%;
        background-image: url("../../../../../assets/icons/fileIcon.png");
        cursor: pointer;
    }
    .fileContainer {
        position: relative;
        width: 2em;
        height: 2em;
        background-position: center;
        background-repeat: no-repeat;
        background-size: 80%;
        background-image: url("../../../../../assets/icons/fileIcon.png");
        cursor: pointer;
    }
    .noFileContainer {
        position: relative;
        width: 2em;
        height: 2em;
        background-position: center;
        background-repeat: no-repeat;
        background-size: 80%;
        background-image: url("../../../../../assets/icons/noFileIcon.png");
        cursor: pointer;
    }
    .floatRight {
        float: right;
    }
</style>
