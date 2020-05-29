import Vue from 'vue';
import Vuex from 'vuex';

Vue.use(Vuex);

export default new Vuex.Store({
    state: {
        name: '',
        groups: {},
        socket: null,
        db: null,
    },
    mutations: {},
    actions: {},
});
