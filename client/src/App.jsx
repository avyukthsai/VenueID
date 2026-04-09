import React, { useState } from "react";
import "./App.css";
import { Show, useUser } from "@clerk/react";
import { Link } from "react-router-dom";
import Navbar from "./components/Navbar";
import VenueCard from "./components/VenueCard";
import BackgroundCarousel from "./components/BackgroundCarousel";
import {
  convertStreamingVenuesToText,
  normalizeVenue,
} from "./utils/venueUtils";

function ContactModal({ onClose }) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    const body = `Name: ${name}\nEmail: ${email}\n\n${message}`;
    const mailtoLink = `mailto:support@venueid.app?subject=${encodeURIComponent(subject || "Venue ID Inquiry")}&body=${encodeURIComponent(body)}`;
    window.open(mailtoLink);
    setSubmitted(true);
    setTimeout(onClose, 2500);
  };

  return (
    <div className="contact-overlay" onClick={onClose}>
      <div className="contact-modal" onClick={(e) => e.stopPropagation()}>
        <button
          className="contact-modal-close"
          onClick={onClose}
          aria-label="Close"
        >
          ×
        </button>

        {submitted ? (
          <div className="contact-modal-success">
            <div className="contact-success-icon">✓</div>
            <h2>Message sent!</h2>
            <p>We'll get back to you shortly.</p>
          </div>
        ) : (
          <>
            <div className="contact-modal-header">
              <h2>Get in Touch</h2>
              <p>Have a question or feedback? We'd love to hear from you.</p>
            </div>
            <form onSubmit={handleSubmit} className="contact-form">
              <div className="contact-form-row">
                <div className="contact-form-field">
                  <label htmlFor="contact-name">Name</label>
                  <input
                    id="contact-name"
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Your name"
                    required
                  />
                </div>
                <div className="contact-form-field">
                  <label htmlFor="contact-email">Email</label>
                  <input
                    id="contact-email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="your@email.com"
                    required
                  />
                </div>
              </div>
              <div className="contact-form-field">
                <label htmlFor="contact-subject">Subject</label>
                <input
                  id="contact-subject"
                  type="text"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  placeholder="What's this about?"
                />
              </div>
              <div className="contact-form-field">
                <label htmlFor="contact-message">Message</label>
                <textarea
                  id="contact-message"
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Tell us how we can help..."
                  rows={5}
                  required
                />
              </div>
              <button type="submit" className="contact-form-submit">
                Send Message →
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  );
}

const API_URL = import.meta.env.VITE_API_URL;

function Toast({ message, type, onClose }) {
  React.useEffect(() => {
    const timer = setTimeout(onClose, 3000);
    return () => clearTimeout(timer);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return <div className={`toast toast-${type}`}>{message}</div>;
}

function App() {
  const { user } = useUser();
  const [showContact, setShowContact] = useState(false);
  const [venueType, setVenueType] = useState("Artist Venue");
  const [country] = useState("US");
  const [state, setState] = useState("");
  const [city, setCity] = useState("");
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [audienceInput, setAudienceInput] = useState("");
  const [venueSetting, setVenueSetting] = useState("Both");
  const [audienceType, setAudienceType] = useState("General / All Ages");
  const [additionalRequirements, setAdditionalRequirements] = useState("");
  const [cityError, setCityError] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [sharing, setSharing] = useState(false);
  const [toasts, setToasts] = useState([]);
  const [streamingVenues, setStreamingVenues] = useState([]);
  const [searchCount, setSearchCount] = useState(0);
  const [limitsEnabled, setLimitsEnabled] = useState(false);
  const [waitlistEmail, setWaitlistEmail] = useState("");
  const [waitlistSubmitting, setWaitlistSubmitting] = useState(false);
  const [limitReached, setLimitReached] = useState(false);
  const [loadingSearchCount, setLoadingSearchCount] = useState(false);

  React.useEffect(() => {
    if (user?.id) {
      fetchSearchCount(user.id);
    }
  }, [user?.id]);

  const fetchSearchCount = async (userId) => {
    setLoadingSearchCount(true);
    try {
      const response = await fetch(`${API_URL}/api/searches/count/${userId}`);
      const data = await response.json();
      if (data.searchCount !== undefined) {
        setSearchCount(data.searchCount);
        setLimitsEnabled(data.limitsEnabled ?? false);
        setLimitReached(data.limitsEnabled && data.searchCount >= 5);
      }
    } catch {
      // silently ignore — UI already shows no limit
    } finally {
      setLoadingSearchCount(false);
    }
  };

  const handleWaitlistSubmit = async () => {
    if (!waitlistEmail || !waitlistEmail.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)) {
      addToast("Please enter a valid email", "error");
      return;
    }

    setWaitlistSubmitting(true);
    try {
      const response = await fetch(`${API_URL}/api/waitlist`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: waitlistEmail }),
      });

      if (response.ok) {
        addToast("Email added to waitlist! We'll notify you soon.", "success");
        setWaitlistEmail("");
      } else {
        const data = await response.json();
        addToast(data.error || "Failed to add email to waitlist", "error");
      }
    } catch {
      addToast("Failed to add email to waitlist", "error");
    } finally {
      setWaitlistSubmitting(false);
    }
  };

  const venueOptions = [
    "Artist Venue",
    "Party Venue",
    "Wedding Venue",
    "Sports Tournament",
    "Theater Show",
  ];

  const addToast = (message, type = "success") => {
    const id = Date.now();
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 3000);
  };

  const buildSearchParams = () => ({
    venueType,
    country,
    state,
    city,
    date,
    time,
    audienceInput,
    venueSetting,
    audienceType,
    additionalRequirements,
  });

  const handleSaveResults = async () => {
    if (!user) {
      addToast("Sign in to save results", "error");
      return;
    }

    setSaving(true);
    try {
      const response = await fetch(`${API_URL}/api/searches`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: user.id,
          searchParams: buildSearchParams(),
          results: convertStreamingVenuesToText(streamingVenues),
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to save results");
      }

      addToast("Results saved successfully", "success");
    } catch {
      addToast("Something went wrong, please try again", "error");
    } finally {
      setSaving(false);
    }
  };

  const handleShare = async () => {
    setSharing(true);
    try {
      const response = await fetch(`${API_URL}/api/shares`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          searchParams: buildSearchParams(),
          results: convertStreamingVenuesToText(streamingVenues),
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to create share link");
      }

      const data = await response.json();
      await navigator.clipboard.writeText(data.shareUrl);
      addToast("Link copied to clipboard!", "success");

      setTimeout(() => setSharing(false), 2000);
    } catch {
      addToast("Failed to create share link", "error");
      setSharing(false);
    }
  };

  const handleStreamingSubmit = async () => {
    setError("");
    setCityError("");

    const missingFields = [];
    if (!venueType) missingFields.push("Event Type");
    if (!city) missingFields.push("City");
    if (!state) missingFields.push("State");
    if (!date) missingFields.push("Date");
    if (!time) missingFields.push("Time");
    if (!audienceInput) missingFields.push("Expected Audience");

    if (city && city.trim().length <= 3) {
      setCityError("Please enter the full city name");
      return;
    }

    if (missingFields.length > 0) {
      setError(`Please fill in: ${missingFields.join(", ")}`);
      return;
    }

    setLoading(true);
    setStreamingVenues([]);

    try {
      const response = await fetch(`${API_URL}/api/venues/stream`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...buildSearchParams(),
          date: date.toString(),
          userId: user?.id,
        }),
      });

      if (!response.ok) {
        if (response.status === 429) {
          setLimitReached(true);
          setError("Search limit reached");
          setLoading(false);
          return;
        }

        const errorText = await response.text();
        let errorMessage = `HTTP error! status: ${response.status}`;
        try {
          const errorData = JSON.parse(errorText);
          if (errorData.error) errorMessage = errorData.error;
        } catch {
          // response wasn't JSON, use generic message
        }
        throw new Error(errorMessage);
      }

      if (user?.id) fetchSearchCount(user.id);

      const data = await response.json();
      if (data.venues && Array.isArray(data.venues)) {
        setStreamingVenues(data.venues);
      }
    } catch (err) {
      setError("Failed to get response: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="App">
      <Navbar onOpenContact={() => setShowContact(true)} />

      {/* Hero Section */}
      <div className="hero-section">
        <div className="hero-decoration">
          <svg viewBox="0 0 1440 400" preserveAspectRatio="none">
            <path
              d="M0,150 Q360,100 720,150 T1440,150"
              fill="none"
              stroke="rgba(0,0,0,0.036)"
              strokeWidth="2"
            />
            <path
              d="M0,220 Q360,180 720,220 T1440,220"
              fill="none"
              stroke="rgba(0,0,0,0.036)"
              strokeWidth="2"
            />
            <path
              d="M0,280 Q360,250 720,280 T1440,280"
              fill="none"
              stroke="rgba(0,0,0,0.036)"
              strokeWidth="2"
            />
          </svg>
        </div>
        <div className="hero-content">
          <h2 className="hero-headline">
            Find the perfect venue{" "}
            <span className="hero-headline-accent">for any event.</span>
          </h2>
          <p className="hero-subtitle">
            AI-powered recommendations grounded in real venue data across
            thousands of locations.
          </p>
        </div>

        {/* CTA button — floats in the wave */}
        <div className="hero-wave-cta">
          <button
            className="hero-cta-primary"
            onClick={() => {
              const eventTypeSection = document.getElementById("event-type");
              const navbar = document.querySelector(".auth-header");
              if (!eventTypeSection) return;
              const navbarHeight =
                navbar instanceof HTMLElement ? navbar.offsetHeight : 0;
              const targetTop =
                window.scrollY +
                eventTypeSection.getBoundingClientRect().top -
                navbarHeight -
                12;
              window.scrollTo({
                top: Math.max(targetTop, 0),
                behavior: "smooth",
              });
            }}
          >
            Find Your Venue
          </button>
        </div>

        {/* Stage graphic */}
        <div className="hero-stage-graphic" aria-hidden="true">
          <svg
            viewBox="0 0 1440 280"
            xmlns="http://www.w3.org/2000/svg"
            className="hero-stage-svg"
            preserveAspectRatio="xMidYMax meet"
          >
            <defs>
              <radialGradient
                id="sg-ambient"
                cx="720"
                cy="120"
                r="520"
                gradientUnits="userSpaceOnUse"
              >
                <stop offset="0%" stopColor="#10b981" stopOpacity="0.22" />
                <stop offset="45%" stopColor="#0ea5e9" stopOpacity="0.08" />
                <stop offset="100%" stopColor="#6366f1" stopOpacity="0" />
              </radialGradient>
              <radialGradient
                id="sg-left"
                cx="260"
                cy="240"
                r="280"
                gradientUnits="userSpaceOnUse"
              >
                <stop offset="0%" stopColor="#0ea5e9" stopOpacity="0.2" />
                <stop offset="100%" stopColor="#0ea5e9" stopOpacity="0" />
              </radialGradient>
              <radialGradient
                id="sg-right"
                cx="1180"
                cy="240"
                r="280"
                gradientUnits="userSpaceOnUse"
              >
                <stop offset="0%" stopColor="#6366f1" stopOpacity="0.2" />
                <stop offset="100%" stopColor="#6366f1" stopOpacity="0" />
              </radialGradient>
              <radialGradient
                id="sg-disc"
                cx="720"
                cy="100"
                r="110"
                gradientUnits="userSpaceOnUse"
              >
                <stop offset="0%" stopColor="#10b981" stopOpacity="0.55" />
                <stop offset="60%" stopColor="#10b981" stopOpacity="0.12" />
                <stop offset="100%" stopColor="#10b981" stopOpacity="0" />
              </radialGradient>
              <linearGradient id="sg-arch" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#10b981" stopOpacity="0" />
                <stop offset="28%" stopColor="#10b981" stopOpacity="0.75" />
                <stop offset="72%" stopColor="#0ea5e9" stopOpacity="0.75" />
                <stop offset="100%" stopColor="#0ea5e9" stopOpacity="0" />
              </linearGradient>
              <filter id="sg-glow" x="-80%" y="-80%" width="260%" height="260%">
                <feGaussianBlur stdDeviation="14" />
              </filter>
              <filter
                id="sg-glow-sm"
                x="-100%"
                y="-100%"
                width="300%"
                height="300%"
              >
                <feGaussianBlur stdDeviation="5" />
              </filter>
            </defs>

            {/* Ambient glow clouds */}
            <ellipse
              cx="720"
              cy="150"
              rx="680"
              ry="200"
              fill="url(#sg-ambient)"
            />
            <ellipse cx="400" cy="220" rx="280" ry="140" fill="url(#sg-left)" />
            <ellipse
              cx="1040"
              cy="220"
              rx="280"
              ry="140"
              fill="url(#sg-right)"
            />

            {/* Dark hill base — sides go full width to bottom corners */}
            <path
              d="M0,280 C280,280 480,82 720,82 C960,82 1160,280 1440,280 Z"
              fill="#1e293b"
            />

            {/* Stadium seating arcs — dashed curves above the hill */}
            <path
              d="M440,195 Q720,18 1000,195"
              fill="none"
              stroke="url(#sg-arch)"
              strokeWidth="1"
              strokeDasharray="5,11"
              opacity="0.55"
            />
            <path
              d="M520,185 Q720,48 920,185"
              fill="none"
              stroke="url(#sg-arch)"
              strokeWidth="1.5"
              opacity="0.38"
            />

            {/* Cardinal tick marks */}
            <line
              x1="720"
              y1="36"
              x2="720"
              y2="50"
              stroke="rgba(16,185,129,0.45)"
              strokeWidth="1.5"
              strokeLinecap="round"
            />
            <line
              x1="784"
              y1="100"
              x2="770"
              y2="100"
              stroke="rgba(14,165,233,0.35)"
              strokeWidth="1.5"
              strokeLinecap="round"
            />
            <line
              x1="656"
              y1="100"
              x2="670"
              y2="100"
              stroke="rgba(14,165,233,0.35)"
              strokeWidth="1.5"
              strokeLinecap="round"
            />
            <line
              x1="762"
              y1="62"
              x2="752"
              y2="73"
              stroke="rgba(16,185,129,0.3)"
              strokeWidth="1"
              strokeLinecap="round"
            />
            <line
              x1="678"
              y1="62"
              x2="688"
              y2="73"
              stroke="rgba(16,185,129,0.3)"
              strokeWidth="1"
              strokeLinecap="round"
            />

            {/* Left accent orb — raised up the slope */}
            <circle
              cx="460"
              cy="178"
              r="22"
              fill="none"
              stroke="rgba(14,165,233,0.38)"
              strokeWidth="1.5"
            />
            <circle
              cx="460"
              cy="178"
              r="7"
              fill="rgba(14,165,233,0.5)"
              filter="url(#sg-glow-sm)"
            />
            <circle cx="460" cy="178" r="3.5" fill="#0ea5e9" />

            {/* Right accent orb — raised up the slope */}
            <circle
              cx="980"
              cy="178"
              r="22"
              fill="none"
              stroke="rgba(99,102,241,0.38)"
              strokeWidth="1.5"
            />
            <circle
              cx="980"
              cy="178"
              r="7"
              fill="rgba(99,102,241,0.5)"
              filter="url(#sg-glow-sm)"
            />
            <circle cx="980" cy="178" r="4" fill="#6366f1" />

            {/* Dashed connectors from side orbs to center */}
            <line
              x1="481"
              y1="170"
              x2="665"
              y2="115"
              stroke="rgba(14,165,233,0.12)"
              strokeWidth="1"
              strokeDasharray="4,9"
            />
            <line
              x1="959"
              y1="170"
              x2="778"
              y2="115"
              stroke="rgba(99,102,241,0.12)"
              strokeWidth="1"
              strokeDasharray="4,9"
            />

            {/* Floating particles */}
            <circle cx="634" cy="64" r="2.5" fill="#10b981" opacity="0.7" />
            <circle cx="806" cy="57" r="2" fill="#0ea5e9" opacity="0.65" />
            <circle cx="672" cy="38" r="1.5" fill="#6366f1" opacity="0.5" />
            <circle cx="768" cy="42" r="2" fill="#10b981" opacity="0.55" />
            <circle cx="720" cy="26" r="1.5" fill="#0ea5e9" opacity="0.45" />
            <circle cx="695" cy="52" r="1" fill="#10b981" opacity="0.5" />
            <circle cx="745" cy="48" r="1.5" fill="#6366f1" opacity="0.45" />
            <circle cx="580" cy="88" r="1.5" fill="#0ea5e9" opacity="0.4" />
            <circle cx="860" cy="82" r="1.5" fill="#6366f1" opacity="0.4" />
          </svg>
        </div>
      </div>

      <div className="content-area" id="search">
        <BackgroundCarousel venueType={venueType} />
        <div className="App-header">
          <div className="main-content-wrapper">
            <div className="glass-card">
              <div className="form-container">
                <div className="column">
                  <h3 id="event-type">Event type</h3>
                  <div className="radio-group">
                    {venueOptions.map((option) => (
                      <div
                        key={option}
                        className="radio-option"
                        onClick={() => setVenueType(option)}
                      >
                        <input
                          type="radio"
                          id={option}
                          name="venueType"
                          value={option}
                          checked={venueType === option}
                          onChange={(e) => setVenueType(e.target.value)}
                        />
                        <label htmlFor={option}>{option}</label>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="column">
                  <h3>Location</h3>
                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns: "1fr 1fr",
                      gap: "24px",
                    }}
                  >
                    <input
                      type="text"
                      placeholder="City"
                      value={city}
                      onChange={(e) => {
                        setCity(e.target.value);
                        if (e.target.value.trim().length > 3) setCityError("");
                      }}
                      className={cityError ? "input-error" : ""}
                    />
                    <select
                      value={state}
                      onChange={(e) => setState(e.target.value)}
                      className={`state-select${!state ? " state-select--empty" : ""}`}
                    >
                      <option value="">State</option>
                      <option value="AL">Alabama</option>
                      <option value="AK">Alaska</option>
                      <option value="AZ">Arizona</option>
                      <option value="AR">Arkansas</option>
                      <option value="CA">California</option>
                      <option value="CO">Colorado</option>
                      <option value="CT">Connecticut</option>
                      <option value="DE">Delaware</option>
                      <option value="FL">Florida</option>
                      <option value="GA">Georgia</option>
                      <option value="HI">Hawaii</option>
                      <option value="ID">Idaho</option>
                      <option value="IL">Illinois</option>
                      <option value="IN">Indiana</option>
                      <option value="IA">Iowa</option>
                      <option value="KS">Kansas</option>
                      <option value="KY">Kentucky</option>
                      <option value="LA">Louisiana</option>
                      <option value="ME">Maine</option>
                      <option value="MD">Maryland</option>
                      <option value="MA">Massachusetts</option>
                      <option value="MI">Michigan</option>
                      <option value="MN">Minnesota</option>
                      <option value="MS">Mississippi</option>
                      <option value="MO">Missouri</option>
                      <option value="MT">Montana</option>
                      <option value="NE">Nebraska</option>
                      <option value="NV">Nevada</option>
                      <option value="NH">New Hampshire</option>
                      <option value="NJ">New Jersey</option>
                      <option value="NM">New Mexico</option>
                      <option value="NY">New York</option>
                      <option value="NC">North Carolina</option>
                      <option value="ND">North Dakota</option>
                      <option value="OH">Ohio</option>
                      <option value="OK">Oklahoma</option>
                      <option value="OR">Oregon</option>
                      <option value="PA">Pennsylvania</option>
                      <option value="RI">Rhode Island</option>
                      <option value="SC">South Carolina</option>
                      <option value="SD">South Dakota</option>
                      <option value="TN">Tennessee</option>
                      <option value="TX">Texas</option>
                      <option value="UT">Utah</option>
                      <option value="VT">Vermont</option>
                      <option value="VA">Virginia</option>
                      <option value="WA">Washington</option>
                      <option value="WV">West Virginia</option>
                      <option value="WI">Wisconsin</option>
                      <option value="WY">Wyoming</option>
                      <option value="DC">Washington D.C.</option>
                    </select>
                  </div>
                  {cityError && <span className="error-text">{cityError}</span>}

                  <h3 style={{ marginTop: "24px" }}>Venue setting</h3>
                  <div className="button-group">
                    {["Indoor", "Outdoor", "Both"].map((option) => (
                      <button
                        key={option}
                        type="button"
                        className={`button-option ${venueSetting === option ? "active" : ""}`}
                        onClick={() => setVenueSetting(option)}
                      >
                        {option}
                      </button>
                    ))}
                  </div>

                  <h3 style={{ marginTop: "24px" }}>Additional requirements</h3>
                  <input
                    type="text"
                    id="additional-requirements"
                    placeholder="Any specific needs? (optional)"
                    value={additionalRequirements}
                    onChange={(e) => setAdditionalRequirements(e.target.value)}
                    className="additional-requirements-input"
                  />
                </div>

                <div className="column">
                  <h3>Event date & time</h3>
                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns: "1fr 1fr",
                      gap: "24px",
                    }}
                  >
                    <div className="date-input-wrapper">
                      <input
                        type="date"
                        id="event-date"
                        value={date}
                        onChange={(e) => setDate(e.target.value)}
                        className={!date ? "date-input--empty" : ""}
                      />
                      <span className="date-input-icon" aria-hidden="true">
                        <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                          <rect x="1" y="3" width="14" height="12" rx="2" stroke="currentColor" strokeWidth="1.4"/>
                          <path d="M1 7h14" stroke="currentColor" strokeWidth="1.4"/>
                          <path d="M5 1v3M11 1v3" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/>
                        </svg>
                      </span>
                    </div>
                    <input
                      type="text"
                      id="event-time"
                      placeholder="e.g., 7:00 PM"
                      value={time}
                      onChange={(e) => setTime(e.target.value)}
                    />
                  </div>

                  <h3 style={{ marginTop: "24px" }}>
                    {venueType === "Artist Venue"
                      ? "Spotify Monthly Listeners"
                      : "Expected audience"}
                  </h3>
                  <input
                    type="text"
                    id="audience-input"
                    placeholder={
                      venueType === "Artist Venue"
                        ? "e.g., 10,000,000"
                        : "e.g., 150"
                    }
                    value={audienceInput}
                    onChange={(e) => setAudienceInput(e.target.value)}
                  />

                  <h3 style={{ marginTop: "24px" }}>Audience type</h3>
                  <div className="radio-group">
                    {[
                      "General / All Ages",
                      "21+",
                      "Corporate / Professional",
                    ].map((option) => (
                      <div
                        key={option}
                        className="radio-option"
                        onClick={() => setAudienceType(option)}
                      >
                        <input
                          type="radio"
                          id={`audience-${option}`}
                          name="audienceType"
                          value={option}
                          checked={audienceType === option}
                          onChange={(e) => setAudienceType(e.target.value)}
                        />
                        <label htmlFor={`audience-${option}`}>{option}</label>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <button
                onClick={handleStreamingSubmit}
                disabled={loading || (user && limitReached)}
                className="generate-button"
              >
                {loading ? (
                  <>
                    <span className="spinner"></span>
                    Finding venues...
                  </>
                ) : (
                  "Find Venues"
                )}
              </button>

              {/* Search counter — only shown when limits are enabled */}
              <Show when="signed-in">
                {loadingSearchCount ? (
                  <p className="search-counter search-counter-loading">
                    Loading...
                  </p>
                ) : limitsEnabled ? (
                  <p
                    className={`search-counter search-counter-${searchCount >= 5 ? "max" : searchCount >= 4 ? "warning" : "normal"}`}
                  >
                    {searchCount === 5
                      ? "Search limit reached"
                      : `${searchCount} of 5 free searches used`}
                  </p>
                ) : null}
              </Show>
              <Show when="signed-out">
                <p className="search-counter search-counter-signout">
                  Sign in to track your searches
                </p>
              </Show>
            </div>

            {/* Limit reached — waitlist signup */}
            {limitReached && user && (
              <div className="limit-reached-container">
                <div className="limit-reached-message">
                  <h3>Search limit reached</h3>
                  <p>
                    You've used all 5 free searches. Upgrade coming soon — enter
                    your email to be notified when Pro launches.
                  </p>
                  <div className="waitlist-form">
                    <input
                      type="email"
                      placeholder="Enter your email"
                      value={waitlistEmail}
                      onChange={(e) => setWaitlistEmail(e.target.value)}
                      className="waitlist-input"
                      disabled={waitlistSubmitting}
                    />
                    <button
                      onClick={handleWaitlistSubmit}
                      className="waitlist-button"
                      disabled={waitlistSubmitting || !waitlistEmail}
                    >
                      {waitlistSubmitting ? "Saving..." : "Notify me"}
                    </button>
                  </div>
                </div>
              </div>
            )}

            {error && <p className="error-message">{error}</p>}

            {streamingVenues.length > 0 && (
              <div className="response-container">
                <h2>Top Venue Picks</h2>
                {streamingVenues.map((venue, index) => (
                  <VenueCard
                    key={`venue-${index}-${venue.name}`}
                    venue={normalizeVenue(venue)}
                    style={{
                      animation: `fadeInUp 0.6s ease-out ${index * 0.2}s both`,
                    }}
                  />
                ))}
                <div className="save-section">
                  <button
                    onClick={handleSaveResults}
                    disabled={saving || !user}
                    className="save-button"
                    title={!user ? "Sign in to save results" : ""}
                  >
                    {saving ? "Saving..." : "Save these results"}
                  </button>
                  <button
                    onClick={handleShare}
                    disabled={sharing}
                    className="share-button"
                  >
                    {sharing ? "Link copied!" : "Share Results"}
                  </button>
                </div>
              </div>
            )}

            <div className="toast-container">
              {toasts.map((toast) => (
                <Toast
                  key={toast.id}
                  message={toast.message}
                  type={toast.type}
                  onClose={() =>
                    setToasts((prev) => prev.filter((t) => t.id !== toast.id))
                  }
                />
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Why Venue ID — bold asymmetric bento */}
      <section className="features-section">
        <div className="features-inner">
          <div className="features-header">
            <p className="features-eyebrow">Why Venue ID</p>
            <h2 className="features-heading">
              The smarter way
              <br />
              to find your{" "}
              <span className="features-heading-accent">venue.</span>
            </h2>
          </div>

          <div className="features-grid">
            <div className="feature-card feature-card--large">
              <div className="feature-card-glow" />
              <div className="feature-card-body">
                <h3>
                  Real Venue
                  <br />
                  Data
                </h3>
                <p>
                  Grounded in live data from Foursquare and Ticketmaster. No
                  hallucinations, no placeholders — only real venues.
                </p>
              </div>
            </div>

            <div className="feature-card">
              <div className="feature-card-body">
                <h3>AI‑Powered Matching</h3>
                <p>
                  We score every venue on capacity, event type, location, and
                  features.
                </p>
              </div>
            </div>

            <div className="feature-card">
              <div className="feature-card-body">
                <h3>Instant Results</h3>
                <p>
                  Three curated picks in seconds. Save to history and revisit
                  any time.
                </p>
              </div>
            </div>

            <div className="feature-card feature-card--wide">
              <div className="feature-card-body">
                <h3>Share with Anyone</h3>
                <p>
                  One-click shareable links. Send your venue picks to clients or
                  collaborators instantly.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="site-footer">
        <div className="footer-top">
          <div className="footer-brand">
            <Link to="/" className="footer-logo">
              <img src="/venue-id-favicon.svg" alt="Venue ID" />
              Venue ID
            </Link>
            <p className="footer-tagline">
              AI-powered venue recommendations grounded in real venue data
              across thousands of locations.
            </p>
          </div>
          <div className="footer-links">
            <div className="footer-col">
              <h4>Product</h4>
              <a
                href="#search"
                onClick={(e) => {
                  e.preventDefault();
                  document
                    .getElementById("search")
                    ?.scrollIntoView({ behavior: "smooth" });
                }}
              >
                Find Venues
              </a>
              <Link to="/history">Saved Searches</Link>
            </div>
            <div className="footer-col">
              <h4>Company</h4>
              <button onClick={() => setShowContact(true)}>Contact Us</button>
              <a href="mailto:support@venueid.app">Support</a>
            </div>
            <div className="footer-col">
              <h4>Legal</h4>
              <a href="mailto:support@venueid.app">Privacy Inquiries</a>
            </div>
          </div>
        </div>
        <div className="footer-bottom-wrapper">
          <div className="footer-bottom">
            <p>© {new Date().getFullYear()} Venue ID. All rights reserved.</p>
          </div>
        </div>
      </footer>

      {showContact && <ContactModal onClose={() => setShowContact(false)} />}
    </div>
  );
}

export default App;
