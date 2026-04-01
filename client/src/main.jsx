import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App.jsx";
import HistoryPage from "./HistoryPage.jsx";
import SharePage from "./SharePage.jsx";
import { ClerkProvider } from "@clerk/react";
import { BrowserRouter, Routes, Route } from "react-router-dom";

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <ClerkProvider
      afterSignOutUrl="/"
      appearance={{
        variables: {
          colorPrimary: "#0ea5e9",
          colorTextOnPrimaryBackground: "white",
          colorBackground: "#f8fafc",
          colorInputBackground: "#ffffff",
          colorInputText: "#0f172a",
          borderRadius: "18px",
          fontFamily: "Outfit, sans-serif",
          fontSize: "1rem",
        },
        elements: {
          formButtonPrimary: {
            background:
              "linear-gradient(135deg, #0ea5e9 0%, #10b981 55%, #14b8a6 100%)",
            border: "none",
            boxShadow: "0 14px 30px rgba(14, 165, 233, 0.28)",
            transition:
              "transform 0.25s ease, box-shadow 0.25s ease, filter 0.25s ease",
            "&:hover": {
              transform: "translateY(-1px)",
              filter: "brightness(1.04)",
              boxShadow: "0 18px 34px rgba(16, 185, 129, 0.3)",
            },
          },
          card: {
            boxShadow: "0 30px 60px rgba(15, 23, 42, 0.18)",
            borderRadius: "24px",
            border: "1px solid rgba(14, 165, 233, 0.18)",
            background:
              "linear-gradient(160deg, #ffffff 0%, #f0f9ff 48%, #ecfeff 100%)",
            backdropFilter: "blur(12px)",
          },
          headerTitle: {
            color: "#0f172a",
            fontWeight: "800",
            letterSpacing: "-0.01em",
          },
          headerSubtitle: {
            color: "#475569",
          },
          socialButtonsBlockButton: {
            border: "1px solid rgba(148, 163, 184, 0.35)",
            borderRadius: "14px",
            backgroundColor: "rgba(255, 255, 255, 0.9)",
            transition: "all 0.22s ease",
            "&:hover": {
              backgroundColor: "#ffffff",
              borderColor: "rgba(14, 165, 233, 0.4)",
              boxShadow: "0 10px 22px rgba(14, 165, 233, 0.12)",
            },
          },
          formFieldInput: {
            border: "1.5px solid rgba(148, 163, 184, 0.45)",
            borderRadius: "14px",
            backgroundColor: "rgba(255, 255, 255, 0.92)",
            "&:focus": {
              borderColor: "#0ea5e9",
              boxShadow: "0 0 0 4px rgba(14, 165, 233, 0.12)",
            },
          },
          footerActionLink: {
            color: "#0ea5e9",
            fontWeight: "600",
            "&:hover": {
              color: "#0284c7",
            },
          },
          identityPreviewEditButton: {
            color: "#0ea5e9",
          },
          avatarBox: {
            width: "40px",
            height: "40px",
            borderRadius: "8px",
          },
          userButtonAvatarBox: {
            width: "40px",
            height: "40px",
            borderRadius: "8px",
          },
          userButton: {
            borderRadius: "14px",
          },
          userButtonTrigger: {
            borderRadius: "14px",
            width: "48px",
            height: "48px",
            padding: "3px",
            transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
            border: "1px solid rgba(14, 165, 233, 0.28)",
            background:
              "linear-gradient(145deg, rgba(14, 165, 233, 0.1), rgba(16, 185, 129, 0.08))",
            boxShadow: "0 10px 22px rgba(14, 165, 233, 0.18)",
            "&:hover": {
              transform: "translateY(-1px)",
              background:
                "linear-gradient(145deg, rgba(14, 165, 233, 0.18), rgba(16, 185, 129, 0.14))",
              borderColor: "rgba(14, 165, 233, 0.8)",
              boxShadow: "0 16px 30px rgba(14, 165, 233, 0.24)",
            },
          },
          userButtonPopoverCard: {
            background: "#0f0f0f",
            border: "1px solid rgba(255,255,255,0.08)",
            borderRadius: "12px",
            boxShadow: "0 8px 32px rgba(0,0,0,0.3)",
          },
          userButtonPopoverActionButton: {
            borderRadius: "8px",
            transition: "all 0.2s ease",
            "&:hover": {
              backgroundColor: "rgba(255,255,255,0.05)",
            },
          },
          userButtonPopoverActionButtonText: {
            color: "#e5e5e5",
          },
          userButtonPopoverFooter: {
            display: "none",
          },
        },
      }}
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
