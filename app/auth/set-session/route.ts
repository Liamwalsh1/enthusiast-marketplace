import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";

function requireEnv(value: string | undefined, name: string) {
  if (!value) throw new Error(`Missing environment variable: ${name}`);
  return value;
}

export async function POST(request: Request) {
  const cookieStore = await cookies();
  const response = new NextResponse(null, { status: 204 });

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
            response.cookies.set({
              name: cookie.name,
              value: cookie.value,
              ...(cookie.options ?? {}),
              path: cookie.options?.path ?? "/",
            });
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

  return response;
}
