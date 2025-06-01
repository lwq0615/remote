<template>
  <div class="p-4">
    <a-space>
      <a-select v-model:value="commnForm.project" show-search style="width: 200px" @change="getBranch">
        <a-select-option v-for="option in projectOptions" :key="option.value" :value="option.value">
          {{ option.label }}
        </a-select-option>
      </a-select>
      <a-button type="primary" @click="getBranch">刷新</a-button>
    </a-space>

    <a-card title="代码分支" class="mt-4">
      <a-spin :spinning="branchLoading">
        <div class="mb-4">
          <a-radio-group v-model:value="currentBranch" :options="branchList" @change="onChangeBranch" />
        </div>
        <a-space>
          <a-input v-model:value="createForm.branch" placeholder="请输入分支名" />
          <a-button type="primary" @click="checkoutBranch(createForm.branch)">创建分支</a-button>
        </a-space>
      </a-spin>
    </a-card>

    <a-card title="同步代码" class="mt-4">
      <a-form layout="inline" @finish="updateGitCode" :model="form">
        <a-form-item label="vpn">
          <a-select v-model:value="form.vpn" style="width: 200px">
            <a-select-option value="1">L2TP</a-select-option>
            <a-select-option value="2">PPTP</a-select-option>
          </a-select>
        </a-form-item>
        <a-form-item>
          <a-button type="primary" html-type="submit" :loading="loading">同步代码</a-button>
        </a-form-item>
      </a-form>
    </a-card>

    <a-card title="代码分支操作" class="mt-4">
      <a-form layout="inline" @finish="deleteBranch" :model="deleteForm">
        <a-form-item label="分支" name="branch" :rules="[{ required: true, message: '请输入分支名' }]">
          <a-select v-model:value="deleteForm.branch" :options="branchList" style="width: 200px" />
        </a-form-item>
        <a-form-item>
          <a-button type="primary" html-type="submit" :loading="deleteLoading" danger>删除分支</a-button>
        </a-form-item>
      </a-form>
    </a-card>
  </div>
</template>

<script setup>
import { reactive, ref } from "vue";
import { message } from "ant-design-vue";
import { get } from "../utils/request";

const projectOptions = [
  { label: "ql-new-cloud", value: "ql-new-cloud" },
  { label: "ql-new-cloud-app", value: "ql-new-cloud-app" },
  { label: "iaas-web", value: "iaas-web" },
  { label: "iaas-app", value: "iaas-app" },
  { label: "ql-web-front", value: "ql-web-front" },
];

const currentBranch = ref("master");
const commnForm = reactive({
  project: "ql-new-cloud",
});
const form = reactive({
  vpn: "1",
});

const loading = ref(false);
function updateGitCode() {
  loading.value = true;
  get("/git/push", {
    ...commnForm,
    ...form,
  })
    .then(() => {
      message.success("同步成功");
    })
    .finally(() => {
      loading.value = false;
    });
}

const branchLoading = ref(false);
const branchList = ref([]);
function getBranch() {
  branchLoading.value = true;
  get("/git/branch", commnForm)
    .then((res) => {
      branchList.value = res
        .split("\n")
        .map((item) => item.trim())
        .filter(Boolean)
        .map((item) => {
          if (item.includes("*")) {
            const branchName = item.replace("*", "").trim();
            currentBranch.value = branchName;
            return {
              value: branchName,
              label: branchName,
              checked: true,
            };
          }
          return {
            value: item,
            label: item,
          };
        });
    })
    .finally(() => {
      branchLoading.value = false;
    });
}
getBranch();

const deleteForm = reactive({
  branch: "",
});
const deleteLoading = ref(false);
function deleteBranch() {
  deleteLoading.value = true;
  get(`/git/delete`, {
    ...commnForm,
    ...deleteForm,
  })
    .then(() => {
      message.success("删除成功");
      deleteForm.branch = null;
      getBranch();
    })
    .finally(() => {
      deleteLoading.value = false;
    });
}

function onChangeBranch(e) {
  checkoutBranch(e.target.value);
}

const createForm = reactive({
  branch: "",
});
function checkoutBranch(branch) {
  branchLoading.value = true;
  get(`/git/checkout`, {
    ...commnForm,
    branch,
  })
    .then(() => {
      message.success("切换分支成功");
      getBranch();
    })
    .finally(() => {
      branchLoading.value = false;
    });
}
</script>
