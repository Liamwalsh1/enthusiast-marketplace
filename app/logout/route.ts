import { NextResponse } from "next/server";
import { createServerSupabaseClient } from "../lib/supabase/server";

async function signOut(request: Request) {
  const supabase = await createServerSupabaseClient();
  await supabase.auth.signOut();

  const url = new URL(request.url);
  const redirectTo = url.searchParams.get("next") || "/browse";
  return NextResponse.redirect(new URL(redirectTo, url.origin), {
    status: 302,
  });
}

export async function POST(request: Request) {
  return signOut(request);
}

export async function GET(request: Request) {
  return signOut(request);
}
