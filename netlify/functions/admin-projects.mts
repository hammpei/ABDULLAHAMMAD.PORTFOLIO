import type { Config, Context } from "@netlify/functions";
import { getDatabase } from "@netlify/database";
import { isAdminRequest } from "../lib/admin-auth.ts";

function cleanString(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function cleanNullableString(value: unknown) {
  const result = cleanString(value);
  return result || null;
}

function cleanYear(value: unknown) {
  if (value === null || value === undefined || value === "") return null;
  const year = Number(value);
  return Number.isInteger(year) && year >= 1900 && year <= 2200 ? year : null;
}

export default async (req: Request, _context: Context) => {
  if (!(await isAdminRequest(req))) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

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

  if (req.method === "POST") {
    const body = await req.json();
    const title = cleanString(body?.title);
    if (!title) return Response.json({ error: "Title is required" }, { status: 400 });

    const [project] = await db.sql`
      INSERT INTO projects (
        title, description, category, youtube_url, image_url, client, year, featured
      ) VALUES (
        ${title},
        ${cleanNullableString(body?.description)},
        ${cleanNullableString(body?.category)},
        ${cleanNullableString(body?.youtube_url)},
        ${cleanNullableString(body?.image_url)},
        ${cleanNullableString(body?.client)},
        ${cleanYear(body?.year)},
        ${Boolean(body?.featured)}
      )
      RETURNING *
    `;

    return Response.json({ project }, { status: 201 });
  }

  if (req.method === "PUT") {
    const body = await req.json();
    const id = Number(body?.id);
    const title = cleanString(body?.title);

    if (!Number.isInteger(id) || id < 1 || !title) {
      return Response.json({ error: "Valid project id and title are required" }, { status: 400 });
    }

    const [project] = await db.sql`
      UPDATE projects
      SET title = ${title},
          description = ${cleanNullableString(body?.description)},
          category = ${cleanNullableString(body?.category)},
          youtube_url = ${cleanNullableString(body?.youtube_url)},
          image_url = ${cleanNullableString(body?.image_url)},
          client = ${cleanNullableString(body?.client)},
          year = ${cleanYear(body?.year)},
          featured = ${Boolean(body?.featured)},
          updated_at = NOW()
      WHERE id = ${id}
      RETURNING *
    `;

    if (!project) return Response.json({ error: "Project not found" }, { status: 404 });
    return Response.json({ project });
  }

  if (req.method === "DELETE") {
    const url = new URL(req.url);
    const id = Number(url.searchParams.get("id"));
    if (!Number.isInteger(id) || id < 1) {
      return Response.json({ error: "Valid project id is required" }, { status: 400 });
    }

    const [deleted] = await db.sql`
      DELETE FROM projects WHERE id = ${id} RETURNING id
    `;

    if (!deleted) return Response.json({ error: "Project not found" }, { status: 404 });
    return Response.json({ ok: true });
  }

  return Response.json({ error: "Method not allowed" }, { status: 405 });
};

export const config: Config = {
  path: "/api/admin/projects",
};
