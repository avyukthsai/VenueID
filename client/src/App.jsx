import React, { useState } from "react";
import "./App.css";
import ReactMarkdown from "react-markdown";

const logoAndName = "/combo.png"; // This now contains both logo and the name "Venue ID"
const slogan = "/slogan.png"; // This is just the slogan text as an image

function App() {
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
          errorData.error || `HTTP error! status: ${response.status}`
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

  return (
    <div className="App">
      <div className="App-header">
        <div className="main-content-wrapper">
          {/* Hero Section: Combined Logo+Name image, then Slogan image below it */}
          <div className="hero-section">
            <img
              src={logoAndName}
              alt="Venue ID Logo and Name"
              className="combined-logo-name-image"
            />
            <img src={slogan} alt="Your Slogan Here" className="slogan-image" />
          </div>

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
                  <div key={option} className="radio-option">
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
                placeholder="Country"
                value={country}
                onChange={(e) => setCountry(e.target.value)}
              />
              <input
                type="text"
                placeholder="State (e.g., OH)"
                value={state}
                onChange={(e) => setState(e.target.value)}
              />
              <input
                type="text"
                placeholder="City (e.g., Cleveland)"
                value={city}
                onChange={(e) => setCity(e.target.value)}
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
              <ReactMarkdown>{geminiResponse}</ReactMarkdown>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default App;
