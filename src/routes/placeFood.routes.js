const express = require("express");
const router = express.Router();
const multer = require("multer");

const upload = multer();
const foodPlaceController = require("../controllers/foodPlace.controller");
const verifyToken = require("../middlewares/verifyToken");

// PUT (multiple images)
router.put(
  "/edit-food-place/:id",
  verifyToken,
  upload.fields([{ name: "images", maxCount: 50 }]),
  foodPlaceController.updateFoodPlace
);

module.exports = router;
