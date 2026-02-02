<template>
  <div style="padding: 40px; font-family: sans-serif">
    <h1>首頁</h1>

    <div v-if="user">
      <p>
        👋 歡迎，<strong>{{ user.name }}</strong> ({{
          user.role === "administrators" ? "系統管理員" : "一般使用者"
        }})
      </p>
    </div>

    <h3>📊 流量報表</h3>
    <ul>
      <li>
        <NuxtLink to="/twtraffic">繁體網站流量 (TwTraffic)</NuxtLink>
      </li>
      <li>
        <NuxtLink to="/mytraffic">簡體網站流量 (MyTraffic)</NuxtLink>
      </li>
    </ul>

    <div v-if="user && user.role === 'administrators'" class="admin-zone">
      <h3>🛡️ 管理功能</h3>
      <p>您擁有管理員權限，可進入後台管理帳號與排程。</p>
      <NuxtLink to="/admin" class="btn admin-btn"> ⚙️ 進入管理頁面 </NuxtLink>
    </div>

    <button v-if="user" @click="logout" class="btn logout-btn">登出</button>
  </div>
</template>

<script setup lang="ts">
// 1. 定義 User 介面 (加入 role)
interface User {
  id: number;
  username: string;
  name: string;
  role: string; // 👈 記得要在這裡補上 role
}

const user = ref<User | null>(null);

/** 取得目前登入者 */
onMounted(async () => {
  try {
    // 1. 在 URL 後面加上 'as any' 避開路由型別檢查
    // 2. 在 $fetch 後面加上 <User> 明確指定回傳型別
    user.value = await $fetch<User>("/api/auth/me" as any, {
      credentials: "include",
    });
  } catch (e) {
    // 若未登入或 session 過期，導回登入頁
    navigateTo("/login");
  }
});

/** 登出 */
const logout = async () => {
  await $fetch("/api/auth/logout", {
    method: "POST",
  });
  user.value = null; // 清除前端狀態
  navigateTo("/login");
};
</script>

<style scoped>
/* 簡單的樣式美化 */
.admin-zone {
  margin-top: 30px;
  padding: 20px;
  background-color: #f0f9eb; /* 淡綠色背景區隔 */
  border: 1px solid #c2e7b0;
  border-radius: 8px;
}

.btn {
  padding: 8px 16px;
  border-radius: 4px;
  border: none;
  cursor: pointer;
  font-size: 1rem;
  text-decoration: none;
  display: inline-block;
}

.admin-btn {
  background-color: #e6a23c; /* 橘黃色 */
  color: white;
  font-weight: bold;
}

.admin-btn:hover {
  background-color: #d69230;
}

.logout-btn {
  margin-top: 30px;
  background-color: #909399;
  color: white;
}
</style>
