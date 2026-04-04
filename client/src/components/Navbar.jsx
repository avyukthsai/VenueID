import { Show, SignInButton, SignUpButton, UserButton } from "@clerk/react";
import { Link } from "react-router-dom";
import "./Navbar.css";

function Navbar({ onOpenContact }) {
  return (
    <div className="auth-header">
      {/* Left — Logo + Saved link */}
      <div className="navbar-left">
        <Link to="/" className="navbar-logo" style={{ textDecoration: "none" }}>
          <img
            src="/venue-id-favicon.svg"
            alt="Venue ID"
            className="navbar-logo-icon"
          />
          Venue ID
        </Link>
        <Show when="signed-in">
          <Link to="/history" className="navbar-saved-btn">
            Saved
          </Link>
        </Show>
      </div>

      {/* Right — Contact Us pill + Auth */}
      <div className="navbar-right">
        <button
          className="navbar-contact-btn"
          onClick={onOpenContact}
        >
          Contact Us
        </button>

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
