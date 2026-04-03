/**
 * Parse the text-based venue format (stored in DB) into raw key-value objects.
 * Returns objects with snake_case keys like { venue, why_this_venue, visit_website, ... }
 */
export function parseVenues(resultsText) {
  return resultsText
    .split("-----")
    .map((block) => block.trim())
    .filter((block) => block)
    .map((venueText) => {
      const venue = {};
      venueText
        .split("\n")
        .map((line) => line.trim())
        .filter((line) => line)
        .forEach((line) => {
          const match = line.match(/\*\*(.*?):\*\*\s*(.*)/);
          if (match) {
            const key = match[1].toLowerCase().replace(/\s+/g, "_");
            venue[key] = match[2];
          }
        });
      return venue;
    });
}

/**
 * Normalize a venue object to the canonical streaming JSON format.
 * Accepts both the legacy text-parsed format and the streaming JSON format.
 *
 * Legacy keys: venue, why_this_venue, visit_website, url_to_website, time_&_date
 * Streaming keys: name, whyThisVenue, website, dateTime, matchScore
 */
export function normalizeVenue(venue) {
  return {
    name: venue.name || venue.venue || "",
    whyThisVenue: venue.whyThisVenue || venue.why_this_venue || "",
    address: venue.address || "",
    capacity: venue.capacity || "",
    location: venue.location || "",
    features: venue.features || "",
    // "visit_website" is the parsed key from stored text; also handle legacy "url_to_website"
    website: venue.website || venue.visit_website || venue.url_to_website || "",
    dateTime: venue.dateTime || venue["time_&_date"] || "",
    matchScore: venue.matchScore ?? null,
  };
}

/**
 * Convert the streaming JSON venue array to the text format used for saving/sharing.
 */
export function convertStreamingVenuesToText(venues) {
  return venues
    .map(
      (venue) =>
        `**Venue:** ${venue.name}\n` +
        `**Why this venue?** ${venue.whyThisVenue}\n` +
        `**Address:** ${venue.address}\n` +
        `**Capacity:** ${venue.capacity}\n` +
        `**Location:** ${venue.location}\n` +
        `**Features:** ${venue.features}\n` +
        `**Visit Website:** ${venue.website}\n` +
        `**Time & Date:** ${venue.dateTime}`,
    )
    .join("\n-----\n");
}
