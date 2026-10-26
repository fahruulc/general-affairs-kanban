import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "../../../server/auth";
import { generateObjectKey, s3Client, getBucketName } from "../../../lib/s3";
import { PutObjectCommand } from "@aws-sdk/client-s3";
import { APP_CONFIG, UI_TEXT } from "../../../lib/constants";

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: UI_TEXT.unauthorized }, { status: 401 });
    }

    const formData = await request.formData();
    const file = formData.get("file") as File | null;
    if (!file) {
      return NextResponse.json({ error: "File tidak ditemukan." }, { status: 400 });
    }

    if (file.size > APP_CONFIG.maxUploadBytes) {
      return NextResponse.json(
        { error: "Ukuran file melebihi batas 5 MB." },
        { status: 400 }
      );
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const objectKey = generateObjectKey(user.id, file.name || "image.jpg");
    const bucket = getBucketName();

    console.log(`[Upload API] Uploading ${file.name} (${file.size} bytes) to B2 bucket "${bucket}" as "${objectKey}"...`);

    const command = new PutObjectCommand({
      Bucket: bucket,
      Key: objectKey,
      Body: buffer,
      ContentType: file.type || "image/jpeg",
    });

    await s3Client.send(command);
    console.log(`[Upload API] Upload to Backblaze B2 successful: ${objectKey}`);

    return NextResponse.json({
      success: true,
      objectKey,
    });
  } catch (error: any) {
    console.error("[Upload API] Error uploading to storage:", error);
    return NextResponse.json(
      { error: error.message || "Gagal mengunggah foto ke penyimpanan." },
      { status: 500 }
    );
  }
}
