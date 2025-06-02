import { createRouter, createWebHistory } from 'vue-router';

const routes = [
  {
    path: '/',
    redirect: '/git',
  },
  {
    path: '/git',
    name: 'Git',
    component: () => import('./views/git.vue'),
  },
];

const router = createRouter({
  history: createWebHistory(),
  routes,
});

export default router;
