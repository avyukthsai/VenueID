const axios = require("axios");

// Mapping of app event types to Foursquare category IDs
const eventTypeCategoryIds = {
  "Artist Venue": [10032, 10005],
  "Party Venue": [13003, 13065],
  "Wedding Venue": [13003, 13065, 10056],
  "Sports Tournament": [18000, 18021],
  "Esports Tournament": [13065, 10000],
  "Theater Show": [10058, 10054],
  "Product Expo": [13065, 10044],
  "Political Rally": [13065, 10044],
  Hackathon: [13065, 12076],
};

/**
 * Fetches venues from Foursquare Places API based on location and event type
 * @param {string} city - City name
 * @param {string} state - State code (e.g., 'CA', 'NY')
 * @param {string} eventType - Event type from the app (e.g., 'Artist Venue', 'Wedding Venue')
 * @returns {Promise<Array>} Array of cleaned venue objects
 */
async function getVenuesByCategory(city, state, eventType) {
  try {
    const apiKey = process.env.FOURSQUARE_API_KEY;

    if (!apiKey) {
      console.warn(
        "FOURSQUARE_API_KEY not configured, returning empty venue list",
      );
      return [];
    }

    // Get the category IDs for this event type
    const categoryIds = eventTypeCategoryIds[eventType] || [];

    if (categoryIds.length === 0) {
      console.warn(
        `No Foursquare categories found for event type: ${eventType}`,
      );
      return [];
    }

    // Convert state to state code if it's a full name
    const stateCode = state && state.length > 2 ? getStateCode(state) : state;

    // Build the 'near' parameter (format: "City, State")
    const nearParam = stateCode ? `${city}, ${stateCode}` : city;

    // Make requests for each category and combine results
    const categoryRequests = categoryIds.map((categoryId) =>
      axios
        .get("https://api.foursquare.com/v3/places/search", {
          params: {
            near: nearParam,
            categories: categoryId,
            limit: 15,
            sort: "RELEVANCE",
          },
          headers: {
            Authorization: apiKey,
            accept: "application/json",
          },
          timeout: 5000, // 5 second timeout
        })
        .catch((error) => {
          let errorMsg = error.message || "Unknown error";
          if (error.response?.status) {
            errorMsg = `Status ${error.response.status}: ${error.response.statusText}`;
          }
          if (error.code === "ECONNABORTED") {
            console.warn(
              `Foursquare request timeout for category ${categoryId} - took too long`,
            );
          } else {
            console.error(
              `Error fetching Foursquare category ${categoryId}:`,
              errorMsg,
            );
          }
          console.error(`Full error details:`, {
            message: error.message,
            code: error.code,
            status: error.response?.status,
            statusText: error.response?.statusText,
          });
          return { data: { results: [] } };
        }),
    );

    const responses = await Promise.all(categoryRequests);

    // Combine results from all category requests
    const allVenues = [];
    const seenVenueNames = new Set();

    for (const response of responses) {
      const venues = response.data.results || [];

      for (const venue of venues) {
        // Avoid duplicates by venue name
        if (!seenVenueNames.has(venue.name)) {
          seenVenueNames.add(venue.name);
          allVenues.push(cleanVenueData(venue, city, stateCode));
        }
      }
    }

    return allVenues;
  } catch (error) {
    console.error("Error fetching venues from Foursquare:", error.message);
    // Gracefully return empty array on error
    return [];
  }
}

/**
 * Cleans and formats a single Foursquare venue object
 * @param {Object} venue - Foursquare venue object
 * @param {string} city - City name for fallback
 * @param {string} state - State code for fallback
 * @returns {Object} Cleaned venue data
 */
function cleanVenueData(venue, city, state) {
  const location = venue.location || {};
  const address = location.formatted_address || "Address not available";

  return {
    name: venue.name || "Unknown Venue",
    address: address,
    city: city || location.locality || "Unknown",
    state: state || location.region || "Unknown",
    categories: venue.categories?.map((cat) => cat.name).join(", ") || "Venue",
    website: venue.website || venue.link || "N/A",
    description: venue.description || "N/A",
  };
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
 * Removes duplicate venues based on name similarity
 * @param {Array} venues1 - First array of venues
 * @param {Array} venues2 - Second array of venues
 * @returns {Array} Merged array with duplicates removed
 */
function mergeAndDeduplicateVenues(venues1, venues2) {
  const merged = [...venues1];
  const existingNames = new Set(venues1.map((v) => v.name.toLowerCase()));

  for (const venue of venues2) {
    // Simple duplicate check: if name is not already present, add it
    if (!existingNames.has(venue.name.toLowerCase())) {
      merged.push(venue);
      existingNames.add(venue.name.toLowerCase());
    }
  }

  return merged;
}

/**
 * Formats combined venue data into a prompt context string for Gemini
 * @param {Array} venues - Array of venue objects
 * @returns {string} Formatted venue data for prompt
 */
function formatVenuesForPrompt(venues) {
  if (!venues || venues.length === 0) {
    return "";
  }

  const venueDetails = venues
    .map((venue) => {
      const hasCat = venue.categories ? ` (${venue.categories})` : "";
      return `- ${venue.name}${hasCat}: ${venue.address}`;
    })
    .join("\n");

  return `\nREAL VENUES FROM MULTIPLE VERIFIED SOURCES:\n${venueDetails}\n`;
}

module.exports = {
  getVenuesByCategory,
  mergeAndDeduplicateVenues,
  formatVenuesForPrompt,
  eventTypeCategoryIds,
};
