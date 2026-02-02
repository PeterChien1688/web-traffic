// server/utils/db.ts
import mysql from "mysql2/promise";

const config = useRuntimeConfig();

export const pool = mysql.createPool({
  host: config.dbHost,
  user: config.dbUser,
  password: config.dbPassword,
  database: config.dbName,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  // 2. ▼ 關鍵修正：強制開啟 SSL ▼
  ssl: {
    // 允許自我簽署憑證 (GCP Cloud SQL 的必要設定)
    rejectUnauthorized: false,
  },
});

// ==========================================
// 2. 新增的連線池 (給 Traffic Map 使用) -> 連到 traffic_db
// ==========================================
export const trafficPool = mysql.createPool({
  host: config.trafficDbHost,
  user: config.trafficDbUser,
  password: config.trafficDbPassword,
  database: config.trafficDbName, // 這裡是 traffic_db
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  ssl: {
    rejectUnauthorized: false,
  },
});

// 除錯用 Log (可以保留觀察)
console.log("DB Configured:", {
  LoginDB: config.dbName,
  TrafficDB: config.trafficDbName,
});
