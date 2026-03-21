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

function App() {
  const { user } = useUser();
  const [venueType, setVenueType] = useState("Artist Venue");
  const [country, setCountry] = useState("");
  const [state, setState] = useState("");
  const [city, setCity] = useState("");
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [audienceInput, setAudienceInput] = useState("");
  const [geminiResponse, setGeminiResponse] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [saveMessage, setSaveMessage] = useState("");
  const [saving, setSaving] = useState(false);

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

  const handleSaveResults = async () => {
    if (!user) {
      setSaveMessage("Sign in to save results");
      setTimeout(() => setSaveMessage(""), 3000);
      return;
    }

    setSaving(true);
    setSaveMessage("");

    const searchParams = {
      venueType,
      country,
      state,
      city,
      date,
      time,
      audienceInput,
    };

    try {
      const response = await fetch("http://localhost:3001/api/searches", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          userId: user.id,
          searchParams,
          results: geminiResponse,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to save results");
      }

      setSaveMessage("Results saved");
      setTimeout(() => setSaveMessage(""), 3000);
    } catch (err) {
      console.error("Error saving results:", err);
      setSaveMessage("Failed to save results");
      setTimeout(() => setSaveMessage(""), 3000);
    } finally {
      setSaving(false);
    }
  };

  const handleSubmit = async () => {
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
              <h3>Location Details</h3>
              <input
                type="text"
                placeholder="City (e.g., Cleveland)"
                value={city}
                onChange={(e) => setCity(e.target.value)}
              />
              <input
                type="text"
                placeholder="State (e.g., OH)"
                value={state}
                onChange={(e) => setState(e.target.value)}
              />
              <input
                type="text"
                placeholder="Country"
                value={country}
                onChange={(e) => setCountry(e.target.value)}
              />
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
                  venueType === "Artist Venue" ? "e.g., 21000000" : "e.g., 5000"
                }
                value={audienceInput}
                onChange={(e) => setAudienceInput(e.target.value)}
              />
            </div>
          </div>

          <button
            onClick={handleSubmit}
            disabled={loading}
            className="generate-button"
          >
            {loading ? "Generating..." : "Find Venues"}
          </button>

          {error && <p className="error-message">{error}</p>}
          {geminiResponse && (
            <div className="response-container">
              <h2>AI's Top Venue Picks:</h2>
              {renderVenues()}
              <div className="save-section">
                {!user ? (
                  <p className="sign-in-message">Sign in to save results</p>
                ) : (
                  <>
                    <button
                      onClick={handleSaveResults}
                      disabled={saving}
                      className="save-button"
                    >
                      {saving ? "Saving..." : "Save these results"}
                    </button>
                    {saveMessage && (
                      <p className="save-message">{saveMessage}</p>
                    )}
                  </>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default App;
