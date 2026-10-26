import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "../../../../server/auth";
import { presignUploadSchema } from "../../../../lib/validators/uploads";
import { generateObjectKey, createPresignedUploadUrl } from "../../../../lib/s3";
import { UI_TEXT } from "../../../../lib/constants";

export async function POST(request: NextRequest) {
  try {
    // 1. Strict Layer 2 session check
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: UI_TEXT.unauthorized }, { status: 401 });
    }

    // 2. Body validation
    const body = await request.json();
    const parsed = presignUploadSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message || "Payload tidak valid." },
        { status: 400 }
      );
    }

    const { fileName, contentType } = parsed.data;

    // 3. Generate isolated object key and presigned upload URL
    const objectKey = generateObjectKey(user.id, fileName);
    const { uploadUrl } = await createPresignedUploadUrl(objectKey, contentType);

    return NextResponse.json({
      uploadUrl,
      objectKey,
    });
  } catch (error: any) {
    console.error("Presign upload error:", error);
    return NextResponse.json(
      { error: "Gagal membuat URL unggah file." },
      { status: 500 }
    );
  }
}
