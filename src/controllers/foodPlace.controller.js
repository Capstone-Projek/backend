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
    } // 1. Insert food_place

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

    let uploadedUrls = []; // Definisikan di luar scope if // 2. Upload images (jika ada) dan simpan ke image_place

    if (req.files?.images?.length) {
      for (const file of req.files.images) {
        const ext = file.originalname.split(".").pop();
        const fileName = `${uuidv4()}.${ext}`;
        const filePath = `${place.id}/${fileName}`;

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
            id_food_place: place.id,
            image_url: url,
          }))
        );
        if (imgError) throw imgError;
      }
    }

    // 3. Ambil data lengkap (termasuk relasi food dan images) untuk response yang konsisten
    const { data: finalPlace, error: finalError } = await supabase
      .from("food_places")
      .select(
        `
            *,
            food:food_id (food_name),
            images:image_place (*)
            `
      )
      .eq("id", place.id)
      .single();

    if (finalError) throw finalError;

    // 4. Format agar konsisten dengan GET
    const formatted = {
      ...finalPlace,
      food_name: finalPlace.food?.food_name ?? "",
      images: finalPlace.images ?? [],
    };

    res.status(201).json(formatted);
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
    const updates = req.body; // 1. Update data utama di tabel food_places

    const { error: placeError } = await supabase
      .from("food_places")
      .update(updates)
      .eq("id", id);
    // Kita tidak menggunakan .select() di sini karena kita akan fetch ulang di akhir

    if (placeError) throw placeError;
    // Cek apakah data benar-benar ada sebelum update
    const { count: exists } = await supabase
      .from("food_places")
      .select("id", { count: "exact" })
      .eq("id", id);
    if (exists === 0)
      return res.status(404).json({ message: "Food place not found" }); // 2. Jika ada file baru, tambahkan ke image_place

    const files = req.files?.images || req.files || [];
    if (files && files.length > 0) {
      const uploadedUrls = [];

      for (const file of files) {
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

    // 3. Ambil semua data terbaru (termasuk relasi food dan images)
    const { data: results, error: fetchError } = await supabase
      .from("food_places")
      .select(
        `
        *,
        food:food_id (food_name),
        images:image_place (*)
        `
      )
      .eq("id", id)
      .single();

    if (fetchError) throw fetchError; // 4. Format hasil akhir agar sesuai model Flutter

    const formatted = {
      ...results,
      food_name: results.food?.food_name ?? "",
      images: results.images ?? [],
    };

    return res.status(200).json(formatted);
  } catch (err) {
    console.error("❌ Error updateFoodPlace:", err.message);
    res.status(500).json({
      error: "Server error",
      detail: err.message,
    });
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
