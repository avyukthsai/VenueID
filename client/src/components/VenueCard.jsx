import React, { useState } from "react";
import "./VenueCard.css";

/**
 * Unified venue card component used across all pages.
 *
 * Props:
 *   venue      — normalized venue object (use normalizeVenue() from venueUtils.js)
 *   variant    — "card" (default, full display) | "detail" (compact, used in HistoryPage)
 *   style      — optional inline styles (e.g. entrance animation delay)
 */
function VenueCard({ venue, variant = "card", style }) {
  const [whyExpanded, setWhyExpanded] = useState(false);
  const isDetail = variant === "detail";

  const WHY_TRUNCATE_LENGTH = 130;
  const whyText = venue.whyThisVenue || "";
  const whyIsTruncatable = whyText.length > WHY_TRUNCATE_LENGTH;
  const whyDisplayText =
    whyIsTruncatable && !whyExpanded
      ? `${whyText.slice(0, WHY_TRUNCATE_LENGTH)}…`
      : whyText;

  const websiteLink = venue.website ? (
    <p>
      <strong>Visit Website:</strong>{" "}
      <a href={venue.website} target="_blank" rel="noopener noreferrer">
        {venue.website}
      </a>
    </p>
  ) : null;

  if (isDetail) {
    return (
      <div className="venue-detail" style={style}>
        <h4>{venue.name}</h4>
        <p>
          <strong>Why this venue?</strong> {whyDisplayText}
          {whyIsTruncatable && (
            <button
              className="read-more-btn"
              onClick={() => setWhyExpanded(!whyExpanded)}
            >
              {whyExpanded ? "Read less" : "Read more"}
            </button>
          )}
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
        {websiteLink}
        {venue.dateTime && (
          <p>
            <strong>Time & Date:</strong> {venue.dateTime}
          </p>
        )}
      </div>
    );
  }

  return (
    <div className="venue-card" style={style}>
      {venue.matchScore != null && (
        <div
          className="match-score-badge"
          title="Match score based on capacity, event type, and venue features"
          style={{ backgroundColor: getMatchScoreColor(venue.matchScore) }}
        >
          {venue.matchScore}%
        </div>
      )}
      <h3>{venue.name}</h3>
      <p>
        <strong>Why this venue?</strong> {whyDisplayText}
        {whyIsTruncatable && (
          <button
            className="read-more-btn"
            onClick={() => setWhyExpanded(!whyExpanded)}
          >
            {whyExpanded ? "Read less" : "Read more"}
          </button>
        )}
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
      {websiteLink}
      {venue.dateTime && (
        <p>
          <strong>Time & Date:</strong> {venue.dateTime}
        </p>
      )}
    </div>
  );
}

function getMatchScoreColor(score) {
  if (score >= 90) return "#10b981";
  if (score >= 75) return "#f59e0b";
  return "#9ca3af";
}

export default VenueCard;
