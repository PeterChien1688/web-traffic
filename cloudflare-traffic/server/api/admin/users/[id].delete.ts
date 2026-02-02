// server/api/admin/users/[id].delete.ts 刪除使用者 API
import { pool } from "../../../utils/db";

export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, "id");

  // 1. 檢查要刪除的人是不是管理員
  const [target]: any = await pool.execute(
    "SELECT r.code FROM users u JOIN roles r ON u.role_id = r.id WHERE u.id = ?",
    [id],
  );

  if (target.length > 0 && target[0].code === "administrators") {
    // 2. 如果是管理員，檢查目前剩下幾個管理員
    const [admins]: any = await pool.execute(
      "SELECT COUNT(*) as count FROM users u JOIN roles r ON u.role_id = r.id WHERE r.code = 'administrators'",
    );

    if (admins[0].count <= 1) {
      throw createError({
        statusCode: 400,
        message: "這是最後一位管理員，不可刪除！",
      });
    }
  }

  // 3. 執行刪除
  await pool.execute("DELETE FROM users WHERE id = ?", [id]);
  return { success: true };
});
