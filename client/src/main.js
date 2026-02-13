import './assets/main.css';

import 'bootstrap/dist/js/bootstrap.bundle.min.js';
import {createBootstrap} from 'bootstrap-vue-next';
import 'bootstrap-vue-next/dist/bootstrap-vue-next.css';

import { createApp } from 'vue';
import App from './App.vue';
import { createPinia } from 'pinia';
import piniaPluginPersistedstate from 'pinia-plugin-persistedstate';
import router from './router';

const app = createApp(App);
const pinia = createPinia();

pinia.use(piniaPluginPersistedstate);

app.use(pinia);
app.use(router);
app.use(createBootstrap());

app.mount('#app');
