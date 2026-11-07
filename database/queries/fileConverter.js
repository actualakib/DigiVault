const { query } = require('../db');

async function listJobs(userId) {
  const result = await query(
    `SELECT id, source_type, source_label, output_name, status, created_at
     FROM file_conversion_jobs WHERE user_id = $1 ORDER BY created_at DESC`,
    [userId]
  );
  return result.rows;
}

async function getJob(userId, jobId) {
  const result = await query(
    `SELECT * FROM file_conversion_jobs WHERE user_id = $1 AND id = $2`,
    [userId, jobId]
  );
  return result.rows[0] || null;
}

async function insertJob({ userId, sourceType, sourceLabel, outputName, outputPath, status }) {
  const result = await query(
    `INSERT INTO file_conversion_jobs (user_id, source_type, source_label, output_name, output_path, status)
     VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
    [userId, sourceType, sourceLabel || null, outputName, outputPath, status || 'completed']
  );
  return result.rows[0];
}

module.exports = { listJobs, getJob, insertJob };
