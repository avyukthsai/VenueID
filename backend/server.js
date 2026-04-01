const dotenv = require("dotenv");

dotenv.config(); // Load environment variables from .env file FIRST

console.log(
  "STARTUP: SEARCH_LIMIT_ENABLED =",
  JSON.stringify(process.env.SEARCH_LIMIT_ENABLED),
);

const express = require("express");
const { GoogleGenerativeAI } = require("@google/generative-ai");
const cors = require("cors");
const searchesRouter = require("./searches");
const sharesRouter = require("./shares");
const supabase = require("./supabase");
const {
  getVenuesByLocation,
  formatVenuesForPrompt: formatTicketmasterVenues,
} = require("./services/ticketmaster");
const {
  getVenuesByCategory,
  mergeAndDeduplicateVenues,
  formatVenuesForPrompt: formatFoursquareVenues,
} = require("./services/foursquare");

const app = express();
const port = 3001; // port for your backend

// Middleware
app.use(
  cors({
    origin: process.env.FRONTEND_URL || "http://localhost:5173",
  }),
); // Enable CORS for cross-origin requests from React app
app.use(express.json()); // To parse JSON request bodies

// Configure Google Generative AI
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

const generationConfig = {
  temperature: 1,
  top_p: 0.95,
  top_k: 40,
  max_output_tokens: 8192,
  response_mime_type: "application/json",
};

// prompt for the AI
const systemInstruction = `You will be given a venue type from the following list:
artist venues, party venues, wedding venues, sports tournament, and theater show. You will be given the country, state, and city.

**IMPORTANT - SPOTIFY MENTIONS:**
Only for Artist Venue events: If the selected venue type is an artist venue, you will receive
the artist's monthly Spotify listener count instead of the expected audience. Based on the monthly 
listener count, estimate the expected audience amount in the whyThisVenue explanation.

For ALL OTHER event types (party, wedding, sports, theater):
NEVER mention Spotify, streaming data, listener counts, or music-related predictions in the 
whyThisVenue explanation. Do not reference the input data source at all. Only discuss the 
expected audience size, event type, venue features, and location suitability.

You will also receive VENUE SETTING information (Indoor, Outdoor, or Both), which should influence your recommendations:
- "Indoor" venues should prioritize climate-controlled, enclosed spaces with full amenities
- "Outdoor" venues should prioritize open-air, natural settings with weather considerations
- "Both" allows flexibility between indoor and outdoor options

Additionally, you will receive AUDIENCE TYPE information (General/All Ages, 21+, Corporate, or Family), which affects recommendations:
- "General / All Ages" venues should have all necessary amenities and family-friendly features
- "21+" venues should focus on bars, nightclubs, lounges, and adult-oriented spaces with liquor licenses
- "Corporate / Professional" venues should have meeting facilities, catering, professional services
- "Family Friendly" venues should prioritize kid-friendly amenities, entertainment, and safety features

You will be given the time of the event in Eastern Standard Time. Based on all this information, locate the best 3 specific venues that would accommodate the specified event type with the expected audience amount, WHILE RESPECTING the venue setting and audience type preferences. Make sure you consider the hours of operation and holidays.

**CRITICAL - RESPOND ONLY IN VALID JSON FORMAT:**
You MUST respond ONLY with a valid JSON object. No other text before or after. Use this exact structure:
{
  "venues": [
    {
      "name": "Venue Name",
      "whyThisVenue": "Detailed explanation (3+ sentences) of why this venue is the best choice for the specified event type, audience, and venue setting. Reference the event type, expected audience size, location, and venue features. Do NOT mention Spotify, streaming data, or music predictions unless this is an Artist Venue event.",
      "address": "Full venue address including street, city, state, and country",
      "capacity": "Estimated or exact capacity number (e.g., '500-1000' or '2500')",
      "location": "Brief description of the venue's neighborhood/district and accessibility",
      "features": "Key features and amenities as a comma-separated list",
      "website": "Official venue website URL or 'Contact venue for website'",
      "dateTime": "Full date and time with timezone (e.g., 'March 21, 2026 at 7:00 PM EST')"
    }
  ]
}

**FIELD COMPLETION RULES - CRITICAL:**
Every field must be filled in for every venue. Never leave a field empty, null, or undefined.
- If exact capacity is unknown, use your best estimate based on the venue type and location
- If features are unknown, list the most likely features/amenities for this venue type
- If website is unknown, use the venue's most likely official website URL or write 'Contact venue for website'
- If exact address is unknown, provide the most likely address based on the venue type and location
- Always include all 8 fields for each venue
- Ensure 'whyThisVenue' is detailed, helpful, and at least 3 sentences long

Provide exactly 3 venue suggestions.`;

// Routes
app.use("/api/searches", searchesRouter);
app.use("/api/shares", sharesRouter);

// Test endpoint to verify server is working
app.get("/test", (req, res) => {
  res.json({ message: "Server is working", timestamp: new Date() });
});

// Helper function to validate and complete venue data
function validateAndCompleteVenue(venue) {
  const fallbacks = {
    name: "Contact venue for details",
    whyThisVenue: "This venue meets the requirements for your event.",
    address: "Contact venue for address",
    capacity: "Contact venue for capacity",
    location: "Contact venue for location details",
    features: "Contact venue for amenities",
    website: "Contact venue for website",
    dateTime: "Contact venue for availability",
  };

  const completed = {};
  for (const key of Object.keys(fallbacks)) {
    // Check if field exists and is not empty
    const value = venue[key];
    if (!value || typeof value !== "string" || value.trim() === "") {
      completed[key] = fallbacks[key];
    } else {
      completed[key] = value.trim();
    }
  }
  return completed;
}

// Helper function to validate JSON response structure
function validateVenueResponse(responseData) {
  try {
    // Ensure it's an object with venues array
    if (!responseData || !Array.isArray(responseData.venues)) {
      return null;
    }

    // Validate and complete each venue
    const validatedVenues = responseData.venues
      .slice(0, 3) // Take only first 3 venues
      .map((venue) => validateAndCompleteVenue(venue));

    // Ensure we have at least 1 venue
    if (validatedVenues.length === 0) {
      return null;
    }

    return { venues: validatedVenues };
  } catch (error) {
    console.error("Error validating venue response:", error);
    return null;
  }
}

// Helper function to convert JSON venues to text format for frontend compatibility
function convertJsonVenuesToText(venuesData) {
  return venuesData.venues
    .map((venue) => {
      return (
        `**Venue:** ${venue.name}\n` +
        `**Why this venue?** ${venue.whyThisVenue}\n` +
        `**Address:** ${venue.address}\n` +
        `**Capacity:** ${venue.capacity}\n` +
        `**Location:** ${venue.location}\n` +
        `**Features:** ${venue.features}\n` +
        `**Visit Website:** ${venue.website}\n` +
        `**Time & Date:** ${venue.dateTime}`
      );
    })
    .join("\n-----\n");
}

function getGeminiErrorDetails(error) {
  const status =
    error?.status ||
    error?.response?.status ||
    error?.response?.statusCode ||
    null;
  const message =
    error?.message ||
    error?.response?.statusText ||
    "Unknown Gemini API error";
  return { status, message };
}

function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// Helper function to calculate match score (0-100)
function calculateMatchScore(venue, venueType, audienceInput, index) {
  let score = 0;

  // Capacity match (40% of score)
  // Parse audience size from input
  const audienceSize = parseInt(audienceInput) || 100;
  const capacityStr = venue.capacity.toLowerCase();

  // Try to extract a number from capacity string
  const capacityMatch = capacityStr.match(/\d+/);
  const capacityNum = capacityMatch ? parseInt(capacityMatch[0]) : 500;

  // Score capacity match: closest match gets highest score
  const capacityRatio =
    Math.min(capacityNum, audienceSize) / Math.max(capacityNum, audienceSize);
  score += capacityRatio * 40;

  // Event type match (30% of score)
  // Check if venue description/features mention the event type favorably
  const venueText =
    `${venue.name} ${venue.whyThisVenue} ${venue.features}`.toLowerCase();
  const typeKeywords = {
    "artist venue": [
      "artist",
      "live",
      "music",
      "performance",
      "stage",
      "sound",
    ],
    "party venue": [
      "bar",
      "club",
      "lounge",
      "nightlife",
      "dance",
      "event space",
    ],
    "wedding venue": ["wedding", "banquet", "reception", "ballroom", "elegant"],
    "sports tournament": ["sports", "arena", "field", "stadium", "game"],
    "theater show": [
      "theater",
      "auditorium",
      "stage",
      "seating",
      "performance",
    ],
  };

  const keywords = typeKeywords[venueType.toLowerCase()] || [];
  const keywordMatches = keywords.filter((kw) => venueText.includes(kw)).length;
  score += (keywordMatches / Math.max(keywords.length, 1)) * 30;

  // Location match (15% of score)
  // Central/accessible locations get higher scores
  const locationText = venue.location.toLowerCase();
  const accessibilityKeywords = [
    "downtown",
    "central",
    "convenient",
    "accessible",
    "public transit",
    "highway",
    "major road",
  ];
  const accessibilityMatches = accessibilityKeywords.filter((kw) =>
    locationText.includes(kw),
  ).length;
  score += (accessibilityMatches / accessibilityKeywords.length) * 15;

  // Features match (15% of score)
  const featuresText = venue.features.toLowerCase();
  const commonFeatures = [
    "parking",
    "food",
    "catering",
    "wifi",
    "sound",
    "lights",
    "seating",
    "accessibility",
  ];
  const featureMatches = commonFeatures.filter((f) =>
    featuresText.includes(f),
  ).length;
  score += (featureMatches / commonFeatures.length) * 15;

  // Now map the base score (0-100) to the appropriate range based on venue position
  let finalScore;
  if (index === 0) {
    // First venue: 85-97 range
    finalScore = 85 + (score / 100) * (97 - 85);
  } else if (index === 1) {
    // Second venue: 70-84 range
    finalScore = 70 + (score / 100) * (84 - 70);
  } else {
    // Third venue: 55-69 range
    finalScore = 55 + (score / 100) * (69 - 55);
  }

  return Math.round(finalScore);
}

// Helper function to check and increment search count
async function checkAndIncrementSearchCount(userId) {
  try {
    // Check if user exists in search counts
    const { data: existingUser, error: fetchError } = await supabase
      .from("user_search_counts")
      .select("search_count")
      .eq("user_id", userId)
      .single();

    if (fetchError && fetchError.code !== "PGRST116") {
      // PGRST116 means no rows found, which is expected for new users
      console.error("Error fetching search count:", fetchError);
      return { error: "Failed to check search limit", code: "DB_ERROR" };
    }

    let currentCount = 0;
    if (existingUser) {
      currentCount = existingUser.search_count;
    } else {
      // Insert new user with count 0
      const { error: insertError } = await supabase
        .from("user_search_counts")
        .insert([{ user_id: userId, search_count: 0 }]);

      if (insertError) {
        console.error("Error inserting new user search count:", insertError);
        return { error: "Failed to initialize search count", code: "DB_ERROR" };
      }
    }

    // Check if limit is reached (5 searches)
    if (currentCount >= 5) {
      return { limitReached: true, currentCount };
    }

    // Increment search count
    const { error: updateError } = await supabase
      .from("user_search_counts")
      .update({ search_count: currentCount + 1 })
      .eq("user_id", userId);

    if (updateError) {
      console.error("Error incrementing search count:", updateError);
      return { error: "Failed to update search count", code: "DB_ERROR" };
    }

    return { limitReached: false, newCount: currentCount + 1 };
  } catch (error) {
    console.error("Unexpected error in checkAndIncrementSearchCount:", error);
    return { error: "Unexpectederror", code: "UNKNOWN_ERROR" };
  }
}

// Helper function to get user's current search count
async function getUserSearchCount(userId) {
  try {
    const { data, error } = await supabase
      .from("user_search_counts")
      .select("search_count")
      .eq("user_id", userId)
      .single();

    if (error && error.code !== "PGRST116") {
      console.error("Error fetching search count:", error);
      return { error: "Failed to fetch search count" };
    }

    return { searchCount: data?.search_count || 0 };
  } catch (error) {
    console.error("Error in getUserSearchCount:", error);
    return { error: "Failed to fetch search count" };
  }
}

// Helper function to add email to waitlist
async function addToWaitlist(email) {
  try {
    const { data, error } = await supabase
      .from("waitlist")
      .insert([{ email }])
      .select();

    if (error) {
      if (error.code === "23505") {
        // Unique constraint violation - email already exists
        return { success: false, message: "Email already on waitlist" };
      }
      console.error("Error adding to waitlist:", error);
      return { success: false, message: "Failed to add email to waitlist" };
    }

    return { success: true, message: "Email added to waitlist" };
  } catch (error) {
    console.error("Error in addToWaitlist:", error);
    return { success: false, message: "Failed to add email to waitlist" };
  }
}
app.post("/api/venues/stream", async (req, res) => {
  console.log("Streaming endpoint hit"); // Debug logging
  const {
    venueType,
    country,
    state,
    city,
    date,
    time,
    audienceInput,
    venueSetting,
    audienceType,
    additionalRequirements,
    userId,
  } = req.body;

  console.log("Request payload:", {
    venueType,
    country,
    state,
    city,
    date,
    time,
    audienceInput,
    userId,
  }); // Debug logging

  // Detailed validation and error reporting
  const missingFields = [];
  if (!venueType) missingFields.push("venueType");
  if (!country) missingFields.push("country");
  if (!city) missingFields.push("city");
  if (!date) missingFields.push("date");
  if (!time) missingFields.push("time");
  if (!audienceInput) missingFields.push("audienceInput");
  if (!userId) missingFields.push("userId");

  if (missingFields.length > 0) {
    console.error("Missing fields:", missingFields);
    return res.status(400).json({
      error: "All input fields are required.",
      missingFields: missingFields,
      received: {
        venueType,
        country,
        state,
        city,
        date,
        time,
        audienceInput,
        userId,
      },
    });
  }

  // Check search limit before proceeding (only if enabled)
  const limitEnabledValue = process.env.SEARCH_LIMIT_ENABLED;
  console.log(
    "DEBUG: SEARCH_LIMIT_ENABLED =",
    JSON.stringify(limitEnabledValue),
    ", Type:",
    typeof limitEnabledValue,
  );
  if (limitEnabledValue === "true") {
    console.log("DEBUG: Limit check is ENABLED");
    const limitCheck = await checkAndIncrementSearchCount(userId);
    if (limitCheck.error) {
      return res.status(500).json({ error: limitCheck.error });
    }
    if (limitCheck.limitReached) {
      console.log("DEBUG: Limit reached, returning 429");
      return res.status(429).json({
        error: "Search limit reached",
        message: "You've used all 5 free searches. Upgrade coming soon.",
      });
    }
  } else {
    console.log("DEBUG: Limit check is DISABLED, allowing search to proceed");
  }

  // Fetch and process venues (non-streaming)
  let allVenues = [];
  let venueContext = "";
  try {
    const [ticketmasterVenues, foursquareVenues] = await Promise.all([
      getVenuesByLocation(city, state, venueType),
      getVenuesByCategory(city, state, venueType),
    ]);

    console.log(
      `Fetched ${ticketmasterVenues.length} venues from Ticketmaster`,
    );
    console.log(`Fetched ${foursquareVenues.length} venues from Foursquare`);

    // Merge and deduplicate results
    allVenues = mergeAndDeduplicateVenues(ticketmasterVenues, foursquareVenues);
    console.log(`Combined to ${allVenues.length} unique venues`);

    if (allVenues.length >= 5) {
      venueContext = formatTicketmasterVenues(
        allVenues.slice(0, 15), // Use top 15 combined venues
      );
      // Update context message to reflect multiple sources
      venueContext = venueContext.replace(
        "REAL VENUES AVAILABLE IN THE AREA",
        "REAL VENUES FROM MULTIPLE VERIFIED SOURCES",
      );
    }
  } catch (error) {
    console.error("Error fetching venues from APIs:", error);
    // Continue without real venue data if APIs fail
  }

  let inputText =
    `Venue Type: ${venueType}; ` +
    `Country: ${country}; ` +
    (state ? `State: ${state}; ` : "") +
    `City: ${city}; ` +
    `Date: ${date}; ` +
    `Time: ${time}; ` +
    `Expected Audience OR Spotify Monthly Listeners: ${audienceInput}; ` +
    (venueSetting ? `Venue Setting: ${venueSetting}; ` : "") +
    (audienceType ? `Audience Type: ${audienceType}; ` : "") +
    (additionalRequirements && additionalRequirements.trim()
      ? `Additional user requirements to factor into venue selection: ${additionalRequirements};`
      : "");

  let enhancedSystemInstruction = systemInstruction;

  // If we have good real venue data, modify the prompt to be grounded in it
  if (venueContext) {
    inputText += venueContext;
    enhancedSystemInstruction =
      systemInstruction +
      `\n\nIMPORTANT - REAL VENUE DATA PROVIDED:\nReal venue data from multiple verified sources has been provided above. You MUST choose the 3 best venues from the provided list. Only recommend venues from the provided list. Do NOT make up or imagine venues that are not in the list. Explain why each of the 3 venues from the list is ideal for this event.`;
  } else if (allVenues.length > 0 && allVenues.length < 5) {
    inputText += `\nNote: Only ${allVenues.length} real venues were found from multiple sources in this location. Real venue data is limited for this area. You may recommend venues based on typical venue types for this event type and location.`;
  }

  let retryCount = 0;
  const maxRetries = 2;

  while (retryCount <= maxRetries) {
    try {
      const model = genAI.getGenerativeModel({
        model: "gemini-3-flash-preview",
        generationConfig,
        systemInstruction: enhancedSystemInstruction,
      });

      const chat = model.startChat({
        history: [],
      });

      const result = await chat.sendMessage(inputText);
      const responseText = result.response.text();

      console.log("Raw Gemini response length:", responseText.length);
      console.log("First 300 chars:", responseText.substring(0, 300));

      // Try to parse JSON response
      let parsedResponse;
      let cleanedText = responseText;

      // Try to extract JSON from markdown code blocks
      if (cleanedText.includes("```json")) {
        cleanedText = cleanedText
          .replace(/```json\n?/g, "")
          .replace(/```\n?/g, "")
          .trim();
      } else if (cleanedText.includes("```")) {
        cleanedText = cleanedText.replace(/```\n?/g, "").trim();
      }

      try {
        parsedResponse = JSON.parse(cleanedText);
      } catch (parseError) {
        console.error("Failed to parse JSON response:", parseError.message);
        console.error(
          "Attempted to parse text (first 300 chars):",
          cleanedText.substring(0, 300),
        );
        if (retryCount < maxRetries) {
          retryCount++;
          console.log(
            `Retry attempt ${retryCount}/${maxRetries} due to JSON parse error`,
          );
          continue;
        }
        return res
          .status(500)
          .json({ error: "Failed to parse AI response format." });
      }

      // Validate venue response
      const validatedData = validateVenueResponse(parsedResponse);
      if (!validatedData) {
        if (retryCount < maxRetries) {
          retryCount++;
          console.log(
            `Retry attempt ${retryCount}/${maxRetries} due to validation error`,
          );
          continue;
        }
        return res
          .status(500)
          .json({ error: "Invalid AI response structure." });
      }

      // Process each venue with match score
      validatedData.venues.forEach((venue, index) => {
        const matchScore = calculateMatchScore(
          venue,
          venueType,
          audienceInput,
          index,
        );
        venue.matchScore = matchScore;
      });

      // Send all venues and response as JSON
      return res.json({
        response: responseText,
        venues: validatedData.venues,
        success: true,
      });
    } catch (error) {
      const geminiError = getGeminiErrorDetails(error);
      console.error("Error calling Gemini API:", geminiError, error);
      if (retryCount < maxRetries) {
        retryCount++;
        await delay(600 * retryCount);
        console.log(
          `Retry attempt ${retryCount}/${maxRetries} due to API error`,
        );
        continue;
      }
      return res
        .status(500)
        .json({ error: "Failed to communicate with the AI model." });
    }
  }
});

app.post("/generate-venue", async (req, res) => {
  const {
    venueType,
    country,
    state,
    city,
    date,
    time,
    audienceInput,
    venueSetting,
    audienceType,
    additionalRequirements,
  } = req.body;

  console.log("Generate endpoint hit with payload:", {
    venueType,
    country,
    state,
    city,
    date,
    time,
    audienceInput,
  });

  // Detailed validation and error reporting
  const missingFields = [];
  if (!venueType) missingFields.push("venueType");
  if (!country) missingFields.push("country");
  if (!city) missingFields.push("city");
  if (!date) missingFields.push("date");
  if (!time) missingFields.push("time");
  if (!audienceInput) missingFields.push("audienceInput");

  if (missingFields.length > 0) {
    console.error("Missing fields:", missingFields);
    return res.status(400).json({
      error: "All input fields are required.",
      missingFields: missingFields,
      received: { venueType, country, state, city, date, time, audienceInput },
    });
  }

  // Fetch real venues from both Ticketmaster and Foursquare simultaneously
  let allVenues = [];
  let venueContext = "";
  try {
    const [ticketmasterVenues, foursquareVenues] = await Promise.all([
      getVenuesByLocation(city, state, venueType),
      getVenuesByCategory(city, state, venueType),
    ]);

    console.log(
      `Fetched ${ticketmasterVenues.length} venues from Ticketmaster`,
    );
    console.log(`Fetched ${foursquareVenues.length} venues from Foursquare`);

    // Merge and deduplicate results
    allVenues = mergeAndDeduplicateVenues(ticketmasterVenues, foursquareVenues);
    console.log(`Combined to ${allVenues.length} unique venues`);

    if (allVenues.length >= 5) {
      venueContext = formatTicketmasterVenues(
        allVenues.slice(0, 15), // Use top 15 combined venues
      );
      // Update context message to reflect multiple sources
      venueContext = venueContext.replace(
        "REAL VENUES AVAILABLE IN THE AREA",
        "REAL VENUES FROM MULTIPLE VERIFIED SOURCES",
      );
    }
  } catch (error) {
    console.error("Error fetching venues from APIs:", error);
    // Continue without real venue data if APIs fail
  }

  let inputText =
    `Venue Type: ${venueType}; ` +
    `Country: ${country}; ` +
    (state ? `State: ${state}; ` : "") +
    `City: ${city}; ` +
    `Date: ${date}; ` +
    `Time: ${time}; ` +
    `Expected Audience OR Spotify Monthly Listeners: ${audienceInput}; ` +
    (venueSetting ? `Venue Setting: ${venueSetting}; ` : "") +
    (audienceType ? `Audience Type: ${audienceType}; ` : "") +
    (additionalRequirements && additionalRequirements.trim()
      ? `Additional user requirements to factor into venue selection: ${additionalRequirements};`
      : "");

  let enhancedSystemInstruction = systemInstruction;

  // If we have good real venue data, modify the prompt to be grounded in it
  if (venueContext) {
    inputText += venueContext;
    enhancedSystemInstruction =
      systemInstruction +
      `\n\nIMPORTANT - REAL VENUE DATA PROVIDED:\nReal venue data from multiple verified sources has been provided above. You MUST choose the 3 best venues from the provided list. Only recommend venues from the provided list. Do NOT make up or imagine venues that are not in the list. Explain why each of the 3 venues from the list is ideal for this event.`;
  } else if (allVenues.length > 0 && allVenues.length < 5) {
    inputText += `\nNote: Only ${allVenues.length} real venues were found from multiple sources in this location. Real venue data is limited for this area. You may recommend venues based on typical venue types for this event type and location.`;
  }

  let retryCount = 0;
  const maxRetries = 2;

  while (retryCount <= maxRetries) {
    try {
      const model = genAI.getGenerativeModel({
        model: "gemini-3-flash-preview",
        generationConfig,
        systemInstruction: enhancedSystemInstruction,
      });

      const chat = model.startChat({
        history: [],
      });

      const result = await chat.sendMessage(inputText);
      const responseText = result.response.text();

      console.log("Raw Gemini response length:", responseText.length);
      console.log("First 300 chars:", responseText.substring(0, 300));

      // Try to parse JSON response
      let parsedResponse;
      let cleanedText = responseText;

      // Try to extract JSON from markdown code blocks
      if (cleanedText.includes("```json")) {
        cleanedText = cleanedText
          .replace(/```json\n?/g, "")
          .replace(/```\n?/g, "")
          .trim();
      } else if (cleanedText.includes("```")) {
        cleanedText = cleanedText.replace(/```\n?/g, "").trim();
      }

      try {
        parsedResponse = JSON.parse(cleanedText);
      } catch (parseError) {
        console.error("Failed to parse JSON response:", parseError.message);
        console.error(
          "Attempted to parse text (first 300 chars):",
          cleanedText.substring(0, 300),
        );
        if (retryCount < maxRetries) {
          retryCount++;
          console.log(
            `Retry attempt ${retryCount}/${maxRetries} due to JSON parse error`,
          );
          continue;
        }
        return res
          .status(500)
          .json({ error: "Failed to parse AI response format." });
      }

      // Validate and complete the venue data
      const validatedData = validateVenueResponse(parsedResponse);
      if (!validatedData) {
        if (retryCount < maxRetries) {
          retryCount++;
          console.log(
            `Retry attempt ${retryCount}/${maxRetries} due to validation error`,
          );
          continue;
        }
        return res
          .status(500)
          .json({ error: "Invalid AI response structure." });
      }

      // Convert validated JSON to text format for frontend compatibility
      const textResponse = convertJsonVenuesToText(validatedData);
      res.json({ response: textResponse });
      return;
    } catch (error) {
      const geminiError = getGeminiErrorDetails(error);
      console.error("Error calling Gemini API:", geminiError, error);
      if (retryCount < maxRetries) {
        retryCount++;
        await delay(600 * retryCount);
        console.log(
          `Retry attempt ${retryCount}/${maxRetries} due to API error`,
        );
        continue;
      }
      return res
        .status(500)
        .json({ error: "Failed to communicate with the AI model." });
    }
  }
});

// Get user's current search count
app.get("/api/searches/count/:userId", async (req, res) => {
  const { userId } = req.params;

  if (!userId) {
    return res.status(400).json({ error: "userId is required" });
  }

  const limitsEnabled = process.env.SEARCH_LIMIT_ENABLED === "true";

  // If limits are disabled, return 0 searches and limitsEnabled flag
  if (!limitsEnabled) {
    console.log(
      "DEBUG: Limits disabled, returning searchCount: 0, limitsEnabled: false",
    );
    return res.json({ searchCount: 0, limitsEnabled: false });
  }

  const result = await getUserSearchCount(userId);

  if (result.error) {
    return res.status(500).json({ error: result.error });
  }

  res.json({ searchCount: result.searchCount, limitsEnabled: true });
});

// Add email to waitlist
app.post("/api/waitlist", async (req, res) => {
  const { email } = req.body;

  if (!email || !email.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)) {
    return res.status(400).json({ error: "Valid email is required" });
  }

  const result = await addToWaitlist(email);

  if (!result.success) {
    return res.status(400).json({ error: result.message });
  }

  res.json({ message: result.message });
});

app.listen(port, () => {
  console.log(`Backend server listening on port ${port}`);
});

// Handle uncaught errors
process.on("uncaughtException", (error) => {
  console.error("Uncaught Exception:", error);
});

process.on("unhandledRejection", (reason, promise) => {
  console.error("Unhandled Rejection at:", promise, "reason:", reason);
});
