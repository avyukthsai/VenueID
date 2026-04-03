import React, { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import Navbar from "./components/Navbar";
import VenueCard from "./components/VenueCard";
import { parseVenues, normalizeVenue } from "./utils/venueUtils";
import "./SharePage.css";

const API_URL = import.meta.env.VITE_API_URL;

function SharePage() {
  const { token } = useParams();
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

  if (loading) {
    return (
      <div className="share-container">
        <Navbar />
        <div className="share-page">
          <div className="response-container">
            {[1, 2, 3].map((i) => (
              <div key={i} className="skeleton-card">
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
          {parseVenues(results).map((venue, i) => (
            <VenueCard key={i} venue={normalizeVenue(venue)} />
          ))}
        </div>
      </div>
    </div>
  );
}

export default SharePage;
