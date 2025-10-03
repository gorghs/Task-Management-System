const redis = require('redis');

const redisClient = redis.createClient({
  url: `redis://${process.env.REDIS_HOST || 'localhost'}:6379`
});

redisClient.on('error', (err) => console.log('Redis Client Error', err));

(async () => {
  await redisClient.connect();
  console.log('Redis Connection Initialized.');
})();

module.exports = redisClient;
