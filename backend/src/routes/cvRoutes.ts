import { Router, Response } from "express";
import multer from "multer";
import path from "path";
import fs from "fs";
import { PDFParse } from "pdf-parse";
import pool from "../config/db";
import { authMiddleware, AuthRequest } from "../middleware/authMiddleware";
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
  authMiddleware,
  (req: AuthRequest, res: Response, next) => {
    upload.single("cv")(req, res, (err) => {
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

    const userId = req.user!.id;
    const filePath = req.file.path;

    try {
      const dataBuffer = fs.readFileSync(filePath);
      const parser = new PDFParse({ data: new Uint8Array(dataBuffer) });
      const pdfData = await parser.getText();
      const extractedText = pdfData.text;
      await parser.destroy();

      const cvResult = await pool.query(
        "INSERT INTO cv_versions (user_id, file_path, extracted_text) VALUES ($1, $2, $3) RETURNING id",
        [userId, filePath, extractedText]
      );
      const cvId = cvResult.rows[0].id;

      const aiRes = await fetch(`${AI_SERVICE_URL}/ai/generate-queries`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ cv_text: extractedText }),
      });

      if (!aiRes.ok) {
        res.status(502).json({ error: "AI service failed to generate queries" });
        return;
      }

      const queries = (await aiRes.json()) as {
        platform_queries: { linkedin: string[]; indeed: string[]; generic: string[] };
      };

      await pool.query(
        "INSERT INTO scraping_jobs (user_id, cv_id, queries_json, status) VALUES ($1, $2, $3, 'pending')",
        [userId, cvId, JSON.stringify(queries)]
      );

      setImmediate(() => {
        runScrapingAndMatchingPipeline(userId, cvId, queries, extractedText);
      });

      res.status(201).json({ status: "processing", cvId });
    } catch (err) {
      res.status(500).json({ error: "Failed to process CV" });
    }
  }
);

router.get("/matches", authMiddleware, async (req: AuthRequest, res: Response): Promise<void> => {
  const userId = req.user!.id;

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

    res.json({ matches: result.rows });
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch matches" });
  }
});

router.get("/matches/:id", authMiddleware, async (req: AuthRequest, res: Response): Promise<void> => {
  const userId = req.user!.id;
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
