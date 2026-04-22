import {createRouter, createWebHistory} from 'vue-router';
import AboutView from '../views/AboutView.vue';
import DataHomeView from '../views/DataHomeView.vue';
import DatasetView from '../views/DatasetView.vue';
import DatasetShowView from '../views/DatasetShowView.vue';
import SchemaShowView from '../views/SchemaShowView.vue';
import SchemaIndexView from '../views/SchemaIndexView.vue';
import {useSearchStore} from '@/store/searchStore';

const router = createRouter({
    history: createWebHistory(import.meta.env.BASE_URL),
    routes: [
        {
            path: '/',
            name: 'home',
            component: DataHomeView, 
            meta: { title: 'Home - Bioenergy.org' }
        },
        {
            path: '/search',
            name: 'datasetSearch',
            component: DatasetView,
            meta: { title: 'Search Datasets - Bioenergy.org' }
        },
        {
            path: '/datasets/:id',
            name: 'datasetShow',
            props: true,
            component: DatasetShowView,
            meta: { title: 'Dataset Details - Bioenergy.org' }
        },
        {
            path: "/schema",
            name: "schema-index",
            component: SchemaIndexView,
            meta: { title: 'Schema - Bioenergy.org' }
        },
        {
            path: '/schema/:version',
            name: 'schemaShow',
            props: true,
            component: SchemaShowView,
            meta: { title: 'Schema - Bioenergy.org' }
        },
        {
            path: '/contact',
            name: 'contact',
            // route level code-splitting
            // this generates a separate chunk (Contact.[hash].js) for this route
            // which is lazy-loaded when the route is visited.
            component: () => import('../views/ContactView.vue'),
            meta: { title: 'Contact - Bioenergy.org' }            
        },
        {
            path: '/about',
            name: 'about',
            component: AboutView,
            meta: { title: 'About Us - Bioenergy.org' }
        },
    ]
});

// Update page title on route change
router.afterEach((to) => {
    if (to.meta.title) {
        document.title = to.meta.title;
    } else {
        document.title = 'Bioenergy.org';      
    }
});


export default router;
