// server/api/admin/users/[id].get.ts 取得單一使用者 API, 用於編輯頁面回填資料。
import { pool } from "../../../utils/db";

export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, "id");
  const [rows]: any = await pool.execute(
    "SELECT id, username, name, role_id FROM users WHERE id = ?",
    [id],
  );
  return rows[0];
});
