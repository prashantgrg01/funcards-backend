// If its not production environment, load our .env file for configuration
if (process.env.NODE_ENV !== "production") {
  require("dotenv").config();
}

// Import required modules
const express = require("express");
const mongoose = require("mongoose");

// Import our routes
const cardRouter = require("./routes/card.route");
const userRouter = require("./routes/user.route");

// Initialize express app
const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
// Configure our Headers
app.use((req, res, next) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, PATCH, DELETE");
  res.setHeader("Access-Control-Allow-Headers", "Origin, Content-Type, Authorization");
  next();
});

// Connect to MongoDB Database using Mongoose
mongoose.connect(process.env.DATABASE_URI, {useNewUrlParser: true, useUnifiedTopology: true});
const db = mongoose.connection;
db.on("error", error => console.error(error) );
db.once("open", () => console.log("Connected to MongoDB Database."));

// Utilise middlewares for our routes
app.use("/api/cards", cardRouter);
app.use("/api/users", userRouter);

PORT = process.env.PORT || 5000;
app.listen(PORT, (err) => {
  if (err) {
    console.log("There was an error starting the server!");
  }
  console.log("Server started on port: " + PORT);
});