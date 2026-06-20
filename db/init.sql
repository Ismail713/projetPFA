CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    email VARCHAR UNIQUE NOT NULL,
    password_hash VARCHAR NOT NULL,
    role VARCHAR DEFAULT 'user',
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE cv_versions (
    id SERIAL PRIMARY KEY,
    user_id INT REFERENCES users(id),
    file_path VARCHAR,
    extracted_text TEXT,
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE scraping_jobs (
    id SERIAL PRIMARY KEY,
    user_id INT REFERENCES users(id),
    cv_id INT REFERENCES cv_versions(id),
    queries_json JSONB,
    status VARCHAR DEFAULT 'pending',
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE job_offers (
    id SERIAL PRIMARY KEY,
    scraping_job_id INT REFERENCES scraping_jobs(id),
    title VARCHAR,
    company VARCHAR,
    description TEXT,
    source VARCHAR,
    url VARCHAR,
    scraped_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE match_results (
    id SERIAL PRIMARY KEY,
    user_id INT REFERENCES users(id),
    cv_id INT REFERENCES cv_versions(id),
    job_offer_id INT REFERENCES job_offers(id),
    score INT,
    verdict VARCHAR,
    matched_skills_json JSONB,
    missing_requirements_json JSONB,
    strengths_json JSONB,
    recommendation TEXT,
    created_at TIMESTAMP DEFAULT NOW()
);
