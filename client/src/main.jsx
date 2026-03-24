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
          colorPrimary: "#10b981",
          colorTextOnPrimaryBackground: "white",
          colorBackground: "#ffffff",
          colorInputBackground: "#f9fafb",
          colorInputText: "#1f2937",
          borderRadius: "10px",
          fontFamily: "Inter, sans-serif",
          fontSize: "1rem",
        },
        elements: {
          formButtonPrimary: {
            backgroundColor: "#10b981",
            "&:hover": {
              backgroundColor: "#059669",
            },
          },
          card: {
            boxShadow: "0 4px 20px rgba(0, 0, 0, 0.08)",
            borderRadius: "16px",
            border: "1px solid #e5e7eb",
          },
          headerTitle: {
            color: "#1f2937",
            fontWeight: "700",
          },
          headerSubtitle: {
            color: "#6b7280",
          },
          socialButtonsBlockButton: {
            border: "1px solid #e5e7eb",
            borderRadius: "8px",
            "&:hover": {
              backgroundColor: "#f9fafb",
            },
          },
          formFieldInput: {
            border: "2px solid #e5e7eb",
            borderRadius: "8px",
            "&:focus": {
              borderColor: "#10b981",
              boxShadow: "0 0 0 3px rgba(16, 185, 129, 0.1)",
            },
          },
          footerActionLink: {
            color: "#10b981",
            "&:hover": {
              color: "#059669",
            },
          },
          identityPreviewEditButton: {
            color: "#10b981",
          },
          userButtonAvatarBox: {
            width: "38px",
            height: "38px",
          },
          userButtonPopoverCard: {
            boxShadow: "0 4px 20px rgba(0, 0, 0, 0.08)",
            borderRadius: "12px",
            border: "1px solid #e5e7eb",
          },
          userButtonPopoverActionButton: {
            "&:hover": {
              backgroundColor: "#f0fdf4",
              color: "#10b981",
            },
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
