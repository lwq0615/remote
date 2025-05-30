<template>
  <div class="p-4">
    <a-card title="同步代码">
      <a-form layout="inline" @finish="updateGitCode" :model="form">
        <a-form-item label="vpn">
          <a-select v-model:value="form.vpn" style="width: 200px">
            <a-select-option value="2">L2TP</a-select-option>
            <a-select-option value="1">PPTP</a-select-option>
          </a-select>
        </a-form-item>
        <a-form-item label="应用">
          <a-select v-model:value="form.project" show-search style="width: 200px">
            <a-select-option v-for="option in projectOptions" :key="option.value" :value="option.value">
              {{ option.label }}
            </a-select-option>
          </a-select>
        </a-form-item>
        <a-form-item label="分支">
          <a-input v-model:value="form.branch" placeholder="请输入分支名" style="width: 200px" />
        </a-form-item>
        <a-form-item>
          <a-button type="primary" html-type="submit" :loading="loading">同步代码</a-button>
        </a-form-item>
      </a-form>
    </a-card>

    <a-card title="查看代码分支" class="mt-4">
      <a-form layout="inline" @finish="getBranch" :model="form2">
        <a-form-item label="应用">
          <a-select v-model:value="form.project" show-search style="width: 200px">
            <a-select-option v-for="option in projectOptions" :key="option.value" :value="option.value">
              {{ option.label }}
            </a-select-option>
          </a-select>
        </a-form-item>
        <a-form-item>
          <a-button type="primary" html-type="submit" :loading="loading2">查看分支</a-button>
        </a-form-item>
      </a-form>
      <a-textarea class="mt-4" v-model:value="branchInfo" :auto-size="{ minRows: 4 }" />
    </a-card>
  </div>
</template>

<script setup>
import { reactive, ref } from 'vue';
import { message } from 'ant-design-vue';
import { get } from '../utils/requets';

const projectOptions = [
  { label: 'ql-new-cloud', value: 'ql-new-cloud' },
  { label: 'ql-bew-cloud-app', value: 'ql-bew-cloud-app' },
  { label: 'iaas-web', value: 'iaas-web' },
  { label: 'iaas-app', value: 'iaas-app' },
  { label: 'ql-web-front', value: 'ql-web-front' }
];

const form = reactive({
  project: 'ql-new-cloud',
  branch: 'master',
  vpn: '2',
});

const loading = ref(false)
function updateGitCode() {
  loading.value = true
  get("/push", form)
    .then(() => {
      message.success("同步成功")
    })
    .finally(() => {
      loading.value = false
    })
}

const form2 = reactive({
  project: 'ql-new-cloud',
});
const loading2 = ref(false)
const branchInfo = ref('')
function getBranch() {
  loading2.value = true
  get("/server/branch", form).then((res) => {
    branchInfo.value = res
  }).finally(() => {
    loading2.value = false
  })
}
</script>
