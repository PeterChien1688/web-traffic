import { defineEventHandler, setCookie } from "h3";

export default defineEventHandler((event) => {
  setCookie(event, "auth_user", "", {
    path: "/",
    maxAge: 0,
  });

  return { success: true };
});
