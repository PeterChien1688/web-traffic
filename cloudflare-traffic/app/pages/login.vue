<script setup lang="ts">
import { ref } from "vue";
import { useRouter } from "vue-router";

const username = ref("");
const password = ref("");
const errorMsg = ref("");
const router = useRouter();

// 1. 綁定全域的 Cookie 狀態
// 這樣當我們修改 authCookie.value 時，整個網站都會知道使用者變更了
const authCookie = useCookie("auth_user");

const handleLogin = async () => {
  errorMsg.value = "";

  if (!username.value || !password.value) {
    errorMsg.value = "請輸入帳號與密碼";
    return;
  }

  try {
    // 2. 改用 Nuxt 的 $fetch
    // 記得在 login.post.ts 我們有回傳 { success: true, user: { ... } }
    const response = await $fetch("/api/auth/login", {
      method: "POST",
      body: {
        username: username.value,
        password: password.value,
      },
    });

    // 3. 關鍵步驟：手動更新前端 Cookie 狀態
    // 雖然瀏覽器已經收到了 Set-Cookie header，但 Nuxt 的響應式系統需要這一行
    // 才能確保跳轉到首頁後，首頁的按鈕會立刻顯示出來
    // @ts-ignore
    authCookie.value = response.user;

    // 4. 登入成功，導向首頁
    router.push("/");
  } catch (error: any) {
    // 5. 錯誤處理
    // 如果後端 throw createError，錯誤訊息通常在 error.data.message 或 error.message
    console.error(error);
    errorMsg.value = error.data?.message || error.message || "登入失敗";
  }
};
</script>

<template>
  <div style="max-width: 400px; margin: 100px auto; font-family: sans-serif">
    <h1 style="text-align: center">系統登入</h1>

    <div style="margin-bottom: 15px">
      <label style="display: block; margin-bottom: 5px; font-weight: bold"
        >帳號</label
      >
      <input
        v-model="username"
        type="text"
        placeholder="請輸入使用者名稱"
        @keyup.enter="handleLogin"
        style="
          width: 100%;
          padding: 10px;
          border: 1px solid #ccc;
          border-radius: 4px;
          box-sizing: border-box;
        "
      />
    </div>

    <div style="margin-bottom: 20px">
      <label style="display: block; margin-bottom: 5px; font-weight: bold"
        >密碼</label
      >
      <input
        v-model="password"
        type="password"
        placeholder="請輸入密碼"
        @keyup.enter="handleLogin"
        style="
          width: 100%;
          padding: 10px;
          border: 1px solid #ccc;
          border-radius: 4px;
          box-sizing: border-box;
        "
      />
    </div>

    <p
      v-if="errorMsg"
      style="color: #f56c6c; text-align: center; margin-bottom: 15px"
    >
      ⚠️ {{ errorMsg }}
    </p>

    <button
      @click="handleLogin"
      style="
        width: 100%;
        padding: 12px;
        background-color: #007acc;
        color: white;
        border: none;
        border-radius: 4px;
        cursor: pointer;
        font-size: 1rem;
        font-weight: bold;
      "
    >
      登入
    </button>
  </div>
</template>
