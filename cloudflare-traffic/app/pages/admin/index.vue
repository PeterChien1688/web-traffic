<template>
  <div class="admin-container">
    <div class="header">
      <h2>🛡️ 管理後台</h2>
      <NuxtLink to="/" class="back-btn">⬅️ 回首頁</NuxtLink>
    </div>

    <div class="action-bar">
      <div class="maintenance-box">
        <h3>⚡ 系統排程</h3>
        <button @click="triggerSync" class="sync-btn" :disabled="isSyncing">
          {{ isSyncing ? "🔄 同步中..." : "🚀 執行 Cloudflare 同步" }}
        </button>
      </div>

      <NuxtLink to="/admin/add" class="add-btn">➕ 新增使用者</NuxtLink>
    </div>

    <hr class="divider" />

    <h3>👤 帳號管理清單</h3>

    <div v-if="pending">載入中...</div>
    <div v-else-if="error" class="error">❌ {{ error.message }}</div>

    <table v-else class="user-table">
      <thead>
        <tr>
          <th>ID</th>
          <th>帳號</th>
          <th>姓名</th>
          <th>角色</th>
          <th>建立時間</th>
          <th>操作</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="u in users" :key="u.id">
          <td>{{ u.id }}</td>
          <td>{{ u.username }}</td>
          <td>{{ u.name }}</td>
          <td>
            <span
              :class="[
                'tag',
                u.role_code === 'administrators' ? 'tag-admin' : 'tag-user',
              ]"
            >
              {{ u.role_name }} ({{ u.role_code }})
            </span>
          </td>
          <td>{{ new Date(u.created_at).toLocaleString() }}</td>
          <td>
            <div class="btn-group">
              <NuxtLink :to="`/admin/edit/${u.id}`" class="btn edit-btn"
                >編輯</NuxtLink
              >

              <button
                @click="handleDelete(u)"
                class="btn delete-btn"
                :disabled="isLastAdmin(u)"
                :title="isLastAdmin(u) ? '最後一位管理員不可刪除' : ''"
              >
                刪除
              </button>
            </div>
          </td>
        </tr>
      </tbody>
    </table>
  </div>
</template>

<script setup lang="ts">
// --- 1. 定義介面 ---
interface UserRow {
  id: number;
  username: string;
  name: string;
  role_name: string;
  role_code: string;
  created_at: string;
}

interface AuthUser {
  id: number;
  username: string;
  name: string;
  role: string;
}

// --- 2. 權限檢查邏輯 ---
const currentUser = useCookie<AuthUser | null>("auth_user");

if (!currentUser.value || currentUser.value.role !== "administrators") {
  if (import.meta.client) {
    alert("您沒有權限進入此頁面");
  }
  navigateTo("/");
}

// --- 3. 取得使用者列表資料 ---
const {
  data: users,
  pending,
  error,
  refresh,
} = await useFetch<UserRow[]>("/api/admin/users");

// --- 4. 補回遺失的：同步功能邏輯 (Cloudflare Sync) ---
const isSyncing = ref(false);

const triggerSync = async () => {
  if (!confirm("⚠️ 確定要手動執行流量同步嗎？\n這可能需要幾秒鐘的時間。"))
    return;

  isSyncing.value = true;
  try {
    // ▼▼▼ 關鍵修改：改用正規 API 呼叫 ▼▼▼
    const res = await $fetch("/api/admin/trigger-sync", {
      method: "POST",
    });
    // ▲▲▲ 修改結束 ▲▲▲

    console.log(res);
    alert("✅ 同步任務已完成！請檢查流量頁面。");
  } catch (err: any) {
    // 這裡會顯示從 API 拋出的錯誤 (例如 500 Internal Server Error)
    alert("❌ 同步失敗: " + (err.data?.message || err.message));
  } finally {
    isSyncing.value = false;
  }
};

// --- 5. 使用者管理邏輯 (新增/刪除保護) ---

// 計算目前的管理員總數
const adminCount = computed(() => {
  return (
    users.value?.filter((u) => u.role_code === "administrators").length || 0
  );
});

// 判斷是否為最後一位管理員
const isLastAdmin = (u: UserRow) => {
  // 如果不是管理員，當然不是最後一位管理員
  if (u.role_code !== "administrators") return false;
  // 如果是管理員，且總數只剩 1 (或更少)，那就是最後一位
  return adminCount.value <= 1;
};

// 刪除功能
const handleDelete = async (u: UserRow) => {
  if (!confirm(`確定要刪除使用者 ${u.name} (${u.username}) 嗎？`)) return;

  try {
    await $fetch(`/api/admin/users/${u.id}`, { method: "DELETE" });
    alert("✅ 刪除成功");
    refresh(); // 重新抓取列表，讓畫面更新
  } catch (e: any) {
    alert("❌ 刪除失敗: " + (e.data?.message || e.message));
  }
};
</script>

<style scoped>
.admin-container {
  padding: 30px;
  font-family: sans-serif;
  max-width: 1000px;
  margin: 0 auto;
}
.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}
.back-btn {
  text-decoration: none;
  color: #666;
  font-weight: bold;
  padding: 5px 10px;
  border: 1px solid #ccc;
  border-radius: 4px;
}
.back-btn:hover {
  background-color: #eee;
}

/* 上方功能區與按鈕 */
.action-bar {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 20px;
  margin-bottom: 30px;
}

/* 系統維護區塊 */
.maintenance-box {
  flex: 1;
  background-color: #fdf6ec;
  border: 1px solid #faecd8;
  padding: 15px 20px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: space-between;
}
.maintenance-box h3 {
  margin: 0;
  color: #e6a23c;
  font-size: 1.1rem;
  margin-right: 15px;
}

.sync-btn {
  background-color: #409eff;
  color: white;
  border: none;
  padding: 8px 16px;
  border-radius: 4px;
  cursor: pointer;
  font-size: 0.95rem;
  transition: background 0.3s;
}
.sync-btn:disabled {
  background-color: #a0cfff;
  cursor: not-allowed;
}
.sync-btn:hover:not(:disabled) {
  background-color: #66b1ff;
}

/* 新增使用者按鈕 */
.add-btn {
  background-color: #67c23a;
  color: white;
  padding: 15px 20px; /* 高度調高一點讓它顯眼 */
  text-decoration: none;
  border-radius: 8px;
  font-weight: bold;
  display: flex;
  align-items: center;
  box-shadow: 0 2px 6px rgba(103, 194, 58, 0.3);
  transition: all 0.2s;
}
.add-btn:hover {
  background-color: #5daf34;
  transform: translateY(-1px);
}

.divider {
  border: 0;
  border-top: 1px solid #eee;
  margin: 30px 0;
}

/* 表格與操作按鈕 */
.user-table {
  width: 100%;
  border-collapse: collapse;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1);
  margin-top: 10px;
}
.user-table th,
.user-table td {
  border: 1px solid #ebeef5;
  padding: 12px;
  text-align: left;
}
.user-table th {
  background-color: #f5f7fa;
  color: #606266;
}

.tag {
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 0.85rem;
  font-weight: bold;
}
.tag-admin {
  background-color: #fde2e2;
  color: #f56c6c;
}
.tag-user {
  background-color: #f0f9eb;
  color: #67c23a;
}

.btn-group {
  display: flex;
  gap: 8px;
}
.btn {
  padding: 5px 10px;
  border: none;
  border-radius: 3px;
  cursor: pointer;
  font-size: 0.9rem;
  text-decoration: none;
  color: white;
}
.edit-btn {
  background-color: #409eff;
  color: white;
}
.edit-btn:hover {
  background-color: #66b1ff;
}
.delete-btn {
  background-color: #f56c6c;
  color: white;
}
.delete-btn:hover:not(:disabled) {
  background-color: #ff7875;
}
.delete-btn:disabled {
  background-color: #fab6b6;
  cursor: not-allowed;
  opacity: 0.6;
}

.error {
  color: #f56c6c;
  font-weight: bold;
}
</style>
