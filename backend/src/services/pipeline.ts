import pool from "../config/db";

const AI_SERVICE_URL = process.env.AI_SERVICE_URL || "http://ai-service:8000";

export async function runScrapingAndMatchingPipeline(
  userId: number,
  cvId: number,
  queries: string[],
  cvText: string
): Promise<void> {
  try {
    const jobResult = await pool.query(
      "SELECT id FROM scraping_jobs WHERE user_id = $1 AND cv_id = $2 ORDER BY created_at DESC LIMIT 1",
      [userId, cvId]
    );
    const scrapingJobId = jobResult.rows[0]?.id;
    if (!scrapingJobId) return;

    await pool.query("UPDATE scraping_jobs SET status = 'scraping' WHERE id = $1", [scrapingJobId]);

    const scrapeRes = await fetch(`${AI_SERVICE_URL}/ai/scrape`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ queries }),
    });

    if (!scrapeRes.ok) {
      await pool.query("UPDATE scraping_jobs SET status = 'failed' WHERE id = $1", [scrapingJobId]);
      return;
    }

    const { jobs } = (await scrapeRes.json()) as { jobs: Array<{ title: string; company: string; description: string; source: string; url: string }> };

    for (const job of jobs) {
      await pool.query(
        "INSERT INTO job_offers (scraping_job_id, title, company, description, source, url) VALUES ($1, $2, $3, $4, $5, $6)",
        [scrapingJobId, job.title, job.company, job.description, job.source, job.url]
      );
    }

    await pool.query("UPDATE scraping_jobs SET status = 'matching' WHERE id = $1", [scrapingJobId]);

    const offers = await pool.query("SELECT id, title, company, description FROM job_offers WHERE scraping_job_id = $1", [scrapingJobId]);

    for (const offer of offers.rows) {
      const matchRes = await fetch(`${AI_SERVICE_URL}/ai/match`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ cv_text: cvText, job_description: offer.description, job_title: offer.title }),
      });

      if (!matchRes.ok) continue;

      const match = (await matchRes.json()) as {
        score: number;
        verdict: string;
        matched_skills: string[];
        missing_requirements: string[];
        strengths: string[];
        recommendation: string;
      };

      await pool.query(
        `INSERT INTO match_results (user_id, cv_id, job_offer_id, score, verdict, matched_skills_json, missing_requirements_json, strengths_json, recommendation)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
        [
          userId, cvId, offer.id, match.score, match.verdict,
          JSON.stringify(match.matched_skills),
          JSON.stringify(match.missing_requirements),
          JSON.stringify(match.strengths),
          match.recommendation,
        ]
      );
    }

    await pool.query("UPDATE scraping_jobs SET status = 'done' WHERE id = $1", [scrapingJobId]);
  } catch (err) {
    console.error("Pipeline error:", err);
  }
}
