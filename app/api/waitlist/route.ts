import { NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/app/lib/supabase/server";
import { Resend } from "resend";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://passiondriven.ie";
const FROM_EMAIL = process.env.FROM_EMAIL || "PassionDriven <notifications@passiondriven.ie>";

export async function POST(request: Request) {
  let payload: { email?: string; name?: string };
  try {
    payload = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }

  const email = payload.email?.trim().toLowerCase();
  const name = payload.name?.trim() || null;

  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return NextResponse.json({ error: "Please enter a valid email address." }, { status: 400 });
  }

  const supabase = await createServerSupabaseClient();

  const { error: insertError } = await supabase
    .from("waitlist")
    .insert({ email, name });

  if (insertError) {
    if (insertError.code === "23505") {
      return NextResponse.json({ error: "You're already signed up!" }, { status: 400 });
    }
    return NextResponse.json({ error: insertError.message }, { status: 400 });
  }

  // Send confirmation email
  if (process.env.RESEND_API_KEY) {
    try {
      const resend = new Resend(process.env.RESEND_API_KEY);
      await resend.emails.send({
        from: FROM_EMAIL,
        to: email,
        subject: "You're on the list — PassionDriven",
        html: `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="margin:0;padding:0;background:#f5f5f5;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f5f5f5;padding:40px 20px;">
    <tr><td align="center">
      <table width="100%" cellpadding="0" cellspacing="0" style="max-width:480px;background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.08);">
        <tr><td style="background:#14532d;padding:24px 32px;text-align:center;">
          <h1 style="margin:0;color:#ffffff;font-size:24px;font-weight:900;">PassionDriven</h1>
        </td></tr>
        <tr><td style="padding:32px;">
          <p style="margin:0 0 16px;color:#14532d;font-size:16px;font-weight:700;">
            ${name ? `Hi ${name},` : "Hi there,"}
          </p>
          <p style="margin:0 0 16px;color:#444;font-size:15px;line-height:1.6;">
            You're on the list. We'll keep you posted as new enthusiast cars, parts and memorabilia are listed on PassionDriven.
          </p>
          <p style="margin:0 0 24px;color:#444;font-size:15px;line-height:1.6;">
            In the meantime, feel free to have a browse — there might already be something worth seeing.
          </p>
          <a href="${siteUrl}/browse" style="display:inline-block;background:#14532d;color:#ffffff;text-decoration:none;padding:14px 28px;border-radius:10px;font-size:15px;font-weight:700;">
            Browse listings
          </a>
        </td></tr>
        <tr><td style="padding:24px 32px;border-top:1px solid #eee;">
          <p style="margin:0;color:#999;font-size:12px;text-align:center;">
            Ireland's marketplace for enthusiast cars, parts & memorabilia.
          </p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`.trim(),
        text: `${name ? `Hi ${name},` : "Hi there,"}\n\nYou're on the list. We'll keep you posted as new enthusiast cars, parts and memorabilia are listed on PassionDriven.\n\nBrowse listings: ${siteUrl}/browse`,
      });
    } catch {
      // Non-critical — don't fail the signup if email fails
    }
  }

  return NextResponse.json({ success: true }, { status: 201 });
}
