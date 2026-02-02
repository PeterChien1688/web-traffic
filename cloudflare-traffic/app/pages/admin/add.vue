<template>
  <div class="form-container">
    <h2>➕ 新增使用者</h2>

    <form @submit.prevent="handleSubmit">
      <div class="form-group">
        <label>帳號 (Username)</label>
        <input v-model="form.username" type="text" required />
      </div>

      <div class="form-group">
        <label>密碼 (Password)</label>
        <input v-model="form.password" type="password" required />
      </div>

      <div class="form-group">
        <label>姓名 (Name)</label>
        <input v-model="form.name" type="text" required />
      </div>

      <div class="form-group">
        <label>角色 (Role)</label>
        <select v-model="form.role_id" required>
          <option :value="1">系統管理員 (administrators)</option>
          <option :value="2">一般使用者 (user)</option>
        </select>
      </div>

      <div class="actions">
        <button type="button" @click="$router.back()" class="cancel-btn">
          取消
        </button>
        <button type="submit" class="submit-btn">建立帳號</button>
      </div>
    </form>
  </div>
</template>

<script setup lang="ts">
const form = ref({
  username: "",
  password: "",
  name: "",
  role_id: 2, // 預設 user
});

const handleSubmit = async () => {
  try {
    await $fetch("/api/admin/users", {
      method: "POST",
      body: form.value,
    });
    alert("✅ 使用者建立成功！");
    navigateTo("/admin");
  } catch (e: any) {
    alert("❌ 失敗: " + (e.data?.message || e.message));
  }
};
</script>

<style scoped>
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
</style>
