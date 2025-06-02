<template>
  <a-layout style="height: 100vh">
    <a-layout-header style="background: #001529; color: #fff;">
      <div style="font-size: 20px; color: #fff;">remote</div>
    </a-layout-header>
    <a-layout>
      <a-layout-sider v-model:collapsed="collapsed" collapsible width="120" style="background: #fff;">
        <a-menu
          mode="inline"
          :selectedKeys="[$route.path]"
          style="height: 100%; border-right: 0"
        >
          <a-menu-item key="/git">
            <template #icon>
              <Html5Outlined />
            </template>
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
import { Html5Outlined } from '@ant-design/icons-vue'
import { ref } from 'vue'

const $route = useRoute()
const collapsed = ref(true)
</script>

<style scoped>
:deep(.ant-layout-sider-trigger) {
  background: #fff;
  color: #001529;
  border-top: 1px solid #f0f0f0;
}
</style>