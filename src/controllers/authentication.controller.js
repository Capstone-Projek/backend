const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const supabase = require("../config/supabaseClient");

const jwtSecret = process.env.JWT_SECRET;

// === REGISTER ===
async function register(req, res) {
  try {
    const { name, email, password } = req.body;

    // 1. Cek user sudah ada
    const { data: existingUser, error: findError } = await supabase
      .from("user")
      .select("id")
      .eq("email", email)
      .single();

    if (findError && findError.code !== "PGRST116") {
      // PGRST116 = no rows found (itu aman, berarti belum ada user)
      throw findError;
    }

    if (existingUser) {
      return res.status(409).json({ message: "Email sudah terdaftar." });
    }

    // 2. Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // 3. Insert user baru dengan role statis 'user'
    const { data: newUser, error: insertError } = await supabase
      .from("user")
      .insert([
        {
          name,
          email,
          password: hashedPassword,
          role: "user", // <<-- PENAMBAHAN INI
        },
      ])
      .select()
      .single();

    if (insertError) throw insertError;

    const userResponse = {
      id: newUser.id,
      name: newUser.name,
      email: newUser.email,
      role: newUser.role, // <<-- TAMBAHKAN ROLE KE RESPONS
    };

    res
      .status(201)
      .json({ message: "Registrasi berhasil!", user: userResponse });
  } catch (error) {
    console.error("Error saat registrasi:", error);
    res.status(500).json({ message: "Terjadi kesalahan server." });
  }
}

// === LOGIN ===
async function login(req, res) {
  try {
    const { email, password } = req.body;

    // 1. Cari user
    const { data: user, error: findError } = await supabase
      .from("user")
      .select("*")
      .eq("email", email)
      .single();

    if (findError || !user) {
      return res.status(401).json({ message: "Email atau password salah." });
    }

    // 2. Cek password
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({ message: "Email atau password salah." });
    }

    // 3. Generate token
    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role },
      jwtSecret,
      {
        // <<-- TAMBAHKAN ROLE KE TOKEN
        expiresIn: "24h",
      }
    );

    res.status(200).json({
      message: "Login berhasil!",
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role, // <<-- TAMBAHKAN ROLE KE RESPONS
      },
    });
  } catch (error) {
    console.error("Error saat login:", error);
    res.status(500).json({ message: "Terjadi kesalahan server." });
  }
}

module.exports = { register, login };
