const supabase = require("../config/supabaseClient");
const { v4: uuidv4 } = require("uuid");
const path = require("path");

// CREATE FOOD + IMAGE
exports.createFood = async (req, res) => {
  try {
    const {
      food_name,
      category,
      from,
      desc,
      history,
      material,
      recipes,
      time_cook,
      serving,
    } = req.body;

    const files = req.files?.images || []; // multer field "images"

    // --- 1. Insert food dulu ---
    const { data: foodData, error: foodError } = await supabase
      .from("food")
      .insert([
        {
          food_name,
          category,
          from,
          desc,
          history,
          material,
          recipes,
          time_cook,
          serving,
        },
      ])
      .select();

    if (foodError) throw foodError;
    const food = foodData[0];

    // --- 3. Upload images ---
    let uploadedImages = [];
    if (files.length > 0) {
      for (const file of files) {
        const ext = path.extname(file.originalname);
        const fileName = `public/${uuidv4()}${ext}`; // Perbaikan: Tambahkan "public/"

        const { error: uploadError } = await supabase.storage
          .from("food")
          .upload(fileName, file.buffer, { contentType: file.mimetype });
        if (uploadError) throw uploadError;

        const { data } = supabase.storage.from("food").getPublicUrl(fileName);
        const imageUrl = data.publicUrl;

        const { data: imageData, error: imageError } = await supabase
          .from("image")
          .insert([{ id_food: food.id_food, image_url: imageUrl }])
          .select();

        if (imageError) throw imageError;
        uploadedImages.push(imageData[0]);
      }
    }

    res.status(201).json({ ...food, images: uploadedImages });
  } catch (err) {
    console.error("Create food error:", err);
    res.status(500).json({ error: err.message });
  }
};

// GET ALL FOOD + IMAGE
exports.getAllFood = async (req, res) => {
  try {
    const { data: foods, error } = await supabase.from("food").select("*");
    if (error) throw error;

    // ambil images per food
    const { data: images, error: imageError } = await supabase
      .from("image")
      .select("*");
    if (imageError) throw imageError;

    const result = foods.map((f) => ({
      ...f,
      images: images.filter((img) => img.id_food === f.id_food),
    }));

    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// GET FOOD BY ID
exports.getFoodById = async (req, res) => {
  try {
    const { id } = req.params;

    const { data: food, error } = await supabase
      .from("food")
      .select("*")
      .eq("id_food", id)
      .single();
    if (error) throw error;

    const { data: images, error: imgError } = await supabase
      .from("image")
      .select("*")
      .eq("id_food", id);
    if (imgError) throw imgError;

    res.json({ ...food, images });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// UPDATE FOOD
exports.updateFood = async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    const { data: updated, error } = await supabase
      .from("food")
      .update(updateData)
      .eq("id_food", id)
      .select();

    if (error) throw error;

    res.json(updated[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// DELETE FOOD + IMAGE
exports.deleteFood = async (req, res) => {
  try {
    const { id } = req.params;

    // ambil images dulu
    const { data: images, error: imgError } = await supabase
      .from("image")
      .select("*")
      .eq("id_food", id);
    if (imgError) throw imgError;

    // hapus file di storage
    for (const img of images) {
      const fileName = img.image_url.split("/").pop(); // ambil nama file dari URL
      await supabase.storage.from("food").remove([fileName]);
    }

    // hapus record images
    await supabase.from("image").delete().eq("id_food", id);

    // hapus food
    await supabase.from("food").delete().eq("id_food", id);

    res.json({ message: "Food and related images deleted" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

/**
 * GET food by exact name (1 hasil) + images
 */
exports.getFoodByExactName = async (req, res) => {
  try {
    const { name } = req.query;

    if (!name) {
      return res.status(400).json({ error: "Parameter 'name' wajib diisi" });
    }

    // 1. Cari food berdasarkan nama persis
    const { data: food, error: foodError } = await supabase
      .from("food")
      .select("*")
      .eq("food_name", name) // persis sama, bukan LIKE
      .single();

    if (foodError) throw foodError;
    if (!food) {
      return res.status(404).json({ message: "Makanan tidak ditemukan" });
    }

    // 2. Ambil semua gambar berdasarkan id_food
    const { data: images, error: imageError } = await supabase
      .from("image")
      .select("id_food, image_url")
      .eq("id_food", food.id_food);

    if (imageError) throw imageError;

    // 3. Gabungkan food + images
    const result = {
      ...food,
      images: images || [],
    };

    return res.json(result);
  } catch (err) {
    console.error("Error getFoodByExactName:", err.message);
    res.status(500).json({ error: "Server error", detail: err.message });
  }
};
