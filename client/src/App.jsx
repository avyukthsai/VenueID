import React, { useState } from "react";
import "./App.css";
import { Show, useUser } from "@clerk/react";
import { Link } from "react-router-dom";
import Navbar from "./components/Navbar";

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
  const [country, setCountry] = useState("US");
  const [state, setState] = useState("");
  const [city, setCity] = useState("");
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [audienceInput, setAudienceInput] = useState("");
  const [venueSetting, setVenueSetting] = useState("Both");
  const [audienceType, setAudienceType] = useState("General / All Ages");
  const [additionalRequirements, setAdditionalRequirements] = useState("");
  const [cityError, setCityError] = useState("");
  const [geminiResponse, setGeminiResponse] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [sharing, setSharing] = useState(false);
  const [toasts, setToasts] = useState([]);
  const [streamingVenues, setStreamingVenues] = useState([]);
  const [streamingInProgress, setStreamingInProgress] = useState(false);
  const [currentVenueCount, setCurrentVenueCount] = useState(0);
  const [totalVenuesToLoad, setTotalVenuesToLoad] = useState(3);
  const [searchCount, setSearchCount] = useState(0);
  const [limitsEnabled, setLimitsEnabled] = useState(false);
  const [waitlistEmail, setWaitlistEmail] = useState("");
  const [waitlistSubmitting, setWaitlistSubmitting] = useState(false);
  const [limitReached, setLimitReached] = useState(false);
  const [loadingSearchCount, setLoadingSearchCount] = useState(false);

  // Fetch search count on component mount and whenever userId changes
  React.useEffect(() => {
    if (user?.id) {
      fetchSearchCount(user.id);
    }
  }, [user?.id]);

  const fetchSearchCount = async (userId) => {
    setLoadingSearchCount(true);
    try {
      const response = await fetch(
        `http://localhost:3001/api/searches/count/${userId}`,
      );
      const data = await response.json();
      console.log("DEBUG: Received from /api/searches/count:", data);
      if (data.searchCount !== undefined) {
        setSearchCount(data.searchCount);
        setLimitsEnabled(data.limitsEnabled ?? false);
        console.log(
          "DEBUG: Setting limitsEnabled to",
          data.limitsEnabled ?? false,
        );
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
      const response = await fetch("http://localhost:3001/api/waitlist", {
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

  const convertStreamingVenuesToText = (venues) => {
    return venues
      .map((venue) => {
        return (
          `**Venue:** ${venue.name}\n` +
          `**Why this venue?** ${venue.whyThisVenue}\n` +
          `**Address:** ${venue.address}\n` +
          `**Capacity:** ${venue.capacity}\n` +
          `**Location:** ${venue.location}\n` +
          `**Features:** ${venue.features}\n` +
          `**Visit Website:** ${venue.website}\n` +
          `**Time & Date:** ${venue.dateTime}`
        );
      })
      .join("\n-----\n");
  };

  const handleSaveResults = async () => {
    if (!user) {
      addToast("Sign in to save results", "error");
      return;
    }

    setSaving(true);

    const searchParams = {
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
    };

    const resultsText = convertStreamingVenuesToText(streamingVenues);

    try {
      const response = await fetch("http://localhost:3001/api/searches", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          userId: user.id,
          searchParams,
          results: resultsText,
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

    const searchParams = {
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
    };

    const resultsText = convertStreamingVenuesToText(streamingVenues);

    try {
      const response = await fetch("http://localhost:3001/api/shares", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          searchParams,
          results: resultsText,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to create share link");
      }

      const data = await response.json();
      const shareUrl = data.shareUrl;

      // Copy to clipboard
      await navigator.clipboard.writeText(shareUrl);
      addToast("Link copied to clipboard!", "success");

      // Reset button text after 2 seconds
      setTimeout(() => {
        setSharing(false);
      }, 2000);
    } catch (err) {
      console.error("Error sharing results:", err);
      addToast("Failed to create share link", "error");
      setSharing(false);
    }
  };

  const handleSubmit = async () => {
    // Client-side validation
    const missingFields = [];
    if (!venueType) missingFields.push("Event Type");
    if (!city) missingFields.push("City");
    if (!state) missingFields.push("State");
    if (!date) missingFields.push("Date");
    if (!time) missingFields.push("Time");
    if (!audienceInput) missingFields.push("Expected Audience");

    if (missingFields.length > 0) {
      setError(`Please fill in: ${missingFields.join(", ")}`);
      return;
    }

    setLoading(true);
    setError("");
    setGeminiResponse("");

    const payload = {
      venueType,
      country,
      state,
      city,
      date: date.toString(),
      time,
      audienceInput,
      venueSetting,
      audienceType,
      additionalRequirements,
    };

    try {
      const response = await fetch("http://localhost:3001/generate-venue", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(
          errorData.error || `HTTP error! status: ${response.status}`,
        );
      }

      const data = await response.json();
      setGeminiResponse(data.response);
    } catch (err) {
      console.error("Error fetching data:", err);
      setError("Failed to get response: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleStreamingSubmit = async () => {
    // Clear previous errors
    setError("");
    setCityError("");

    // Client-side validation
    const missingFields = [];
    if (!venueType) missingFields.push("Event Type");
    if (!city) missingFields.push("City");
    if (!state) missingFields.push("State");
    if (!date) missingFields.push("Date");
    if (!time) missingFields.push("Time");
    if (!audienceInput) missingFields.push("Expected Audience");

    // City validation - must be more than 3 characters for best results
    if (city && city.trim().length <= 3) {
      setCityError("Please enter the full city name");
      return;
    }

    if (missingFields.length > 0) {
      setError(`Please fill in: ${missingFields.join(", ")}`);
      return;
    }

    setLoading(true);
    setError("");
    setStreamingVenues([]);
    setCurrentVenueCount(0);

    const payload = {
      venueType,
      country,
      state,
      city,
      date: date.toString(),
      time,
      audienceInput,
      venueSetting,
      audienceType,
      additionalRequirements,
      userId: user?.id,
    };

    console.log("Submitting venue request with payload:", payload);

    try {
      const response = await fetch("http://localhost:3001/api/venues/stream", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        // Handle search limit error (429)
        if (response.status === 429) {
          setLimitReached(true);
          setError("Search limit reached");
          setLoading(false);
          return;
        }

        const errorText = await response.text();
        console.error(
          "Request failed with status:",
          response.status,
          "Body:",
          errorText,
        );
        try {
          const errorData = JSON.parse(errorText);
          throw new Error(
            errorData.error || `HTTP error! status: ${response.status}`,
          );
        } catch {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
      }

      // Refetch search count after successful submission to stay in sync with backend
      if (user?.id) {
        fetchSearchCount(user.id);
      }

      const data = await response.json();
      console.log("Received response:", data);

      if (data.response) {
        setGeminiResponse(data.response);
      }

      if (data.venues && Array.isArray(data.venues)) {
        setStreamingVenues(data.venues);
        setCurrentVenueCount(data.venues.length);
      }
    } catch (err) {
      console.error("Error fetching venue data:", err);
      setError("Failed to get response: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  const parseVenues = (response) => {
    const venues = response
      .split("-----")
      .map((block) => block.trim())
      .filter((block) => block);
    return venues.map((venueText) => {
      const lines = venueText
        .split("\n")
        .map((line) => line.trim())
        .filter((line) => line);
      const venue = {};
      lines.forEach((line) => {
        const match = line.match(/\*\*(.*?):\*\*\s*(.*)/);
        if (match) {
          const key = match[1].toLowerCase().replace(/\s+/g, "_");
          venue[key] = match[2];
        }
      });
      return venue;
    });
  };

  const renderVenues = () => {
    const venues = parseVenues(geminiResponse);
    return venues.map((venue, index) => (
      <div key={index} className="venue-card">
        <h3>{venue.venue}</h3>
        <p>
          <strong>Why this venue?</strong> {venue.why_this_venue}
        </p>
        <p>
          <strong>Address:</strong> {venue.address}
        </p>
        <p>
          <strong>Capacity:</strong> {venue.capacity}
        </p>
        <p>
          <strong>Location:</strong> {venue.location}
        </p>
        <p>
          <strong>Features:</strong> {venue.features}
        </p>
        <p>
          <strong>Visit Website:</strong>{" "}
          <a
            href={venue.url_to_website}
            target="_blank"
            rel="noopener noreferrer"
          >
            {venue.url_to_website}
          </a>
        </p>
        <p>
          <strong>Time & Date:</strong> {venue["time_&_date"]}
        </p>
      </div>
    ));
  };

  const getMatchScoreColor = (score) => {
    if (score >= 90) return "#10b981"; // green
    if (score >= 75) return "#f59e0b"; // amber
    return "#9ca3af"; // gray
  };

  const renderStreamingVenues = () => {
    return streamingVenues.map((venue, index) => (
      <div
        key={index}
        className="venue-card venue-card-streaming"
        style={{
          animation: `fadeInUp 0.6s ease-out ${index * 0.2}s both`,
        }}
      >
        <div className="venue-card-header">
          <h3>{venue.name}</h3>
          <div
            className="match-score-badge"
            title="Match score based on capacity, event type, and venue features"
            style={{
              backgroundColor: getMatchScoreColor(venue.matchScore),
            }}
          >
            {venue.matchScore}%
          </div>
        </div>
        <p>
          <strong>Why this venue?</strong> {venue.whyThisVenue}
        </p>
        <p>
          <strong>Address:</strong> {venue.address}
        </p>
        <p>
          <strong>Capacity:</strong> {venue.capacity}
        </p>
        <p>
          <strong>Location:</strong> {venue.location}
        </p>
        <p>
          <strong>Features:</strong> {venue.features}
        </p>
        <p>
          <strong>Visit Website:</strong>{" "}
          <a href={venue.website} target="_blank" rel="noopener noreferrer">
            {venue.website}
          </a>
        </p>
        <p>
          <strong>Time & Date:</strong> {venue.dateTime}
        </p>
      </div>
    ));
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
                const extraOffset = 12;
                const targetTop =
                  window.scrollY +
                  eventTypeSection.getBoundingClientRect().top -
                  navbarHeight -
                  extraOffset;

                window.scrollTo({
                  top: Math.max(targetTop, 0),
                  behavior: "smooth",
                });
              }}
            >
              Find Your Venue
            </button>
          </div>
        </div>
      </div>

      <div className="content-area" id="search">
        <div className="App-header">
          <div className="main-content-wrapper">
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
                      if (e.target.value.trim().length > 3) {
                        setCityError("");
                      }
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

            {/* Search counter - only show if limits are enabled */}
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

            {/* Limit reached with waitlist signup */}
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
            {streamingInProgress && (
              <div className="streaming-indicator">
                Finding venue {currentVenueCount + 1} of {totalVenuesToLoad}
                ...
              </div>
            )}
            {streamingVenues.length > 0 && (
              <div className="response-container">
                <h2>Top Venue Picks</h2>
                {renderStreamingVenues()}
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
