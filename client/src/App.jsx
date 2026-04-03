import React, { useState } from "react";
import "./App.css";
import { Show, useUser } from "@clerk/react";
import Navbar from "./components/Navbar";
import VenueCard from "./components/VenueCard";
import BackgroundCarousel from "./components/BackgroundCarousel";
import {
  convertStreamingVenuesToText,
  normalizeVenue,
} from "./utils/venueUtils";

const API_URL = import.meta.env.VITE_API_URL;

function Toast({ message, type, onClose }) {
  React.useEffect(() => {
    const timer = setTimeout(onClose, 3000);
    return () => clearTimeout(timer);
  }, [onClose]);

  return <div className={`toast toast-${type}`}>{message}</div>;
}

function App() {
  const { user } = useUser();
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
    } catch (err) {
      console.error("Error fetching search count:", err);
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
    } catch (err) {
      console.error("Error adding to waitlist:", err);
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
    } catch (err) {
      console.error("Error saving results:", err);
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
    } catch (err) {
      console.error("Error sharing results:", err);
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
        try {
          const errorData = JSON.parse(errorText);
          throw new Error(
            errorData.error || `HTTP error! status: ${response.status}`,
          );
        } catch {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
      }

      if (user?.id) fetchSearchCount(user.id);

      const data = await response.json();
      if (data.venues && Array.isArray(data.venues)) {
        setStreamingVenues(data.venues);
      }
    } catch (err) {
      console.error("Error fetching venue data:", err);
      setError("Failed to get response: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="App">
      <Navbar />

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
            Find the perfect venue for any event.
          </h2>
          <p className="hero-subtitle">
            AI-powered recommendations grounded in real venue data across
            thousands of locations.
          </p>
          <div className="hero-cta-buttons">
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
                window.scrollTo({ top: Math.max(targetTop, 0), behavior: "smooth" });
              }}
            >
              Find Your Venue
            </button>
          </div>
        </div>
      </div>

      <div className="content-area" id="search">
        <BackgroundCarousel />
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
                  <input
                    type="text"
                    placeholder="State"
                    value={state}
                    onChange={(e) => setState(e.target.value)}
                  />
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
                  <input
                    type="date"
                    id="event-date"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                  />
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
                    venueType === "Artist Venue" ? "e.g., 10,000,000" : "e.g., 150"
                  }
                  value={audienceInput}
                  onChange={(e) => setAudienceInput(e.target.value)}
                />

                <h3 style={{ marginTop: "24px" }}>Audience type</h3>
                <div className="radio-group">
                  {[
                    "General / All Ages",
                    "21+ Only",
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
                    key={index}
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
    </div>
  );
}

export default App;
