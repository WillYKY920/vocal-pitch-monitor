import { createRouter, createWebHistory } from 'vue-router'
import Home from '../views/Home.vue'
import Help from '../views/Help.vue'
import Test from '../views/Test.vue'
import About from '../views/About.vue'

const routes = [
    {
        path: '/',
        name: 'Home',
        component: Home
    },
    {
        path: '/help',
        name: 'Help',
        component: Help
    },
    {
        path: '/test',
        name: 'Test',
        component: Test
    },
    {
        path: '/about',
        name: 'About',
        component: About
    }
]

const router = createRouter({
    history: createWebHistory(),
    routes
})

export default router
