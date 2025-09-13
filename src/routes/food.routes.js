const express = require("express");
const multer = require("multer");
const foodController = require("../controllers/food.controller");

const upload = multer(); // memory storage
const router = express.Router();

router.post(
  "/food",
  upload.fields([
    { name: "images", maxCount: 50 }, // multiple images
  ]),
  foodController.createFood
);
router.get("/food", foodController.getAllFood);
router.get("/food/:id", foodController.getFoodById);
router.put("/food/:id", foodController.updateFood);
router.delete("/food/:id", foodController.deleteFood);

module.exports = router;
