const supabase = require("../config/supabaseClient");
const { v4: uuidv4 } = require("uuid");

/**
 * GET food_places by name (include images)
 */
exports.getFoodPlacesByName = async (req, res) => {
  try {
    const { name } = req.query;
    if (!name)
      return res.status(400).json({ error: "Parameter 'name' wajib diisi" });

    // cari food
    const { data: foods, error: foodError } = await supabase
      .from("food")
      .select("id_food, food_name")
      .ilike("food_name", `%${name}%`);

    if (foodError) throw foodError;
    if (!foods?.length)
      return res.status(404).json({ message: "Makanan tidak ditemukan" });

    const foodIds = foods.map((f) => f.id_food);

    // cari places + images
    const { data: places, error: placesError } = await supabase
      .from("food_places")
      .select(
        `
            *,
            food:food_id (food_name),
            images:image_place (*)
        `
      )
      .in("food_id", foodIds);

    if (placesError) throw placesError;

    return res.json({ food_name: name, results: places });
  } catch (err) {
    console.error("Error getFoodPlacesByName:", err.message);
    return res.status(500).json({ error: "Server error", detail: err.message });
  }
};

/**
 * GET all food_places (include images)
 */
exports.getAllFoodPlaces = async (req, res) => {
  try {
    const { data, error } = await supabase.from("food_places").select(`
            *,
            food:food_id (food_name),
            images:image_place (*)
        `);

    if (error) throw error;

    return res.json(data);
  } catch (err) {
    console.error("Error getAllFoodPlaces:", err.message);
    res.status(500).json({ error: "Server error", detail: err.message });
  }
};

/**
 * GET food_place by id (include images)
 */
// Perbaikan Kode Controller
exports.getFoodPlaceById = async (req, res) => {
  try {
    const { id } = req.params;
    const { data: results, error } = await supabase // Ganti 'data' menjadi 'results' (array)
      .from("food_places")
      .select(
        `
        *,
        food:food_id (food_name),
        images:image_place (*)
        `
      )
      .eq("id", id); // Hapus .single()

    if (error) throw error; // Ambil baris pertama, atau kembalikan 404 jika array kosong
    if (!results || results.length === 0)
      return res.status(404).json({ message: "Food place not found" });

    const data = results[0]; // Ambil baris pertama

    res.json(data);
  } catch (err) {
    console.error("Error getFoodPlaceById:", err.message);
    res.status(500).json({ error: "Server error", detail: err.message });
  }
};

/**
 * POST create new food_place + images
 */
exports.createFoodPlace = async (req, res) => {
  try {
    const {
      food_id,
      shop_name,
      address,
      phone,
      open_hours,
      close_hours,
      price_range,
      latitude,
      longitude,
      food_name,
    } = req.body;

    if (!shop_name || !latitude || !longitude) {
      return res
        .status(400)
        .json({ error: "shop_name, latitude, longitude wajib diisi" });
    }

    // insert food_place
    const { data: place, error: placeError } = await supabase
      .from("food_places")
      .insert([
        {
          food_id,
          shop_name,
          address,
          phone,
          open_hours,
          close_hours,
          price_range,
          latitude,
          longitude,
          food_name,
        },
      ])
      .select()
      .single();

    if (placeError) throw placeError;

    // upload images kalau ada
    if (req.files?.images?.length) {
      const uploadedUrls = [];

      for (const file of req.files.images) {
        const ext = file.originalname.split(".").pop();
        const fileName = `${uuidv4()}.${ext}`;
        const filePath = `${place.id}/${fileName}`;

        // upload ke storage
        const { error: uploadError } = await supabase.storage
          .from("food_place_image")
          .upload(filePath, file.buffer, {
            contentType: file.mimetype,
          });

        if (uploadError) throw uploadError;

        // ambil public URL
        const { data: publicUrlData } = supabase.storage
          .from("food_place_image")
          .getPublicUrl(filePath);

        uploadedUrls.push(publicUrlData.publicUrl);
      }

      // simpan ke image_place
      if (uploadedUrls.length) {
        const { error: imgError } = await supabase.from("image_place").insert(
          uploadedUrls.map((url) => ({
            id_food_place: place.id,
            image_url: url,
          }))
        );
        if (imgError) throw imgError;
      }
    }

    res.status(201).json({
      ...place,
      images: uploadedUrls.map((url) => ({
        image_url: url,
      })),
    });
  } catch (err) {
    console.error("Error createFoodPlace:", err.message);
    res.status(500).json({ error: "Server error", detail: err.message });
  }
};

/**
 * PUT update food_place + upload images
 */
exports.updateFoodPlace = async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    // update data food_place
    const { data: place, error: placeError } = await supabase
      .from("food_places")
      .update(updates)
      .eq("id", id)
      .select()
      .single();

    if (placeError) throw placeError;
    if (!place)
      return res.status(404).json({ message: "Food place not found" });

    // kalau ada file baru, replace semua gambar lama
    if (req.files?.images) {
      await supabase.from("image_place").delete().eq("id_food_place", id);

      const uploadedUrls = [];

      for (const file of req.files.images) {
        const ext = file.originalname.split(".").pop();
        const fileName = `${uuidv4()}.${ext}`;
        const filePath = `${id}/${fileName}`;

        const { error: uploadError } = await supabase.storage
          .from("food_place_image")
          .upload(filePath, file.buffer, {
            contentType: file.mimetype,
          });

        if (uploadError) throw uploadError;

        const { data: publicUrlData } = supabase.storage
          .from("food_place_image")
          .getPublicUrl(filePath);

        uploadedUrls.push(publicUrlData.publicUrl);
      }

      if (uploadedUrls.length) {
        const { error: imgError } = await supabase.from("image_place").insert(
          uploadedUrls.map((url) => ({
            id_food_place: id,
            image_url: url,
          }))
        );
        if (imgError) throw imgError;
      }
    }

    res.json(place);
  } catch (err) {
    console.error("Error updateFoodPlace:", err.message);
    res.status(500).json({ error: "Server error", detail: err.message });
  }
};

/**
 * DELETE food_place (images ikut kehapus karena FK cascade)
 */
exports.deleteFoodPlace = async (req, res) => {
  try {
    const { id } = req.params;
    const { error } = await supabase.from("food_places").delete().eq("id", id);
    if (error) throw error;

    res.json({ message: "Food place deleted successfully" });
  } catch (err) {
    console.error("Error deleteFoodPlace:", err.message);
    res.status(500).json({ error: "Server error", detail: err.message });
  }
};
