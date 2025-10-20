import {createRouter, createWebHistory} from 'vue-router';
import HomeView from '../views/HomeView.vue';
import DatasetView from '../views/DatasetView.vue';
import DatasetShowView from '../views/DatasetShowView.vue'

const router = createRouter({
    history: createWebHistory(import.meta.env.BASE_URL),
    routes: [
        {
            path: '/',
            //path: '/home',
            name: 'home',
            component: HomeView
        },
        {
            path: '/data',
            name: 'data',
            component: DatasetView
        },
                {
            path: '/data/:id',
            name: 'datasetShow',
            props: true,
            component: DatasetShowView
        },
        {
            path: '/contact',
            name: 'contact',
            // route level code-splitting
            // this generates a separate chunk (About.[hash].js) for this route
            // which is lazy-loaded when the route is visited.
            component: () => import('../views/AboutView.vue')
        },
    ]
});

export default router;
