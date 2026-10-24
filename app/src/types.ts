export type Loan = {
  id: number;
  friend_name: string;
  amount: string; // backend NUMERIC ko string bhejta hai
  due_date: string;
  is_repaid: boolean;
  repaid_at: string | null;
  is_overdue: boolean;
};

export type Summary = {
  total_lent: number;
  total_repaid: number;
  overdue_amount: number;
};