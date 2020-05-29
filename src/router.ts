import Vue from 'vue';
import Router from 'vue-router';
import HomeComponent from './components/home/HomeComponent.vue';
import ChatComponent from './components/chat/ChatComponent.vue';
import GroupsComponent from './components/chat/groups/GroupsComponent.vue';
import NewGroupComponent from './components/chat/newgroup/NewGroupComponent.vue';
import MessagingComponent from './components/chat/groups/messaging/MessagingComponent.vue';

Vue.use(Router);

export default new Router({
    mode: 'history',
    base: process.env.BASE_URL,
    routes: [
        {
            path: '/',
            component: HomeComponent,
        },
        {
            name: 'chat',
            path: '/chat',
            props: true,
            component: ChatComponent,
            children: [
                {
                    path: 'groups',
                    component: GroupsComponent,
                    children: [
                        {
                            name: 'group',
                            path: ':id',
                            props: true,
                            component: MessagingComponent,
                        },
                    ],
                },
                {
                    path: 'newgroup',
                    component: NewGroupComponent,
                },
            ],
        },
    ],
});
