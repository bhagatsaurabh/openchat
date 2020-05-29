<template>
    <router-link
        tag="div"
        :to="{ name: 'group', params: { id: id, group: group } }"
        id="groupItem"
        @updateRecent.native="updateRecentData($event)"
    >
        <div id="groupIcon"></div>
        <div id="groupInfo">
            <div id="groupName">{{ group.name }}</div>
            <div id="groupRecent">
                {{ ((recentFrom != "" && recentMessage != "") ? (recentFrom + " : " + recentMessage) : ((recentFile) ? (recentFrom + " : File") : "No Messages")) }}
            </div>
        </div>
    </router-link>
</template>

<script>
    export default {
        name: "grouplistitem",
        data: () => {
            return {
                recentFrom: "",
                recentMessage: "",
                recentFile: false
            };
        },
        props: {
            group: {
                name: {
                    required: true,
                    type: String,
                },
                members: {
                    required: true,
                    type: [],
                },
                messages: {
                    required: true,
                    type: Array,
                },
            },
            id: {
                required: true,
                type: String,
            },
        },
        mounted() {
            console.info('GroupListItem : mounted');
            if (this.group.messages) {
                this.recentFrom = this.group.messages[this.group.messages.length - 1].from;
                this.recentMessage = this.group.messages[this.group.messages.length - 1].message;
                if (typeof(this.group.messages[this.group.messages.length - 1].fileId) != 'undefined' && this.group.messages[this.group.messages.length - 1].fileId != null)
                    this.recentFile = true;
            }
            this.$root.$on('updateRecent', () => {
                console.log('GroupListItem : mounted : got \'updateRecent\' signal');
                this.recentFrom = this.group.messages[this.group.messages.length - 1].from;
                this.recentMessage = this.group.messages[this.group.messages.length - 1].message;
                if (typeof(this.group.messages[this.group.messages.length - 1].fileId) != 'undefined' && this.group.messages[this.group.messages.length - 1].fileId != null)
                    this.recentFile = true;
            });
        },
        beforeDestroy() {
            console.info('GroupListItem : destroying');
        },
        methods: {
        },
    };
</script>

<style>
    #groupItem {
        cursor: pointer;
        display: flex;
        flex-direction: row;
        position: relative;
        height: 10vh;
        background-color: rgb(206, 206, 206);
        width: 99%;
        margin-bottom: 1vh;
    }
    #groupIcon {
        position: absolute;
        width: 25%;
        height: 100%;
        background-image: url("../../../assets/icons/multiple-users-silhouette.png");
        background-position: center;
        background-repeat: no-repeat;
        background-size: 50%;
        opacity: 0.6;
    }
    #groupInfo {
        position: absolute;
        width: 75%;
        height: 100%;
        left: 25%;
        display: flex;
        flex-direction: column;
    }
    #groupName {
        flex-grow: 0.6;
        display: flex;
        justify-content: flex-start;
        align-items: center;
        font-size: 1.1em;
        font-weight: bold;
    }
    #groupRecent {
        flex-grow: 0.4;
        display: flex;
        justify-content: flex-start;
        align-items: center;
        font-size: 0.9em;
        font-weight: 100;
        color: rgb(99, 99, 99);
    }
</style>
