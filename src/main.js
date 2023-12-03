import './assets/main.css';

import { createApp } from 'vue';
import { createPinia } from 'pinia';

import vHide from '@/directives/hide';
import App from './App.vue';
import router from './router';

const app = createApp(App);

app.use(createPinia());
app.use(router);
app.directive('hide', vHide);

app.mount('#app');
