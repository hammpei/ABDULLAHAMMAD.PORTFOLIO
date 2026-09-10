import type { Config, Context } from "@netlify/functions";
import { getDatabase } from "@netlify/database";

export default async (req: Request, _context: Context) => {
  const db = getDatabase();

  if (req.method === "GET") {
    const projects = await db.sql`
      SELECT id, title, description, category, youtube_url, image_url, client,
             year, featured, created_at, updated_at
      FROM projects
      ORDER BY featured DESC, created_at DESC
    `;

    return Response.json({ projects });
  }

  return Response.json({ error: "Method not allowed" }, { status: 405 });
};

export const config: Config = {
  path: "/api/projects",
};
