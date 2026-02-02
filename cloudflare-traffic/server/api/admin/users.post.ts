import { pool } from "../../utils/db"; // 確保使用 ~ 路徑
import bcrypt from "bcrypt";

export default defineEventHandler(async (event) => {
  // 1. 權限檢查 (改用 Cookie 驗證)
  const cookieStr = getCookie(event, "auth_user");
  if (!cookieStr) {
    throw createError({ statusCode: 401, message: "未登入" });
  }

  const user = JSON.parse(cookieStr);
  if (user.role !== "administrators") {
    throw createError({ statusCode: 403, message: "權限不足" });
  }

  const body = await readBody(event);
  const { username, password, name, role_id } = body;

  if (!username || !password || !role_id) {
    throw createError({ statusCode: 400, message: "欄位不完整" });
  }

  // ▼▼▼【關鍵修改：檢查帳號重複】▼▼▼
  // 先去資料庫撈看看有沒有這個 username
  const [existingUsers]: any = await pool.execute(
    "SELECT id FROM users WHERE username = ?",
    [username],
  );

  // 如果陣列長度大於 0，代表帳號已存在
  if (existingUsers.length > 0) {
    throw createError({
      statusCode: 409, // 409 Conflict 代表資源衝突
      message: `帳號 "${username}" 已經被使用了，請更換一個。`,
    });
  }
  // ▲▲▲【檢查結束】▲▲▲

  // 3. 密碼加密
  const hashedPassword = await bcrypt.hash(password, 10);

  // 4. 寫入資料庫 (這時候已經確保不重複了)
  await pool.execute(
    "INSERT INTO users (username, password, name, role_id) VALUES (?, ?, ?, ?)",
    [username, hashedPassword, name, role_id],
  );

  return { success: true };
});
