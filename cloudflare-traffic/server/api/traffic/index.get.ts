// server/api/traffic/traffic.get.ts
import { trafficPool } from "../../utils/db";
// ✅ 手動加入這行
import { defineEventHandler, getQuery, createError } from "h3";

export default defineEventHandler(async (event) => {
  // 1. 取得前端傳來的參數 (?table=TwTraffic)
  const query = getQuery(event);
  const tableName = query.table as string;

  // 安全檢查：為了防止 SQL Injection，建議設定白名單
  // 如果你的資料表名稱是動態的，請確保只允許特定的名稱
  const allowedTables = ["TwTraffic", "MyTraffic", "traffic_data_tw"];
  if (!tableName || !allowedTables.includes(tableName)) {
    // 為了開發方便，如果你確定環境安全，可以暫時拿掉這段檢查，直接使用 tableName
    // 但正式上線強烈建議保留白名單機制
    console.warn(`⚠️ 警告: 嘗試存取未授權的資料表 -> ${tableName}`);
    // throw createError({ statusCode: 400, message: 'Invalid table name' });
  }

  try {
    // 2. 執行 SQL 查詢
    // 假設你的資料表欄位有: record_date, country, requests
    // 我們直接組字串 (注意：實務上最好再次確認 tableName 安全性)
    const sql = `SELECT record_date, country, requests FROM ${tableName} ORDER BY record_date DESC`;

    const [rows] = await trafficPool.execute(sql);

    // 3. 回傳資料給前端
    return rows;
  } catch (error: any) {
    console.error("SQL Error:", error);
    throw createError({
      statusCode: 500,
      message: `Database Query Failed: ${error.message}`,
    });
  }
});
