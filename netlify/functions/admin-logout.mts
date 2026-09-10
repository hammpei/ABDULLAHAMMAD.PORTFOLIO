import type { Config, Context } from "@netlify/functions";
import { clearSessionCookie } from "../lib/admin-auth.ts";

export default async (req: Request, _context: Context) => {
  if (req.method !== "POST") {
    return Response.json({ error: "Method not allowed" }, { status: 405 });
  }

  return Response.json(
    { ok: true },
    { headers: { "Set-Cookie": clearSessionCookie() } },
  );
};

export const config: Config = {
  path: "/api/admin/logout",
};
