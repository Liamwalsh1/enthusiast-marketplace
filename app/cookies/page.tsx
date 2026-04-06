import Link from "next/link";

export const metadata = {
  title: "Cookie Policy | Passion Driven",
  description: "Information about how we use cookies and similar technologies",
};

export default function CookiePolicyPage() {
  return (
    <main className="container" style={{ maxWidth: 800 }}>
      <Link className="pill" href="/">
        ← Back to Home
      </Link>

      <h1 style={h1Style}>Cookie Policy</h1>
      <p style={updatedStyle}>Last updated: January 2025</p>

      <div style={contentStyle}>
        <section style={sectionStyle}>
          <h2 style={h2Style}>1. What Are Cookies?</h2>
          <p>
            Cookies are small text files that are stored on your device when you visit a website.
            They help websites remember your preferences and improve your browsing experience.
          </p>
        </section>

        <section style={sectionStyle}>
          <h2 style={h2Style}>2. How We Use Cookies</h2>
          <p>We use cookies for the following purposes:</p>

          <h3 style={h3Style}>Essential Cookies (Required)</h3>
          <p>
            These cookies are necessary for the website to function properly. They enable core
            functionality such as security, authentication, and session management. You cannot
            opt out of these cookies.
          </p>
          <div style={tableContainerStyle}>
            <table style={tableStyle}>
              <thead>
                <tr>
                  <th style={thStyle}>Cookie</th>
                  <th style={thStyle}>Purpose</th>
                  <th style={thStyle}>Duration</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td style={tdStyle}>sb-*-auth-token</td>
                  <td style={tdStyle}>Authentication session</td>
                  <td style={tdStyle}>Session</td>
                </tr>
                <tr>
                  <td style={tdStyle}>cookie-consent</td>
                  <td style={tdStyle}>Stores your cookie preferences</td>
                  <td style={tdStyle}>1 year</td>
                </tr>
              </tbody>
            </table>
          </div>

          <h3 style={h3Style}>Functional Cookies (Optional)</h3>
          <p>
            These cookies enable enhanced functionality and personalization, such as remembering
            your preferences and settings.
          </p>
          <div style={tableContainerStyle}>
            <table style={tableStyle}>
              <thead>
                <tr>
                  <th style={thStyle}>Cookie</th>
                  <th style={thStyle}>Purpose</th>
                  <th style={thStyle}>Duration</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td style={tdStyle}>theme</td>
                  <td style={tdStyle}>Remembers your display preferences</td>
                  <td style={tdStyle}>1 year</td>
                </tr>
                <tr>
                  <td style={tdStyle}>recent-searches</td>
                  <td style={tdStyle}>Stores your recent search history</td>
                  <td style={tdStyle}>30 days</td>
                </tr>
              </tbody>
            </table>
          </div>

          <h3 style={h3Style}>Analytics Cookies (Optional)</h3>
          <p>
            These cookies help us understand how visitors interact with our website by collecting
            and reporting information anonymously.
          </p>
          <div style={tableContainerStyle}>
            <table style={tableStyle}>
              <thead>
                <tr>
                  <th style={thStyle}>Cookie</th>
                  <th style={thStyle}>Purpose</th>
                  <th style={thStyle}>Duration</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td style={tdStyle}>_ga</td>
                  <td style={tdStyle}>Google Analytics - distinguishes users</td>
                  <td style={tdStyle}>2 years</td>
                </tr>
                <tr>
                  <td style={tdStyle}>_gid</td>
                  <td style={tdStyle}>Google Analytics - distinguishes users</td>
                  <td style={tdStyle}>24 hours</td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>

        <section style={sectionStyle}>
          <h2 style={h2Style}>3. Managing Your Cookie Preferences</h2>
          <p>
            When you first visit our website, you will see a cookie banner that allows you to
            accept or reject non-essential cookies. You can change your preferences at any time by:
          </p>
          <ul style={listStyle}>
            <li>Clicking the &quot;Cookie Settings&quot; link in the footer</li>
            <li>Adjusting your browser settings to block or delete cookies</li>
          </ul>
          <p>
            Please note that blocking certain cookies may impact your experience on the website.
          </p>
        </section>

        <section style={sectionStyle}>
          <h2 style={h2Style}>4. Browser Cookie Controls</h2>
          <p>
            Most web browsers allow you to control cookies through their settings. Here are links
            to cookie management instructions for popular browsers:
          </p>
          <ul style={listStyle}>
            <li>
              <a href="https://support.google.com/chrome/answer/95647" style={linkStyle} target="_blank" rel="noopener noreferrer">
                Google Chrome
              </a>
            </li>
            <li>
              <a href="https://support.mozilla.org/en-US/kb/cookies-information-websites-store-on-your-computer" style={linkStyle} target="_blank" rel="noopener noreferrer">
                Mozilla Firefox
              </a>
            </li>
            <li>
              <a href="https://support.apple.com/guide/safari/manage-cookies-sfri11471/mac" style={linkStyle} target="_blank" rel="noopener noreferrer">
                Safari
              </a>
            </li>
            <li>
              <a href="https://support.microsoft.com/en-us/microsoft-edge/delete-cookies-in-microsoft-edge-63947406-40ac-c3b8-57b9-2a946a29ae09" style={linkStyle} target="_blank" rel="noopener noreferrer">
                Microsoft Edge
              </a>
            </li>
          </ul>
        </section>

        <section style={sectionStyle}>
          <h2 style={h2Style}>5. Third-Party Cookies</h2>
          <p>
            Some cookies on our website are set by third-party services. We use:
          </p>
          <ul style={listStyle}>
            <li><strong>Supabase:</strong> For authentication and data storage</li>
            <li><strong>Google Analytics:</strong> For website analytics (if you consent)</li>
          </ul>
          <p>
            These third parties have their own privacy policies governing the use of cookies.
          </p>
        </section>

        <section style={sectionStyle}>
          <h2 style={h2Style}>6. Updates to This Policy</h2>
          <p>
            We may update this Cookie Policy from time to time to reflect changes in our practices
            or for other operational, legal, or regulatory reasons. Please check this page
            periodically for updates.
          </p>
        </section>

        <section style={sectionStyle}>
          <h2 style={h2Style}>7. Contact Us</h2>
          <p>
            If you have questions about our use of cookies, please contact us at{" "}
            <a href="mailto:info@passiondriven.ie" style={linkStyle}>
              info@passiondriven.ie
            </a>
          </p>
        </section>
      </div>
    </main>
  );
}

const h1Style: React.CSSProperties = {
  fontSize: 34,
  fontWeight: 950,
  color: "var(--green-900)",
  margin: "12px 0 8px",
};

const updatedStyle: React.CSSProperties = {
  color: "var(--muted)",
  fontWeight: 600,
  fontSize: 14,
  marginBottom: 24,
};

const contentStyle: React.CSSProperties = {
  background: "white",
  borderRadius: 20,
  border: "1px solid var(--border)",
  padding: 32,
};

const sectionStyle: React.CSSProperties = {
  marginBottom: 28,
};

const h2Style: React.CSSProperties = {
  fontSize: 18,
  fontWeight: 800,
  color: "var(--green-900)",
  marginBottom: 12,
};

const h3Style: React.CSSProperties = {
  fontSize: 15,
  fontWeight: 700,
  color: "var(--green-900)",
  marginTop: 16,
  marginBottom: 8,
};

const listStyle: React.CSSProperties = {
  marginLeft: 20,
  marginTop: 8,
  display: "flex",
  flexDirection: "column",
  gap: 6,
};

const linkStyle: React.CSSProperties = {
  color: "var(--green-900)",
  fontWeight: 700,
};

const tableContainerStyle: React.CSSProperties = {
  overflowX: "auto",
  marginTop: 12,
  marginBottom: 16,
};

const tableStyle: React.CSSProperties = {
  width: "100%",
  borderCollapse: "collapse",
  fontSize: 14,
};

const thStyle: React.CSSProperties = {
  textAlign: "left",
  padding: "10px 12px",
  background: "var(--soft)",
  borderBottom: "1px solid var(--border)",
  fontWeight: 700,
  color: "var(--green-900)",
};

const tdStyle: React.CSSProperties = {
  padding: "10px 12px",
  borderBottom: "1px solid var(--border)",
  fontWeight: 600,
  color: "var(--text)",
};
