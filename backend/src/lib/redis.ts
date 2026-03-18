import Redis from 'ioredis';

const redisUrl = process.env.REDIS_URL;

if (!redisUrl) {
  console.warn('⚠️ REDIS_URL não encontrada no .env! Tentando localhost...');
}

const redis = new Redis(redisUrl || 'redis://localhost:6379');

redis.on('connect', () => console.log('✅ Conectado ao Redis do Zaeon'));
redis.on('error', (err) => console.error('❌ Erro no Redis:', err));

export default redis;