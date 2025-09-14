const supabase = require("../config/supabaseClient");

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
exports.getFoodPlaceById = async (req, res) => {
  try {
    const { id } = req.params;
    const { data, error } = await supabase
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

    if (error) throw error;
    if (!data) return res.status(404).json({ message: "Food place not found" });

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
      images = [], // array url
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

    // insert images jika ada
    if (images.length) {
      const { error: imgError } = await supabase.from("image_place").insert(
        images.map((url) => ({
          id_food_place: place.id,
          image_url: url,
        }))
      );
      if (imgError) throw imgError;
    }

    res.status(201).json(place);
  } catch (err) {
    console.error("Error createFoodPlace:", err.message);
    res.status(500).json({ error: "Server error", detail: err.message });
  }
};

/**
 * PUT update food_place + images
 */
exports.updateFoodPlace = async (req, res) => {
  try {
    const { id } = req.params;
    const { images, ...updates } = req.body;

    // update food_place
    const { data: place, error: placeError } = await supabase
      .from("food_places")
      .update(updates)
      .eq("id", id)
      .select()
      .single();

    if (placeError) throw placeError;
    if (!place)
      return res.status(404).json({ message: "Food place not found" });

    // update images (replace all)
    if (images) {
      await supabase.from("image_place").delete().eq("id_food_place", id);

      if (images.length) {
        const { error: imgError } = await supabase
          .from("image_place")
          .insert(images.map((url) => ({ id_food_place: id, image_url: url })));
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
