import Link from "next/link";

export const metadata = {
  title: "Privacy Policy | Passion Driven",
  description: "How we collect, use, and protect your personal data",
};

export default function PrivacyPage() {
  return (
    <main className="container" style={{ maxWidth: 800 }}>
      <Link className="pill" href="/">
        ← Back to Home
      </Link>

      <h1 style={h1Style}>Privacy Policy</h1>
      <p style={updatedStyle}>Last updated: April 2026</p>

      <div style={contentStyle}>
        <section style={sectionStyle}>
          <h2 style={h2Style}>1. Introduction</h2>
          <p>
            Passion Driven (&quot;we&quot;, &quot;us&quot;, &quot;our&quot;) is committed to protecting your privacy.
            This Privacy Policy explains how we collect, use, disclose, and safeguard your information
            when you use our platform.
          </p>
          <p>
            We comply with the General Data Protection Regulation (GDPR) and the Irish Data Protection
            Acts 1988-2018.
          </p>
        </section>

        <section style={sectionStyle}>
          <h2 style={h2Style}>2. Information We Collect</h2>

          <h3 style={h3Style}>Information You Provide</h3>
          <ul style={listStyle}>
            <li><strong>Account Information:</strong> Email address, display name, location when you register</li>
            <li><strong>Profile Information:</strong> Bio, profile picture, contact preferences</li>
            <li><strong>Listing Information:</strong> Details about items you list for sale, including photos</li>
            <li><strong>Communications:</strong> Messages you send to other users through our platform</li>
          </ul>

          <h3 style={h3Style}>Information Collected Automatically</h3>
          <ul style={listStyle}>
            <li><strong>Usage Data:</strong> Pages visited, features used, time spent on the platform</li>
            <li><strong>Device Information:</strong> Browser type, operating system, device identifiers</li>
            <li><strong>Log Data:</strong> IP address, access times, referring URLs</li>
          </ul>
        </section>

        <section style={sectionStyle}>
          <h2 style={h2Style}>3. How We Use Your Information</h2>
          <p>We use your information to:</p>
          <ul style={listStyle}>
            <li>Provide and maintain our services</li>
            <li>Process and facilitate transactions between users</li>
            <li>Send you important updates about your account and listings</li>
            <li>Respond to your inquiries and provide customer support</li>
            <li>Improve and personalize your experience on the platform</li>
            <li>Detect, prevent, and address fraud or security issues</li>
            <li>Comply with legal obligations</li>
          </ul>
        </section>

        <section style={sectionStyle}>
          <h2 style={h2Style}>4. Legal Basis for Processing (GDPR)</h2>
          <p>We process your personal data based on:</p>
          <ul style={listStyle}>
            <li><strong>Contract:</strong> Processing necessary to provide our services to you</li>
            <li><strong>Legitimate Interests:</strong> Improving our services, preventing fraud</li>
            <li><strong>Consent:</strong> Where you have given explicit consent (e.g., marketing emails)</li>
            <li><strong>Legal Obligation:</strong> Where required by law</li>
          </ul>
        </section>

        <section style={sectionStyle}>
          <h2 style={h2Style}>5. Information Sharing</h2>
          <p>We may share your information with:</p>
          <ul style={listStyle}>
            <li><strong>Other Users:</strong> Your public profile and listing information is visible to other users</li>
            <li><strong>Service Providers:</strong> Third parties who help us operate the platform (hosting, analytics)</li>
            <li><strong>Legal Requirements:</strong> When required by law or to protect our rights</li>
          </ul>
          <p>We do not sell your personal information to third parties.</p>
        </section>

        <section style={sectionStyle}>
          <h2 style={h2Style}>6. Cookies and Tracking</h2>
          <p>
            We use cookies and similar technologies to enhance your experience. For detailed information
            about the cookies we use and your choices, please see our{" "}
            <Link href="/cookies" style={linkStyle}>Cookie Policy</Link>.
          </p>
        </section>

        <section style={sectionStyle}>
          <h2 style={h2Style}>7. Data Retention</h2>
          <p>
            We retain your personal data for as long as your account is active or as needed to provide
            you services. We may retain certain information for longer periods as required by law or
            for legitimate business purposes.
          </p>
        </section>

        <section style={sectionStyle}>
          <h2 style={h2Style}>8. Your Rights (GDPR)</h2>
          <p>Under GDPR, you have the right to:</p>
          <ul style={listStyle}>
            <li><strong>Access:</strong> Request a copy of your personal data</li>
            <li><strong>Rectification:</strong> Correct inaccurate or incomplete data</li>
            <li><strong>Erasure:</strong> Request deletion of your data (&quot;right to be forgotten&quot;)</li>
            <li><strong>Portability:</strong> Receive your data in a structured, machine-readable format</li>
            <li><strong>Objection:</strong> Object to processing based on legitimate interests</li>
            <li><strong>Restriction:</strong> Request restriction of processing</li>
            <li><strong>Withdraw Consent:</strong> Where processing is based on consent</li>
          </ul>
          <p>
            To exercise these rights, please contact us at{" "}
            <a href="mailto:info@passiondriven.ie" style={linkStyle}>
              info@passiondriven.ie
            </a>
          </p>
        </section>

        <section style={sectionStyle}>
          <h2 style={h2Style}>9. Data Security</h2>
          <p>
            We implement appropriate technical and organizational measures to protect your personal data
            against unauthorized access, alteration, disclosure, or destruction. However, no method of
            transmission over the Internet is 100% secure.
          </p>
        </section>

        <section style={sectionStyle}>
          <h2 style={h2Style}>10. International Transfers</h2>
          <p>
            Your information may be transferred to and processed in countries outside the European
            Economic Area (EEA). We ensure appropriate safeguards are in place for such transfers,
            including standard contractual clauses approved by the European Commission.
          </p>
        </section>

        <section style={sectionStyle}>
          <h2 style={h2Style}>11. Children&apos;s Privacy</h2>
          <p>
            Our platform is not intended for children under 18. We do not knowingly collect personal
            information from children. If you believe we have collected information from a child,
            please contact us immediately.
          </p>
        </section>

        <section style={sectionStyle}>
          <h2 style={h2Style}>12. Changes to This Policy</h2>
          <p>
            We may update this Privacy Policy from time to time. We will notify you of any significant
            changes by posting a notice on the platform or sending you an email.
          </p>
        </section>

        <section style={sectionStyle}>
          <h2 style={h2Style}>13. Contact Us</h2>
          <p>
            If you have questions about this Privacy Policy or wish to exercise your rights, contact us at:
          </p>
          <ul style={listStyle}>
            <li>Email: <a href="mailto:info@passiondriven.ie" style={linkStyle}>info@passiondriven.ie</a></li>
          </ul>
          <p>
            You also have the right to lodge a complaint with the Irish Data Protection Commission
            at <a href="https://www.dataprotection.ie" style={linkStyle} target="_blank" rel="noopener noreferrer">www.dataprotection.ie</a>
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
