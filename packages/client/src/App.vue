<template>
  <a-layout style="min-height: 100vh">
    <a-layout-header style="background: #001529; color: #fff;">
      <div style="font-size: 20px; color: #fff;">remote</div>
    </a-layout-header>
    <a-layout>
      <a-layout-sider width="200" style="background: #fff;">
        <a-menu
          mode="inline"
          :selectedKeys="[$route.path]"
          style="height: 100%; border-right: 0"
        >
          <a-menu-item key="/git">
            <router-link to="/git">Git操作</router-link>
          </a-menu-item>
        </a-menu>
      </a-layout-sider>
      <a-layout-content style="padding: 12px; min-height: 280px;">
        <div class="bg-white h-full overflow-auto rounded-sm">
          <router-view />
        </div>
      </a-layout-content>
    </a-layout>
  </a-layout>
</template>

<script setup>
import { useRoute } from 'vue-router'
const $route = useRoute()
</script>