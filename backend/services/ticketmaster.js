const axios = require("axios");

// Mapping of app event types to Ticketmaster search keywords
const eventTypeKeywords = {
  "Artist Venue": "music concert",
  "Party Venue": "party entertainment",
  "Wedding Venue": "wedding",
  "Sports Tournament": "sports",
  "Esports Tournament": "esports gaming",
  "Theater Show": "theater performing arts",
  "Product Expo": "expo convention",
  "Political Rally": "rally",
  Hackathon: "conference convention",
};

/**
 * Fetches real venues from Ticketmaster Discovery API based on location and event type
 * @param {string} city - City name
 * @param {string} state - State code (e.g., 'CA', 'NY')
 * @param {string} eventType - Event type from the app (e.g., 'Artist Venue', 'Wedding Venue')
 * @returns {Promise<Array>} Array of cleaned venue objects
 */
async function getVenuesByLocation(city, state, eventType) {
  try {
    const apiKey = process.env.TICKETMASTER_API_KEY;

    if (!apiKey) {
      console.warn(
        "TICKETMASTER_API_KEY not configured, returning empty venue list",
      );
      return [];
    }

    // Get the keyword for this event type
    const keyword = eventTypeKeywords[eventType] || "venue";

    // Convert state to state code if it's a full name
    const stateCode = state && state.length > 2 ? getStateCode(state) : state;

    // Build query parameters
    const params = {
      apikey: apiKey,
      city: city,
      stateCode: stateCode,
      keyword: keyword,
      countryCode: "US",
      size: 20,
    };

    // Call Ticketmaster Discovery API with timeout
    const response = await axios.get(
      "https://app.ticketmaster.com/discovery/v2/venues.json",
      {
        params,
        timeout: 5000, // 5 second timeout
      },
    );

    // Extract and clean venue data
    const venues = response.data._embedded?.venues || [];

    const cleanedVenues = venues.map((venue) => ({
      name: venue.name || "Unknown Venue",
      address: formatAddress(venue),
      city: venue.city?.name || city || "Unknown",
      state: venue.state?.stateCode || stateCode || "Unknown",
      postalCode: venue.postalCode || "N/A",
      capacity:
        venue.capacity && venue.capacity > 0
          ? venue.capacity.toString()
          : "N/A",
      url: venue.url || "N/A",
      generalInfo: venue.generalInfo || "N/A",
      parkingDetail: venue.parkingDetail || "N/A",
      accessibleSeatingDetail: venue.accessibleSeatingDetail || "N/A",
    }));

    return cleanedVenues;
  } catch (error) {
    if (error.code === "ECONNABORTED") {
      console.warn("Ticketmaster request timeout - took too long");
    } else {
      console.error("Error fetching venues from Ticketmaster:", error.message);
    }
    // Gracefully return empty array on error
    return [];
  }
}

/**
 * Formats a Ticketmaster venue address into a readable string
 * @param {Object} venue - Ticketmaster venue object
 * @returns {string} Formatted address
 */
function formatAddress(venue) {
  const parts = [];

  if (venue.address?.line1) parts.push(venue.address.line1);
  if (venue.city?.name) parts.push(venue.city.name);
  if (venue.state?.stateCode) parts.push(venue.state.stateCode);
  if (venue.postalCode) parts.push(venue.postalCode);

  return parts.length > 0 ? parts.join(", ") : "Address not available";
}

/**
 * Converts a full state name to its two-letter code
 * @param {string} stateName - Full state name (e.g., 'California')
 * @returns {string} State code (e.g., 'CA')
 */
function getStateCode(stateName) {
  const stateMap = {
    alabama: "AL",
    alaska: "AK",
    arizona: "AZ",
    arkansas: "AR",
    california: "CA",
    colorado: "CO",
    connecticut: "CT",
    delaware: "DE",
    florida: "FL",
    georgia: "GA",
    hawaii: "HI",
    idaho: "ID",
    illinois: "IL",
    indiana: "IN",
    iowa: "IA",
    kansas: "KS",
    kentucky: "KY",
    louisiana: "LA",
    maine: "ME",
    maryland: "MD",
    massachusetts: "MA",
    michigan: "MI",
    minnesota: "MN",
    mississippi: "MS",
    missouri: "MO",
    montana: "MT",
    nebraska: "NE",
    nevada: "NV",
    "new hampshire": "NH",
    "new jersey": "NJ",
    "new mexico": "NM",
    "new york": "NY",
    "north carolina": "NC",
    "north dakota": "ND",
    ohio: "OH",
    oklahoma: "OK",
    oregon: "OR",
    pennsylvania: "PA",
    "rhode island": "RI",
    "south carolina": "SC",
    "south dakota": "SD",
    tennessee: "TN",
    texas: "TX",
    utah: "UT",
    vermont: "VT",
    virginia: "VA",
    washington: "WA",
    "west virginia": "WV",
    wisconsin: "WI",
    wyoming: "WY",
  };

  return stateMap[stateName.toLowerCase()] || stateName.toUpperCase();
}

/**
 * Formats real venue data into a prompt context string for Gemini
 * @param {Array} venues - Array of venue objects from Ticketmaster
 * @returns {string} Formatted venue data for prompt
 */
function formatVenuesForPrompt(venues) {
  if (!venues || venues.length === 0) {
    return "";
  }

  const venueDetails = venues
    .map((venue) => {
      return `- ${venue.name} (${venue.city}, ${venue.state}): Address: ${venue.address}, Capacity: ${venue.capacity}, Website: ${venue.url}`;
    })
    .join("\n");

  return `\nREAL VENUES AVAILABLE IN THE AREA:\n${venueDetails}\n`;
}

module.exports = {
  getVenuesByLocation,
  formatVenuesForPrompt,
  eventTypeKeywords,
};
