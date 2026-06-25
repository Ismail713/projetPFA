import { Router, Response } from "express";
import multer from "multer";
import path from "path";

import { PDFParse } from "pdf-parse";
import pool from "../config/db";
import { optionalAuth, AuthRequest } from "../middleware/authMiddleware";
import { runScrapingAndMatchingPipeline } from "../services/scrapingService";

const AI_SERVICE_URL = process.env.AI_SERVICE_URL || "http://ai-service:8000";

const storage = multer.diskStorage({
  destination: path.join(__dirname, "../../uploads"),
  filename: (_req, file, cb) => {
    const unique = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    cb(null, `${unique}${path.extname(file.originalname)}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    if (file.mimetype !== "application/pdf") {
      cb(new Error("Only PDF files are allowed"));
      return;
    }
    cb(null, true);
  },
});

const router = Router();

router.post(
  "/cv/upload",
  optionalAuth,
  (req: AuthRequest, res: Response, next) => {
    upload.single("file")(req, res, (err) => {
      if (err instanceof multer.MulterError) {
        if (err.code === "LIMIT_FILE_SIZE") {
          res.status(400).json({ error: "File exceeds 10MB limit" });
          return;
        }
        res.status(400).json({ error: err.message });
        return;
      }
      if (err) {
        res.status(400).json({ error: err.message });
        return;
      }
      next();
    });
  },
  async (req: AuthRequest, res: Response): Promise<void> => {
    if (!req.file) {
      res.status(400).json({ error: "PDF file is required" });
      return;
    }

    const userId = req.user?.id ?? 0;
    const filePath = req.file.path;

    try {
      const parser = new PDFParse({ url: filePath });
      const pdfData = await parser.getText();
      const extractedText = pdfData.text;
      await parser.destroy();

      const cvResult = await pool.query(
        "INSERT INTO cv_versions (user_id, file_path, extracted_text) VALUES ($1, $2, $3) RETURNING id",
        [userId, filePath, extractedText]
      );
      const cvId = cvResult.rows[0].id;

      res.status(201).json({ status: "processing", cvId });

      // AI analysis + scraping + matching runs in background after response is sent
      (async () => {
        try {
          // Run CV analysis and query generation in parallel
          const [analysisRes, aiRes] = await Promise.all([
            fetch(`${AI_SERVICE_URL}/ai/analyze-cv`, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ cv_text: extractedText }),
            }),
            fetch(`${AI_SERVICE_URL}/ai/generate-queries`, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ cv_text: extractedText }),
            }),
          ]);

          // Save CV analysis
          if (analysisRes.ok) {
            const analysis = (await analysisRes.json()) as {
              cv_score: number;
              overall_assessment: string;
              strengths: string[];
              weaknesses: string[];
              missing_sections: string[];
              suggestions_to_add: string[];
              suggestions_to_remove: string[];
              suggestions_to_improve: string[];
              keywords_to_add: string[];
              rewrite_tips: string[];
            };

            await pool.query("DELETE FROM cv_analyses WHERE user_id = $1", [userId]);

            await pool.query(
              `INSERT INTO cv_analyses
                 (user_id, cv_id, cv_score, overall_assessment, strengths_json, weaknesses_json,
                  missing_sections_json, suggestions_to_add_json, suggestions_to_remove_json,
                  suggestions_to_improve_json, keywords_to_add_json, rewrite_tips_json)
               VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)`,
              [
                userId, cvId,
                analysis.cv_score,
                analysis.overall_assessment,
                JSON.stringify(analysis.strengths),
                JSON.stringify(analysis.weaknesses),
                JSON.stringify(analysis.missing_sections),
                JSON.stringify(analysis.suggestions_to_add),
                JSON.stringify(analysis.suggestions_to_remove),
                JSON.stringify(analysis.suggestions_to_improve),
                JSON.stringify(analysis.keywords_to_add),
                JSON.stringify(analysis.rewrite_tips),
              ]
            );
          } else {
            console.error("CV analysis failed:", analysisRes.status);
          }

          // Process search queries and start scraping
          if (!aiRes.ok) {
            console.error("AI service failed:", aiRes.status);
            return;
          }

          const queries = (await aiRes.json()) as {
            platform_queries: { linkedin: string[]; indeed: string[]; generic: string[] };
          };

          await pool.query("DELETE FROM match_results WHERE user_id = $1", [userId]);
          await pool.query(
            "DELETE FROM job_offers WHERE scraping_job_id IN (SELECT id FROM scraping_jobs WHERE user_id = $1)",
            [userId]
          );
          await pool.query("DELETE FROM scraping_jobs WHERE user_id = $1", [userId]);

          await pool.query(
            "INSERT INTO scraping_jobs (user_id, cv_id, queries_json, status) VALUES ($1, $2, $3, 'pending')",
            [userId, cvId, JSON.stringify(queries)]
          );

          runScrapingAndMatchingPipeline(userId, cvId, queries, extractedText);
        } catch (bgErr) {
          console.error("Background pipeline error:", bgErr);
        }
      })();
    } catch (err) {
      console.error("CV upload error:", err);
      res.status(500).json({ error: "Failed to process CV" });
    }
  }
);

router.get("/cv/analysis/latest", optionalAuth, async (req: AuthRequest, res: Response): Promise<void> => {
  const userId = req.user?.id ?? 0;

  try {
    const result = await pool.query(
      `SELECT cv_score, overall_assessment, strengths_json, weaknesses_json,
              missing_sections_json, suggestions_to_add_json, suggestions_to_remove_json,
              suggestions_to_improve_json, keywords_to_add_json, rewrite_tips_json, created_at
       FROM cv_analyses
       WHERE user_id = $1
       ORDER BY created_at DESC LIMIT 1`,
      [userId]
    );

    if (result.rows.length === 0) {
      res.status(404).json({ error: "CV analysis not found or still processing" });
      return;
    }

    const a = result.rows[0];
    res.json({
      cv_score: a.cv_score,
      overall_assessment: a.overall_assessment,
      strengths: a.strengths_json,
      weaknesses: a.weaknesses_json,
      missing_sections: a.missing_sections_json,
      suggestions_to_add: a.suggestions_to_add_json,
      suggestions_to_remove: a.suggestions_to_remove_json,
      suggestions_to_improve: a.suggestions_to_improve_json,
      keywords_to_add: a.keywords_to_add_json,
      rewrite_tips: a.rewrite_tips_json,
    });
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch CV analysis" });
  }
});

router.delete("/matches", optionalAuth, async (req: AuthRequest, res: Response): Promise<void> => {
  const userId = req.user?.id ?? 0;

  try {
    await pool.query("DELETE FROM match_results WHERE user_id = $1", [userId]);
    await pool.query(
      "DELETE FROM job_offers WHERE scraping_job_id IN (SELECT id FROM scraping_jobs WHERE user_id = $1)",
      [userId]
    );
    await pool.query("DELETE FROM scraping_jobs WHERE user_id = $1", [userId]);
    await pool.query("DELETE FROM cv_analyses WHERE user_id = $1", [userId]);
    await pool.query("DELETE FROM cv_versions WHERE user_id = $1", [userId]);
    res.json({ status: "cleared" });
  } catch (err) {
    res.status(500).json({ error: "Failed to clear results" });
  }
});

router.get("/matches", optionalAuth, async (req: AuthRequest, res: Response): Promise<void> => {
  const userId = req.user?.id ?? 0;

  try {
    const result = await pool.query(
      `SELECT mr.id, mr.cv_id, mr.job_offer_id, mr.score, mr.verdict,
              mr.matched_skills_json, mr.missing_requirements_json, mr.strengths_json,
              mr.recommendation, mr.created_at,
              jo.title, jo.company, jo.url
       FROM match_results mr
       JOIN job_offers jo ON jo.id = mr.job_offer_id
       WHERE mr.user_id = $1
       ORDER BY mr.score DESC`,
      [userId]
    );

    const matches = result.rows.map((r: Record<string, unknown>) => ({
      title: r.title,
      company: r.company,
      url: r.url,
      score: r.score,
      verdict: r.verdict,
      matching_points: typeof r.matched_skills_json === "string" ? JSON.parse(r.matched_skills_json) : r.matched_skills_json || [],
      missing_requirements: typeof r.missing_requirements_json === "string" ? JSON.parse(r.missing_requirements_json) : r.missing_requirements_json || [],
      strengths: typeof r.strengths_json === "string" ? JSON.parse(r.strengths_json) : r.strengths_json || [],
      recommendation: r.recommendation || "",
    }));

    res.json({ status: "done", matches });
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch matches" });
  }
});

router.get("/matches/:id", optionalAuth, async (req: AuthRequest, res: Response): Promise<void> => {
  const userId = req.user?.id ?? 0;
  const matchId = parseInt(req.params.id as string, 10);

  if (isNaN(matchId)) {
    res.status(400).json({ error: "Invalid match ID" });
    return;
  }

  try {
    const result = await pool.query(
      `SELECT mr.id, mr.cv_id, mr.job_offer_id, mr.score, mr.verdict,
              mr.matched_skills_json, mr.missing_requirements_json, mr.strengths_json,
              mr.recommendation, mr.created_at,
              jo.title, jo.company, jo.description, jo.source, jo.url
       FROM match_results mr
       JOIN job_offers jo ON jo.id = mr.job_offer_id
       WHERE mr.id = $1 AND mr.user_id = $2`,
      [matchId, userId]
    );

    if (result.rows.length === 0) {
      res.status(404).json({ error: "Match not found" });
      return;
    }

    res.json({ match: result.rows[0] });
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch match" });
  }
});

export default router;
