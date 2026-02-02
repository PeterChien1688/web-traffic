// server/api/admin/trigger-sync.post.ts
export default defineEventHandler(async (event) => {
  console.log("👤 [Admin API] 管理員手動觸發流量同步...");

  try {
    // 呼叫我們在 Step 1 建立的共用邏輯
    // Nuxt 會自動引入 runTrafficSync
    const result = await runTrafficSync();

    return result;
  } catch (error: any) {
    console.error("❌ [Admin API] 同步失敗:", error);

    // 回傳錯誤給前端
    throw createError({
      statusCode: 500,
      statusMessage: "Internal Server Error",
      message: error.message || "同步過程發生未知錯誤",
    });
  }
});
