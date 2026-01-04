import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

function requireEnv(value: string | undefined, name: string) {
  if (!value) throw new Error(`Missing environment variable: ${name}`);
  return value;
}

export async function createServerSupabaseClient() {
  const cookieStore = await cookies();

  return createServerClient(
    requireEnv(process.env.NEXT_PUBLIC_SUPABASE_URL, "NEXT_PUBLIC_SUPABASE_URL"),
    requireEnv(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY, "NEXT_PUBLIC_SUPABASE_ANON_KEY"),
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookies) {
          for (const cookie of cookies) {
            cookieStore.set({
              name: cookie.name,
              value: cookie.value,
              ...(cookie.options ?? {}),
              path: cookie.options?.path ?? "/",
            });
          }
        },
      },
    }
  );
}
