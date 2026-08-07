import { NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { getSupabaseSessionClient } from "@/lib/supabase/server-client";
import { getSupabaseServerClient } from "@/lib/supabase/client";

const MAX_FILE_BYTES = 8 * 1024 * 1024;

/**
 * Uploads a menu photo to Supabase Storage and asks Claude's vision to
 * transcribe it into plain text (dish names, descriptions, prices) — the
 * voice assistant can't "look" at an image mid-call, so the photo is only
 * useful once it's turned into text the system prompt can include.
 */
export async function POST(request: Request) {
  const supabase = await getSupabaseSessionClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
  }

  const formData = await request.formData();
  const file = formData.get("file");
  if (!(file instanceof File)) {
    return NextResponse.json({ error: "No file uploaded." }, { status: 400 });
  }
  if (file.size > MAX_FILE_BYTES) {
    return NextResponse.json({ error: "Image is too large (max 8MB)." }, { status: 400 });
  }
  if (!file.type.startsWith("image/")) {
    return NextResponse.json({ error: "Only image files are supported." }, { status: 400 });
  }

  const bytes = new Uint8Array(await file.arrayBuffer());
  const base64 = Buffer.from(bytes).toString("base64");

  // Upload via the service-role client — this route only ever writes into
  // the caller's own path (user.id prefix), no cross-tenant access possible.
  const storage = getSupabaseServerClient();
  const path = `${user.id}/${Date.now()}-${file.name.replace(/[^a-zA-Z0-9._-]/g, "_")}`;
  const { error: uploadError } = await storage.storage
    .from("menu-photos")
    .upload(path, bytes, { contentType: file.type });

  if (uploadError) {
    return NextResponse.json({ error: uploadError.message }, { status: 500 });
  }

  const {
    data: { publicUrl },
  } = storage.storage.from("menu-photos").getPublicUrl(path);

  let extractedText = "";
  try {
    const anthropic = new Anthropic();
    const message = await anthropic.messages.create({
      model: "claude-sonnet-5",
      max_tokens: 1024,
      messages: [
        {
          role: "user",
          content: [
            {
              type: "image",
              source: { type: "base64", media_type: file.type as "image/jpeg", data: base64 },
            },
            {
              type: "text",
              text: "This is a photo of a restaurant menu page. Transcribe every dish name, short description, and price you can read into plain text, one item per line. If it's not a menu, say so in one line. Respond with only the transcription, no extra commentary.",
            },
          ],
        },
      ],
    });
    const textBlock = message.content.find((block) => block.type === "text");
    extractedText = textBlock && textBlock.type === "text" ? textBlock.text.trim() : "";
  } catch (err) {
    console.error("Menu photo OCR failed:", err);
    // Photo is still uploaded and usable even if the OCR step fails.
  }

  return NextResponse.json({ url: publicUrl, extractedText });
}
