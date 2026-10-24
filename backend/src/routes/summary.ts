import { Router, Response } from "express";
import { pool } from "../db";
import { requireAuth, AuthRequest } from "../middleware/auth";

const router = Router();
router.use(requireAuth);

router.get("/", async (req: AuthRequest, res: Response) => {
  const result = await pool.query(
    `SELECT
       COALESCE(SUM(amount), 0) AS total_lent,
       COALESCE(SUM(amount) FILTER (WHERE is_repaid), 0) AS total_repaid,
       COALESCE(SUM(amount) FILTER (WHERE NOT is_repaid AND due_date < CURRENT_DATE), 0) AS overdue_amount
     FROM loans
     WHERE user_id = $1`,
    [req.userId]
  );

  const row = result.rows[0];
  res.json({
    total_lent: Number(row.total_lent),
    total_repaid: Number(row.total_repaid),
    overdue_amount: Number(row.overdue_amount),
  });
});

export default router;