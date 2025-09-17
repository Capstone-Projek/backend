const supabase = require("../config/supabaseClient");

// CREATE REVIEW
exports.createReview = async (req, res) => {
  try {
    const { id_food } = req.params;
    const { review_desc } = req.body;

    // Asumsi: user_id didapatkan dari token atau sesi yang sudah login
    // Pastikan user_id valid dan ada
    const id_user = req.user.id;

    // Cek apakah id_user ada
    if (!id_user) {
      return res.status(401).json({ error: "User not authenticated." });
    }

    const { data, error } = await supabase
      .from("review")
      .insert([
        {
          id_food,
          id_user,
          review_desc,
        },
      ])
      .select();

    if (error) throw error;

    res.status(201).json(data[0]);
  } catch (err) {
    console.error("Create review error:", err);
    res.status(500).json({ error: err.message });
  }
};

// GET REVIEWS BY id_food
exports.getReviewsByFoodId = async (req, res) => {
  try {
    const { id_food } = req.params;

    const { data, error } = await supabase
      .from("review")
      .select(
        `
        *,
        user (name, email)
      `
      )
      .eq("id_food", id_food);

    if (error) throw error;

    if (!data || data.length === 0) {
      return res.status(404).json({ error: "No reviews found for this food." });
    }

    res.status(200).json(data);
  } catch (err) {
    console.error("Get reviews error:", err);
    res.status(500).json({ error: err.message });
  }
};
