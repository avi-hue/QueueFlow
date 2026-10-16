const request = require('supertest');
const app = require('../src/app');
require('./setup');

describe('Module 3: Smart Wait-Time Prediction Engine', () => {
  let customerToken;
  let ownerToken;
  let staffToken;
  let clinicId;
  let triageCounterId;

  beforeEach(async () => {
    // Login Customer
    const custRes = await request(app).post('/api/v1/auth/login').send({
      email: 'customer@queueflow.dev',
      password: 'Password123!'
    });
    customerToken = custRes.body.data.accessToken;

    // Login Owner
    const ownerRes = await request(app).post('/api/v1/auth/login').send({
      email: 'owner@queueflow.dev',
      password: 'Password123!'
    });
    ownerToken = ownerRes.body.data.accessToken;
    const rawBizId = ownerRes.body.data.user.businessId;
    clinicId = typeof rawBizId === 'object' && rawBizId !== null ? rawBizId._id : String(rawBizId);

    // Login Staff
    const staffRes = await request(app).post('/api/v1/auth/login').send({
      email: 'staff@queueflow.dev',
      password: 'Password123!'
    });
    staffToken = staffRes.body.data.accessToken;

    // Counter
    const bizRes = await request(app)
      .get('/api/v1/business/profile')
      .set('Authorization', `Bearer ${ownerToken}`);
    triageCounterId = bizRes.body.data.business.counters[0]._id;
  });

  it('GET /api/v1/queue/prediction/:businessId should return detailed prediction breakdown', async () => {
    const res = await request(app).get(`/api/v1/queue/prediction/${clinicId}`);

    expect(res.status).toBe(200);
    expect(res.body.status).toBe('success');
    expect(res.body.data.businessId).toBe(clinicId);
    expect(res.body.data.prediction).toBeDefined();

    const pred = res.body.data.prediction;
    expect(pred.estimatedWaitMins).toBeGreaterThanOrEqual(0);
    expect(['high', 'medium', 'historical', 'baseline']).toContain(pred.confidence);
    expect(pred.activeCounters).toBeGreaterThanOrEqual(1);
    expect(pred.blendedAvgServiceTime).toBeGreaterThan(0);
    expect(pred.historicalAvgServiceTime).toBeGreaterThan(0);
    expect(pred.algorithm).toBe('hybrid_dynamic_m_m_c');

    // Historical patterns array
    expect(Array.isArray(res.body.data.hourlyPattern)).toBe(true);
    expect(res.body.data.hourlyPattern.length).toBeGreaterThan(0);
  });

  it('GET /api/v1/queue/my-token should include prediction metrics for the customer', async () => {
    const res = await request(app)
      .get('/api/v1/queue/my-token')
      .set('Authorization', `Bearer ${customerToken}`);

    expect(res.status).toBe(200);
    expect(res.body.status).toBe('success');
    expect(res.body.data.token).not.toBeNull();
    expect(res.body.data.token.prediction).toBeDefined();
    expect(res.body.data.token.prediction.blendedAvgServiceTime).toBeGreaterThan(0);
  });

  it('GET /api/v1/queue/business/queue should return stats.prediction for staff view', async () => {
    const res = await request(app)
      .get('/api/v1/queue/business/queue')
      .set('Authorization', `Bearer ${staffToken}`);

    expect(res.status).toBe(200);
    expect(res.body.data.queue.stats.prediction).toBeDefined();
    expect(res.body.data.queue.stats.prediction.algorithm).toBe('hybrid_dynamic_m_m_c');
  });

  it('Token service completion updates HourlyStat and records service duration', async () => {
    // Call next token
    const callRes = await request(app)
      .post('/api/v1/queue/business/queue/call-next')
      .set('Authorization', `Bearer ${staffToken}`)
      .send({ counterId: triageCounterId });

    const calledTokenId = callRes.body.data.token._id;

    // Start service
    await request(app)
      .post(`/api/v1/queue/business/queue/start-service/${calledTokenId}`)
      .set('Authorization', `Bearer ${staffToken}`);

    // Complete service
    const compRes = await request(app)
      .post(`/api/v1/queue/business/queue/complete/${calledTokenId}`)
      .set('Authorization', `Bearer ${staffToken}`);

    expect(compRes.status).toBe(200);
    expect(compRes.body.data.token.status).toBe('completed');
    expect(compRes.body.data.token.completedAt).toBeDefined();

    // Verify prediction endpoint reflects live activity
    const predRes = await request(app).get(`/api/v1/queue/prediction/${clinicId}`);
    expect(predRes.status).toBe(200);
    expect(predRes.body.data.prediction.liveSampleCount).toBeGreaterThan(0);
    expect(predRes.body.data.prediction.liveAvgServiceTime).toBeGreaterThan(0);
  });
});
