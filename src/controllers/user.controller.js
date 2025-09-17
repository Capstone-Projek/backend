const supabase = require("../config/supabaseClient");
const path = require("path");

// --- 1. UPDATE USER PROFILE (nama, dll.) ---
exports.updateUserProfile = async (req, res) => {
  try {
    const userId = req.user.id;
    const { name, email } = req.body;

    if (!userId) {
      return res.status(401).json({ message: "User not authenticated." });
    }

    const { data, error } = await supabase
      .from("user")
      .update({ name: name, email: email, update_at: new Date() })
      .eq("id", userId)
      .select();

    if (error) {
      console.error("Update user profile error:", error);
      return res
        .status(500)
        .json({ message: "Failed to update user profile." });
    }

    res.status(200).json({
      message: "User profile updated successfully.",
      user: data[0],
    });
  } catch (error) {
    console.error("Update user profile error:", error);
    res.status(500).json({ message: "Internal server error." });
  }
};

const imageBucketName = "profile_image"; // Ganti dengan nama bucket Anda

exports.updateProfileImage = async (req, res) => {
  try {
    const userId = req.user.id;
    const file = req.file;

    if (!userId) {
      return res.status(401).json({ message: "User not authenticated." });
    }

    if (!file) {
      return res.status(400).json({ message: "No image file provided." });
    }

    // Nama file unik berdasarkan ID pengguna untuk menimpa file lama
    const fileName = `public/${userId}${path.extname(file.originalname)}`;

    // Unggah file baru ke Supabase Storage, akan otomatis menimpa file dengan nama yang sama
    const { error: uploadError } = await supabase.storage
      .from(imageBucketName)
      .upload(fileName, file.buffer, {
        contentType: file.mimetype,
        upsert: true,
      });

    if (uploadError) {
      console.error("Upload image error:", uploadError);
      return res.status(500).json({ message: "Failed to upload new image." });
    }

    // Dapatkan URL publik dari file yang baru diunggah
    const { data: publicUrlData } = supabase.storage
      .from(imageBucketName)
      .getPublicUrl(fileName);
    const imageUrl = publicUrlData.publicUrl;

    // Masukkan atau perbarui URL gambar di tabel image_profile
    // id_image berelasi dengan id user, jadi kita gunakan id_image = userId
    const { error: dbError } = await supabase.from("image_profile").upsert(
      { id_image: userId, image_url: imageUrl },
      {
        onConflict: "id_image",
      }
    );

    if (dbError) {
      console.error("Database update error:", dbError);
      return res
        .status(500)
        .json({ message: "Failed to update database record." });
    }

    res.status(200).json({
      message: "Profile image updated successfully.",
      imageUrl,
    });
  } catch (error) {
    console.error("Update profile image error:", error);
    res.status(500).json({ message: "Internal server error." });
  }
};
