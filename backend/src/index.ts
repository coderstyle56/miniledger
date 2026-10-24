import "dotenv/config";
import express from "express";
import cors from "cors";
import { pool } from "./db";
import authRoutes from "./routes/auth";
import loansRoutes from "./routes/loans";
import summaryRoutes from "./routes/summary";

const app = express();
app.use(cors());
app.use(express.json())
app.use("/auth", authRoutes);
app.use("/loans", loansRoutes);
app.use("/summary", summaryRoutes);

app.get("/health/db", async (_req, res) => {
    const result = await pool.query("SELECT NOW()");
    res.json({ db: "ok", time: result.rows[0].now });
});

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});