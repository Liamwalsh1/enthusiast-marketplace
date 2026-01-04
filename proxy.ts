import { NextResponse, type NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";

export default async function proxy(request: NextRequest) {
  const response = NextResponse.next({ request: { headers: request.headers } });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
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

  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (process.env.NODE_ENV !== "production") {
    console.debug("Proxy auth check:", {
      path: request.nextUrl.pathname,
      hasUser: !!user,
      error: error?.message ?? null,
    });
  }

  return response;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
