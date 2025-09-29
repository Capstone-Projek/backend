const express = require("express");
const multer = require("multer");
const foodController = require("../controllers/food.controller");
const verifyToken = require("../middlewares/verifyToken");

const upload = multer(); // memory storage
const router = express.Router();

router.post(
  "/food",
  upload.fields([
    { name: "images", maxCount: 50 }, // multiple images
  ]),
  foodController.createFood
);
router.get("/food", verifyToken, foodController.getAllFood);
router.get("/food/:id", verifyToken, foodController.getFoodById);
router.put("/food/:id", verifyToken, foodController.updateFood);
router.delete("/food/:id", verifyToken, foodController.deleteFood);
router.get("/food/search", verifyToken, foodController.getFoodByExactName);

module.exports = router;
