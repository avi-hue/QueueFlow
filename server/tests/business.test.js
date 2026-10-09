const request = require('supertest');
const app = require('../src/app');
require('./setup');

describe('Business Management API Endpoints', () => {
  let ownerToken;
  let customerToken;
  let businessId;

  beforeEach(async () => {
    // Register owner with business
    const ownerRes = await request(app).post('/api/v1/auth/register').send({
      name: 'Dr. Test Owner',
      email: 'owner@clinic.com',
      password: 'Password123!',
      role: 'owner',
      business: {
        name: 'Metro Care Center',
        category: 'Healthcare',
        address: '500 7th Ave, New York, NY',
        coordinates: [-73.988, 40.753]
      }
    });

    ownerToken = ownerRes.body.data.accessToken;
    businessId = ownerRes.body.data.business._id;

    // Register customer
    const customerRes = await request(app).post('/api/v1/auth/register').send({
      name: 'Regular Customer',
      email: 'customer@regular.com',
      password: 'Password123!',
      role: 'customer'
    });

    customerToken = customerRes.body.data.accessToken;
  });

  it('GET /api/v1/business/profile should return business details for owner', async () => {
    const res = await request(app)
      .get('/api/v1/business/profile')
      .set('Authorization', `Bearer ${ownerToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.business.name).toBe('Metro Care Center');
  });

  it('Customer should be forbidden from accessing owner business profile', async () => {
    const res = await request(app)
      .get('/api/v1/business/profile')
      .set('Authorization', `Bearer ${customerToken}`);

    expect(res.status).toBe(403);
    expect(res.body.success).toBe(false);
  });

  it('PATCH /api/v1/business/profile should update business settings', async () => {
    const res = await request(app)
      .patch('/api/v1/business/profile')
      .set('Authorization', `Bearer ${ownerToken}`)
      .send({
        description: 'Premier outpatient medical clinic in Manhattan',
        settings: {
          avgServiceTimeDefault: 12,
          approachingThreshold: 4
        }
      });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.business.description).toBe('Premier outpatient medical clinic in Manhattan');
    expect(res.body.data.business.settings.avgServiceTimeDefault).toBe(12);
  });

  it('POST /api/v1/business/counters should add a new counter', async () => {
    const res = await request(app)
      .post('/api/v1/business/counters')
      .set('Authorization', `Bearer ${ownerToken}`)
      .send({
        name: 'Urgent Care Station 2',
        isActive: true
      });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.counter.name).toBe('Urgent Care Station 2');
  });

  it('DELETE /api/v1/business/counters/:id should remove counter', async () => {
    const addRes = await request(app)
      .post('/api/v1/business/counters')
      .set('Authorization', `Bearer ${ownerToken}`)
      .send({ name: 'Temporary Desk' });

    const counterId = addRes.body.data.counter._id;

    const delRes = await request(app)
      .delete(`/api/v1/business/counters/${counterId}`)
      .set('Authorization', `Bearer ${ownerToken}`);

    expect(delRes.status).toBe(200);
    expect(delRes.body.success).toBe(true);
  });

  it('POST /api/v1/business/staff should create staff member', async () => {
    const res = await request(app)
      .post('/api/v1/business/staff')
      .set('Authorization', `Bearer ${ownerToken}`)
      .send({
        name: 'Staff Member 1',
        email: 'staff1@clinic.com',
        password: 'Password123!',
        phone: '1112223333'
      });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.staff.role).toBe('staff');
  });

  it('GET /api/v1/businesses/:id should return public details of business', async () => {
    const res = await request(app).get(`/api/v1/businesses/${businessId}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.business.name).toBe('Metro Care Center');
  });
});
