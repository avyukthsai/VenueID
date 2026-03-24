import React, { useState } from "react";
import "./App.css";
import {
  Show,
  SignInButton,
  SignUpButton,
  UserButton,
  useUser,
} from "@clerk/react";
import { Link } from "react-router-dom";

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

  const venueOptions = [
    "Artist Venue",
    "Party Venue",
    "Wedding Venue",
    "Sports Tournament",
    "Esports Tournament",
    "Theater Show",
    "Product Expo",
    "Political Rally",
    "Hackathon",
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
          `**Url To Website:** ${venue.website}\n` +
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
    setStreamingInProgress(true);

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

    console.log("Submitting stream request with payload:", payload);

    try {
      const response = await fetch("http://localhost:3001/api/venues/stream", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error(
          "Stream request failed with status:",
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

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");

        // Keep incomplete line in buffer
        buffer = lines.pop() || "";

        for (const line of lines) {
          if (line.startsWith("data: ")) {
            try {
              const data = JSON.parse(line.slice(6));

              if (data.error) {
                setError(data.error);
                setStreamingInProgress(false);
              } else if (data.complete) {
                setStreamingInProgress(false);
              } else if (data.venue) {
                setStreamingVenues((prev) => [...prev, data.venue]);
                setCurrentVenueCount(data.count);
                setTotalVenuesToLoad(data.total);
              }
            } catch (e) {
              console.error("Error parsing SSE data:", e);
            }
          }
        }
      }
    } catch (err) {
      console.error("Error fetching streaming data:", err);
      setError("Failed to get response: " + err.message);
      setStreamingInProgress(false);
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
          <strong>URL to Website:</strong>{" "}
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
          <strong>URL to Website:</strong>{" "}
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
      <div className="auth-header">
        <div className="header-content">
          <div className="logo">Venue ID</div>
        </div>
        <div>
          <Show when="signed-in">
            <Link to="/history" className="history-link">
              History
            </Link>
          </Show>
          <Show when="signed-out">
            <SignInButton />
            <SignUpButton />
          </Show>
          <Show when="signed-in">
            <UserButton />
          </Show>
        </div>
      </div>
      <div className="content-area">
        <div className="App-header">
          <div className="main-content-wrapper">
            <div className="form-title-container">
              <h1>Find Your Perfect Venue</h1>
              <p className="subtitle">
                Tell us about your event, and we'll find the ideal spot!
              </p>
            </div>

            <div className="form-container">
              <div className="column">
                <h3>Select Event Type</h3>
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
                <h3>Location & Setting</h3>
                <input
                  type="text"
                  placeholder="Full city name (e.g., Cleveland)"
                  value={city}
                  onChange={(e) => {
                    setCity(e.target.value);
                    if (e.target.value.trim().length > 3) {
                      setCityError("");
                    }
                  }}
                  className={cityError ? "input-error" : ""}
                />
                {cityError && <span className="error-text">{cityError}</span>}
                <p className="helper-text">
                  Enter full city name for best results
                </p>
                <input
                  type="text"
                  placeholder="State code (e.g., OH)"
                  value={state}
                  onChange={(e) => setState(e.target.value)}
                />
                <label
                  htmlFor="country-select"
                  className="input-label"
                  style={{ marginTop: "12px" }}
                >
                  Country:
                </label>
                <select
                  id="country-select"
                  value={country}
                  onChange={(e) => setCountry(e.target.value)}
                  className="country-select"
                >
                  <option value="US">United States</option>
                  <option value="UK">United Kingdom</option>
                  <option value="Canada">Canada</option>
                  <option value="Australia">Australia</option>
                </select>

                <h4 style={{ marginTop: "16px", marginBottom: "8px" }}>
                  Venue Setting
                </h4>
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

                <div style={{ marginTop: "16px" }}>
                  <label
                    htmlFor="additional-requirements"
                    className="input-label"
                  >
                    Additional Requirements
                    <span className="optional-tag">Optional</span>
                  </label>
                  <input
                    type="text"
                    id="additional-requirements"
                    placeholder="Any specific requirements? (e.g. needs a basketball court, must have a green room, waterfront preferred...)"
                    value={additionalRequirements}
                    onChange={(e) => setAdditionalRequirements(e.target.value)}
                    className="additional-requirements-input"
                  />
                </div>
              </div>

              <div className="column">
                <h3>Event Specifics</h3>
                <label htmlFor="event-date" className="input-label">
                  Date:
                </label>
                <input
                  type="date"
                  id="event-date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                />
                <label htmlFor="event-time" className="input-label">
                  Time (EST):
                </label>
                <input
                  type="text"
                  id="event-time"
                  placeholder="e.g., 7:00 PM"
                  value={time}
                  onChange={(e) => setTime(e.target.value)}
                />
                <label htmlFor="audience-input" className="input-label">
                  {venueType === "Artist Venue"
                    ? "Spotify Monthly Listeners:"
                    : "Expected Audience:"}
                </label>
                <input
                  type="text"
                  id="audience-input"
                  placeholder={
                    venueType === "Artist Venue"
                      ? "e.g., 21000000"
                      : "e.g., 5000"
                  }
                  value={audienceInput}
                  onChange={(e) => setAudienceInput(e.target.value)}
                />

                <h4 style={{ marginTop: "16px", marginBottom: "8px" }}>
                  Audience Type
                </h4>
                <select
                  value={audienceType}
                  onChange={(e) => setAudienceType(e.target.value)}
                  className="audience-select"
                >
                  <option>General / All Ages</option>
                  <option>21+ Only</option>
                  <option>Corporate / Professional</option>
                  <option>Family Friendly</option>
                </select>
              </div>
            </div>

            <button
              onClick={handleStreamingSubmit}
              disabled={loading}
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

            {error && <p className="error-message">{error}</p>}
            {streamingInProgress && (
              <div className="streaming-indicator">
                Finding venue {currentVenueCount + 1} of {totalVenuesToLoad}
                ...
              </div>
            )}
            {streamingVenues.length > 0 && (
              <div className="response-container">
                <h2>Top Venue Picks:</h2>
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
