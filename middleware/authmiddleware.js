const jwt = require("jsonwebtoken"); // Import jsonwebtoken
const users = require("../models/user"); // Ensure this is correctly imported

const uauth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    const tokenFromCookie = req.cookies?.token;

    console.log("Authorization Header:", authHeader);
    console.log("Token from Cookie:", tokenFromCookie);

    if (!authHeader || !authHeader.startsWith("Bearer")) {
      return res.status(401).json({ error: "Unauthorized: No token provided" });
    }

    const token = authHeader.split(" ")[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    console.log("Decoded Token:", decoded);
    const user = await users.findById(decoded.id);
    if (!user) {
      return res.status(401).json({ error: "Unauthorized - Invalid User" });
    }

    req.user = user;
    next();
  } catch (e) {
    console.error("Error in uauth middleware:", e);
    return res.status(401).json({ error: "Unauthorized - Invalid Token" });
  }
};

module.exports = { uauth };