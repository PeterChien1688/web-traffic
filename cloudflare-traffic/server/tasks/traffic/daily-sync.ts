// (這裡什麼都不用 import，Nuxt 知道 defineTask 是什麼)

export default defineTask({
  meta: {
    name: "traffic:daily-sync",
    description: "每天自動同步 Cloudflare 流量資料到 MySQL",
  },
  async run() {
    console.log("🤖 [System Task] 排程任務被觸發...");
    return await runTrafficSync();
  },
});
