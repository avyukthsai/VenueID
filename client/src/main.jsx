import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App.jsx";
import HistoryPage from "./HistoryPage.jsx";
import SharePage from "./SharePage.jsx";
import { ClerkProvider, Show, RedirectToSignIn } from "@clerk/react";
import { BrowserRouter, Routes, Route } from "react-router-dom";

const clerkAppearance = {
  variables: {
    colorPrimary: "#10b981",
    colorBackground: "#ffffff",
    colorInputBackground: "#f9fafb",
    colorInputText: "#0f172a",
    colorText: "#0f172a",
    colorTextSecondary: "#6b7280",
    colorTextOnPrimaryBackground: "#ffffff",
    colorNeutral: "#6b7280",
    colorShimmer: "rgba(0, 0, 0, 0.04)",
    colorDanger: "#ef4444",
    colorSuccess: "#10b981",
    borderRadius: "10px",
    fontFamily: '"Plus Jakarta Sans", -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
    fontSize: "0.94rem",
  },

  elements: {
    // ── Card / Modal shell ──────────────────────────────────────
    card: {
      background: "#ffffff",
      border: "1px solid rgba(0, 0, 0, 0.08)",
      boxShadow: "0 24px 60px rgba(0, 0, 0, 0.1), 0 8px 20px rgba(0, 0, 0, 0.05)",
      borderRadius: "18px",
    },
    modalBackdrop: {
      background: "rgba(0, 0, 0, 0.4)",
      backdropFilter: "blur(6px)",
    },

    // ── Header ─────────────────────────────────────────────────
    headerTitle: {
      color: "#0f172a",
      fontWeight: "700",
      letterSpacing: "-0.3px",
      fontFamily: '"Playfair Display", serif',
    },
    headerSubtitle: {
      color: "#6b7280",
    },

    // ── Divider ────────────────────────────────────────────────
    dividerLine: {
      background: "#e5e7eb",
    },
    dividerText: {
      color: "#9ca3af",
      background: "#ffffff",
    },

    // ── Social / OAuth buttons ──────────────────────────────────
    socialButtonsBlockButton: {
      background: "#f9fafb",
      border: "1px solid #e5e7eb",
      borderRadius: "10px",
      color: "#374151",
      transition: "all 0.2s ease",
    },
    socialButtonsBlockButtonText: {
      color: "#374151",
      fontWeight: "600",
    },
    socialButtonsBlockButtonArrow: {
      color: "#9ca3af",
    },
    socialButtonsProviderIcon: {
      filter: "none",
    },

    // ── Form fields ────────────────────────────────────────────
    formFieldLabel: {
      color: "#6b7280",
      fontSize: "0.78rem",
      fontWeight: "600",
      textTransform: "uppercase",
      letterSpacing: "0.08em",
    },
    formFieldInput: {
      background: "#f9fafb",
      border: "1.5px solid #e5e7eb",
      borderRadius: "10px",
      color: "#0f172a",
      transition: "all 0.2s ease",
    },
    formFieldInputShowPasswordButton: {
      color: "#9ca3af",
    },
    formFieldSuccessText: {
      color: "#059669",
    },
    formFieldErrorText: {
      color: "#ef4444",
    },
    formFieldWarningText: {
      color: "#f59e0b",
    },
    formFieldHintText: {
      color: "#9ca3af",
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
      color: "#6b7280",
      fontWeight: "500",
    },

    // ── Footer / links ─────────────────────────────────────────
    footer: {
      background: "transparent",
      borderTop: "1px solid #f0f0f0",
    },
    footerActionText: {
      color: "#9ca3af",
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
      background: "#f9fafb",
      border: "1px solid #e5e7eb",
      borderRadius: "10px",
      color: "#374151",
      transition: "all 0.2s ease",
    },
    alternativeMethodsBlockButtonText: {
      color: "#374151",
      fontWeight: "500",
    },

    // ── OTP / Code input ───────────────────────────────────────
    otpCodeField: {
      gap: "10px",
    },
    otpCodeFieldInput: {
      background: "#f9fafb",
      border: "1.5px solid #e5e7eb",
      borderRadius: "10px",
      color: "#0f172a",
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
      background: "#ffffff",
      border: "1px solid rgba(0, 0, 0, 0.08)",
      borderRadius: "14px",
      boxShadow: "0 16px 40px rgba(0, 0, 0, 0.12), 0 4px 12px rgba(0, 0, 0, 0.06)",
    },
    userButtonPopoverActions: {
      background: "transparent",
    },
    userButtonPopoverActionButton: {
      borderRadius: "8px",
      transition: "all 0.15s ease",
    },
    userButtonPopoverActionButtonIcon: {
      color: "#9ca3af",
    },
    userButtonPopoverActionButtonText: {
      color: "#374151",
      fontWeight: "500",
    },
    userButtonPopoverFooter: {
      display: "none",
    },
    userPreview: {
      background: "transparent",
    },
    userPreviewMainIdentifier: {
      color: "#0f172a",
      fontWeight: "600",
    },
    userPreviewSecondaryIdentifier: {
      color: "#6b7280",
      fontSize: "0.82em",
    },

    // ── UserProfile (Manage Account full page) ─────────────────
    profilePage: {
      background: "#f8fafc",
    },
    pageScrollBox: {
      background: "#f8fafc",
    },
    navbar: {
      background: "#ffffff",
      borderRight: "1px solid #e5e7eb",
    },
    navbarButton: {
      color: "#6b7280",
      borderRadius: "8px",
      fontWeight: "500",
      transition: "all 0.18s ease",
    },
    navbarButtonIcon: {
      color: "inherit",
      opacity: 0.8,
    },
    profileSection: {
      borderTop: "1px solid #f0f0f0",
    },
    profileSectionTitle: {
      borderBottom: "1px solid #f0f0f0",
    },
    profileSectionTitleText: {
      color: "#374151",
      fontWeight: "600",
      fontSize: "0.82em",
      textTransform: "uppercase",
      letterSpacing: "0.09em",
    },
    profileSectionContent: {
      color: "#6b7280",
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
      color: "#374151",
    },
    badge: {
      background: "rgba(16, 185, 129, 0.1)",
      color: "#059669",
      border: "1px solid rgba(16, 185, 129, 0.2)",
      borderRadius: "6px",
      fontWeight: "600",
    },
    breadcrumbs: {
      color: "#9ca3af",
    },
    breadcrumbsItem__currentPage: {
      color: "#0f172a",
    },
    breadcrumbsItemDivider: {
      color: "#d1d5db",
    },
    activeDeviceListItem: {
      border: "1px solid #e5e7eb",
      borderRadius: "10px",
      background: "#f9fafb",
    },
    accordionTriggerButton: {
      color: "#6b7280",
    },
    destructiveActionButton: {
      color: "#dc2626",
      borderColor: "rgba(220, 38, 38, 0.2)",
      background: "rgba(220, 38, 38, 0.05)",
      borderRadius: "8px",
    },
  },
};

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <BrowserRouter>
      <ClerkProvider
        publishableKey={import.meta.env.VITE_CLERK_PUBLISHABLE_KEY}
        afterSignOutUrl="/"
        appearance={clerkAppearance}
      >
        <Routes>
          <Route path="/" element={<App />} />
          <Route
            path="/history"
            element={
              <>
                <Show when="signed-in"><HistoryPage /></Show>
                <Show when="signed-out"><RedirectToSignIn /></Show>
              </>
            }
          />
          <Route path="/share/:token" element={<SharePage />} />
        </Routes>
      </ClerkProvider>
    </BrowserRouter>
  </StrictMode>,
);
