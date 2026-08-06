import { NextResponse } from "next/server";
import { getSupabaseSessionClient } from "@/lib/supabase/server-client";

// The recording_url stored on a call at webhook time is the raw, private
// storage path (see app/api/vapi/webhook/route.ts) — it 403s if fetched
// directly. Vapi issues short-lived (30 min) presigned URLs for actual
// playback, so we fetch a fresh one on demand every time a call is opened,
// rather than trying to store a URL that would go stale.
export async function GET(
  request: Request,
  { params }: { params: Promise<{ callId: string }> }
) {
  const { callId } = await params;

  const supabase = await getSupabaseSessionClient();
  // RLS scopes this to the current user's own business (calls_select_own).
  const { data: call } = await supabase
    .from("calls")
    .select("vapi_call_id, recording_url")
    .eq("id", callId)
    .maybeSingle();

  if (!call?.vapi_call_id) {
    return NextResponse.json({ error: "Recording not found." }, { status: 404 });
  }

  const apiKey = process.env.VAPI_PRIVATE_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: "Missing VAPI_PRIVATE_API_KEY." }, { status: 500 });
  }

  const res = await fetch(`https://api.vapi.ai/call/${call.vapi_call_id}`, {
    headers: { Authorization: `Bearer ${apiKey}` },
  });
  if (!res.ok) {
    return NextResponse.json({ error: "Failed to fetch call from Vapi." }, { status: 502 });
  }

  const data = (await res.json()) as {
    artifact?: { presignedStereoUrl?: string; presignedMonoUrl?: string };
  };

  // Verified live against Vapi's actual /call/{id} response: the presigned,
  // directly-playable URLs live under artifact.presigned{Stereo,Mono}Url —
  // the plain recordingUrl/stereoRecordingUrl fields (top-level and under
  // artifact) point at the private storage bucket and 403 without a
  // signature, which is why playback was broken before this route existed.
  const presignedUrl =
    data.artifact?.presignedStereoUrl ?? data.artifact?.presignedMonoUrl ?? call.recording_url;

  if (!presignedUrl) {
    return NextResponse.json({ error: "No recording available for this call." }, { status: 404 });
  }

  return NextResponse.redirect(presignedUrl);
}
