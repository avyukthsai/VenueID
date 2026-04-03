import React from "react";
import { Show, SignInButton, SignUpButton, UserButton } from "@clerk/react";
import { Link } from "react-router-dom";
import "./Navbar.css";

function Navbar() {
  return (
    <div className="auth-header">
      {/* Left — Logo */}
      <Link to="/" className="navbar-logo" style={{ textDecoration: "none" }}>
        <img
          src="/venue-id-favicon.svg"
          alt="Venue ID"
          className="navbar-logo-icon"
        />
        Venue ID
      </Link>

      {/* Center — Pill nav */}
      <nav className="navbar-pill">
        <Show when="signed-in">
          <Link to="/history" className="navbar-pill-link">
            Saved
          </Link>
        </Show>
        <button
          className="navbar-contact-btn"
          onClick={() => {
            window.location.href =
              "mailto:support@venueid.app?subject=Venue%20ID%20Inquiry";
          }}
        >
          Contact Us
        </button>
      </nav>

      {/* Right — Auth */}
      <div className="navbar-right">
        <Show when="signed-in">
          <div className="navbar-avatar-wrapper">
            <UserButton afterSignOutUrl="/" />
          </div>
        </Show>

        <Show when="signed-out">
          <SignInButton mode="modal" asChild>
            <button className="navbar-auth-btn">Log in</button>
          </SignInButton>

          <SignUpButton mode="modal" asChild>
            <button className="navbar-auth-btn navbar-auth-btn-primary">
              Sign up
            </button>
          </SignUpButton>
        </Show>
      </div>
    </div>
  );
}

export default Navbar;
