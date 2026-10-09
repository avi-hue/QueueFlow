const request = require('supertest');
const app = require('../src/app');
require('./setup');

describe('Core Queue MVP API Endpoints', () => {
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


    // Get Business Counter ID
    const bizRes = await request(app)
      .get('/api/v1/business/profile')
      .set('Authorization', `Bearer ${ownerToken}`);
    triageCounterId = bizRes.body.data.business.counters[0]._id;
  });

  it('GET /api/v1/queue/public/:businessId should return public queue snapshot', async () => {
    const res = await request(app).get(`/api/v1/queue/public/${clinicId}`);
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('success');
    expect(res.body.data.businessId).toBe(clinicId);
    expect(res.body.data.totalWaiting).toBeGreaterThanOrEqual(0);
  });

  it('GET /api/v1/queue/my-token should return pre-seeded customer token', async () => {
    const res = await request(app)
      .get('/api/v1/queue/my-token')
      .set('Authorization', `Bearer ${customerToken}`);
    
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('success');
    expect(res.body.data.token).not.toBeNull();
    expect(res.body.data.token.tokenLabel).toBe('A-001');
  });

  it('POST /api/v1/queue/join should prevent customer from joining twice', async () => {
    const res = await request(app)
      .post('/api/v1/queue/join')
      .set('Authorization', `Bearer ${customerToken}`)
      .send({ businessId: clinicId });

    expect(res.status).toBe(400);
    expect(res.body.message).toContain('already have an active queue token');
  });

  it('GET /api/v1/queue/business/queue should return full live queue state for staff', async () => {
    const res = await request(app)
      .get('/api/v1/queue/business/queue')
      .set('Authorization', `Bearer ${staffToken}`);

    expect(res.status).toBe(200);
    expect(res.body.status).toBe('success');
    expect(res.body.data.queue.stats).toBeDefined();
    expect(res.body.data.queue.waitingTokens.length).toBeGreaterThan(0);
  });

  it('POST /api/v1/queue/business/queue/call-next should call earliest waiting customer', async () => {
    const res = await request(app)
      .post('/api/v1/queue/business/queue/call-next')
      .set('Authorization', `Bearer ${staffToken}`)
      .send({ counterId: triageCounterId });

    expect(res.status).toBe(200);
    expect(res.body.status).toBe('success');
    expect(res.body.data.token.status).toBe('called');
    expect(res.body.data.token.tokenLabel).toBe('A-002');
  });

  it('POST /api/v1/queue/business/queue/start-service/:tokenId should transition called token to serving', async () => {
    const callRes = await request(app)
      .post('/api/v1/queue/business/queue/call-next')
      .set('Authorization', `Bearer ${staffToken}`)
      .send({ counterId: triageCounterId });

    const calledTokenId = callRes.body.data.token._id;

    const res = await request(app)
      .post(`/api/v1/queue/business/queue/start-service/${calledTokenId}`)
      .set('Authorization', `Bearer ${staffToken}`);

    expect(res.status).toBe(200);
    expect(res.body.data.token.status).toBe('serving');
  });

  it('POST /api/v1/queue/business/queue/complete/:tokenId should transition serving token to completed', async () => {
    const callRes = await request(app)
      .post('/api/v1/queue/business/queue/call-next')
      .set('Authorization', `Bearer ${staffToken}`)
      .send({ counterId: triageCounterId });

    const calledTokenId = callRes.body.data.token._id;

    await request(app)
      .post(`/api/v1/queue/business/queue/start-service/${calledTokenId}`)
      .set('Authorization', `Bearer ${staffToken}`);

    const res = await request(app)
      .post(`/api/v1/queue/business/queue/complete/${calledTokenId}`)
      .set('Authorization', `Bearer ${staffToken}`);

    expect(res.status).toBe(200);
    expect(res.body.data.token.status).toBe('completed');
  });

  it('POST /api/v1/queue/business/queue/walk-in should issue a walk-in token', async () => {
    const res = await request(app)
      .post('/api/v1/queue/business/queue/walk-in')
      .set('Authorization', `Bearer ${staffToken}`)
      .send({ walkInName: 'Walk-in Mark' });

    expect(res.status).toBe(201);
    expect(res.body.data.token.source).toBe('walk_in');
    expect(res.body.data.token.walkInName).toBe('Walk-in Mark');
  });

  it('PATCH /api/v1/queue/business/queue/status should allow owner to pause queue', async () => {
    const res = await request(app)
      .patch('/api/v1/queue/business/queue/status')
      .set('Authorization', `Bearer ${ownerToken}`)
      .send({ status: 'paused' });

    expect(res.status).toBe(200);
    expect(res.body.data.queue.status).toBe('paused');
  });
});
