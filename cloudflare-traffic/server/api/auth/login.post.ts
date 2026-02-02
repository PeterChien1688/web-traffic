import { pool } from "../../utils/db";
import bcrypt from "bcrypt";

export default defineEventHandler(async (event) => {
  const body = await readBody(event);
  const { username, password } = body;

  if (!username || !password) {
    throw createError({ statusCode: 400, message: "缺少帳號或密碼" });
  }

  // ▼▼▼ 修改重點 1：SQL 改用 JOIN 查詢角色代碼 (r.code) ▼▼▼
  const [rows]: any = await pool.query(
    `SELECT u.id, u.username, u.password, u.name, r.code as role 
     FROM users u 
     LEFT JOIN roles r ON u.role_id = r.id 
     WHERE u.username = ?`,
    [username],
  );

  if (!rows.length) {
    throw createError({ statusCode: 401, message: "帳號或密碼錯誤" });
  }

  const user = rows[0];

  const ok = await bcrypt.compare(password, user.password);
  if (!ok) {
    throw createError({ statusCode: 401, message: "帳號或密碼錯誤" });
  }

  // ▼▼▼ 修改重點 2：將 role 寫入 Cookie ▼▼▼
  setCookie(
    event,
    "auth_user",
    JSON.stringify({
      id: user.id,
      username: user.username,
      name: user.name,
      // 如果還沒設定角色，給一個預設值 'user' 以防萬一
      role: user.role || "user",
    }),
    {
      httpOnly: false, // ⚠️ 注意：如果你要在前端 JS (Vue) 直接讀取 Cookie 判斷 UI，這裡建議改成 false
      // 如果你是用 Nuxt 的 useCookie 在 SSR 階段讀取，httpOnly: true 是比較安全的
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24,
    },
  );

  // 回傳時也包含 role，方便前端登入後立即使用
  return {
    success: true,
    user: {
      username: user.username,
      role: user.role || "user",
    },
  };
});
