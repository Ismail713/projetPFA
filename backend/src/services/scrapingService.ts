import puppeteer, { type Browser, type Page } from "puppeteer";
import pool from "../config/db";

const AI_SERVICE_URL = process.env.AI_SERVICE_URL || "http://ai-service:8000";

interface PlatformQueries {
  linkedin: string[];
  indeed: string[];
  generic: string[];
}

interface ScrapedJob {
  title: string;
  company: string;
  description: string;
  url: string;
  source: string;
}

interface MatchResponse {
  match_percentage: number;
  verdict: string;
  matching_points: string[];
  missing_requirements: string[];
  strengths: string[];
  recommendation: string;
}

async function scrapeIndeedPage(page: Page, query: string): Promise<ScrapedJob[]> {
  const url = `https://www.indeed.com/jobs?q=${encodeURIComponent(query)}&limit=10`;
  const jobs: ScrapedJob[] = [];

  try {
    await page.goto(url, { waitUntil: "domcontentloaded", timeout: 30000 });
    await page.waitForSelector(".job_seen_beacon, .jobsearch-ResultsList", { timeout: 10000 });

    const scraped = await page.evaluate(() => {
      const cards = document.querySelectorAll(".job_seen_beacon");
      const results: Array<{ title: string; company: string; description: string; url: string }> = [];

      cards.forEach((card: Element, i: number) => {
        if (i >= 10) return;

        const titleEl = card.querySelector("h2.jobTitle a, h2.jobTitle span");
        const companyEl = card.querySelector("[data-testid='company-name'], .companyName");
        const linkEl = card.querySelector("h2.jobTitle a");
        const snippetEl = card.querySelector(".job-snippet, [data-testid='job-snippet']");

        results.push({
          title: titleEl?.textContent?.trim() || "Untitled",
          company: companyEl?.textContent?.trim() || "Unknown",
          description: snippetEl?.textContent?.trim() || "",
          url: linkEl ? `https://www.indeed.com${linkEl.getAttribute("href") || ""}` : "",
        });
      });

      return results;
    });

    jobs.push(...scraped.map((j) => ({ ...j, source: "indeed" })));
  } catch (err) {
    console.error(`Scraping failed for query "${query}":`, err);
  }

  return jobs;
}

export async function runScrapingAndMatchingPipeline(
  userId: number,
  cvId: number,
  queries: { platform_queries: PlatformQueries },
  cvText: string
): Promise<void> {
  let browser: Browser | null = null;

  const jobResult = await pool.query(
    "SELECT id FROM scraping_jobs WHERE user_id = $1 AND cv_id = $2 ORDER BY created_at DESC LIMIT 1",
    [userId, cvId]
  );
  const scrapingJobId = jobResult.rows[0]?.id;
  if (!scrapingJobId) return;

  try {
    await pool.query("UPDATE scraping_jobs SET status = 'running' WHERE id = $1", [scrapingJobId]);

    browser = await puppeteer.launch({ headless: true, args: ["--no-sandbox", "--disable-setuid-sandbox"] });
    const page = await browser.newPage();
    await page.setUserAgent(
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
    );

    const allQueries = [
      ...queries.platform_queries.indeed,
      ...queries.platform_queries.linkedin,
      ...queries.platform_queries.generic,
    ];

    for (const query of allQueries) {
      const jobs = await scrapeIndeedPage(page, query);

      for (const job of jobs) {
        await pool.query(
          "INSERT INTO job_offers (scraping_job_id, title, company, description, source, url) VALUES ($1, $2, $3, $4, $5, $6)",
          [scrapingJobId, job.title, job.company, job.description, job.source, job.url]
        );
      }
    }

    await browser.close();
    browser = null;

    const offers = await pool.query(
      "SELECT id, title, company, description FROM job_offers WHERE scraping_job_id = $1",
      [scrapingJobId]
    );

    for (const offer of offers.rows) {
      try {
        const matchRes = await fetch(`${AI_SERVICE_URL}/ai/final-match`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ cv_text: cvText, job_description: offer.description }),
        });

        if (!matchRes.ok) continue;

        const match = (await matchRes.json()) as MatchResponse;

        await pool.query(
          `INSERT INTO match_results
             (user_id, cv_id, job_offer_id, score, verdict, matched_skills_json, missing_requirements_json, strengths_json, recommendation)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
          [
            userId,
            cvId,
            offer.id,
            match.match_percentage,
            match.verdict,
            JSON.stringify(match.matching_points),
            JSON.stringify(match.missing_requirements),
            JSON.stringify(match.strengths),
            match.recommendation,
          ]
        );
      } catch (err) {
        console.error(`Matching failed for offer ${offer.id}:`, err);
      }
    }

    await pool.query("UPDATE scraping_jobs SET status = 'completed' WHERE id = $1", [scrapingJobId]);
  } catch (err) {
    console.error("Pipeline error:", err);
    await pool.query("UPDATE scraping_jobs SET status = 'failed' WHERE id = $1", [scrapingJobId]);
  } finally {
    if (browser) {
      await browser.close().catch(() => {});
    }
  }
}
