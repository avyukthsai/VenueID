const dotenv = require("dotenv");
dotenv.config();

const express = require("express");
const { GoogleGenerativeAI } = require("@google/generative-ai");
const cors = require("cors");
const rateLimit = require("express-rate-limit");
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
} = require("./services/foursquare");

// Fail fast if required env vars are missing
const REQUIRED_ENV = ["GEMINI_API_KEY", "SUPABASE_URL", "SUPABASE_SERVICE_KEY", "FRONTEND_URL"];
for (const key of REQUIRED_ENV) {
  if (!process.env[key]) {
    console.error(`Missing required environment variable: ${key}`);
    process.exit(1);
  }
}

const app = express();
const port = 3001;

// Rate limiters
const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Too many requests. Please try again later." },
});

const venueLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Too many requests. Please try again in 15 minutes." },
});

app.use(globalLimiter);
app.use(cors({ origin: process.env.FRONTEND_URL }));
app.use(express.json({ limit: "50kb" }));

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

const generationConfig = {
  temperature: 1,
  top_p: 0.95,
  top_k: 40,
  max_output_tokens: 8192,
  response_mime_type: "application/json",
};

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

app.get("/test", (req, res) => {
  res.json({ message: "Server is working", timestamp: new Date() });
});

// ─── Constants ──────────────────────────────────────────────────────────────
const MAX_SEARCH_LIMIT = 5;
const MAX_VENUES_TO_RANK = 15;
const MAX_RETRIES = 2;
const GEMINI_TIMEOUT_MS = 30000;

const VALID_VENUE_TYPES = ["Artist Venue", "Party Venue", "Wedding Venue", "Sports Tournament", "Theater Show"];
const VALID_VENUE_SETTINGS = ["Indoor", "Outdoor", "Both"];
const VALID_AUDIENCE_TYPES = ["General / All Ages", "21+", "Corporate / Professional", "Family Friendly"];

// ─── Helpers ────────────────────────────────────────────────────────────────

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
    const value = venue[key];
    completed[key] =
      value && typeof value === "string" && value.trim() !== ""
        ? value.trim()
        : fallbacks[key];
  }
  return completed;
}

function validateVenueResponse(responseData) {
  try {
    if (!responseData || !Array.isArray(responseData.venues)) return null;

    const validatedVenues = responseData.venues
      .slice(0, 3)
      .map((venue) => validateAndCompleteVenue(venue));

    return validatedVenues.length === 0 ? null : { venues: validatedVenues };
  } catch {
    return null;
  }
}

function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function calculateMatchScore(venue, venueType, audienceInput, index) {
  let score = 0;

  const audienceSize = parseInt(audienceInput) || 100;
  const capacityStr = venue.capacity.toLowerCase();
  const capacityMatch = capacityStr.match(/\d+/);
  const capacityNum = capacityMatch ? parseInt(capacityMatch[0]) : 500;

  const capacityRatio =
    Math.min(capacityNum, audienceSize) / Math.max(capacityNum, audienceSize);
  score += capacityRatio * 40;

  const venueText =
    `${venue.name} ${venue.whyThisVenue} ${venue.features}`.toLowerCase();
  const typeKeywords = {
    "artist venue": ["artist", "live", "music", "performance", "stage", "sound"],
    "party venue": ["bar", "club", "lounge", "nightlife", "dance", "event space"],
    "wedding venue": ["wedding", "banquet", "reception", "ballroom", "elegant"],
    "sports tournament": ["sports", "arena", "field", "stadium", "game"],
    "theater show": ["theater", "auditorium", "stage", "seating", "performance"],
  };

  const keywords = typeKeywords[venueType.toLowerCase()] || [];
  const keywordMatches = keywords.filter((kw) => venueText.includes(kw)).length;
  score += (keywordMatches / Math.max(keywords.length, 1)) * 30;

  const locationText = venue.location.toLowerCase();
  const accessibilityKeywords = [
    "downtown", "central", "convenient", "accessible",
    "public transit", "highway", "major road",
  ];
  const accessibilityMatches = accessibilityKeywords.filter((kw) =>
    locationText.includes(kw),
  ).length;
  score += (accessibilityMatches / accessibilityKeywords.length) * 15;

  const featuresText = venue.features.toLowerCase();
  const commonFeatures = [
    "parking", "food", "catering", "wifi", "sound", "lights", "seating", "accessibility",
  ];
  const featureMatches = commonFeatures.filter((f) =>
    featuresText.includes(f),
  ).length;
  score += (featureMatches / commonFeatures.length) * 15;

  // Map base score to position-based range: 1st=85-97, 2nd=70-84, 3rd=55-69
  const ranges = [
    [85, 97],
    [70, 84],
    [55, 69],
  ];
  const [min, max] = ranges[Math.min(index, 2)];
  return Math.round(min + (score / 100) * (max - min));
}

async function checkAndIncrementSearchCount(userId) {
  try {
    const { data: existingUser, error: fetchError } = await supabase
      .from("user_search_counts")
      .select("search_count")
      .eq("user_id", userId)
      .single();

    if (fetchError && fetchError.code !== "PGRST116") {
      return { error: "Failed to check search limit", code: "DB_ERROR" };
    }

    let currentCount = 0;
    if (existingUser) {
      currentCount = existingUser.search_count;
    } else {
      const { error: insertError } = await supabase
        .from("user_search_counts")
        .insert([{ user_id: userId, search_count: 0 }]);

      if (insertError) {
        return { error: "Failed to initialize search count", code: "DB_ERROR" };
      }
    }

    if (currentCount >= MAX_SEARCH_LIMIT) {
      return { limitReached: true, currentCount };
    }

    const { error: updateError } = await supabase
      .from("user_search_counts")
      .update({ search_count: currentCount + 1 })
      .eq("user_id", userId);

    if (updateError) {
      return { error: "Failed to update search count", code: "DB_ERROR" };
    }

    return { limitReached: false, newCount: currentCount + 1 };
  } catch {
    return { error: "Unexpected error", code: "UNKNOWN_ERROR" };
  }
}

async function getUserSearchCount(userId) {
  try {
    const { data, error } = await supabase
      .from("user_search_counts")
      .select("search_count")
      .eq("user_id", userId)
      .single();

    if (error && error.code !== "PGRST116") {
      return { error: "Failed to fetch search count" };
    }

    return { searchCount: data?.search_count || 0 };
  } catch {
    return { error: "Failed to fetch search count" };
  }
}

async function addToWaitlist(email) {
  try {
    const { error } = await supabase.from("waitlist").insert([{ email }]).select();

    if (error) {
      if (error.code === "23505") {
        return { success: false, message: "Email already on waitlist" };
      }
      return { success: false, message: "Failed to add email to waitlist" };
    }

    return { success: true, message: "Email added to waitlist" };
  } catch {
    return { success: false, message: "Failed to add email to waitlist" };
  }
}

/**
 * Core logic shared by both venue endpoints:
 * fetches real venue data, builds the prompt, calls Gemini with retries,
 * and returns validated venue data.
 *
 * Returns { validatedData } on success or { error, statusCode } on failure.
 */
async function generateVenueRecommendations({
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
}) {
  // Fetch real venue data from both APIs in parallel
  let allVenues = [];
  let venueContext = "";
  try {
    const [ticketmasterVenues, foursquareVenues] = await Promise.all([
      getVenuesByLocation(city, state, venueType),
      getVenuesByCategory(city, state, venueType),
    ]);

    allVenues = mergeAndDeduplicateVenues(ticketmasterVenues, foursquareVenues);

    if (allVenues.length >= 5) {
      venueContext = formatTicketmasterVenues(allVenues.slice(0, MAX_VENUES_TO_RANK));
      venueContext = venueContext.replace(
        "REAL VENUES AVAILABLE IN THE AREA",
        "REAL VENUES FROM MULTIPLE VERIFIED SOURCES",
      );
    }
  } catch {
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

  if (venueContext) {
    inputText += venueContext;
    enhancedSystemInstruction =
      systemInstruction +
      `\n\nIMPORTANT - REAL VENUE DATA PROVIDED:\nReal venue data from multiple verified sources has been provided above. You MUST choose the 3 best venues from the provided list. Only recommend venues from the provided list. Do NOT make up or imagine venues that are not in the list. Explain why each of the 3 venues from the list is ideal for this event.`;
  } else if (allVenues.length > 0 && allVenues.length < 5) {
    inputText += `\nNote: Only ${allVenues.length} real venues were found from multiple sources in this location. Real venue data is limited for this area. You may recommend venues based on typical venue types for this event type and location.`;
  }

  let retryCount = 0;

  while (retryCount <= MAX_RETRIES) {
    try {
      const model = genAI.getGenerativeModel({
        model: "gemini-3-flash-preview",
        generationConfig,
        systemInstruction: enhancedSystemInstruction,
      });

      const result = await Promise.race([
        model.startChat({ history: [] }).sendMessage(inputText),
        new Promise((_, reject) =>
          setTimeout(() => reject(new Error("Gemini request timed out")), GEMINI_TIMEOUT_MS)
        ),
      ]);
      const responseText = result.response.text();

      // Strip markdown code fences if present
      let cleanedText = responseText;
      if (cleanedText.includes("```json")) {
        cleanedText = cleanedText.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
      } else if (cleanedText.includes("```")) {
        cleanedText = cleanedText.replace(/```\n?/g, "").trim();
      }

      let parsedResponse;
      try {
        parsedResponse = JSON.parse(cleanedText);
      } catch {
        if (retryCount < MAX_RETRIES) {
          retryCount++;
          continue;
        }
        return { error: "Failed to parse AI response format.", statusCode: 500 };
      }

      const validatedData = validateVenueResponse(parsedResponse);
      if (!validatedData) {
        if (retryCount < MAX_RETRIES) {
          retryCount++;
          continue;
        }
        return { error: "Invalid AI response structure.", statusCode: 500 };
      }

      return { validatedData, responseText };
    } catch {
      if (retryCount < MAX_RETRIES) {
        retryCount++;
        await delay(600 * retryCount);
        continue;
      }
      return {
        error: "Failed to communicate with the AI model.",
        statusCode: 500,
      };
    }
  }
}

// ─── Routes ─────────────────────────────────────────────────────────────────

// Primary endpoint: returns structured JSON venues with match scores
app.post("/api/venues/stream", venueLimiter, async (req, res) => {
  const {
    venueType, country, state, city, date, time,
    audienceInput, venueSetting, audienceType,
    additionalRequirements, userId,
  } = req.body;

  const missingFields = [];
  if (!venueType) missingFields.push("venueType");
  if (!country) missingFields.push("country");
  if (!city) missingFields.push("city");
  if (!date) missingFields.push("date");
  if (!time) missingFields.push("time");
  if (!audienceInput) missingFields.push("audienceInput");
  if (!userId) missingFields.push("userId");

  if (missingFields.length > 0) {
    return res.status(400).json({ error: "All input fields are required.", missingFields });
  }

  // Type validation
  const requiredStrings = { venueType, country, city, date, time, audienceInput, userId };
  for (const [field, val] of Object.entries(requiredStrings)) {
    if (typeof val !== "string") {
      return res.status(400).json({ error: `Invalid type for field: ${field}` });
    }
  }
  if (additionalRequirements !== undefined && typeof additionalRequirements !== "string") {
    return res.status(400).json({ error: "Invalid type for field: additionalRequirements" });
  }

  // Length validation
  if (venueType.length > 100 || country.length > 100 || city.length > 100 ||
      date.length > 20 || time.length > 20 || audienceInput.length > 50) {
    return res.status(400).json({ error: "Input field exceeds maximum length." });
  }
  if (additionalRequirements && additionalRequirements.length > 500) {
    return res.status(400).json({ error: "Additional requirements must be 500 characters or fewer." });
  }

  // Enum validation
  if (!VALID_VENUE_TYPES.includes(venueType)) {
    return res.status(400).json({ error: "Invalid venue type." });
  }
  if (venueSetting && !VALID_VENUE_SETTINGS.includes(venueSetting)) {
    return res.status(400).json({ error: "Invalid venue setting." });
  }
  if (audienceType && !VALID_AUDIENCE_TYPES.includes(audienceType)) {
    return res.status(400).json({ error: "Invalid audience type." });
  }

  // Date format validation (YYYY-MM-DD)
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    return res.status(400).json({ error: "Invalid date format. Use YYYY-MM-DD." });
  }

  // Check search limit (when enabled)
  if (process.env.SEARCH_LIMIT_ENABLED === "true") {
    const limitCheck = await checkAndIncrementSearchCount(userId);
    if (limitCheck.error) {
      return res.status(500).json({ error: limitCheck.error });
    }
    if (limitCheck.limitReached) {
      return res.status(429).json({
        error: "Search limit reached",
        message: "You've used all 5 free searches. Upgrade coming soon.",
      });
    }
  }

  const result = await generateVenueRecommendations({
    venueType, country, state, city, date, time,
    audienceInput, venueSetting, audienceType, additionalRequirements,
  });

  if (result.error) {
    return res.status(result.statusCode || 500).json({ error: result.error });
  }

  // Attach match scores
  result.validatedData.venues.forEach((venue, index) => {
    venue.matchScore = calculateMatchScore(venue, venueType, audienceInput, index);
  });

  return res.json({
    response: result.responseText,
    venues: result.validatedData.venues,
    success: true,
  });
});

// Get user's current search count
app.get("/api/searches/count/:userId", async (req, res) => {
  const { userId } = req.params;

  if (!userId) {
    return res.status(400).json({ error: "userId is required" });
  }

  const limitsEnabled = process.env.SEARCH_LIMIT_ENABLED === "true";

  if (!limitsEnabled) {
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
  console.log(`Backend server running on port ${port}`);
});

process.on("uncaughtException", (error) => {
  console.error("Uncaught Exception:", error);
});

process.on("unhandledRejection", (reason, promise) => {
  console.error("Unhandled Rejection at:", promise, "reason:", reason);
});
