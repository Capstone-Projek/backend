const express = require("express");
const router = express.Router();
const reviewController = require("../controllers/review.controller");
const verifyToken = require("../middlewares/verifyToken");

// Route untuk membuat review baru. Memerlukan autentikasi.
router.post(
  "/food/:id_food/review",
  verifyToken,
  reviewController.createReview
);

// Route untuk mendapatkan semua review berdasarkan id_food.
router.get(
  "/food/:id_food/review",
  verifyToken,
  reviewController.getReviewsByFoodId
);

module.exports = router;
