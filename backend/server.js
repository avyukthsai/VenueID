const express = require("express");
const { GoogleGenerativeAI } = require("@google/generative-ai");
const dotenv = require("dotenv");
const cors = require("cors");

dotenv.config(); // Load environment variables from .env file

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
  response_mime_type: "text/plain",
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
You will be given the time of the
event in Eastern Standard Time. Based on this information, locate the best 3 specific venues that
would accommodate the specified event type with
the expected audience amount. Make sure you consider the hours of operation and holidays. If the location is
unavailable, please provide an explanation why under an additional 'Note:' heading in the provided format.

Provide each of the venues in the following format **exactly with each heading bolded**, and give a short description of the venue:
**Venue:** [Venue Name]
**Why this venue?** [Reason for selection, should be 3 sentences long.]
**Address:** [Venue Address]
**Capacity:** [Capacity]
**Location:** [Location details]
**Features:** [Key features]
**Url To Website:** [URL]
**Time & Date:** [Time & Date]

**Crucial Instructions:**
1. **START IMMEDIATELY with the first "Venue:" heading.**
2. **DO NOT include any introductory phrases, greetings, or conversational fillers like "Okay, here are...", "Certainly!",
 "Here are some options:", or similar text before the first venue or after the last venue.**
3. **Separate each complete venue suggestion with a clear, prominent separator line consisting of exactly 
five hyphens on its own line, like this:**
   **-----**
4. **DO NOT add any numbering (e.g., "1.", "2.", "3.") to the venues.**
5. **Ensure strict adherence to the specified format for each venue.**
`;

app.post("/generate-venue", async (req, res) => {
  const { venueType, country, state, city, date, time, audienceInput } =
    req.body;

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
    `Expected Audience OR Spotify Monthly Listeners: ${audienceInput};`;

  try {
    const model = genAI.getGenerativeModel({
      model: "gemini-2.0-flash",
      generationConfig,
      systemInstruction: systemInstruction,
    });

    const chat = model.startChat({
      history: [],
    });

    const result = await chat.sendMessage(inputText);
    const responseText = result.response.text();
    res.json({ response: responseText });
  } catch (error) {
    console.error("Error calling Gemini API:", error);
    res.status(500).json({ error: "Failed to communicate with the AI model." });
  }
});

app.listen(port, () => {
  console.log(`Backend server listening at http://localhost:${port}`);
});
