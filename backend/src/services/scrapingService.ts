import pool from "../config/db";

const AI_SERVICE_URL = process.env.AI_SERVICE_URL || "http://ai-service:8000";
const JSEARCH_API_KEY = process.env.JSEARCH_API_KEY || "";

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

async function searchJobs(query: string): Promise<ScrapedJob[]> {
  const jobs: ScrapedJob[] = [];

  try {
    const res = await fetch(
      `https://jsearch.p.rapidapi.com/search?query=${encodeURIComponent(query)}&num_pages=1&page=1`,
      {
        headers: {
          "x-rapidapi-key": JSEARCH_API_KEY,
          "x-rapidapi-host": "jsearch.p.rapidapi.com",
        },
      }
    );

    if (!res.ok) {
      console.error(`JSearch API error: ${res.status}`);
      return jobs;
    }

    const data = (await res.json()) as {
      data: Array<{
        job_title: string;
        employer_name: string;
        job_description: string;
        job_apply_link: string;
        job_publisher: string;
      }>;
    };

    for (const item of (data.data || []).slice(0, 5)) {
      jobs.push({
        title: item.job_title || "Untitled",
        company: item.employer_name || "Unknown",
        description: (item.job_description || "").substring(0, 2000),
        url: item.job_apply_link || "",
        source: item.job_publisher || "jsearch",
      });
    }
  } catch (err) {
    console.error(`Job search failed for "${query}":`, err);
  }

  return jobs;
}

export async function runScrapingAndMatchingPipeline(
  userId: number,
  cvId: number,
  queries: { platform_queries: PlatformQueries },
  cvText: string
): Promise<void> {
  const jobResult = await pool.query(
    "SELECT id FROM scraping_jobs WHERE user_id = $1 AND cv_id = $2 ORDER BY created_at DESC LIMIT 1",
    [userId, cvId]
  );
  const scrapingJobId = jobResult.rows[0]?.id;
  if (!scrapingJobId) return;

  try {
    await pool.query("UPDATE scraping_jobs SET status = 'running' WHERE id = $1", [scrapingJobId]);

    const pq = queries.platform_queries || {};
    const toArray = (v: unknown): string[] => {
      if (Array.isArray(v)) return v.map(String);
      if (typeof v === "string") return [v];
      return [];
    };
    const allQueries = [
      ...toArray(pq.generic),
      ...toArray(pq.indeed),
      ...toArray(pq.linkedin),
    ];

    // Deduplicate and limit to 3 queries to conserve API calls
    const uniqueQueries = [...new Set(allQueries)].slice(0, 3);
    console.log("Search queries:", uniqueQueries);
    const seenUrls = new Set<string>();

    for (const query of uniqueQueries) {
      console.log(`Searching jobs for: "${query}"`);
      const jobs = await searchJobs(query);
      console.log(`Found ${jobs.length} jobs for "${query}"`);

      for (const job of jobs) {
        if (seenUrls.has(job.url)) continue;
        seenUrls.add(job.url);

        await pool.query(
          "INSERT INTO job_offers (scraping_job_id, title, company, description, source, url) VALUES ($1, $2, $3, $4, $5, $6)",
          [scrapingJobId, job.title, job.company, job.description, job.source, job.url]
        );
      }
    }

    const offers = await pool.query(
      "SELECT id, title, company, description FROM job_offers WHERE scraping_job_id = $1",
      [scrapingJobId]
    );

    for (const offer of offers.rows) {
      try {
        const matchRes = await fetch(`${AI_SERVICE_URL}/ai/final-match`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            cv_text: cvText,
            job_description: `${offer.title} at ${offer.company}. ${offer.description}`,
          }),
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
  }
}
