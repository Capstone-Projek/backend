require("dotenv").config();

const { Sequelize } = require("sequelize");

const sequelize = new Sequelize(
  process.env.DB_NAME,
  process.env.DB_USER,
  process.env.DB_PASSWORD,
  {
    host: process.env.DB_HOST,
    dialect: "mysql",
    logging: false,
  }
);

async function testConnection() {
  try {
    await sequelize.authenticate();
    console.log("✅ Connection Database has been established successfully.");
  } catch (error) {
    console.error("❌ Unable to connect to DB2:", error);
  }
}

testConnection();

module.exports = sequelize;
