const express = require("express");
const supabase = require("./supabase");

const router = express.Router();

// POST /api/searches - Save a new search
router.post("/", async (req, res) => {
  const { userId, searchParams, results } = req.body;

  // Validate required fields
  if (!userId || !searchParams || !results) {
    return res.status(400).json({
      error: "Missing required fields: userId, searchParams, and results",
    });
  }

  try {
    const { data, error } = await supabase
      .from("saved_searches")
      .insert([
        {
          user_id: userId,
          search_params: searchParams,
          results: results,
        },
      ])
      .select();

    if (error) {
      return res.status(500).json({ error: "Failed to save search" });
    }

    res.status(201).json({
      message: "Search saved successfully",
      data: data,
    });
  } catch {
    res.status(500).json({ error: "Failed to save search" });
  }
});

// GET /api/searches/:userId - Get all searches for a user
router.get("/:userId", async (req, res) => {
  const { userId } = req.params;

  if (!userId) {
    return res.status(400).json({ error: "userId parameter is required" });
  }

  try {
    const { data, error } = await supabase
      .from("saved_searches")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false });

    if (error) {
      return res.status(500).json({ error: "Failed to retrieve searches" });
    }

    res.json({
      message: "Searches retrieved successfully",
      data: data,
    });
  } catch {
    res.status(500).json({ error: "Failed to retrieve searches" });
  }
});

// DELETE /api/searches/:id - Delete a search
router.delete("/:id", async (req, res) => {
  const { id } = req.params;
  const { userId } = req.body;

  if (!id) {
    return res.status(400).json({ error: "Search ID is required" });
  }

  if (!userId) {
    return res.status(400).json({ error: "userId is required" });
  }

  try {
    // First verify that the search belongs to the user
    const { data: searchData, error: fetchError } = await supabase
      .from("saved_searches")
      .select("user_id")
      .eq("id", id)
      .single();

    if (fetchError || !searchData) {
      return res.status(404).json({ error: "Search not found" });
    }

    // Verify the user owns this search
    if (searchData.user_id !== userId) {
      return res.status(403).json({ error: "Unauthorized" });
    }

    // Delete the search
    const { error: deleteError } = await supabase
      .from("saved_searches")
      .delete()
      .eq("id", id);

    if (deleteError) {
      return res.status(500).json({ error: "Failed to delete search" });
    }

    res.json({ message: "Search deleted successfully" });
  } catch {
    res.status(500).json({ error: "Failed to delete search" });
  }
});

module.exports = router;
