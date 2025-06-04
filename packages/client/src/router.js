import { createRouter, createWebHistory } from 'vue-router';

export const routes = [
  {
    path: '/',
    redirect: '/git',
  },
  {
    path: '/git',
    name: 'Git',
    component: () => import('./views/git.vue'),
  },
  {
    path: '/cmd',
    name: 'Cmd',
    component: () => import('./views/cmd.vue'),
  },
];

const router = createRouter({
  history: createWebHistory(),
  routes,
});

export default router;
