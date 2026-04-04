import React from "react";
import "./BackgroundCarousel.css";

const VENUE_IMAGES = [
  {
    type: "Artist Venue",
    src: "https://images.unsplash.com/photo-1470229722913-7c0e2dbbafd3?w=1920&q=80&auto=format&fit=crop",
  },
  {
    type: "Wedding Venue",
    src: "https://images.unsplash.com/photo-1519167758481-83f550bb49b3?w=1920&q=80&auto=format&fit=crop",
  },
  {
    type: "Party Venue",
    src: "https://images.unsplash.com/photo-1533174072545-7a4b6ad7a6c3?w=1920&q=80&auto=format&fit=crop",
  },
  {
    type: "Theater Show",
    src: "https://images.unsplash.com/photo-1507676184212-d03ab07a01bf?w=1920&q=80&auto=format&fit=crop",
  },
  {
    type: "Sports Tournament",
    src: "https://images.unsplash.com/photo-1540747913346-19e32dc3e97e?w=1920&q=80&auto=format&fit=crop",
  },
];

function BackgroundCarousel({ venueType }) {
  return (
    <div className="bg-carousel" aria-hidden="true">
      {VENUE_IMAGES.map(({ type, src }) => (
        <div
          key={type}
          className={`bg-carousel-slide ${type === venueType ? "bg-carousel-slide-active" : ""}`}
          style={{ backgroundImage: `url(${src})` }}
        />
      ))}
      <div className="bg-carousel-overlay" />
    </div>
  );
}

export default BackgroundCarousel;
