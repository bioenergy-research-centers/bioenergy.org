import {createRouter, createWebHistory} from 'vue-router';
import AboutView from '../views/AboutView.vue';
import DataHomeView from '../views/DataHomeView.vue';
import DatasetView from '../views/DatasetView.vue';
import DatasetShowView from '../views/DatasetShowView.vue';
import {useSearchStore} from '@/store/searchStore';

const router = createRouter({
    history: createWebHistory(import.meta.env.BASE_URL),
    routes: [
        {
            path: '/',
            name: 'home',
            component: DataHomeView
        },
        {
            path: '/data',
            name: 'dataHome',
            component: DataHomeView
        },
        {
            path: '/search',
            name: 'datasetSearch',
            component: DatasetView,
        },
        {
            path: '/datasets/:id',
            name: 'datasetShow',
            props: true,
            component: DatasetShowView
        },
        {
            path: '/contact',
            name: 'contact',
            // route level code-splitting
            // this generates a separate chunk (Contact.[hash].js) for this route
            // which is lazy-loaded when the route is visited.
            component: () => import('../views/ContactView.vue')
        },
        {
            path: '/about',
            name: 'about',
            component: AboutView,
        },
    ]
});

export default router;
