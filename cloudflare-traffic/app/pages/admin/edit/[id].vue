<template>
  <div class="form-container">
    <h2>✏️ 編輯使用者</h2>

    <div v-if="pending">讀取中...</div>
    <form v-else @submit.prevent="handleSubmit">
      <div class="form-group">
        <label>帳號 (唯讀)</label>
        <input
          v-model="form.username"
          type="text"
          disabled
          class="disabled-input"
        />
      </div>

      <div class="form-group">
        <label>姓名</label>
        <input v-model="form.name" type="text" required />
      </div>

      <div class="form-group">
        <label>角色</label>
        <select v-model="form.role_id" :disabled="isDowngradeDisabled">
          <option :value="1">系統管理員</option>
          <option :value="2">一般使用者</option>
        </select>
        <p v-if="isDowngradeDisabled" class="warn-text">
          ⚠️ 這是最後一位管理員，無法變更角色
        </p>
      </div>

      <div class="form-group">
        <label>重設密碼 (若不修改請留空)</label>
        <input
          v-model="form.password"
          type="password"
          placeholder="輸入新密碼以變更"
        />
      </div>

      <div class="actions">
        <button type="button" @click="$router.back()" class="cancel-btn">
          取消
        </button>
        <button type="submit" class="submit-btn">儲存變更</button>
      </div>
    </form>
  </div>
</template>

<script setup lang="ts">
const route = useRoute();
const userId = route.params.id;

// 1. 取得該使用者資料
const { data: userData, pending } = await useFetch<any>(
  `/api/admin/users/${userId}`,
);

// 2. 為了判斷是否為「最後一位管理員」，我們需要知道目前所有的使用者狀態
// 雖然有點多餘，但這是前端判斷最準確的方式
const { data: allUsers } = await useFetch<any[]>("/api/admin/users");

const form = ref({
  username: "",
  name: "",
  role_id: 0,
  password: "", // 密碼選填
});

// 當資料載入後，填入表單
watch(
  userData,
  (newVal) => {
    if (newVal) {
      form.value.username = newVal.username;
      form.value.name = newVal.name;
      form.value.role_id = newVal.role_id;
    }
  },
  { immediate: true },
);

// 3. ✅ 邏輯：判斷是否禁止變更角色 (降級)
const isDowngradeDisabled = computed(() => {
  if (!userData.value || !allUsers.value) return false;

  // 如果這個人原本不是管理員，當然可以隨便改
  // 注意：這裡假設 role_id=1 是管理員，實際專案建議比對 code
  if (userData.value.role_id !== 1) return false;

  // 計算全站有幾個管理員 (role_id === 1)
  const adminCount = allUsers.value.filter(
    (u) => u.role_code === "administrators",
  ).length; // 注意 API 回傳結構

  // 如果只有 1 個管理員，且這個人就是那個管理員，則禁止修改
  return adminCount <= 1;
});

const handleSubmit = async () => {
  try {
    await $fetch(`/api/admin/users/${userId}`, {
      method: "PUT",
      body: form.value,
    });
    alert("✅ 修改成功！");
    navigateTo("/admin");
  } catch (e: any) {
    alert("❌ 失敗: " + (e.data?.message || e.message));
  }
};
</script>

<style scoped>
/* 樣式同新增頁面 */
.form-container {
  max-width: 500px;
  margin: 40px auto;
  padding: 30px;
  background: #fff;
  border-radius: 8px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
  font-family: sans-serif;
}
.form-group {
  margin-bottom: 20px;
}
label {
  display: block;
  margin-bottom: 8px;
  font-weight: bold;
}
input,
select {
  width: 100%;
  padding: 10px;
  border: 1px solid #ddd;
  border-radius: 4px;
  box-sizing: border-box;
}
.disabled-input {
  background-color: #f5f7fa;
  color: #909399;
  cursor: not-allowed;
}
.actions {
  display: flex;
  gap: 10px;
  justify-content: flex-end;
}
.submit-btn {
  background: #409eff;
  color: white;
  border: none;
  padding: 10px 20px;
  border-radius: 4px;
  cursor: pointer;
}
.cancel-btn {
  background: #909399;
  color: white;
  border: none;
  padding: 10px 20px;
  border-radius: 4px;
  cursor: pointer;
}
.warn-text {
  color: #e6a23c;
  font-size: 0.9rem;
  margin-top: 5px;
}
</style>
