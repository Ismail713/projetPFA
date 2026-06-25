CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(20) DEFAULT 'user',
    created_at TIMESTAMP DEFAULT NOW()
);

INSERT INTO users (id, email, password_hash, role)
VALUES (0, 'anonymous@smartmatch.local', 'nologin', 'anonymous')
ON CONFLICT (id) DO NOTHING;

SELECT setval('users_id_seq', GREATEST((SELECT MAX(id) FROM users), 1));

CREATE TABLE cv_versions (
    id SERIAL PRIMARY KEY,
    user_id INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    file_path VARCHAR(500),
    extracted_text TEXT,
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_cv_versions_user_id ON cv_versions(user_id);

CREATE TABLE cv_analyses (
    id SERIAL PRIMARY KEY,
    user_id INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    cv_id INT NOT NULL REFERENCES cv_versions(id) ON DELETE CASCADE,
    cv_score INT CHECK (cv_score >= 0 AND cv_score <= 100),
    overall_assessment TEXT,
    strengths_json JSONB,
    weaknesses_json JSONB,
    missing_sections_json JSONB,
    suggestions_to_add_json JSONB,
    suggestions_to_remove_json JSONB,
    suggestions_to_improve_json JSONB,
    keywords_to_add_json JSONB,
    rewrite_tips_json JSONB,
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_cv_analyses_user_id ON cv_analyses(user_id);
CREATE INDEX idx_cv_analyses_cv_id ON cv_analyses(cv_id);

CREATE TABLE scraping_jobs (
    id SERIAL PRIMARY KEY,
    user_id INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    cv_id INT NOT NULL REFERENCES cv_versions(id) ON DELETE CASCADE,
    queries_json JSONB,
    status VARCHAR(20) DEFAULT 'pending',
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_scraping_jobs_user_id ON scraping_jobs(user_id);
CREATE INDEX idx_scraping_jobs_cv_id ON scraping_jobs(cv_id);
CREATE INDEX idx_scraping_jobs_status ON scraping_jobs(status);

CREATE TABLE job_offers (
    id SERIAL PRIMARY KEY,
    scraping_job_id INT NOT NULL REFERENCES scraping_jobs(id) ON DELETE CASCADE,
    title VARCHAR(500),
    company VARCHAR(255),
    description TEXT,
    source VARCHAR(50),
    url VARCHAR(2000),
    scraped_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_job_offers_scraping_job_id ON job_offers(scraping_job_id);

CREATE TABLE match_results (
    id SERIAL PRIMARY KEY,
    user_id INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    cv_id INT NOT NULL REFERENCES cv_versions(id) ON DELETE CASCADE,
    job_offer_id INT NOT NULL REFERENCES job_offers(id) ON DELETE CASCADE,
    score INT CHECK (score >= 0 AND score <= 100),
    verdict VARCHAR(20),
    matched_skills_json JSONB,
    missing_requirements_json JSONB,
    strengths_json JSONB,
    recommendation TEXT,
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_match_results_user_id ON match_results(user_id);
CREATE INDEX idx_match_results_cv_id ON match_results(cv_id);
CREATE INDEX idx_match_results_job_offer_id ON match_results(job_offer_id);
CREATE INDEX idx_match_results_score ON match_results(score DESC);
