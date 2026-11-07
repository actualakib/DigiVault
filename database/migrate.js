require('dotenv').config();
const fs = require('fs');
const path = require('path');
const { execute, close } = require('./db');

async function migrate() {
  const schema = fs.readFileSync(path.join(__dirname, 'schema.sql'), 'utf8');
  try {
    execute(schema);
    console.log('SQLite database schema applied successfully');
  } finally {
    close();
  }
}

migrate().catch((err) => {
  console.error('Migration failed:', err.message);
  process.exit(1);
});
