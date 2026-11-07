const fs = require('fs');
const path = require('path');
const { DatabaseSync } = require('node:sqlite');

const configuredPath = process.env.SQLITE_DB_PATH || path.join(__dirname, 'digivault.sqlite');
const databasePath = configuredPath === ':memory:'
  ? configuredPath
  : path.resolve(process.cwd(), configuredPath);

if (databasePath !== ':memory:') {
  fs.mkdirSync(path.dirname(databasePath), { recursive: true });
}

const database = new DatabaseSync(databasePath);
database.exec('PRAGMA foreign_keys = ON');

function prepareSql(text) {
  return text
    .replace(/\$(\d+)/g, '?$1')
    .replace(/\bnow\(\)/gi, 'CURRENT_TIMESTAMP');
}

async function query(text, params) {
  const statement = database.prepare(prepareSql(text));
  if (statement.columns().length > 0) {
    const rows = statement.all(...(params || []));
    return { rows, rowCount: rows.length };
  }

  const result = statement.run(...(params || []));
  return { rows: [], rowCount: Number(result.changes) };
}

async function withTransaction(callback) {
  database.exec('BEGIN');
  try {
    const result = await callback({ query });
    database.exec('COMMIT');
    return result;
  } catch (err) {
    database.exec('ROLLBACK');
    throw err;
  }
}

function execute(sql) {
  database.exec(sql);
}

function close() {
  database.close();
}

module.exports = { query, withTransaction, execute, close };
