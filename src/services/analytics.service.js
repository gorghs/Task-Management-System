const db = require('../db/db');
const redisClient = require('../db/redis');

const LEADERBOARD_CACHE_KEY = 'leaderboard';

async function getLeaderboard() {
  // Try to get the leaderboard from the cache first
  const cachedLeaderboard = await redisClient.get(LEADERBOARD_CACHE_KEY);
  if (cachedLeaderboard) {
    return JSON.parse(cachedLeaderboard);
  }

  // If not in cache, fetch from the database
  const query = `
    SELECT
      u.user_id,
      u.name,
      COUNT(t.task_id) AS completed_tasks
    FROM users u
    JOIN tasks t ON u.user_id = t.assigned_user_id
    WHERE t.status = 'completed'
    GROUP BY u.user_id, u.name
    ORDER BY completed_tasks DESC
    LIMIT 10;
  `;

  const result = await db.query(query);

  // Cache the result in Redis for 1 hour
  await redisClient.set(LEADERBOARD_CACHE_KEY, JSON.stringify(result.rows), {
    EX: 3600 // 1 hour
  });

  return result.rows;
}

module.exports = { getLeaderboard };
