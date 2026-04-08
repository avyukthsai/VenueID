const express = require("express");
const crypto = require("crypto");
const supabase = require("./supabase");

const router = express.Router();

// POST /api/shares - Create a shareable link
router.post("/", async (req, res) => {
  const { searchParams, results } = req.body;

  // Validate required fields
  if (!searchParams || !results) {
    return res.status(400).json({
      error: "Missing required fields: searchParams and results",
    });
  }

  try {
    // Generate a unique token
    const token = crypto.randomBytes(12).toString("hex");

    // Save to shared_searches table
    const { data, error } = await supabase
      .from("shared_searches")
      .insert([
        {
          token: token,
          search_params: searchParams,
          results: results,
        },
      ])
      .select();

    if (error) {
      return res.status(500).json({ error: "Failed to create share link" });
    }

    // Return the full share URL
    const shareUrl = `${process.env.FRONTEND_URL || "http://localhost:5173"}/share/${token}`;

    res.status(201).json({
      message: "Share link created successfully",
      token: token,
      shareUrl: shareUrl,
    });
  } catch {
    res.status(500).json({ error: "Failed to create share link" });
  }
});

// GET /api/shares/:token - Retrieve shared search by token
router.get("/:token", async (req, res) => {
  const { token } = req.params;

  if (!token) {
    return res.status(400).json({ error: "Token parameter is required" });
  }

  try {
    const { data, error } = await supabase
      .from("shared_searches")
      .select("*")
      .eq("token", token)
      .single();

    if (error || !data) {
      return res.status(404).json({ error: "Share link not found" });
    }

    // Check if the share link has expired
    const expiresAt = new Date(data.expires_at);
    if (expiresAt < new Date()) {
      return res.status(404).json({ error: "Share link has expired" });
    }

    res.json({
      message: "Share retrieved successfully",
      searchParams: data.search_params,
      results: data.results,
    });
  } catch {
    res.status(500).json({ error: "Failed to retrieve share" });
  }
});

module.exports = router;
