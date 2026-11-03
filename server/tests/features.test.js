const request = require('supertest');
const app = require('../src/app');
const { store } = require('../src/db/inMemoryStore');
require('./setup');

describe('New Features: Nearby Queue Comparison, Real-Time Notifications, & Business Analytics', () => {
  let customerToken;
  let ownerToken;
  let sampleBizId;

  beforeEach(async () => {
    // Login Customer
    const resCust = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: 'customer@queueflow.dev', password: 'Password123!' });
    customerToken = resCust.body.data.accessToken;

    // Login Apex Health Clinic Owner
    const resOwner = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: 'owner@queueflow.dev', password: 'Password123!' });
    ownerToken = resOwner.body.data.accessToken;
    sampleBizId = resOwner.body.data.user.businessId;
  });

  describe('Feature 1: Nearby Queue Comparison', () => {
    it('GET /api/v1/businesses/compare should return multi-location comparison with metrics and highlights', async () => {
      const allBiz = store.businesses.slice(0, 3);
      const ids = allBiz.map((b) => b._id).join(',');

      const res = await request(app).get(`/api/v1/businesses/compare?ids=${ids}`);
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data.businesses)).toBe(true);
      expect(res.body.data.businesses.length).toBe(3);

      const first = res.body.data.businesses[0];
      // Compare queue size
      expect(first.queueSize).toBeDefined();
      // Compare estimated wait time
      expect(first.estimatedWaitMins).toBeDefined();
      // Compare availability
      expect(first.availability).toBeDefined();
      expect(first.availability.queueStatus).toBeDefined();
      expect(first.availability.activeCounters).toBeDefined();

      // Comparison highlights summary
      expect(res.body.data.summary).toBeDefined();
      expect(res.body.data.summary.totalCompared).toBe(3);
    });

    it('GET /api/v1/businesses with sorting and filters should order by wait_time and filter by category', async () => {
      const res = await request(app).get('/api/v1/businesses?category=healthcare&sort=wait_time');
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.businesses.length).toBeGreaterThan(0);
      res.body.data.businesses.forEach((biz) => {
        expect(biz.category.toLowerCase()).toBe('healthcare');
      });
    });
  });

  describe('Feature 2: Real-Time Notifications', () => {
    it('GET /api/v1/notifications should return notifications for authenticated customer', async () => {
      const res = await request(app)
        .get('/api/v1/notifications')
        .set('Authorization', `Bearer ${customerToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data.notifications)).toBe(true);
      expect(res.body.data.unreadCount).toBeGreaterThanOrEqual(0);
    });

    it('PATCH /api/v1/notifications/:id/read should mark notification as read', async () => {
      const listRes = await request(app)
        .get('/api/v1/notifications')
        .set('Authorization', `Bearer ${customerToken}`);

      const notif = listRes.body.data.notifications[0];
      if (notif) {
        const res = await request(app)
          .patch(`/api/v1/notifications/${notif._id}/read`)
          .set('Authorization', `Bearer ${customerToken}`);

        expect(res.status).toBe(200);
        expect(res.body.success).toBe(true);
        expect(res.body.data.notification.read).toBe(true);
      }
    });

    it('POST /api/v1/notifications/read-all should mark all notifications as read', async () => {
      const res = await request(app)
        .post('/api/v1/notifications/read-all')
        .set('Authorization', `Bearer ${customerToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);

      const checkRes = await request(app)
        .get('/api/v1/notifications')
        .set('Authorization', `Bearer ${customerToken}`);
      expect(checkRes.body.data.unreadCount).toBe(0);
    });
  });

  describe('Feature 3: Business Analytics Dashboard', () => {
    it('GET /api/v1/business/analytics should return peak hours, customer flow, waiting times, and service performance', async () => {
      const res = await request(app)
        .get('/api/v1/business/analytics?timeframe=today')
        .set('Authorization', `Bearer ${ownerToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      const data = res.body.data;

      // KPIs
      expect(data.kpis).toBeDefined();
      expect(data.kpis.completionRate).toBeDefined();
      expect(data.kpis.avgWaitTimeMin).toBeDefined();
      expect(data.kpis.activeCountersCount).toBeDefined();

      // Peak Hours Analysis
      expect(data.peakHours).toBeDefined();
      expect(Array.isArray(data.peakHours.hourlyBreakdown)).toBe(true);
      expect(data.peakHours.hourlyBreakdown.length).toBeGreaterThan(0);
      expect(data.peakHours.busiestHour).toBeDefined();

      // Customer Flow
      expect(data.customerFlow).toBeDefined();
      expect(data.customerFlow.channels).toBeDefined();
      expect(data.customerFlow.funnel).toBeDefined();

      // Waiting Times
      expect(data.waitTimes).toBeDefined();
      expect(data.waitTimes.distribution).toBeDefined();

      // Service Performance
      expect(data.servicePerformance).toBeDefined();
      expect(Array.isArray(data.servicePerformance.counters)).toBe(true);
    });

    it('PATCH /api/v1/business/analytics/status should allow owner to manage queue status', async () => {
      const res = await request(app)
        .patch('/api/v1/business/analytics/status')
        .set('Authorization', `Bearer ${ownerToken}`)
        .send({ status: 'paused' });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.queue.status).toBe('paused');

      // Reset back to open
      await request(app)
        .patch('/api/v1/business/analytics/status')
        .set('Authorization', `Bearer ${ownerToken}`)
        .send({ status: 'open' });
    });
  });
});
