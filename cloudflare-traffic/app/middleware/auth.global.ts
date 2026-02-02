import { defineNuxtRouteMiddleware, navigateTo, useRequestHeaders } from "#app";

export default defineNuxtRouteMiddleware(async (to) => {
  // 放行 Nuxt 內部資源
  if (
    to.path.startsWith("/_nuxt") ||
    to.path.startsWith("/api") ||
    to.path.startsWith("/_nitro")
  ) {
    return;
  }

  // 公開頁
  if (to.path === "/login") {
    return;
  }

  try {
    // 🔴 關鍵：SSR 時手動取得 cookie
    const headers = useRequestHeaders(["cookie"]);

    await $fetch("/api/auth/me", {
      headers, // ✅ 把 cookie 轉送給 API
      credentials: "include", // Client 仍需要
    });
  } catch (err) {
    return navigateTo("/login");
  }
});
