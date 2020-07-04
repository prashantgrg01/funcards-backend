const express = require("express");
const Card = require("../models/card.model");
const { authenticateUser } = require("../middlewares/auth");

const router = express.Router({ mergeParams: true });

// Middleware - Retrieve a card from the database if it exists
const getCard = async (req, res, next) => {
  let card;
  try {
    card = await Card.findById(req.params.id);
    if (!card) {
      return res.status(404).json({ error: "Resource not found!" });
    }
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
  res.card = card;
  next();
}

// Get all cards
router.get("/", async (req, res) => {
  let cards;
  try {
    // Fetch all cards from the database in descending order based on their creation date
    cards = await Card.find().sort({ "createdAt": "desc" });
    res.status(200).json(cards);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get a single card
router.get("/:id", authenticateUser, getCard, (req, res) => {
  res.status(200).json(res.card);
});

// Create a new card
router.post("/", authenticateUser, async (req, res) => {
  const newCard = new Card({
    title: req.body.title,
    function_name: req.body.function_name,
    description: req.body.description,
    parameters: req.body.parameters,
    example_code: req.body.example_code
  });
  try {
    await newCard.save();
    res.status(201).json(newCard);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Update a card
router.patch("/:id", authenticateUser, getCard, async (req, res) => {
  // Get the card passed by middleware
  let card = res.card;

  // Update all the user sent fields only when their values are different from the existing values
  if (req.body.title != null && req.body.title != card.title) {
    card.title = req.body.title;
  }
  if (req.body.function_name != null && req.body.function_name != card.function_name) {
    card.function_name = req.body.function_name;
  }
  if (req.body.description != null && req.body.description != card.description) {
    card.description = req.body.description;
  }
  if (req.body.parameters != null && req.body.parameters != card.parameters.join(",")) {
    card.parameters = req.body.parameters;
  }
  if (req.body.example_code != null && req.body.example_code != card.example_code) {
    card.example_code = req.body.example_code;
  }

  try {
    // try to save the updated card
    await card.save();
    res.status(200).json(card);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Delete a card
router.delete("/:id", authenticateUser, getCard, async (req, res) => {
  try {
    await res.card.remove();
    res.status(200).json({ message: "Resource deleted successfully!" });
  } catch (err) {
    res.status(500).json({ err: err.message });
  }
});

module.exports = router;