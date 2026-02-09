import Link from "next/link";

export const metadata = {
  title: "Terms of Service | Passion Driven",
  description: "Terms and conditions for using Passion Driven",
};

export default function TermsPage() {
  return (
    <main className="container" style={{ maxWidth: 800 }}>
      <Link className="pill" href="/">
        ← Back to Home
      </Link>

      <h1 style={h1Style}>Terms of Service</h1>
      <p style={updatedStyle}>Last updated: January 2025</p>

      <div style={contentStyle}>
        <section style={sectionStyle}>
          <h2 style={h2Style}>1. Acceptance of Terms</h2>
          <p>
            By accessing or using Passion Driven (&quot;the Platform&quot;), you agree to be bound by these
            Terms of Service. If you do not agree to these terms, please do not use the Platform.
          </p>
        </section>

        <section style={sectionStyle}>
          <h2 style={h2Style}>2. Description of Service</h2>
          <p>
            Passion Driven is an online platform that connects buyers and sellers of classic cars,
            automotive parts, and memorabilia in Ireland. We provide the technology and services to facilitate
            these transactions but are not a party to any transaction between users.
          </p>
        </section>

        <section style={sectionStyle}>
          <h2 style={h2Style}>3. User Accounts</h2>
          <p>To use certain features of the Platform, you must create an account. You agree to:</p>
          <ul style={listStyle}>
            <li>Provide accurate and complete information when creating your account</li>
            <li>Maintain the security of your account credentials</li>
            <li>Notify us immediately of any unauthorized access to your account</li>
            <li>Accept responsibility for all activities that occur under your account</li>
          </ul>
        </section>

        <section style={sectionStyle}>
          <h2 style={h2Style}>4. Listing Guidelines</h2>
          <p>When creating listings, you agree that:</p>
          <ul style={listStyle}>
            <li>All information provided is accurate and not misleading</li>
            <li>You have the legal right to sell the item listed</li>
            <li>The item complies with all applicable laws and regulations</li>
            <li>Images are your own or you have permission to use them</li>
            <li>You will not list prohibited items (stolen goods, counterfeit items, etc.)</li>
          </ul>
          <p>
            All listings are subject to review and approval by our team. We reserve the right to reject
            or remove any listing that violates these guidelines.
          </p>
        </section>

        <section style={sectionStyle}>
          <h2 style={h2Style}>5. Transactions Between Users</h2>
          <p>
            Passion Driven facilitates connections between buyers and sellers but is not a party
            to any transaction. Users are solely responsible for:
          </p>
          <ul style={listStyle}>
            <li>Negotiating and agreeing on terms of sale</li>
            <li>Verifying the condition and authenticity of items</li>
            <li>Arranging payment and delivery</li>
            <li>Resolving any disputes that may arise</li>
          </ul>
        </section>

        <section style={sectionStyle}>
          <h2 style={h2Style}>6. Prohibited Conduct</h2>
          <p>You agree not to:</p>
          <ul style={listStyle}>
            <li>Use the Platform for any illegal purpose</li>
            <li>Post false, misleading, or fraudulent content</li>
            <li>Harass, abuse, or harm other users</li>
            <li>Attempt to circumvent any security features</li>
            <li>Use automated systems to access the Platform without permission</li>
            <li>Interfere with the proper functioning of the Platform</li>
          </ul>
        </section>

        <section style={sectionStyle}>
          <h2 style={h2Style}>7. Content and Intellectual Property</h2>
          <p>
            You retain ownership of content you post on the Platform. By posting content, you grant us
            a non-exclusive, worldwide, royalty-free license to use, display, and distribute that content
            in connection with operating the Platform.
          </p>
        </section>

        <section style={sectionStyle}>
          <h2 style={h2Style}>8. Limitation of Liability</h2>
          <p>
            To the maximum extent permitted by law, Passion Driven shall not be liable for any
            indirect, incidental, special, consequential, or punitive damages arising from your use of
            the Platform or any transactions conducted through it.
          </p>
        </section>

        <section style={sectionStyle}>
          <h2 style={h2Style}>9. Disclaimer of Warranties</h2>
          <p>
            The Platform is provided &quot;as is&quot; without warranties of any kind. We do not guarantee the
            accuracy of listings, the quality of items, or the reliability of other users.
          </p>
        </section>

        <section style={sectionStyle}>
          <h2 style={h2Style}>10. Modifications to Terms</h2>
          <p>
            We reserve the right to modify these Terms at any time. We will notify users of significant
            changes by posting a notice on the Platform. Your continued use of the Platform after such
            modifications constitutes acceptance of the updated Terms.
          </p>
        </section>

        <section style={sectionStyle}>
          <h2 style={h2Style}>11. Governing Law</h2>
          <p>
            These Terms shall be governed by and construed in accordance with the laws of Ireland.
            Any disputes arising from these Terms or your use of the Platform shall be subject to the
            exclusive jurisdiction of the courts of Ireland.
          </p>
        </section>

        <section style={sectionStyle}>
          <h2 style={h2Style}>12. Contact Us</h2>
          <p>
            If you have any questions about these Terms, please contact us at{" "}
            <a href="mailto:legal@passiondriven.ie" style={linkStyle}>
              legal@passiondriven.ie
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
