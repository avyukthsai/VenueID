import React, { useState, useEffect } from "react";
import { useUser } from "@clerk/react";
import { Link } from "react-router-dom";
import { Show, UserButton } from "@clerk/react";
import "./HistoryPage.css";

function HistoryPage() {
  const { user } = useUser();
  const [searches, setSearches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [expandedId, setExpandedId] = useState(null);
  const [deleting, setDeleting] = useState(null);

  useEffect(() => {
    if (!user) return;

    const fetchSearches = async () => {
      try {
        const response = await fetch(
          `http://localhost:3001/api/searches/${user.id}`,
        );
        if (!response.ok) {
          throw new Error("Failed to fetch searches");
        }
        const data = await response.json();
        setSearches(data.data || []);
      } catch (err) {
        console.error("Error fetching searches:", err);
        setError("Failed to load search history");
      } finally {
        setLoading(false);
      }
    };

    fetchSearches();
  }, [user]);

  const handleDelete = async (searchId) => {
    setDeleting(searchId);
    try {
      const response = await fetch(
        `http://localhost:3001/api/searches/${searchId}`,
        {
          method: "DELETE",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ userId: user.id }),
        },
      );

      if (!response.ok) {
        throw new Error("Failed to delete search");
      }

      setSearches(searches.filter((s) => s.id !== searchId));
    } catch (err) {
      console.error("Error deleting search:", err);
      setError("Failed to delete search");
    } finally {
      setDeleting(null);
    }
  };

  const getRelativeTime = (timestamp) => {
    const now = new Date();
    const created = new Date(timestamp);
    const diffMs = now - created;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);
    const diffWeeks = Math.floor(diffDays / 7);

    if (diffMins < 1) return "just now";
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    if (diffWeeks < 4) return `${diffWeeks}w ago`;
    return created.toLocaleDateString();
  };

  const parseVenues = (resultsText) => {
    const venues = resultsText
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

  const getTopVenueName = (resultsText) => {
    const venues = parseVenues(resultsText);
    return venues.length > 0 ? venues[0].venue : "Unknown Venue";
  };

  const renderVenue = (venue) => (
    <div key={venue.venue} className="venue-detail">
      <h4>{venue.venue}</h4>
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
        <strong>Website:</strong>{" "}
        <a
          href={venue.url_to_website}
          target="_blank"
          rel="noopener noreferrer"
        >
          {venue.url_to_website}
        </a>
      </p>
      {venue["time_&_date"] && (
        <p>
          <strong>Time & Date:</strong> {venue["time_&_date"]}
        </p>
      )}
    </div>
  );

  if (loading) {
    return (
      <div className="history-container">
        <div className="auth-header">
          <div className="header-content">
            <Link to="/" className="logo">
              Venue ID
            </Link>
          </div>
          <Show when="signed-in">
            <UserButton />
          </Show>
        </div>
        <div className="history-page">
          <h1 className="page-title">Your saved searches</h1>
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

  return (
    <div className="history-container">
      <div className="auth-header">
        <div className="header-content">
          <Link to="/" className="logo">
            Venue ID
          </Link>
        </div>
        <Show when="signed-in">
          <UserButton />
        </Show>
      </div>

      <div className="history-page">
        <h1 className="page-title">Your saved searches</h1>

        {error && <p className="error-message">{error}</p>}

        {searches.length === 0 ? (
          <div className="empty-state">
            <p className="empty-message">No saved searches yet</p>
            <Link to="/" className="back-button">
              Start a new search
            </Link>
          </div>
        ) : (
          <div className="search-history">
            {searches.map((search) => (
              <div
                key={search.id}
                className={`search-card ${expandedId === search.id ? "expanded" : ""}`}
              >
                <div className="card-header">
                  <div
                    className="card-content"
                    onClick={() =>
                      setExpandedId(expandedId === search.id ? null : search.id)
                    }
                  >
                    <div className="card-summary">
                      <div className="summary-left">
                        <div className="event-type">
                          {search.search_params.venueType}
                        </div>
                        <div className="location">
                          {search.search_params.city}
                          {search.search_params.state
                            ? `, ${search.search_params.state}`
                            : ""}
                          , {search.search_params.country}
                        </div>
                        <div className="date">{search.search_params.date}</div>
                        <div className="top-venue">
                          Top: {getTopVenueName(search.results)}
                        </div>
                      </div>
                      <div className="timestamp">
                        {getRelativeTime(search.created_at)}
                      </div>
                    </div>
                    <div className="expand-icon">
                      {expandedId === search.id ? "▼" : "▶"}
                    </div>
                  </div>
                  <button
                    className="delete-button"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDelete(search.id);
                    }}
                    disabled={deleting === search.id}
                    title="Delete this search"
                  >
                    <svg
                      width="18"
                      height="18"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                    >
                      <path d="M3 6h18M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2m3 0v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6h14zM10 11v6M14 11v6" />
                    </svg>
                  </button>
                </div>

                {expandedId === search.id && (
                  <div className="card-details">
                    <div className="venues-container">
                      {parseVenues(search.results).map((venue) =>
                        renderVenue(venue),
                      )}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default HistoryPage;
