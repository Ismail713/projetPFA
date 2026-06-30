import { Router, Response } from "express";
import pool from "../config/db";
import { authMiddleware, AuthRequest } from "../middleware/authMiddleware";

const AI_SERVICE_URL = process.env.AI_SERVICE_URL || "http://ai-service:8000";

const VALID_FEEDBACK = ["relevant", "not_relevant", "applied"];

const router = Router();

router.post("/", authMiddleware, async (req: AuthRequest, res: Response): Promise<void> => {
  const userId = req.user!.id;
  const { matchResultId, jobTitle, feedback, comment } = req.body;

  if (!matchResultId || !jobTitle || !VALID_FEEDBACK.includes(feedback)) {
    res.status(400).json({ error: "matchResultId, jobTitle and a valid feedback are required" });
    return;
  }

  try {
    await pool.query(
      `INSERT INTO user_feedback (user_id, match_result_id, job_title, feedback, comment)
       VALUES ($1, $2, $3, $4, $5)`,
      [userId, matchResultId, jobTitle, feedback, comment ?? null]
    );

    try {
      await fetch(`${AI_SERVICE_URL}/ai/add-feedback`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          user_id: String(userId),
          job_title: jobTitle,
          feedback_type: feedback,
        }),
      });
    } catch (aiErr) {
      console.error("AI service feedback sync failed:", aiErr);
    }

    res.status(201).json({ status: "saved" });
  } catch (err) {
    console.error("Feedback save error:", err);
    res.status(500).json({ error: "Failed to save feedback" });
  }
});

router.get("/stats", authMiddleware, async (req: AuthRequest, res: Response): Promise<void> => {
  const userId = req.user!.id;

  try {
    const countsResult = await pool.query(
      `SELECT feedback, COUNT(*)::int AS count
       FROM user_feedback
       WHERE user_id = $1
       GROUP BY feedback`,
      [userId]
    );

    const counts: Record<string, number> = { relevant: 0, not_relevant: 0, applied: 0 };
    for (const row of countsResult.rows) {
      counts[row.feedback] = row.count;
    }
    const total = counts.relevant + counts.not_relevant + counts.applied;

    const topRelevantResult = await pool.query(
      `SELECT job_title, COUNT(*)::int AS count
       FROM user_feedback
       WHERE user_id = $1 AND feedback = 'relevant'
       GROUP BY job_title
       ORDER BY count DESC, job_title ASC
       LIMIT 5`,
      [userId]
    );

    const topIrrelevantResult = await pool.query(
      `SELECT job_title, COUNT(*)::int AS count
       FROM user_feedback
       WHERE user_id = $1 AND feedback = 'not_relevant'
       GROUP BY job_title
       ORDER BY count DESC, job_title ASC
       LIMIT 5`,
      [userId]
    );

    res.json({
      total,
      relevant_count: counts.relevant,
      not_relevant_count: counts.not_relevant,
      applied_count: counts.applied,
      top_relevant_jobs: topRelevantResult.rows,
      top_irrelevant_jobs: topIrrelevantResult.rows,
    });
  } catch (err) {
    console.error("Feedback stats error:", err);
    res.status(500).json({ error: "Failed to fetch feedback stats" });
  }
});

export default router;
