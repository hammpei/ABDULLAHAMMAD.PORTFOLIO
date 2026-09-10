import type { Config, Context } from "@netlify/functions";
import { createSessionCookie, passwordsMatch } from "../lib/admin-auth.ts";

export default async (req: Request, _context: Context) => {
  if (req.method !== "POST") {
    return Response.json({ error: "Method not allowed" }, { status: 405 });
  }

  try {
    const body = await req.json();
    const password = typeof body?.password === "string" ? body.password : "";

    if (!(await passwordsMatch(password))) {
      return Response.json({ error: "Invalid password" }, { status: 401 });
    }

    return Response.json(
      { ok: true },
      { headers: { "Set-Cookie": await createSessionCookie() } },
    );
  } catch (error) {
    console.error(error);
    return Response.json({ error: "Unable to sign in" }, { status: 500 });
  }
};

export const config: Config = {
  path: "/api/admin/login",
};
