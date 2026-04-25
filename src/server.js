const env = require('./config/env');
const { getPool } = require('./db/pool');
const { migrate } = require('./db/migrate');
const { ensureStorageDirectories } = require('./services/storage-service');
const createApp = require('./app');

async function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function waitForDatabase(maxAttempts = 20) {
  const pool = getPool();

  for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
    try {
      const connection = await pool.getConnection();
      await connection.ping();
      connection.release();
      return;
    } catch (error) {
      if (attempt === maxAttempts) {
        throw error;
      }

      await sleep(2000);
    }
  }
}

async function bootstrap() {
  await ensureStorageDirectories();
  await waitForDatabase();
  await migrate();

  const app = createApp();
  app.listen(env.port, () => {
    console.log(`${env.appName} listening on port ${env.port}`);
  });
}

bootstrap().catch((error) => {
  console.error('Failed to bootstrap application:', error);
  process.exit(1);
});
