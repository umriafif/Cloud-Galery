const mysql = require('mysql2/promise');
const env = require('../config/env');

let pool;

function getPool() {
  if (!pool) {
    pool = mysql.createPool({
      ...env.db,
      timezone: 'Z',
      charset: 'utf8mb4'
    });
  }

  return pool;
}

async function query(sql, params = []) {
  const [rows] = await getPool().execute(sql, params);
  return rows;
}

async function withTransaction(handler) {
  const connection = await getPool().getConnection();

  try {
    await connection.beginTransaction();
    const result = await handler(connection);
    await connection.commit();
    return result;
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
}

module.exports = {
  getPool,
  query,
  withTransaction
};
