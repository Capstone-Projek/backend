const express = require("express");
const router = express.Router();
const multer = require("multer");

const upload = multer();
const foodPlaceController = require("../controllers/foodPlace.controller");
const verifyToken = require("../middlewares/verifyToken");

// GET all food_places (include images)
router.get("/food-place", verifyToken, foodPlaceController.getAllFoodPlaces);

// GET food_places by name (include images) → /api/food_places/search?name=Bakso
router.get(
  "/food-place/search",
  verifyToken,
  foodPlaceController.getFoodPlacesByName
);

// GET food_place by id (include images)
router.get(
  "/get-food-place/:id",
  verifyToken,
  foodPlaceController.getFoodPlaceById
);

// POST (multiple images)
router.post(
  "/food-place",
  verifyToken,
  upload.fields([{ name: "images", maxCount: 50 }]),
  foodPlaceController.createFoodPlace
);

// PUT (multiple images)
router.put(
  "/edit-food-place/:id",
  verifyToken,
  upload.fields([{ name: "images", maxCount: 50 }]),
  foodPlaceController.updateFoodPlace
);

// DELETE food_place (images ikut kehapus karena FK cascade)
router.delete(
  "/food-place/:id",
  verifyToken,
  foodPlaceController.deleteFoodPlace
);

router.post(
  "/food-place/image",
  verifyToken,
  upload.fields([{ name: "images", maxCount: 50 }]),
  foodPlaceController.insertImages
);

// PUT: update gambar (hapus lama, upload baru)
router.put(
  "/food-place/image",
  verifyToken,
  upload.fields([{ name: "images", maxCount: 50 }]),
  foodPlaceController.updateImages
);

module.exports = router;
