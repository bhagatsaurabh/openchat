<template>
    <div ref="leftSidebar" id="leftSidebar">
        <div id="sidebarControl" @click="toggleSidebar()">
            <div ref="sidebarControlIcon" id="sidebarControlIcon"></div>
        </div>
        <div
            @click="currentNav('newgroup')"
            class="leftSidebarItem"
            :class="{ selectedChatNav: selectedNav == 'newgroup' }"
            >
            <router-link
                id="newGroupIcon"
                class="sidebarIcon"
                tag="div"
                to="/chat/newgroup"
            ></router-link>
        </div>
        <div
            @click="currentNav('groups')"
            class="leftSidebarItem"
            :class="{ selectedChatNav: selectedNav == 'groups' }"
            >
            <router-link
                id="groupsIcon"
                class="sidebarIcon"
                tag="div"
                to="/chat/groups"
            ></router-link>
        </div>
    </div>
</template>

<script>
    export default {
        name: "chatnav-component",
        data: () => {
            return {
                sidebarOpened: true,
                selectedNav: "chat",
            };
        },
        methods: {
            toggleSidebar() {
                if (this.sidebarOpened) {
                    this.$refs.leftSidebar.style.left = "-3.5%";
                    this.$refs.sidebarControlIcon.style.transform = "rotateZ(180deg)";
                } else {
                    this.$refs.leftSidebar.style.left = "0";
                    this.$refs.sidebarControlIcon.style.transform = "rotateZ(0deg)";
                }
                this.sidebarOpened = !this.sidebarOpened;
                this.$emit("sidebarChange", this.sidebarOpened);
            },
            currentNav(selected) {
                this.selectedNav = selected;
            },
        },
        mounted() {
            console.info('ChatNavComponent : mounted');
            this.$root.$on("selectGroup", () => {
                console.log('ChatNavComponent : mounted : got \'selectGroup\' signal');
                this.selectedNav = "groups";
            });
        },
        beforeDestroy() {
            console.info('ChatNavComponent : destroying');
        },
    };
</script>

<style>
    .selectedChatNav {
        box-shadow: 0 0 3px 0.5px;
        background-color: rgb(214, 167, 255);
    }
</style>
