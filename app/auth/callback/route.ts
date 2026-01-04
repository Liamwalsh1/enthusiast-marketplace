import { NextResponse } from "next/server";
import { createServerSupabaseClient } from "../../lib/supabase/server";

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");
  const next = requestUrl.searchParams.get("next") || "/account";

  if (!code) {
    return NextResponse.redirect(new URL(`/login?error=missing_code`, requestUrl.origin));
  }

  try {
    const supabase = await createServerSupabaseClient();
    await supabase.auth.exchangeCodeForSession(code);
  } catch (error) {
    console.error("Auth callback error:", error);
    return NextResponse.redirect(
      new URL(`/login?error=${encodeURIComponent("Sign-in failed")}`, requestUrl.origin)
    );
  }

  return NextResponse.redirect(new URL(next, requestUrl.origin), {
    status: 302,
  });
}
