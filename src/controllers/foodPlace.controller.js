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

    // cari tempat + images
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

    // format konsisten dengan model di Flutter
    const formatted = places.map((item) => ({
      ...item,
      food_name: item.food?.food_name ?? "",
      images: item.images ?? [],
    }));

    return res.json({
      search_name: name,
      results: formatted,
    });
  } catch (err) {
    console.error("Error getFoodPlacesByName:", err.message);
    res.status(500).json({ error: "Server error", detail: err.message });
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

    // format data agar konsisten
    const formatted = data.map((item) => ({
      ...item,
      food_name: item.food?.food_name ?? "",
      images: item.images ?? [],
    }));

    res.json(formatted);
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
    const { data: results, error } = await supabase
      .from("food_places")
      .select(
        `
        *,
        food:food_id (food_name),
        images:image_place (*)
      `
      )
      .eq("id", id);

    if (error) throw error;
    if (!results || results.length === 0)
      return res.status(404).json({ message: "Food place not found" });

    const item = results[0];

    // format agar sesuai model Flutter
    const formatted = {
      ...item,
      food_name: item.food?.food_name ?? "",
      images: item.images ?? [],
    };

    res.json(formatted);
  } catch (err) {
    console.error("Error getFoodPlaceById:", err.message);
    res.status(500).json({ error: "Server error", detail: err.message });
  }
};

/**
 * GET food_place by food id (include images)
 */
exports.getFoodPlaceByFoodId = async (req, res) => {
  try {
    const { food_id } = req.params;

    const { data, error } = await supabase
      .from("food_places")
      .select(`
        *,
        food:food_id (food_name),
        images:image_place (*)
      `)
      .eq("food_id", food_id);

    if (error) throw error;

    const formatted = data.map((item) => ({
      ...item,
      food_name: item.food?.food_name ?? "",
      images: item.images ?? [],
    }));

    res.json(formatted);
  } catch (err) {
    console.error("Error getAllFoodPlaces:", err.message);
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

    res.status(201).json({
      message: "Food place berhasil dibuat",
      data: place,
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

    const { error: updateError } = await supabase
      .from("food_places")
      .update(updates)
      .eq("id", id);

    if (updateError) throw updateError;

    const { data: updated, error: fetchError } = await supabase
      .from("food_places")
      .select(`*, food:food_id(food_name), images:image_place(*)`)
      .eq("id", id)
      .single();

    if (fetchError) throw fetchError;
    res.status(201).json({
      message: "Food place berhasil diupdate",
      data: updated,
    });
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

exports.insertImages = async (req, res) => {
  try {
    const { id_food_place } = req.body;

    if (!id_food_place) {
      return res.status(400).json({ error: "id_food_place wajib diisi" });
    }

    if (!req.files?.images?.length) {
      return res.status(400).json({ error: "Tidak ada file gambar dikirim" });
    }

    const uploadedUrls = [];

    for (const file of req.files.images) {
      const ext = file.originalname.split(".").pop();
      const fileName = `${uuidv4()}.${ext}`;
      const filePath = `${id_food_place}/${fileName}`;

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
          id_food_place,
          image_url: url,
        }))
      );
      if (imgError) throw imgError;
    }

    res.status(201).json({
      message: "Gambar berhasil diunggah",
      urls: uploadedUrls,
    });
  } catch (err) {
    console.error("Error insertImages:", err.message);
    res.status(500).json({ error: "Server error", detail: err.message });
  }
};

// ⬆️ Update image (hapus lama + upload baru)
exports.updateImages = async (req, res) => {
  try {
    const { id_food_place } = req.body;

    if (!id_food_place) {
      return res.status(400).json({ error: "id_food_place wajib diisi" });
    }

    // Hapus semua image lama dari tabel dan storage
    const { data: oldImages, error: getError } = await supabase
      .from("image_place")
      .select("image_url")
      .eq("id_food_place", id_food_place);

    if (getError) throw getError;

    for (const img of oldImages) {
      const path = img.image_url.split("/").pop();
      await supabase.storage
        .from("food_place_image")
        .remove([`${id_food_place}/${path}`]);
    }

    await supabase
      .from("image_place")
      .delete()
      .eq("id_food_place", id_food_place);

    // Upload gambar baru
    if (!req.files?.images?.length) {
      return res
        .status(400)
        .json({ error: "Tidak ada file gambar baru dikirim" });
    }

    const uploadedUrls = [];

    for (const file of req.files.images) {
      const ext = file.originalname.split(".").pop();
      const fileName = `${uuidv4()}.${ext}`;
      const filePath = `${id_food_place}/${fileName}`;

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
      const { error: insertError } = await supabase.from("image_place").insert(
        uploadedUrls.map((url) => ({
          id_food_place,
          image_url: url,
        }))
      );
      if (insertError) throw insertError;
    }

    res.status(200).json({
      message: "Gambar berhasil diperbarui",
      urls: uploadedUrls,
    });
  } catch (err) {
    console.error("Error updateImages:", err.message);
    res.status(500).json({ error: "Server error", detail: err.message });
  }
};
