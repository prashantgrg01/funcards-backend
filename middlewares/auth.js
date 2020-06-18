// If its not production environment, load our .env file for configuration
if (process.env.NODE_ENV !== "production") {
  require("dotenv").config();
}

// Import JSON web token module
const jwt = require("jsonwebtoken");

// Generate JWT Access Token
module.exports.generateAccessToken = (user) => {
  const accessToken = jwt.sign(user, process.env.ACCESS_TOKEN_SECRET, { expiresIn: "2m" });
  return accessToken;
}

// Generate Refresh Token
module.exports.generateRefreshToken = (user) => {
  const refreshToken = jwt.sign(user, process.env.REFRESH_TOKEN_SECRET);
  return refreshToken;
}

// Function to verify JWT access token
module.exports.authenticateToken = (req, res, next) => {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];
  if (token == null) return res.sendStatus(401);

  jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, user) => {
    if (err) return res.sendStatus(403);
    req.user = user;
    next();
  });
}
