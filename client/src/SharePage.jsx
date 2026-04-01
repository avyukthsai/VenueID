import React, { useState, useEffect } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import Navbar from "./components/Navbar";
import "./SharePage.css";

const API_URL = import.meta.env.VITE_API_URL;

function SharePage() {
  const { token } = useParams();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useState(null);
  const [results, setResults] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchSharedSearch = async () => {
      try {
        const response = await fetch(`${API_URL}/api/shares/${token}`);

        if (!response.ok) {
          throw new Error(
            response.status === 404
              ? "This link has expired or doesn't exist"
              : "Failed to load shared search",
          );
        }

        const data = await response.json();
        setSearchParams(data.searchParams);
        setResults(data.results);
      } catch (err) {
        console.error("Error fetching shared search:", err);
        setError(
          err.message || "Failed to load shared search. Please try again.",
        );
      } finally {
        setLoading(false);
      }
    };

    fetchSharedSearch();
  }, [token]);

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
    const venues = parseVenues(results);
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

  if (loading) {
    return (
      <div className="share-container">
        <Navbar />
        <div className="share-page">
          <div className="search-history">
            {[1, 2, 3].map((index) => (
              <div key={index} className="skeleton-card">
                <div className="skeleton-header">
                  <div className="skeleton-line skeleton-title"></div>
                  <div className="skeleton-line skeleton-subtitle"></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="share-container">
        <Navbar />
        <div className="share-page">
          <div className="error-state">
            <h2>This link has expired or doesn't exist</h2>
            <p>The shared venue recommendations are no longer available.</p>
            <Link to="/" className="back-button">
              Start a new search
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="share-container">
      <Navbar />

      <div className="share-page">
        <div className="share-banner">
          <div className="banner-content">
            <h1 className="banner-title">
              Venue recommendations for {searchParams?.venueType} in{" "}
              {searchParams?.city}
            </h1>
          </div>
          <Link to="/" className="discover-button">
            Find your own venue
          </Link>
        </div>

        <div className="response-container">
          <h2>Top Venue Picks</h2>
          {renderVenues()}
        </div>
      </div>
    </div>
  );
}

export default SharePage;
