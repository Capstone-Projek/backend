const express = require("express");
const router = express.Router();
const foodPlaceController = require("../controllers/foodPlace.controller");

// GET all food_places (include images)
router.get("/", foodPlaceController.getAllFoodPlaces);

// GET food_places by name (include images) → /api/food_places/search?name=Bakso
router.get("/search", foodPlaceController.getFoodPlacesByName);

// GET food_place by id (include images)
router.get("/:id", foodPlaceController.getFoodPlaceById);

// POST create new food_place + images
router.post("/", foodPlaceController.createFoodPlace);

// PUT update food_place + images
router.put("/:id", foodPlaceController.updateFoodPlace);

// DELETE food_place (images ikut kehapus karena FK cascade)
router.delete("/:id", foodPlaceController.deleteFoodPlace);

module.exports = router;
