"use client";

import Link from "next/link";
import { useState, useEffect } from "react";

type ConsentState = {
  essential: boolean;
  functional: boolean;
  analytics: boolean;
};

const COOKIE_CONSENT_KEY = "cookie-consent";

export default function CookieBanner() {
  const [showBanner, setShowBanner] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [consent, setConsent] = useState<ConsentState>({
    essential: true,
    functional: false,
    analytics: false,
  });

  useEffect(() => {
    const stored = localStorage.getItem(COOKIE_CONSENT_KEY);
    if (!stored) {
      setShowBanner(true);
    } else {
      try {
        const parsed = JSON.parse(stored);
        setConsent(parsed);
      } catch {
        setShowBanner(true);
      }
    }
  }, []);

  function saveConsent(newConsent: ConsentState) {
    localStorage.setItem(COOKIE_CONSENT_KEY, JSON.stringify(newConsent));
    setConsent(newConsent);
    setShowBanner(false);
    setShowSettings(false);
  }

  function acceptAll() {
    saveConsent({ essential: true, functional: true, analytics: true });
  }

  function rejectNonEssential() {
    saveConsent({ essential: true, functional: false, analytics: false });
  }

  function saveCustom() {
    saveConsent(consent);
  }

  if (!showBanner) return null;

  return (
    <div style={overlayStyle}>
      <div style={bannerStyle}>
        {!showSettings ? (
          <>
            <div style={headerStyle}>
              <div style={titleStyle}>We use cookies</div>
            </div>
            <p style={textStyle}>
              We use cookies to enhance your browsing experience, provide personalized content,
              and analyze our traffic. By clicking &quot;Accept All&quot;, you consent to our use of cookies.
              You can manage your preferences by clicking &quot;Cookie Settings&quot;.
            </p>
            <div style={linksStyle}>
              <Link href="/privacy" style={linkStyle}>Privacy Policy</Link>
              <span style={separatorStyle}>|</span>
              <Link href="/cookies" style={linkStyle}>Cookie Policy</Link>
            </div>
            <div style={buttonGroupStyle}>
              <button onClick={rejectNonEssential} style={secondaryButtonStyle}>
                Reject Non-Essential
              </button>
              <button onClick={() => setShowSettings(true)} style={secondaryButtonStyle}>
                Cookie Settings
              </button>
              <button onClick={acceptAll} style={primaryButtonStyle}>
                Accept All
              </button>
            </div>
          </>
        ) : (
          <>
            <div style={headerStyle}>
              <div style={titleStyle}>Cookie Settings</div>
              <button onClick={() => setShowSettings(false)} style={backButtonStyle}>
                ← Back
              </button>
            </div>
            <div style={settingsListStyle}>
              <div style={settingItemStyle}>
                <div style={settingHeaderStyle}>
                  <div>
                    <div style={settingTitleStyle}>Essential Cookies</div>
                    <div style={settingDescStyle}>
                      Required for the website to function. Cannot be disabled.
                    </div>
                  </div>
                  <div style={alwaysOnStyle}>Always On</div>
                </div>
              </div>

              <div style={settingItemStyle}>
                <div style={settingHeaderStyle}>
                  <div>
                    <div style={settingTitleStyle}>Functional Cookies</div>
                    <div style={settingDescStyle}>
                      Enable enhanced features like remembering your preferences.
                    </div>
                  </div>
                  <label style={toggleStyle}>
                    <input
                      type="checkbox"
                      checked={consent.functional}
                      onChange={(e) => setConsent({ ...consent, functional: e.target.checked })}
                      style={checkboxStyle}
                    />
                    <span style={toggleSliderStyle(consent.functional)}>
                      <span style={toggleKnobStyle} />
                    </span>
                  </label>
                </div>
              </div>

              <div style={settingItemStyle}>
                <div style={settingHeaderStyle}>
                  <div>
                    <div style={settingTitleStyle}>Analytics Cookies</div>
                    <div style={settingDescStyle}>
                      Help us understand how visitors interact with our website.
                    </div>
                  </div>
                  <label style={toggleStyle}>
                    <input
                      type="checkbox"
                      checked={consent.analytics}
                      onChange={(e) => setConsent({ ...consent, analytics: e.target.checked })}
                      style={checkboxStyle}
                    />
                    <span style={toggleSliderStyle(consent.analytics)}>
                      <span style={toggleKnobStyle} />
                    </span>
                  </label>
                </div>
              </div>
            </div>
            <div style={buttonGroupStyle}>
              <button onClick={rejectNonEssential} style={secondaryButtonStyle}>
                Reject All
              </button>
              <button onClick={saveCustom} style={primaryButtonStyle}>
                Save Preferences
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

const overlayStyle: React.CSSProperties = {
  position: "fixed",
  bottom: 0,
  left: 0,
  right: 0,
  zIndex: 9999,
  padding: 16,
  background: "rgba(0,0,0,0.3)",
  backdropFilter: "blur(4px)",
};

const bannerStyle: React.CSSProperties = {
  maxWidth: 600,
  margin: "0 auto",
  background: "white",
  borderRadius: 20,
  padding: 24,
  boxShadow: "0 -4px 20px rgba(0,0,0,0.15)",
};

const headerStyle: React.CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  marginBottom: 12,
};

const titleStyle: React.CSSProperties = {
  fontSize: 18,
  fontWeight: 900,
  color: "var(--green-900)",
};

const textStyle: React.CSSProperties = {
  fontSize: 14,
  fontWeight: 600,
  color: "var(--text)",
  lineHeight: 1.5,
  marginBottom: 12,
};

const linksStyle: React.CSSProperties = {
  display: "flex",
  gap: 8,
  marginBottom: 16,
};

const linkStyle: React.CSSProperties = {
  fontSize: 13,
  fontWeight: 700,
  color: "var(--green-900)",
  textDecoration: "underline",
};

const separatorStyle: React.CSSProperties = {
  color: "var(--muted)",
};

const buttonGroupStyle: React.CSSProperties = {
  display: "flex",
  gap: 10,
  flexWrap: "wrap",
};

const primaryButtonStyle: React.CSSProperties = {
  flex: 1,
  minWidth: 120,
  padding: "12px 20px",
  borderRadius: 12,
  border: "none",
  background: "var(--green-900)",
  color: "white",
  fontSize: 14,
  fontWeight: 700,
  cursor: "pointer",
};

const secondaryButtonStyle: React.CSSProperties = {
  flex: 1,
  minWidth: 120,
  padding: "12px 20px",
  borderRadius: 12,
  border: "1px solid var(--border)",
  background: "var(--soft)",
  color: "var(--green-900)",
  fontSize: 14,
  fontWeight: 700,
  cursor: "pointer",
};

const backButtonStyle: React.CSSProperties = {
  padding: "6px 12px",
  borderRadius: 8,
  border: "1px solid var(--border)",
  background: "transparent",
  color: "var(--muted)",
  fontSize: 13,
  fontWeight: 600,
  cursor: "pointer",
};

const settingsListStyle: React.CSSProperties = {
  display: "flex",
  flexDirection: "column",
  gap: 12,
  marginBottom: 16,
};

const settingItemStyle: React.CSSProperties = {
  padding: 12,
  borderRadius: 12,
  border: "1px solid var(--border)",
  background: "var(--soft)",
};

const settingHeaderStyle: React.CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  gap: 12,
};

const settingTitleStyle: React.CSSProperties = {
  fontSize: 14,
  fontWeight: 700,
  color: "var(--green-900)",
  marginBottom: 4,
};

const settingDescStyle: React.CSSProperties = {
  fontSize: 12,
  fontWeight: 600,
  color: "var(--muted)",
};

const alwaysOnStyle: React.CSSProperties = {
  fontSize: 12,
  fontWeight: 700,
  color: "var(--muted)",
  background: "var(--border)",
  padding: "4px 10px",
  borderRadius: 20,
  whiteSpace: "nowrap",
};

const toggleStyle: React.CSSProperties = {
  position: "relative",
  display: "inline-block",
  width: 48,
  height: 26,
  flexShrink: 0,
  cursor: "pointer",
};

const checkboxStyle: React.CSSProperties = {
  opacity: 0,
  width: 0,
  height: 0,
  position: "absolute",
};

const toggleSliderStyle = (checked: boolean): React.CSSProperties => ({
  position: "absolute",
  top: 0,
  left: 0,
  right: 0,
  bottom: 0,
  background: checked ? "var(--green-900)" : "var(--border)",
  borderRadius: 26,
  transition: "0.2s",
  display: "flex",
  alignItems: "center",
  padding: "0 3px",
  justifyContent: checked ? "flex-end" : "flex-start",
});

const toggleKnobStyle: React.CSSProperties = {
  width: 20,
  height: 20,
  borderRadius: "50%",
  background: "white",
  boxShadow: "0 1px 3px rgba(0,0,0,0.2)",
};
