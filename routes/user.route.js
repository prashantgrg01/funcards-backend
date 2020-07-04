const express = require("express");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const User = require("../models/user.model");
const RefreshToken = require("../models/refreshToken.model");
const { generateAccessToken, authenticateUser } = require("../middlewares/auth");

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

    // Generate JWT access token for the user for a successful signup
    const accessToken = generateAccessToken({ id: newUser._id.toString() });
    newUser.tokens.push({ token: accessToken });
    
    // Save the new user to the database
    await newUser.save();

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

    // Generate JWT access token for the user for a successful login and save it to the database
    const accessToken = generateAccessToken({ id: user._id.toString() });
    user.tokens.push({ token: accessToken });
    await user.save();

    res.status(200).json({ accessToken: accessToken });
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
      const newAccessToken = generateAccessToken(user);
      res.status(200).json({ accessToken: newAccessToken });
    });

  } catch(err) {
    res.status(400).json({ error: err.message });
  } 
});

// Handle Request for currently Logged-In User
router.get("/me", authenticateUser, async (req, res) => {
  try {
    const currentUser = req.user;
    res.status(200).json({ email: currentUser.email, first_name: currentUser.first_name, last_name: currentUser.last_name });
  } catch(err) {
    res.status(500).json({ error: err.message });
  }
});

// Handle User Log Out
router.post("/logout", authenticateUser, async (req, res) => {
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
  try {
    const currentUser = req.user;
    // Reset the tokens for current user
    currentUser.tokens = [];
    await currentUser.save();
    res.status(200).json({ success: true });
  } catch(err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;