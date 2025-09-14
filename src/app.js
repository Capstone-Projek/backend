const express = require("express");
const cors = require("cors");
const morgan = require("morgan");

const app = express();

app.use(cors());
app.use(morgan("dev"));
app.use(express.json());

const authRoutes = require("./routes/auth.routes");
const foodRoutes = require("./routes/food.routes");
const foodPlaceRoutes = require("./routes/foodPlace.routes");

app.use(express.urlencoded({ extended: true }));

app.use("/api", authRoutes);
app.use("/api", foodRoutes);
app.use("/api", foodPlaceRoutes);

app.use((req, res) => {
  res.status(404).json({ message: "Route not found" });
});

module.exports = app;
