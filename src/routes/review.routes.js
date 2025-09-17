const express = require("express");
const router = express.Router();
const reviewController = require("../controllers/review.controller");

// Route untuk membuat review baru. Memerlukan autentikasi.
router.post("/food/:id_food/review", reviewController.createReview);

// Route untuk mendapatkan semua review berdasarkan id_food.
router.get("/food/:id_food/review", reviewController.getReviewsByFoodId);

module.exports = router;
