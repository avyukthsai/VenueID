import React from "react";
import { Show, SignInButton, SignUpButton, UserButton } from "@clerk/react";
import { Link } from "react-router-dom";
import "./Navbar.css";

function Navbar() {
  return (
    <div className="auth-header">
      {/* Left side - placeholder */}
      <div className="navbar-left"></div>

      {/* Center - Logo (absolute positioning) */}
      <Link to="/" className="navbar-logo" style={{ textDecoration: "none" }}>
        <img
          src="/venue-id-favicon.svg"
          alt="Venue ID"
          className="navbar-logo-icon"
        />
        Venue ID
      </Link>

      {/* Right side - Navigation items */}
      <div className="navbar-right">
        <Show when="signed-in">
          <Link to="/history" className="navbar-saved-link">
            Saved
          </Link>
        </Show>

        <Show when="signed-in">
          <div className="navbar-avatar-wrapper">
            <UserButton afterSignOutUrl="/" />
          </div>
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

        <Show when="signed-out">
          {/* Added asChild so Clerk uses our button instead of making its own */}
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
