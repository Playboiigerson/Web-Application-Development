const mysql = require('mysql2/promise');
require('dotenv').config();

const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'budget_tracker',
};

(async () => {
  const userId = process.env.DEBUG_USER_ID ? parseInt(process.env.DEBUG_USER_ID, 10) : 7;
  const limit = process.env.DEBUG_LIMIT ? parseInt(process.env.DEBUG_LIMIT, 10) : 5;

  let connection;
  try {
    connection = await mysql.createConnection(dbConfig);
    console.log('Connected to DB');

    const query = `SELECT * FROM transactions WHERE user_id = ? ORDER BY transaction_date DESC, created_at DESC LIMIT ${limit}`;
    console.log('Running:', query, 'with userId=', userId);

    const [rows] = await connection.execute(query, [userId]);
    console.log('Rows returned:', rows.length);
    console.table(rows);
  } catch (err) {
    console.error('DB error:', err.message);
  } finally {
    if (connection) await connection.end();
  }
})();
