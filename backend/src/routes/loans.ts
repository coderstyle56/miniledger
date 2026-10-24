import { Router, Response } from "express";
import { pool } from "../db";
import { requireAuth, AuthRequest } from "../middleware/auth";

const router = Router();
router.use(requireAuth);

const DATE_REGEX = /^\d{4}-\d{2}-\d{2}$/;

// Har query mein yahi columns aate hain
const LOAN_COLUMNS = `
  id,
  friend_name,
  amount,
  due_date::text AS due_date,
  is_repaid,
  repaid_at,
  (NOT is_repaid AND due_date < CURRENT_DATE) AS is_overdue
`;

router.post("/", async (req: AuthRequest, res: Response) => {
  const { friend_name, amount, due_date } = req.body;

  if (typeof friend_name !== "string" || friend_name.trim() === "") {
    return res.status(400).json({ error: "friend_name is required" });
  }
  if (typeof amount !== "number" || !Number.isFinite(amount) || amount <= 0 || amount >= 1e10) {
    return res.status(400).json({ error: "amount must be a positive number" });
  }
  if (typeof due_date !== "string" || !DATE_REGEX.test(due_date) || isNaN(Date.parse(due_date))) {
    return res.status(400).json({ error: "due_date must be YYYY-MM-DD" });
  }

  const result = await pool.query(
    `INSERT INTO loans (user_id, friend_name, amount, due_date)
     VALUES ($1, $2, $3, $4)
     RETURNING ${LOAN_COLUMNS}`,
    [req.userId, friend_name.trim(), amount, due_date]
  );

  res.status(201).json(result.rows[0]);
});

router.get("/", async (req: AuthRequest, res: Response) => {
  const result = await pool.query(
    `SELECT ${LOAN_COLUMNS} FROM loans
     WHERE user_id = $1
     ORDER BY is_repaid ASC, due_date ASC`,
    [req.userId]
  );
  res.json(result.rows);
});

router.patch("/:id/repay", async (req: AuthRequest, res: Response) => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id)) {
    return res.status(400).json({ error: "Invalid loan id" });
  }

  const result = await pool.query(
    `UPDATE loans
     SET is_repaid = TRUE, repaid_at = NOW()
     WHERE id = $1 AND user_id = $2 AND is_repaid = FALSE
     RETURNING ${LOAN_COLUMNS}`,
    [id, req.userId]
  );

  if (result.rows.length === 0) {
    return res.status(404).json({ error: "Loan not found or already repaid" });
  }

  res.json(result.rows[0]);
});

export default router;