import { NextRequest, NextResponse } from "next/server";
import { parseFile } from "@/lib/fileParser";

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const files = formData.getAll("files") as File[];

    if (!files || files.length === 0) {
      return NextResponse.json({ error: "No files provided" }, { status: 400 });
    }

    const parsedFiles = [];

    for (const file of files) {
      const buffer = Buffer.from(await file.arrayBuffer());
      const parsed = await parseFile(buffer, file.name, file.type);
      parsedFiles.push(parsed);
    }

    return NextResponse.json({ files: parsedFiles });
  } catch (error) {
    console.error("Upload error:", error);
    return NextResponse.json(
      { error: "Failed to process files" },
      { status: 500 }
    );
  }
}
