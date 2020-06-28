// If its not production environment, load our .env file for configuration
if (process.env.NODE_ENV !== "production") {
  require("dotenv").config();
}

const express = require("express");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const User = require("../models/user.model");
const RefreshToken = require("../models/refreshToken.model");
const { generateAccessToken, authenticateToken, generateRefreshToken } = require("../middlewares/auth");

const router = express.Router({ mergeParams: true });

// Handle New User Sign Up
router.post("/signup", async (req, res) => {
  // Get all the values from the form fields
  const first_name = req.body.first_name;
  const last_name = req.body.last_name;
  const email = req.body.email;
  const password = req.body.password;

  // Validate the required form fields
  if (first_name == null || last_name == null || email == null || password == null) {
    return res.status(400).json({ error: "One or more fields are empty!" });
  }

  try {
    // Check if the email already exists in our database
    const emailExists = await User.findOne({ "email": email });
    if (emailExists) return res.status(400).json({ error: "Email already exists!" });

    // Hash the password
    const passwordHash = await bcrypt.hash(password, 10);

    // Create a new user
    const newUser = User({
      first_name: first_name,
      last_name: last_name,
      email: email,
      password: passwordHash
    });
    // Save the user to the database
    await newUser.save();

    // Generate JWT access token for the user for a successful signup
    const accessToken = generateAccessToken({ email: newUser.email });
    res.status(201).json({ accessToken: accessToken });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Handle User Login
router.post("/login", async (req, res) => {
  // Get all the values from the form fields
  const email = req.body.email;
  const password = req.body.password;

  // Validate the required form fields
  if (email == null || password == null) {
    return res.status(400).json({error: "One or more fields are empty!"});
  }

  try {
    // Check if the user exists in our database
    const user = await User.findOne({ "email": email });
    if (!user) {
      return res.status(404).json({ error: "User not found!" });
    }
    // If the user exists, verify their password
    const passwordsMatch = await bcrypt.compare(password, user.password);
    if (!passwordsMatch) {
      return res.status(400).json({ error: "Incorrect password!" });
    }

    // Generate JWT access token for the user for a successful login
    const accessToken = generateAccessToken({ email: user.email });
    const refreshToken = generateRefreshToken({ email: user.email });
    // Create new refresh token entry
    const newRefreshToken = RefreshToken({
      token: refreshToken
    });
    await newRefreshToken.save();

    res.status(200).json({ accessToken: accessToken, refreshToken: newRefreshToken.token });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Handle Token Re-generation
router.post("/token", async (req, res) => {
  const refreshToken = req.body.token;
  if (!refreshToken) return res.sendStatus(401);
  try {
    // Check if the refresh token exists in our database
    const tokenObj = await RefreshToken.findOne({ "token": refreshToken });
    if (!tokenObj) return res.sendStatus(401);
    // If it exists, verify the refresh token
    jwt.verify(tokenObj.token, process.env.REFRESH_TOKEN_SECRET, (err, user) => {
      if (err) return res.sendStatus(403);
      // Generate new access token for the user
      const newAccessToken = generateAccessToken({ email: user.email });
      res.status(200).json({ accessToken: newAccessToken });
    });

  } catch(err) {
    res.status(400).json({ error: err.message });
  } 
});

// Handle Request for currently Logged-In User
router.get("/me", authenticateToken, (req, res) => {
  res.status(200).json(req.user);
});

// Handle User Log Out
router.post("/logout", authenticateToken, async (req, res) => {
  /*
  const refreshToken = req.body.token;
  if (!refreshToken) return res.sendStatus(401);
  try {
    // Check if the refresh token exists in our database
    const tokenObj = await RefreshToken.findOne({ "token": refreshToken });
    if (!tokenObj) return res.sendStatus(403);
    // If it exists, remove refresh token entry from the database for successful log out
    await tokenObj.remove();
    res.status(200).json({ success: true });
  } catch(err) {
    res.status(500).json({ error: err.message });
  }
  */
  res.status(200).json({ success: true });
});

// Get User Dashboard
router.get("/dashboard", authenticateToken, async (req, res) => {
  try {
    const user = await User.findOne({ "email": req.user.email });
    res.status(200).json({ email: user.email, username: user.username });
  } catch(err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;