const dotenv = require("dotenv");

dotenv.config(); // Load environment variables from .env file FIRST

const express = require("express");
const { GoogleGenerativeAI } = require("@google/generative-ai");
const cors = require("cors");
const searchesRouter = require("./searches");
const sharesRouter = require("./shares");

const app = express();
const port = 3001; // port for your backend

// Middleware
app.use(cors()); // Enable CORS for cross-origin requests from React app
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
artist venues, party venues, wedding venues, sports tournament,
esports tournament, theater show, product expo, political rally,
and hackathon. You will be given the country, state, and city.
If the selected venue type is an artist venue, then you will receive
the artist's monthly Spotify listener count instead of the expected audience. Based
on the monthly listener count, estimate the expected audience amount. Specify that you
estimated the expected audience amount based on the listener count. Otherwise, you will
receive the expected audience amount. Also describe how this expected audience value was predicted
based on the Spotify monthly listeners.

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
      "whyThisVenue": "Detailed explanation (3+ sentences) of why this venue is the best choice for the specified event type, audience, and venue setting.",
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
        `**Url To Website:** ${venue.website}\n` +
        `**Time & Date:** ${venue.dateTime}`
      );
    })
    .join("\n-----\n");
}

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

  if (!venueType || !country || !city || !date || !time || !audienceInput) {
    return res.status(400).json({ error: "All input fields are required." });
  }

  const inputText =
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

  let retryCount = 0;
  const maxRetries = 1;

  while (retryCount <= maxRetries) {
    try {
      const model = genAI.getGenerativeModel({
        model: "gemini-3-flash-preview",
        generationConfig,
        systemInstruction: systemInstruction,
      });

      const chat = model.startChat({
        history: [],
      });

      const result = await chat.sendMessage(inputText);
      const responseText = result.response.text();

      // Try to parse JSON response
      let parsedResponse;
      try {
        parsedResponse = JSON.parse(responseText);
      } catch (parseError) {
        console.error("Failed to parse JSON response:", parseError);
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
      console.error("Error calling Gemini API:", error);
      if (retryCount < maxRetries) {
        retryCount++;
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

app.listen(port, () => {
  console.log(`Backend server listening at http://localhost:${port}`);
});
