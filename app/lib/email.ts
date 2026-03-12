import { Resend } from "resend";

// Lazy initialization to avoid build-time errors
let _resend: Resend | null = null;

function getResend(): Resend {
  if (!_resend) {
    if (!process.env.RESEND_API_KEY) {
      throw new Error("RESEND_API_KEY is not set");
    }
    _resend = new Resend(process.env.RESEND_API_KEY);
  }
  return _resend;
}

const FROM_EMAIL = process.env.FROM_EMAIL || "PassionDriven <notifications@passiondriven.ie>";
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://passiondriven.ie";

// Email templates
export async function sendNewMessageEmail({
  toEmail,
  toName,
  senderName,
  listingTitle,
  messagePreview,
  threadId,
}: {
  toEmail: string;
  toName: string;
  senderName: string;
  listingTitle: string;
  messagePreview: string;
  threadId: string;
}) {
  const resend = getResend();

  const truncatedPreview = messagePreview.length > 150
    ? messagePreview.substring(0, 150) + "..."
    : messagePreview;

  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 0; background-color: #f5f5f5; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f5f5f5; padding: 40px 20px;">
    <tr>
      <td align="center">
        <table width="100%" cellpadding="0" cellspacing="0" style="max-width: 480px; background-color: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.08);">
          <!-- Header -->
          <tr>
            <td style="background-color: #14532d; padding: 24px 32px; text-align: center;">
              <h1 style="margin: 0; color: #ffffff; font-size: 24px; font-weight: 900;">PassionDriven</h1>
            </td>
          </tr>

          <!-- Content -->
          <tr>
            <td style="padding: 32px;">
              <p style="margin: 0 0 16px; color: #14532d; font-size: 16px; font-weight: 600;">
                Hi ${toName},
              </p>

              <p style="margin: 0 0 24px; color: #666; font-size: 15px; line-height: 1.5;">
                You have a new message from <strong style="color: #14532d;">${senderName}</strong> about:
              </p>

              <div style="background-color: #f0fdf4; border-radius: 12px; padding: 16px; margin-bottom: 24px;">
                <p style="margin: 0; color: #14532d; font-size: 15px; font-weight: 700;">${listingTitle}</p>
              </div>

              <div style="background-color: #f5f5f5; border-radius: 12px; padding: 16px; margin-bottom: 24px; border-left: 4px solid #14532d;">
                <p style="margin: 0; color: #333; font-size: 14px; line-height: 1.5; font-style: italic;">
                  "${truncatedPreview}"
                </p>
              </div>

              <a href="${SITE_URL}/messages/${threadId}" style="display: inline-block; background-color: #14532d; color: #ffffff; text-decoration: none; padding: 14px 28px; border-radius: 10px; font-size: 15px; font-weight: 700;">
                View Message
              </a>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding: 24px 32px; border-top: 1px solid #eee;">
              <p style="margin: 0; color: #999; font-size: 12px; text-align: center;">
                You're receiving this because you have message notifications enabled.<br>
                <a href="${SITE_URL}/account/profile" style="color: #14532d;">Manage notification settings</a>
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `.trim();

  const text = `
Hi ${toName},

You have a new message from ${senderName} about: ${listingTitle}

"${truncatedPreview}"

View the conversation: ${SITE_URL}/messages/${threadId}

---
You're receiving this because you have message notifications enabled.
Manage settings: ${SITE_URL}/account/profile
  `.trim();

  try {
    const { error } = await resend.emails.send({
      from: FROM_EMAIL,
      to: toEmail,
      subject: `New message from ${senderName} - ${listingTitle}`,
      html,
      text,
    });

    if (error) {
      console.error("Failed to send message notification email:", error);
      return { success: false, error };
    }

    return { success: true };
  } catch (err) {
    console.error("Email send error:", err);
    return { success: false, error: err };
  }
}

export async function sendAlertMatchEmail({
  toEmail,
  toName,
  alertName,
  listings,
  alertId,
}: {
  toEmail: string;
  toName: string;
  alertName: string;
  listings: Array<{
    id: string;
    title: string;
    price_eur: number | null;
    location: string | null;
    image_url: string | null;
  }>;
  alertId: string;
}) {
  const resend = getResend();

  const listingItems = listings.map(listing => `
    <tr>
      <td style="padding: 12px 0; border-bottom: 1px solid #eee;">
        <table width="100%" cellpadding="0" cellspacing="0">
          <tr>
            <td width="80" style="vertical-align: top;">
              ${listing.image_url
                ? `<img src="${listing.image_url}" alt="" style="width: 72px; height: 54px; object-fit: cover; border-radius: 8px;" />`
                : `<div style="width: 72px; height: 54px; background-color: #f0fdf4; border-radius: 8px;"></div>`
              }
            </td>
            <td style="vertical-align: top; padding-left: 12px;">
              <a href="${SITE_URL}/listings/${listing.id}" style="color: #14532d; text-decoration: none; font-size: 14px; font-weight: 700; display: block; margin-bottom: 4px;">
                ${listing.title}
              </a>
              <p style="margin: 0; color: #666; font-size: 13px;">
                ${listing.price_eur ? `€${listing.price_eur.toLocaleString()}` : "Price on request"}
                ${listing.location ? ` · ${listing.location}` : ""}
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  `).join("");

  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 0; background-color: #f5f5f5; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f5f5f5; padding: 40px 20px;">
    <tr>
      <td align="center">
        <table width="100%" cellpadding="0" cellspacing="0" style="max-width: 480px; background-color: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.08);">
          <!-- Header -->
          <tr>
            <td style="background-color: #14532d; padding: 24px 32px; text-align: center;">
              <h1 style="margin: 0; color: #ffffff; font-size: 24px; font-weight: 900;">PassionDriven</h1>
            </td>
          </tr>

          <!-- Content -->
          <tr>
            <td style="padding: 32px;">
              <p style="margin: 0 0 16px; color: #14532d; font-size: 16px; font-weight: 600;">
                Hi ${toName},
              </p>

              <p style="margin: 0 0 8px; color: #666; font-size: 15px; line-height: 1.5;">
                We found <strong style="color: #14532d;">${listings.length} new listing${listings.length > 1 ? "s" : ""}</strong> matching your alert:
              </p>

              <div style="background-color: #f0fdf4; border-radius: 10px; padding: 12px 16px; margin-bottom: 24px;">
                <p style="margin: 0; color: #14532d; font-size: 14px; font-weight: 700;">${alertName}</p>
              </div>

              <table width="100%" cellpadding="0" cellspacing="0">
                ${listingItems}
              </table>

              <div style="margin-top: 24px;">
                <a href="${SITE_URL}/account/alerts" style="display: inline-block; background-color: #14532d; color: #ffffff; text-decoration: none; padding: 14px 28px; border-radius: 10px; font-size: 15px; font-weight: 700;">
                  View All Matches
                </a>
              </div>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding: 24px 32px; border-top: 1px solid #eee;">
              <p style="margin: 0; color: #999; font-size: 12px; text-align: center;">
                You're receiving this because you set up a search alert.<br>
                <a href="${SITE_URL}/account/alerts" style="color: #14532d;">Manage your alerts</a>
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `.trim();

  const listingText = listings.map(l =>
    `- ${l.title} (${l.price_eur ? `€${l.price_eur.toLocaleString()}` : "Price on request"})${l.location ? ` - ${l.location}` : ""}\n  ${SITE_URL}/listings/${l.id}`
  ).join("\n\n");

  const text = `
Hi ${toName},

We found ${listings.length} new listing${listings.length > 1 ? "s" : ""} matching your alert "${alertName}":

${listingText}

View all matches: ${SITE_URL}/account/alerts

---
You're receiving this because you set up a search alert.
Manage alerts: ${SITE_URL}/account/alerts
  `.trim();

  try {
    const { error } = await resend.emails.send({
      from: FROM_EMAIL,
      to: toEmail,
      subject: `${listings.length} new listing${listings.length > 1 ? "s" : ""} matching "${alertName}"`,
      html,
      text,
    });

    if (error) {
      console.error("Failed to send alert match email:", error);
      return { success: false, error };
    }

    return { success: true };
  } catch (err) {
    console.error("Email send error:", err);
    return { success: false, error: err };
  }
}

// Admin notification when a new listing is submitted for review
export async function sendAdminNewListingEmail({
  listingId,
  listingTitle,
  category,
  sellerEmail,
  sellerName,
  price,
  imageUrl,
}: {
  listingId: string;
  listingTitle: string;
  category: string;
  sellerEmail: string;
  sellerName: string;
  price: number | null;
  imageUrl: string | null;
}) {
  const adminEmail = process.env.ADMIN_EMAIL;
  if (!adminEmail) {
    console.warn("ADMIN_EMAIL not set, skipping admin notification");
    return { success: false, error: "ADMIN_EMAIL not configured" };
  }

  const resend = getResend();

  const priceDisplay = price ? `€${price.toLocaleString()}` : "Price on request";
  const categoryLabel = category.charAt(0).toUpperCase() + category.slice(1);

  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 0; background-color: #f5f5f5; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f5f5f5; padding: 40px 20px;">
    <tr>
      <td align="center">
        <table width="100%" cellpadding="0" cellspacing="0" style="max-width: 480px; background-color: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.08);">
          <!-- Header -->
          <tr>
            <td style="background-color: #14532d; padding: 24px 32px; text-align: center;">
              <h1 style="margin: 0; color: #ffffff; font-size: 24px; font-weight: 900;">New Listing Pending</h1>
            </td>
          </tr>

          <!-- Content -->
          <tr>
            <td style="padding: 32px;">
              <p style="margin: 0 0 16px; color: #14532d; font-size: 16px; font-weight: 600;">
                A new listing needs your review:
              </p>

              ${imageUrl ? `
              <div style="margin-bottom: 16px;">
                <img src="${imageUrl}" alt="" style="width: 100%; max-height: 200px; object-fit: cover; border-radius: 12px;" />
              </div>
              ` : ""}

              <div style="background-color: #f0fdf4; border-radius: 12px; padding: 16px; margin-bottom: 16px;">
                <p style="margin: 0 0 8px; color: #14532d; font-size: 18px; font-weight: 700;">${listingTitle}</p>
                <p style="margin: 0; color: #666; font-size: 14px;">
                  <strong>Category:</strong> ${categoryLabel}<br>
                  <strong>Price:</strong> ${priceDisplay}
                </p>
              </div>

              <div style="background-color: #f5f5f5; border-radius: 12px; padding: 16px; margin-bottom: 24px;">
                <p style="margin: 0 0 4px; color: #666; font-size: 12px; font-weight: 600; text-transform: uppercase;">Seller</p>
                <p style="margin: 0; color: #333; font-size: 14px; font-weight: 600;">${sellerName}</p>
                <p style="margin: 0; color: #666; font-size: 13px;">${sellerEmail}</p>
              </div>

              <a href="${SITE_URL}/admin/pending" style="display: inline-block; background-color: #14532d; color: #ffffff; text-decoration: none; padding: 14px 28px; border-radius: 10px; font-size: 15px; font-weight: 700; margin-right: 8px;">
                Review Pending Listings
              </a>
              <a href="${SITE_URL}/listings/${listingId}" style="display: inline-block; background-color: #f5f5f5; color: #14532d; text-decoration: none; padding: 14px 28px; border-radius: 10px; font-size: 15px; font-weight: 700; border: 1px solid #ddd;">
                View Listing
              </a>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding: 24px 32px; border-top: 1px solid #eee;">
              <p style="margin: 0; color: #999; font-size: 12px; text-align: center;">
                This is an automated admin notification from PassionDriven.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `.trim();

  const text = `
New listing pending review on PassionDriven:

Title: ${listingTitle}
Category: ${categoryLabel}
Price: ${priceDisplay}

Seller: ${sellerName} (${sellerEmail})

Review pending listings: ${SITE_URL}/admin/pending
View listing: ${SITE_URL}/listings/${listingId}
  `.trim();

  try {
    const { error } = await resend.emails.send({
      from: FROM_EMAIL,
      to: adminEmail,
      subject: `New listing pending: ${listingTitle}`,
      html,
      text,
    });

    if (error) {
      console.error("Failed to send admin notification email:", error);
      return { success: false, error };
    }

    return { success: true };
  } catch (err) {
    console.error("Admin email send error:", err);
    return { success: false, error: err };
  }
}
