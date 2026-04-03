import React, { useState, useEffect } from "react";
import "./BackgroundCarousel.css";

const CAROUSEL_IMAGES = [
  "https://images.unsplash.com/photo-1470229722913-7c0e2dbbafd3?w=1920&q=80&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1519167758481-83f550bb49b3?w=1920&q=80&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1533174072545-7a4b6ad7a6c3?w=1920&q=80&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1507676184212-d03ab07a01bf?w=1920&q=80&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1461896836934-bd45ba32b0f6?w=1920&q=80&auto=format&fit=crop",
];

function BackgroundCarousel() {
  const [activeIndex, setActiveIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setActiveIndex((prev) => (prev + 1) % CAROUSEL_IMAGES.length);
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="bg-carousel" aria-hidden="true">
      {CAROUSEL_IMAGES.map((src, i) => (
        <div
          key={i}
          className={`bg-carousel-slide ${i === activeIndex ? "bg-carousel-slide-active" : ""}`}
          style={{ backgroundImage: `url(${src})` }}
        />
      ))}
      <div className="bg-carousel-overlay" />
    </div>
  );
}

export default BackgroundCarousel;
