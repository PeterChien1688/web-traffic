// server/api/traffic/dates.get.ts
import { trafficPool } from "../../utils/db";

export default defineEventHandler(async (event) => {
  try {
    // 👇 FIX: Change 'timestamp' to the correct column name (e.g., 'record_date')
    const [rows] = await trafficPool.execute(
      "SELECT DISTINCT DATE_FORMAT(record_date, '%Y-%m-%d') as date_val FROM TwTraffic ORDER BY date_val DESC",
    );

    return rows.map((r: any) => r.date_val);
  } catch (e: any) {
    console.error("Date Fetch Error:", e);
    return [];
  }
});
