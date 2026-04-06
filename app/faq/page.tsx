"use client";

import Link from "next/link";
import { useState } from "react";

const faqs = [
  {
    section: "Buying",
    questions: [
      {
        q: "How do I contact a seller?",
        a: "On any listing page, click the 'Message Seller' button. You'll need to create a free account to send messages. All communication stays within the platform.",
      },
      {
        q: "Are listings verified?",
        a: "Every listing is reviewed by our team before going live. We check that listings are genuine, appropriately described, and meet our content guidelines. Look for the 'Active' status on a listing.",
      },
      {
        q: "How do I pay for a car or item?",
        a: "Passion Driven is a marketplace that connects buyers and sellers — we don't process payments between users. Payment, collection, and handover are arranged directly between buyer and seller. We recommend meeting in person and inspecting the item before paying.",
      },
      {
        q: "Can I save listings to come back to later?",
        a: "Yes — click the heart icon on any listing to save it. You can find all your saved listings in your account under 'Saved Listings'. You'll need to be signed in.",
      },
      {
        q: "Can I get notified when new listings match my search?",
        a: "Yes. Set up your filters on the Browse page and click 'Save search'. You'll receive an email whenever a new listing matches your criteria.",
      },
    ],
  },
  {
    section: "Selling",
    questions: [
      {
        q: "How do I list an item for sale?",
        a: "Click 'Sell' in the navigation bar and choose your category — Car, Wheels, Parts, or Memorabilia. Fill in the details, upload up to 20 photos, and submit. Your listing will be reviewed and approved within 24 hours.",
      },
      {
        q: "How long does approval take?",
        a: "We aim to review all listings within 24 hours. You'll receive an email once your listing is approved and live on the site.",
      },
      {
        q: "Is it free to list?",
        a: "Yes, basic listings are completely free. We also offer optional paid features to boost your listing's visibility, such as Featured placement on the homepage and Boost which places your listing at the top of search results.",
      },
      {
        q: "How many photos can I upload?",
        a: "You can upload up to 20 photos per listing. We recommend using clear, well-lit photos from multiple angles to attract more interest.",
      },
      {
        q: "Can I edit my listing after it's been approved?",
        a: "Yes — go to your Account page, find the listing under 'My Listings', and click Edit. Changes may require re-approval before going live.",
      },
      {
        q: "How do I mark a listing as sold?",
        a: "Go to your Account page, find the listing under 'My Listings', and use the Mark as Sold option. This keeps the listing visible but clearly marked as sold.",
      },
    ],
  },
  {
    section: "Accounts",
    questions: [
      {
        q: "Do I need an account to browse?",
        a: "No — anyone can browse and view listings without an account. You'll need to sign up to message sellers, save listings, or post an ad.",
      },
      {
        q: "How do I create an account?",
        a: "Click 'Sign in' in the top right and select 'Create account'. You can sign up with your email address. It's free.",
      },
      {
        q: "How do I delete my account?",
        a: "Email us at info@passiondriven.ie and we'll remove your account and associated data in line with our Privacy Policy.",
      },
    ],
  },
  {
    section: "General",
    questions: [
      {
        q: "What categories does Passion Driven cover?",
        a: "We cover four categories: Cars (enthusiast and performance vehicles), Wheels (alloys, tyres, and sets), Parts (engine, body, interior, and accessories), and Memorabilia (signs, models, collectibles, and automotive art).",
      },
      {
        q: "Is Passion Driven only for Ireland?",
        a: "Yes — we're an Ireland-based marketplace. All listings are based in Ireland.",
      },
      {
        q: "How do I report a suspicious listing?",
        a: "If you come across a listing that looks fraudulent or inappropriate, email us at info@passiondriven.ie with the listing link and details. We'll investigate and remove it if necessary.",
      },
      {
        q: "I have a question that isn't answered here.",
        a: "Get in touch at info@passiondriven.ie and we'll get back to you as soon as possible.",
      },
    ],
  },
];

function FAQItem({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false);

  return (
    <div style={itemStyle}>
      <button style={questionStyle} onClick={() => setOpen(!open)}>
        <span>{q}</span>
        <svg
          width="18"
          height="18"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          style={{ flexShrink: 0, transform: open ? "rotate(180deg)" : "rotate(0deg)", transition: "transform 0.2s ease" }}
        >
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </button>
      {open && <div style={answerStyle}>{a}</div>}
    </div>
  );
}

export default function FAQPage() {
  return (
    <main className="container" style={{ maxWidth: 800 }}>
      <Link className="pill" href="/">← Back to Home</Link>

      <h1 style={h1Style}>Frequently Asked Questions</h1>
      <p style={subtitleStyle}>
        Everything you need to know about buying and selling on Passion Driven.
        Can&apos;t find your answer?{" "}
        <a href="mailto:info@passiondriven.ie" style={linkStyle}>Get in touch</a>.
      </p>

      <div style={{ display: "flex", flexDirection: "column", gap: 32, marginTop: 8 }}>
        {faqs.map((section) => (
          <div key={section.section}>
            <h2 style={sectionTitleStyle}>{section.section}</h2>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {section.questions.map((faq) => (
                <FAQItem key={faq.q} q={faq.q} a={faq.a} />
              ))}
            </div>
          </div>
        ))}
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

const subtitleStyle: React.CSSProperties = {
  color: "var(--muted)",
  fontWeight: 600,
  fontSize: 15,
  marginBottom: 28,
  lineHeight: 1.5,
};

const linkStyle: React.CSSProperties = {
  color: "var(--green-900)",
  fontWeight: 700,
};

const sectionTitleStyle: React.CSSProperties = {
  fontSize: 18,
  fontWeight: 900,
  color: "var(--green-900)",
  marginBottom: 12,
  paddingBottom: 8,
  borderBottom: "2px solid var(--soft)",
};

const itemStyle: React.CSSProperties = {
  background: "white",
  border: "1px solid var(--border)",
  borderRadius: 12,
  overflow: "hidden",
};

const questionStyle: React.CSSProperties = {
  width: "100%",
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  gap: 12,
  padding: "16px 20px",
  background: "none",
  border: "none",
  cursor: "pointer",
  textAlign: "left",
  fontWeight: 700,
  fontSize: 15,
  color: "var(--green-900)",
};

const answerStyle: React.CSSProperties = {
  padding: "0 20px 16px",
  fontSize: 14,
  fontWeight: 600,
  color: "var(--muted)",
  lineHeight: 1.6,
  borderTop: "1px solid var(--border)",
  marginTop: 0,
  paddingTop: 14,
};
