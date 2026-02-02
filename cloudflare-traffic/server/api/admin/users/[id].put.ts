// server/api/admin/users/[id].put.ts 更新使用者 API, 處理資料更新，如果密碼欄位是空的就不更新密碼。
import { pool } from "../../../utils/db";
import bcrypt from "bcrypt";

export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, "id");
  const body = await readBody(event);
  const { name, role_id, password } = body;

  // 安全檢查：如果是最後一位管理員，禁止降級 (後端防護)
  // ... (類似刪除 API 的檢查邏輯，若 role_id 變更且是最後管理員則擋下) ...

  let sql = "UPDATE users SET name = ?, role_id = ? WHERE id = ?";
  let params = [name, role_id, id];

  if (password) {
    const hashedPassword = await bcrypt.hash(password, 10);
    sql = "UPDATE users SET name = ?, role_id = ?, password = ? WHERE id = ?";
    params = [name, role_id, hashedPassword, id];
  }

  await pool.execute(sql, params);
  return { success: true };
});
