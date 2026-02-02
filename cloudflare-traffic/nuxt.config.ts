// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  // 1. 啟用 Nuxt 4 目錄結構
  future: {
    compatibilityVersion: 4,
  },

  compatibilityDate: "2025-07-15",
  devtools: { enabled: true },

  // ▼▼▼ 關鍵修正：新增 Nitro 設定以啟用 Tasks ▼▼▼
  nitro: {
    experimental: {
      tasks: true, // 👈 必須開啟這個，/_nitro/tasks/ 網址才會生效
    },
    scheduledTasks: {
      "30 1 * * *": ["traffic:daily-sync"], // 設定 Cron 排程
    },
  },
  // ▲▲▲ 修正結束 ▲▲▲

  runtimeConfig: {
    // === 私有設定 (Private) ===
    secret: process.env.NUXT_SECRET,

    // Database configuration
    dbHost: process.env.NUXT_DB_HOST,
    dbUser: process.env.NUXT_DB_USER,
    dbPassword: process.env.NUXT_DB_PASSWORD,
    dbName: process.env.NUXT_DB_NAME,

    // Traffic Map Database configuration
    trafficDbHost: process.env.TRAFFIC_DB_HOST,
    trafficDbUser: process.env.TRAFFIC_DB_USER,
    trafficDbPassword: process.env.TRAFFIC_DB_PASSWORD,
    trafficDbName: process.env.TRAFFIC_DB_NAME,

    // Cloudflare configuration
    cfApiToken: process.env.CF_API_TOKEN,
    cfZoneIdTw: process.env.CF_ZONE_ID_TW,
    cfZoneIdMy: process.env.CF_ZONE_ID_MY,

    // === 公開設定 (Public) ===
    public: {},
  },
});
