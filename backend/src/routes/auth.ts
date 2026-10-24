import { Router } from "express";
import crypto from "crypto";
import jwt from "jsonwebtoken";
import { pool } from "../db";

const router = Router();

const PHONE_REGEX = /^\+?[0-9]{10,13}$/;
const OTP_VALID_MINUTES = 5;

router.post("/send-otp", async (req,res) => {
    const { phone } = req.body;

    if (typeof phone !== "string" || !PHONE_REGEX.test(phone)) {
        return res.status(400).json({error: "Valid phone number required" });
    }

    const code = crypto.randomInt(100000, 1000000).toString();
    const expiresAt = new Date(Date.now() + OTP_VALID_MINUTES * 60 * 1000);

    await pool.query("DELETE FROM otps WHERE phone = $1", [phone]);
    await pool.query(
        "INSERT INTO otps (phone, code, expires_at) VALUES ($1, $2, $3)",
        [phone, code, expiresAt]
    );

    console.log(`[MOCK OTP] ${phone} -> ${code}`);
    res.json({ message: "OTP sent (check server log)" });
});

router.post("/verify-otp", async (req,res) => {
    const { phone, otp } = req.body;

    if (typeof phone !== "string" || typeof otp !== "string") {
        return res.status(400).json({error: "phone & otp required "});
    }

    const result = await pool.query(
        "SELECT id FROM otps WHERE phone = $1 AND code = $2 AND expires_at > NOW()",
        [phone, otp]
    );

    if (result.rows.length === 0){
        return res.status(401).json({error : "Invalid or Expired OTP" });

    }

    const userResult = await pool.query(
        `INSERT INTO users (phone) VALUES ($1)
        ON CONFLICT (phone) DO UPDATE SET phone = EXCLUDED.phone
        RETURNING id`,
        [phone]
    );

    const userId = userResult.rows[0].id;

    const token = jwt.sign({ userId }, process.env.JWT_SECRET as string, {
        expiresIn: "7d",
    });
    res.json({ token });
});

export default router;