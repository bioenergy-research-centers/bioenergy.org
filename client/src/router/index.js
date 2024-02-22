import { createRouter, createWebHistory } from 'vue-router'
import HomeView from '../views/HomeView.vue'

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
      path: '/about',
      name: 'about',
      // route level code-splitting
      // this generates a separate chunk (About.[hash].js) for this route
      // which is lazy-loaded when the route is visited.
      component: () => import('../views/AboutView.vue')
    },
    {
      path: "/datasets",
      alias: "/datasets",
      name: "datasets",
      component: () => import("../views/DatasetsList.vue")
    },
    {
      path: "/datasets/:id",
      name: "dataset",
      component: () => import("../views/Dataset.vue")
    },
    {
      path: "/add",
      name: "add",
      component: () => import("../views/AddDataset.vue")
    }
  ]
})

export default router
