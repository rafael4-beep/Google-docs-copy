// POST /api/upload (multipart/form-data, field "file")
// Imports a .txt/.md/.docx file and creates a new document owned by the current
// user. Returns the created document so the client can navigate straight to it.

import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { createDocument } from "@/lib/repo";
import { importFile, SUPPORTED_EXTENSIONS } from "@/lib/import";

export async function POST(request: Request) {
  const user = await getCurrentUser();

  let formData: FormData;
  try {
    formData = await request.formData();
  } catch {
    return NextResponse.json({ error: "Expected a multipart form upload" }, { status: 400 });
  }

  const file = formData.get("file");
  if (!file || typeof file === "string") {
    return NextResponse.json({ error: "No file provided" }, { status: 400 });
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  try {
    const { title, html } = await importFile({ filename: file.name, buffer });
    const doc = createDocument({ title, content: html, ownerId: user.id });
    return NextResponse.json({ document: doc }, { status: 201 });
  } catch (err) {
    return NextResponse.json(
      {
        error: err instanceof Error ? err.message : "Could not import file",
        supported: SUPPORTED_EXTENSIONS,
      },
      { status: 400 }
    );
  }
}
