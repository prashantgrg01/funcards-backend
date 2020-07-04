// Import required modules
const jwt = require("jsonwebtoken");
const User = require("../models/user.model");

// Generate JWT Access Token
module.exports.generateAccessToken = (user) => {
  const accessToken = jwt.sign(user, process.env.ACCESS_TOKEN_SECRET, { expiresIn: "5m" });
  return accessToken;
}

// Generate Refresh Token
module.exports.generateRefreshToken = (user) => {
  const refreshToken = jwt.sign(user, process.env.REFRESH_TOKEN_SECRET);
  return refreshToken;
}

// Middleware to authenticate the current user by validating the JWT token on the Authorization header
module.exports.authenticateUser = (req, res, next) => {
  // Retrieve the authorization token from the header
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];
  // If there is no token on the authorization header, return 401 Unauthorized Error
  if (!token) return res.sendStatus(401);
  // If there is a token, verify the token
  jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, { ignoreExpiration: true }, async (err, user) => {
    // If there is an error when verifying the token, return 403 Forbidden Error
    if (err) return res.sendStatus(403);
    // Find the user corresponding to the user id encrypted in the token
    const currentUser = await User.findById(user.id);
    // If no user exists, return 404 Resource Not Found Error
    if (!currentUser) return res.sendStatus(404);
    // Check if the token is currently active for the current user, if not return 403 Forbidden Error
    if (!containsToken(token, currentUser.tokens)) return res.sendStatus(403);
    // If there is a user, pass it onto the request object
    req.user = currentUser;
    next();
  });
};

// Function to check if a token exists in an array of provided tokens
function containsToken(token, tokens) {
  let tokenExists = false;
  for (let i=0; i<tokens.length; i++) {
    if (tokens[i].token == token) {
      tokenExists = true;
    }
  }
  return tokenExists;
}
