import { defineEventHandler, getCookie, createError } from "h3";

export default defineEventHandler((event) => {
  const cookie = getCookie(event, "auth_user");

  if (!cookie) {
    throw createError({
      statusCode: 401,
      message: "未登入",
    });
  }

  return JSON.parse(cookie);
});
