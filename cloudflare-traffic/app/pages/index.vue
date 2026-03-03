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

    <h3>📈 系統與設備狀態</h3>
    <div style="margin-bottom: 20px" v-if="user">
      <a
        :href="
          user.role === 'administrators'
            ? '/zabbix/'
            : '/zabbix/index.php?enter=guest'
        "
        target="_blank"
        rel="noopener noreferrer"
        :class="[
          'btn',
          user.role === 'administrators'
            ? 'admin-zabbix-btn'
            : 'guest-zabbix-btn',
        ]"
      >
        {{
          user.role === "administrators"
            ? "⚙️ Zabbix 系統管理後台"
            : "📈 WisdomHall設備資訊"
        }}
      </a>
    </div>
    <div v-if="user && user.role === 'administrators'" class="admin-zone">
      <h3>🛡️ 管理功能與基礎設施</h3>
      <p>您擁有管理員權限，可進入後台管理帳號與排程設定。</p>

      <div class="action-buttons">
        <NuxtLink to="/admin" class="btn admin-btn"> ⚙️ 進入管理頁面 </NuxtLink>
      </div>
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
  role: string;
}

const user = ref<User | null>(null);

/** 取得目前登入者 */
onMounted(async () => {
  try {
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
/* === 原有樣式 === */
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

/* ▼▼▼ 新增/修改樣式：按鈕群組與不同身分的 Zabbix 按鈕 ▼▼▼ */
.action-buttons {
  display: flex;
  gap: 15px; /* 讓兩個按鈕中間有間距 */
  margin-top: 15px;
}

/* 一般使用者看到的戰情看板按鈕 (深紅色) */
.guest-zabbix-btn {
  background-color: #d32f2f;
  color: white;
  font-weight: bold;
}

.guest-zabbix-btn:hover {
  background-color: #b71c1c;
}

/* 管理員看到的後台管理按鈕 (深藍色，區分管理情境) */
.admin-zabbix-btn {
  background-color: #1976d2;
  color: white;
  font-weight: bold;
}

.admin-zabbix-btn:hover {
  background-color: #115293;
}
/* ▲▲▲ 新增/修改樣式結束 ▲▲▲ */
</style>
