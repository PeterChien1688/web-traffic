// server/utils/trafficHandler.ts
import { trafficPool } from "./db";
import { fetchCloudflareTraffic } from "./cloudflare";

export const runTrafficSync = async () => {
  console.log("⏰ [核心邏輯] 開始執行流量同步...");

  // @ts-ignore
  const config = useRuntimeConfig();

  const sites = [
    {
      domain: "wisdomhall.com.tw",
      table: "TwTraffic",
      zoneId: (config.cfZoneIdTw as string) || "",
    },
    {
      domain: "wisdomhall.my",
      table: "MyTraffic",
      zoneId: (config.cfZoneIdMy as string) || "",
    },
  ];

  // 1. 計算「昨天」的日期字串 (YYYY-MM-DD)
  const now = new Date();
  const yesterdayDate = new Date(now);
  yesterdayDate.setDate(yesterdayDate.getDate() - 1);
  const yesterdayStr = formatDate(yesterdayDate);

  console.log(`📅 系統時間: ${now.toLocaleString()}`);
  console.log(`🎯 同步目標: 補齊至 ${yesterdayStr} (昨天)`);

  for (const site of sites) {
    console.log(`--------------------------------------------------`);
    console.log(`📡 檢查網站: ${site.domain}`);

    if (!site.zoneId) {
      console.error(`❌ 錯誤: 未設定 Zone ID`);
      continue;
    }

    try {
      // 2. 查詢資料庫目前最新的日期
      const [rows]: any = await trafficPool.execute(
        `SELECT MAX(record_date) as last_date FROM ${site.table}`,
      );

      let lastDbDateStr = "";
      if (rows[0]?.last_date) {
        lastDbDateStr = formatDate(new Date(rows[0].last_date));
      }

      console.log(`🔍 資料庫目前最新紀錄: ${lastDbDateStr || "無 (全空)"}`);

      let nextDate: Date;

      if (!lastDbDateStr) {
        console.log("⚠️ 資料表為空，預設從 7 天前開始抓取");
        nextDate = new Date(yesterdayDate);
        nextDate.setDate(nextDate.getDate() - 7);
      } else {
        // 從資料庫日期的「隔天」開始
        nextDate = new Date(lastDbDateStr);
        nextDate.setDate(nextDate.getDate() + 1);
      }

      let nextDateStr = formatDate(nextDate);

      // 3. 判斷是否需要抓取
      if (nextDateStr > yesterdayStr) {
        console.log(`✅ 資料已是最新的，無需更新。`);
        continue;
      }

      // 4. 迴圈抓取
      while (nextDateStr <= yesterdayStr) {
        console.log(`📥 [${site.domain}] 正在抓取: ${nextDateStr}...`);

        const trafficData = await fetchCloudflareTraffic(
          site.zoneId,
          nextDateStr,
        );

        if (trafficData.length > 0) {
          const connection = await trafficPool.getConnection();
          try {
            await connection.beginTransaction();

            for (const row of trafficData) {
              const sql = `
                  INSERT INTO ${site.table} (record_date, country, requests)
                  VALUES (?, ?, ?)
                  ON DUPLICATE KEY UPDATE requests = VALUES(requests)
                `;
              await connection.execute(sql, [
                row.record_date,
                row.country,
                row.requests,
              ]);
            }

            await connection.commit();
            console.log(
              `💾 成功儲存 ${nextDateStr}: ${trafficData.length} 筆資料`,
            );
          } catch (err) {
            await connection.rollback();
            console.error(`❌ 資料庫寫入失敗:`, err);
          } finally {
            connection.release();
          }
        } else {
          console.log(`⚠️ ${nextDateStr} API 回傳無資料`);
        }

        nextDate.setDate(nextDate.getDate() + 1);
        nextDateStr = formatDate(nextDate);

        await new Promise((r) => setTimeout(r, 500));
      }
    } catch (err) {
      console.error(`❌ 處理 ${site.domain} 發生錯誤:`, err);
    }
  }

  console.log(`--------------------------------------------------`);
  return { result: "Sync Complete" };
};

// 輔助函式
function formatDate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}
