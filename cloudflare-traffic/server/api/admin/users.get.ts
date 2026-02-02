// server/api/admin/users.get.ts
import { pool } from "../../utils/db";

export default defineEventHandler(async (event) => {
  // ... (權限檢查省略) ...

  // ✅ 修改 SQL：加入 r.code as role_code
  const [rows] = await pool.execute(
    `SELECT u.id, u.username, u.name, u.created_at, r.name as role_name, r.code as role_code
     FROM users u
     LEFT JOIN roles r ON u.role_id = r.id
     ORDER BY u.id ASC`,
  );

  return rows;
});
