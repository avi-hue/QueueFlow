const request = require('supertest');
const app = require('../src/app');
require('./setup');

describe('Health Check API', () => {
  it('GET /api/v1/health should return UP status', async () => {
    const res = await request(app).get('/api/v1/health');
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.status).toBe('UP');
  });
});

describe('Auth API Endpoints', () => {
  const customerData = {
    name: 'Customer Test',
    email: 'customertest@test.com',
    password: 'Password123!',
    phone: '1234567890',
    role: 'customer'
  };

  const ownerData = {
    name: 'Owner Test',
    email: 'ownertest@test.com',
    password: 'Password123!',
    role: 'owner',
    business: {
      name: 'Test Health Clinic',
      category: 'Healthcare',
      address: '100 Main St, New York',
      coordinates: [-73.985, 40.748]
    }
  };

  it('POST /api/v1/auth/register should register a customer', async () => {
    const res = await request(app).post('/api/v1/auth/register').send(customerData);
    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.user.email).toBe(customerData.email);
    expect(res.body.data.user.role).toBe('customer');
    expect(res.body.data.accessToken).toBeDefined();
    expect(res.body.data.refreshToken).toBeDefined();
  });

  it('POST /api/v1/auth/register should register an owner and create business', async () => {
    const res = await request(app).post('/api/v1/auth/register').send(ownerData);
    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.user.role).toBe('owner');
    expect(res.body.data.business).toBeDefined();
    expect(res.body.data.business.name).toBe('Test Health Clinic');
    expect(res.body.data.business.counters.length).toBe(1);
  });

  it('POST /api/v1/auth/register should fail on duplicate email', async () => {
    await request(app).post('/api/v1/auth/register').send(customerData);
    const res = await request(app).post('/api/v1/auth/register').send(customerData);
    expect(res.status).toBe(409);
    expect(res.body.success).toBe(false);
  });

  it('POST /api/v1/auth/login should authenticate user and return tokens', async () => {
    await request(app).post('/api/v1/auth/register').send(customerData);

    const res = await request(app).post('/api/v1/auth/login').send({
      email: customerData.email,
      password: customerData.password
    });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.accessToken).toBeDefined();
  });

  it('POST /api/v1/auth/login should reject bad password', async () => {
    await request(app).post('/api/v1/auth/register').send(customerData);

    const res = await request(app).post('/api/v1/auth/login').send({
      email: customerData.email,
      password: 'WrongPassword'
    });

    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
  });

  it('POST /api/v1/auth/refresh should issue new access token', async () => {
    const regRes = await request(app).post('/api/v1/auth/register').send(customerData);
    const refreshToken = regRes.body.data.refreshToken;

    const res = await request(app)
      .post('/api/v1/auth/refresh')
      .send({ refreshToken });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.accessToken).toBeDefined();
  });

  it('GET /api/v1/auth/me should return current user info', async () => {
    const regRes = await request(app).post('/api/v1/auth/register').send(customerData);
    const token = regRes.body.data.accessToken;

    const res = await request(app)
      .get('/api/v1/auth/me')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.user.email).toBe(customerData.email);
  });
});
