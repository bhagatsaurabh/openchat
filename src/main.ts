import Vue from 'vue';
import App from './App.vue';
import router from './router';
import store from './store';
import io from 'socket.io-client';
import firebase from 'firebase/app';
import 'firebase/database';
import 'firebase/storage';

firebase.initializeApp(<Firebase Key>);

Vue.config.productionTip = false;

new Vue({
    router,
    store,
    beforeMount() {
        console.info('Root : beforeMount');
        this.$store.state.socket = io.connect('https://share-fast.herokuapp.com');
        if (!window.indexedDB) {
            console.log('Root : Indexed DB not supported');
        } else {
            const request: any = indexedDB.open('openchatDB');
            request.onerror = () => {
                console.log('Root : Indexed DB usage rejected');
            };
            request.onsuccess = (event: any) => {
                console.log('Root : Connected to IndexedDB');
                this.$store.state.db = event.target.result;
                this.$store.state.db.onerror = (e: any) => {
                    console.log('Root : DB Error : ');
                    console.log(e);
                };
            };
            request.onupgradeneeded = (event: any) => {
                this.$store.state.db = event.target.result;
                this.$store.state.db.onerror = (e: any) => {
                    console.log('Root : DB Error : ');
                    console.log(e);
                };

                const fileMetadataStore = this.$store.state.db.createObjectStore('fileMetadata');
                fileMetadataStore.transaction.oncomplete = () => {
                    console.log('Root : Created fileMetadataStore');
                };

                const fileStore = this.$store.state.db.createObjectStore('file');
                fileStore.transaction.oncomplete = () => {
                    console.log('Root : Created fileStore');
                };
            };
        }
    },
    render: (h) => h(App),
}).$mount('#app');
