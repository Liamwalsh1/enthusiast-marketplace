import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";

function requireEnv(value: string | undefined, name: string) {
  if (!value) throw new Error(`Missing environment variable: ${name}`);
  return value;
}

export async function POST(request: Request) {
  const cookieStore = await cookies();

  // We'll collect cookies to set and apply them at the end
  const cookiesToSet: Array<{ name: string; value: string; options?: Record<string, unknown> }> = [];

  let body: { access_token?: string; refresh_token?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const accessToken = body.access_token;
  const refreshToken = body.refresh_token;

  if (!accessToken || !refreshToken) {
    return NextResponse.json({ error: "Missing tokens" }, { status: 400 });
  }

  const supabase = createServerClient(
    requireEnv(process.env.NEXT_PUBLIC_SUPABASE_URL, "NEXT_PUBLIC_SUPABASE_URL"),
    requireEnv(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY, "NEXT_PUBLIC_SUPABASE_ANON_KEY"),
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookies) {
          cookies.forEach((cookie) => {
            cookiesToSet.push(cookie);
          });
        },
      },
    }
  );

  const { error } = await supabase.auth.setSession({
    access_token: accessToken,
    refresh_token: refreshToken,
  });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  // Create response and set all cookies
  const response = new NextResponse(JSON.stringify({ success: true }), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });

  for (const cookie of cookiesToSet) {
    response.cookies.set({
      name: cookie.name,
      value: cookie.value,
      path: (cookie.options?.path as string) ?? "/",
      maxAge: cookie.options?.maxAge as number | undefined,
      httpOnly: (cookie.options?.httpOnly as boolean) ?? true,
      secure: process.env.NODE_ENV === "production",
      sameSite: (cookie.options?.sameSite as "lax" | "strict" | "none") ?? "lax",
    });
  }

  return response;
}
