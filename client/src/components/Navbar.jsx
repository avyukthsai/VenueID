import { useState, useEffect, useRef } from "react";
import { Show, SignInButton, SignUpButton, UserButton } from "@clerk/react";
import { Link } from "react-router-dom";
import "./Navbar.css";

function Navbar({ onOpenContact }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef(null);

  // Close menu when clicking outside
  useEffect(() => {
    if (!menuOpen) return;
    function handleClick(e) {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setMenuOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [menuOpen]);

  // Close menu on route navigation or resize back to desktop
  useEffect(() => {
    function handleResize() {
      if (window.innerWidth >= 768) setMenuOpen(false);
    }
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  return (
    <div className="auth-header" ref={menuRef}>
      {/* Left — Logo */}
      <div className="navbar-left">
        <Link to="/" className="navbar-logo" style={{ textDecoration: "none" }} onClick={() => setMenuOpen(false)}>
          <img
            src="/venue-id-favicon.svg"
            alt="Venue ID"
            className="navbar-logo-icon"
          />
          Venue ID
        </Link>
        {/* Saved link — desktop only */}
        <Show when="signed-in">
          <Link to="/history" className="navbar-saved-btn navbar-desktop-only">
            Saved
          </Link>
        </Show>
      </div>

      {/* Right — desktop: Contact Us pill + Auth; mobile: hamburger */}
      <div className="navbar-right">
        {/* Desktop items */}
        <button
          className="navbar-contact-btn navbar-desktop-only"
          onClick={onOpenContact}
        >
          Contact Us
        </button>

        <Show when="signed-in">
          <div className="navbar-avatar-wrapper navbar-desktop-only">
            <UserButton afterSignOutUrl="/" />
          </div>
        </Show>

        <Show when="signed-out">
          <SignInButton mode="modal" asChild>
            <button className="navbar-auth-btn navbar-desktop-only">Log in</button>
          </SignInButton>

          <SignUpButton mode="modal" asChild>
            <button className="navbar-auth-btn navbar-auth-btn-primary navbar-desktop-only">
              Sign up
            </button>
          </SignUpButton>
        </Show>

        {/* Hamburger — mobile only */}
        <button
          className="navbar-hamburger"
          onClick={() => setMenuOpen((o) => !o)}
          aria-label={menuOpen ? "Close menu" : "Open menu"}
          aria-expanded={menuOpen}
        >
          {menuOpen ? (
            /* X icon */
            <svg width="22" height="22" viewBox="0 0 22 22" fill="none" xmlns="http://www.w3.org/2000/svg">
              <defs>
                <linearGradient id="hb-grad-x" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#10b981" />
                  <stop offset="100%" stopColor="#0ea5e9" />
                </linearGradient>
              </defs>
              <line x1="3" y1="3" x2="19" y2="19" stroke="url(#hb-grad-x)" strokeWidth="2.2" strokeLinecap="round"/>
              <line x1="19" y1="3" x2="3" y2="19" stroke="url(#hb-grad-x)" strokeWidth="2.2" strokeLinecap="round"/>
            </svg>
          ) : (
            /* Three-line hamburger */
            <svg width="22" height="22" viewBox="0 0 22 22" fill="none" xmlns="http://www.w3.org/2000/svg">
              <defs>
                <linearGradient id="hb-grad" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#10b981" />
                  <stop offset="100%" stopColor="#0ea5e9" />
                </linearGradient>
              </defs>
              <line x1="3" y1="5" x2="19" y2="5" stroke="url(#hb-grad)" strokeWidth="2.2" strokeLinecap="round"/>
              <line x1="3" y1="11" x2="19" y2="11" stroke="url(#hb-grad)" strokeWidth="2.2" strokeLinecap="round"/>
              <line x1="3" y1="17" x2="19" y2="17" stroke="url(#hb-grad)" strokeWidth="2.2" strokeLinecap="round"/>
            </svg>
          )}
        </button>
      </div>

      {/* Mobile dropdown menu */}
      {menuOpen && (
        <div className="navbar-mobile-menu">
          <Show when="signed-in">
            <Link
              to="/history"
              className="navbar-mobile-item"
              onClick={() => setMenuOpen(false)}
            >
              Saved
            </Link>
          </Show>

          <button
            className="navbar-mobile-item"
            onClick={() => { setMenuOpen(false); onOpenContact(); }}
          >
            Contact Us
          </button>

          <Show when="signed-in">
            <div className="navbar-mobile-item navbar-mobile-avatar">
              <span className="navbar-mobile-label">Account</span>
              <UserButton afterSignOutUrl="/" />
            </div>
          </Show>

          <Show when="signed-out">
            <SignInButton mode="modal" asChild>
              <button className="navbar-mobile-item" onClick={() => setMenuOpen(false)}>
                Log in
              </button>
            </SignInButton>

            <SignUpButton mode="modal" asChild>
              <button className="navbar-mobile-item navbar-mobile-signup" onClick={() => setMenuOpen(false)}>
                Sign up
              </button>
            </SignUpButton>
          </Show>
        </div>
      )}
    </div>
  );
}

export default Navbar;
