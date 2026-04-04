import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App.jsx";
import HistoryPage from "./HistoryPage.jsx";
import SharePage from "./SharePage.jsx";
import { ClerkProvider } from "@clerk/react";
import { BrowserRouter, Routes, Route } from "react-router-dom";

const clerkAppearance = {
  variables: {
    colorPrimary: "#10b981",
    colorBackground: "#111111",
    colorInputBackground: "#1c1c1c",
    colorInputText: "#ffffff",
    colorText: "#ffffff",
    colorTextSecondary: "rgba(255, 255, 255, 0.58)",
    colorTextOnPrimaryBackground: "#ffffff",
    colorNeutral: "#888888",
    colorShimmer: "rgba(255, 255, 255, 0.03)",
    colorDanger: "#f87171",
    colorSuccess: "#34d399",
    borderRadius: "10px",
    fontFamily: '"Plus Jakarta Sans", -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
    fontSize: "0.94rem",
  },

  elements: {
    // ── Card / Modal shell ──────────────────────────────────────
    card: {
      background: "#141414",
      border: "1px solid rgba(255, 255, 255, 0.09)",
      boxShadow: "0 32px 80px rgba(0, 0, 0, 0.7), 0 8px 24px rgba(0, 0, 0, 0.4)",
      borderRadius: "18px",
    },
    modalBackdrop: {
      background: "rgba(0, 0, 0, 0.65)",
      backdropFilter: "blur(6px)",
    },

    // ── Header ─────────────────────────────────────────────────
    headerTitle: {
      color: "#ffffff",
      fontWeight: "700",
      letterSpacing: "-0.3px",
      fontFamily: '"Playfair Display", serif',
    },
    headerSubtitle: {
      color: "rgba(255, 255, 255, 0.52)",
    },

    // ── Divider ────────────────────────────────────────────────
    dividerLine: {
      background: "rgba(255, 255, 255, 0.08)",
    },
    dividerText: {
      color: "rgba(255, 255, 255, 0.32)",
      background: "#141414",
    },

    // ── Social / OAuth buttons ──────────────────────────────────
    socialButtonsBlockButton: {
      background: "rgba(255, 255, 255, 0.05)",
      border: "1px solid rgba(255, 255, 255, 0.11)",
      borderRadius: "10px",
      color: "#ffffff",
      transition: "all 0.2s ease",
    },
    socialButtonsBlockButtonText: {
      color: "rgba(255, 255, 255, 0.82)",
      fontWeight: "600",
    },
    socialButtonsBlockButtonArrow: {
      color: "rgba(255, 255, 255, 0.35)",
    },
    socialButtonsProviderIcon: {
      filter: "brightness(0.9)",
    },

    // ── Form fields ────────────────────────────────────────────
    formFieldLabel: {
      color: "rgba(255, 255, 255, 0.62)",
      fontSize: "0.78rem",
      fontWeight: "600",
      textTransform: "uppercase",
      letterSpacing: "0.08em",
    },
    formFieldInput: {
      background: "rgba(255, 255, 255, 0.06)",
      border: "1.5px solid rgba(255, 255, 255, 0.11)",
      borderRadius: "10px",
      color: "#ffffff",
      transition: "all 0.2s ease",
    },
    formFieldInputShowPasswordButton: {
      color: "rgba(255, 255, 255, 0.45)",
    },
    formFieldSuccessText: {
      color: "#34d399",
    },
    formFieldErrorText: {
      color: "#f87171",
    },
    formFieldWarningText: {
      color: "#fbbf24",
    },
    formFieldHintText: {
      color: "rgba(255, 255, 255, 0.4)",
    },

    // ── Primary action button ──────────────────────────────────
    formButtonPrimary: {
      background: "linear-gradient(135deg, #10b981 0%, #059669 100%)",
      color: "#ffffff",
      fontWeight: "700",
      borderRadius: "10px",
      border: "none",
      boxShadow: "0 4px 14px rgba(16, 185, 129, 0.32)",
      letterSpacing: "-0.1px",
      transition: "all 0.2s ease",
    },
    formButtonReset: {
      color: "rgba(255, 255, 255, 0.55)",
      fontWeight: "500",
    },

    // ── Footer / links ─────────────────────────────────────────
    footer: {
      background: "transparent",
      borderTop: "1px solid rgba(255, 255, 255, 0.07)",
    },
    footerActionText: {
      color: "rgba(255, 255, 255, 0.42)",
    },
    footerActionLink: {
      color: "#10b981",
      fontWeight: "600",
    },
    footerPages: {
      background: "transparent",
    },
    identityPreviewEditButton: {
      color: "#10b981",
    },
    formResendCodeLink: {
      color: "#10b981",
      fontWeight: "600",
    },
    alternativeMethodsBlockButton: {
      background: "rgba(255, 255, 255, 0.04)",
      border: "1px solid rgba(255, 255, 255, 0.1)",
      borderRadius: "10px",
      color: "rgba(255, 255, 255, 0.75)",
      transition: "all 0.2s ease",
    },
    alternativeMethodsBlockButtonText: {
      color: "rgba(255, 255, 255, 0.75)",
      fontWeight: "500",
    },

    // ── OTP / Code input ───────────────────────────────────────
    otpCodeField: {
      gap: "10px",
    },
    otpCodeFieldInput: {
      background: "rgba(255, 255, 255, 0.06)",
      border: "1.5px solid rgba(255, 255, 255, 0.12)",
      borderRadius: "10px",
      color: "#ffffff",
      fontWeight: "700",
      fontSize: "1.2em",
    },

    // ── UserButton trigger ─────────────────────────────────────
    userButtonTrigger: {
      borderRadius: "50%",
      border: "2px solid rgba(16, 185, 129, 0.32)",
      transition: "all 0.2s ease",
      padding: "2px",
      boxShadow: "none",
      background: "transparent",
    },
    userButtonAvatarBox: {
      borderRadius: "50%",
      width: "34px",
      height: "34px",
    },

    // ── UserButton popover ─────────────────────────────────────
    userButtonPopoverCard: {
      background: "#141414",
      border: "1px solid rgba(255, 255, 255, 0.09)",
      borderRadius: "14px",
      boxShadow: "0 24px 60px rgba(0, 0, 0, 0.65), 0 8px 20px rgba(0, 0, 0, 0.4)",
    },
    userButtonPopoverActions: {
      background: "transparent",
    },
    userButtonPopoverActionButton: {
      borderRadius: "8px",
      transition: "all 0.15s ease",
    },
    userButtonPopoverActionButtonIcon: {
      color: "rgba(255, 255, 255, 0.48)",
    },
    userButtonPopoverActionButtonText: {
      color: "rgba(255, 255, 255, 0.82)",
      fontWeight: "500",
    },
    userButtonPopoverFooter: {
      display: "none",
    },
    userPreview: {
      background: "transparent",
    },
    userPreviewMainIdentifier: {
      color: "#ffffff",
      fontWeight: "600",
    },
    userPreviewSecondaryIdentifier: {
      color: "rgba(255, 255, 255, 0.45)",
      fontSize: "0.82em",
    },

    // ── UserProfile (Manage Account full page) ─────────────────
    profilePage: {
      background: "#111111",
    },
    pageScrollBox: {
      background: "#111111",
    },
    navbar: {
      background: "#0d0d0d",
      borderRight: "1px solid rgba(255, 255, 255, 0.07)",
    },
    navbarButton: {
      color: "rgba(255, 255, 255, 0.6)",
      borderRadius: "8px",
      fontWeight: "500",
      transition: "all 0.18s ease",
    },
    navbarButtonIcon: {
      color: "inherit",
      opacity: 0.8,
    },
    profileSection: {
      borderTop: "1px solid rgba(255, 255, 255, 0.07)",
    },
    profileSectionTitle: {
      borderBottom: "1px solid rgba(255, 255, 255, 0.07)",
    },
    profileSectionTitleText: {
      color: "rgba(255, 255, 255, 0.88)",
      fontWeight: "600",
      fontSize: "0.82em",
      textTransform: "uppercase",
      letterSpacing: "0.09em",
    },
    profileSectionContent: {
      color: "rgba(255, 255, 255, 0.7)",
    },
    profileSectionPrimaryButton: {
      color: "#10b981",
      borderRadius: "8px",
      fontWeight: "600",
      border: "1px solid rgba(16, 185, 129, 0.22)",
      background: "rgba(16, 185, 129, 0.07)",
      transition: "all 0.18s ease",
    },
    profileSectionItemValue: {
      color: "rgba(255, 255, 255, 0.72)",
    },
    badge: {
      background: "rgba(16, 185, 129, 0.12)",
      color: "#34d399",
      border: "1px solid rgba(16, 185, 129, 0.25)",
      borderRadius: "6px",
      fontWeight: "600",
    },
    breadcrumbs: {
      color: "rgba(255, 255, 255, 0.38)",
    },
    breadcrumbsItem__currentPage: {
      color: "rgba(255, 255, 255, 0.88)",
    },
    breadcrumbsItemDivider: {
      color: "rgba(255, 255, 255, 0.22)",
    },
    activeDeviceListItem: {
      border: "1px solid rgba(255, 255, 255, 0.08)",
      borderRadius: "10px",
      background: "rgba(255, 255, 255, 0.03)",
    },
    accordionTriggerButton: {
      color: "rgba(255, 255, 255, 0.68)",
    },
    destructiveActionButton: {
      color: "#f87171",
      borderColor: "rgba(248, 113, 113, 0.25)",
      background: "rgba(248, 113, 113, 0.07)",
      borderRadius: "8px",
    },
  },
};

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <ClerkProvider
      afterSignOutUrl="/"
      appearance={clerkAppearance}
    >
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<App />} />
          <Route path="/history" element={<HistoryPage />} />
          <Route path="/share/:token" element={<SharePage />} />
        </Routes>
      </BrowserRouter>
    </ClerkProvider>
  </StrictMode>,
);
