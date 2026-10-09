const bcrypt = require('bcryptjs');
const crypto = require('crypto');

const generateId = () => crypto.randomBytes(12).toString('hex');

class InMemoryStore {
  constructor() {
    this.users = [];
    this.businesses = [];
    this.queues = [];
    this.tokens = [];
    this.logs = [];
    this.seed();
  }

  reset() {
    this.users = [];
    this.businesses = [];
    this.queues = [];
    this.tokens = [];
    this.logs = [];
  }

  seed() {
    this.reset();

    const ownerId = generateId();
    const clinicId = generateId();
    const staffId = generateId();
    const triageCounterId = generateId();
    const docCounterId = generateId();
    const labCounterId = generateId();

    const salt = bcrypt.genSaltSync(10);
    const defaultPasswordHash = bcrypt.hashSync('Password123!', salt);

    const owner = {
      _id: ownerId,
      name: 'Dr. Robert Vance',
      email: 'owner@queueflow.dev',
      passwordHash: defaultPasswordHash,
      phone: '+1 (555) 234-5678',
      role: 'owner',
      businessId: clinicId,
      notificationPrefs: { approachingThreshold: 3, positionAlerts: true },
      createdAt: new Date().toISOString()
    };

    const clinic = {
      _id: clinicId,
      ownerId: ownerId,
      name: 'Apex Health Clinic',
      category: 'Healthcare',
      description: 'Primary care walk-in clinic and preventive healthcare with smart live queue tracking.',
      phone: '+1 (555) 234-5678',
      address: '350 5th Ave, New York, NY 10118',
      location: {
        type: 'Point',
        coordinates: [-73.98513, 40.748817]
      },
      timezone: 'America/New_York',
      isActive: true,
      settings: {
        maxQueueSize: 50,
        avgServiceTimeDefault: 8,
        approachingThreshold: 3,
        noShowGraceMinutes: 5,
        allowRemoteJoin: true
      },
      counters: [
        { _id: triageCounterId, name: 'Triage Counter A', isActive: true, staffId: staffId },
        { _id: docCounterId, name: 'Consultation Desk 1', isActive: true, staffId: null },
        { _id: labCounterId, name: 'Lab Sampling Station', isActive: true, staffId: null }
      ],
      createdAt: new Date().toISOString()
    };

    const staff = {
      _id: staffId,
      name: 'Nurse Sarah Connor',
      email: 'staff@queueflow.dev',
      passwordHash: defaultPasswordHash,
      phone: '+1 (555) 345-6789',
      role: 'staff',
      businessId: clinicId,
      notificationPrefs: { approachingThreshold: 3, positionAlerts: true },
      createdAt: new Date().toISOString()
    };

    // Cafe Demo
    const cafeOwnerId = generateId();
    const cafeId = generateId();

    const cafeOwner = {
      _id: cafeOwnerId,
      name: 'Marco Rossi',
      email: 'cafe@queueflow.dev',
      passwordHash: defaultPasswordHash,
      phone: '+1 (555) 876-5432',
      role: 'owner',
      businessId: cafeId,
      notificationPrefs: { approachingThreshold: 2, positionAlerts: true },
      createdAt: new Date().toISOString()
    };

    const cafe = {
      _id: cafeId,
      ownerId: cafeOwnerId,
      name: 'Urban Grind Artisanal Coffee',
      category: 'Food & Beverage',
      description: 'Single-origin espresso bar & organic bakery. Skip the sidewalk line.',
      phone: '+1 (555) 876-5432',
      address: '72 Spring St, New York, NY 10012',
      location: {
        type: 'Point',
        coordinates: [-73.99723, 40.72234]
      },
      timezone: 'America/New_York',
      isActive: true,
      settings: {
        maxQueueSize: 30,
        avgServiceTimeDefault: 3,
        approachingThreshold: 2,
        noShowGraceMinutes: 3,
        allowRemoteJoin: true
      },
      counters: [
        { _id: generateId(), name: 'Espresso Bar 1', isActive: true, staffId: null },
        { _id: generateId(), name: 'Pastry & Mobile Pickup', isActive: true, staffId: null }
      ],
      createdAt: new Date().toISOString()
    };

    // Customers
    const customer = {
      _id: generateId(),
      name: 'Alex Turner',
      email: 'customer@queueflow.dev',
      passwordHash: defaultPasswordHash,
      phone: '+1 (555) 999-1122',
      role: 'customer',
      businessId: null,
      notificationPrefs: { approachingThreshold: 3, positionAlerts: true },
      createdAt: new Date().toISOString()
    };

    const customer2 = {
      _id: generateId(),
      name: 'Jane Doe',
      email: 'jane@queueflow.dev',
      passwordHash: defaultPasswordHash,
      phone: '+1 (555) 999-3344',
      role: 'customer',
      businessId: null,
      notificationPrefs: { approachingThreshold: 2, positionAlerts: true },
      createdAt: new Date().toISOString()
    };

    // Seed default Queue & Tokens for Clinic
    const todayStr = new Date().toISOString().split('T')[0];
    const clinicQueueId = generateId();

    const clinicQueue = {
      _id: clinicQueueId,
      businessId: clinicId,
      date: todayStr,
      status: 'open',
      tokenSeq: 3,
      nowServing: [
        { counterId: triageCounterId, tokenId: 'token_001' }
      ],
      createdAt: new Date().toISOString()
    };

    const token1 = {
      _id: 'token_001',
      queueId: clinicQueueId,
      businessId: clinicId,
      userId: customer._id,
      walkInName: null,
      tokenNumber: 1,
      tokenLabel: 'A-001',
      status: 'called',
      counterId: triageCounterId,
      joinedAt: new Date(Date.now() - 15 * 60000).toISOString(),
      calledAt: new Date(Date.now() - 2 * 60000).toISOString(),
      serviceStartedAt: null,
      completedAt: null,
      estimatedWaitAtJoin: 0,
      source: 'remote',
      notifiedFlags: { approachingSent: true, calledSent: true, skippedSent: false },
      createdAt: new Date(Date.now() - 15 * 60000).toISOString()
    };

    const token2 = {
      _id: 'token_002',
      queueId: clinicQueueId,
      businessId: clinicId,
      userId: customer2._id,
      walkInName: null,
      tokenNumber: 2,
      tokenLabel: 'A-002',
      status: 'waiting',
      counterId: null,
      joinedAt: new Date(Date.now() - 10 * 60000).toISOString(),
      calledAt: null,
      serviceStartedAt: null,
      completedAt: null,
      estimatedWaitAtJoin: 8,
      source: 'remote',
      notifiedFlags: { approachingSent: false, calledSent: false, skippedSent: false },
      createdAt: new Date(Date.now() - 10 * 60000).toISOString()
    };

    const token3 = {
      _id: 'token_003',
      queueId: clinicQueueId,
      businessId: clinicId,
      userId: null,
      walkInName: 'Walk-in John Smith',
      tokenNumber: 3,
      tokenLabel: 'A-003',
      status: 'waiting',
      counterId: null,
      joinedAt: new Date(Date.now() - 5 * 60000).toISOString(),
      calledAt: null,
      serviceStartedAt: null,
      completedAt: null,
      estimatedWaitAtJoin: 16,
      source: 'walk_in',
      notifiedFlags: { approachingSent: false, calledSent: false, skippedSent: false },
      createdAt: new Date(Date.now() - 5 * 60000).toISOString()
    };

    this.users.push(owner, staff, cafeOwner, customer, customer2);
    this.businesses.push(clinic, cafe);
    this.queues.push(clinicQueue);
    this.tokens.push(token1, token2, token3);
  }
}

const store = new InMemoryStore();

class UserModel {
  constructor(data) {
    this._id = data._id ? data._id.toString() : generateId();
    this.name = data.name;
    this.email = data.email?.toLowerCase();
    this.phone = data.phone || '';
    this.passwordHash = data.passwordHash;
    this.role = data.role || 'customer';
    this.businessId = data.businessId ? data.businessId.toString() : null;
    this.notificationPrefs = data.notificationPrefs || { approachingThreshold: 3, positionAlerts: true };
    this.createdAt = data.createdAt || new Date().toISOString();
  }

  async matchPassword(password) {
    return await bcrypt.compare(password, this.passwordHash);
  }

  toJSON() {
    const copy = { ...this };
    delete copy.passwordHash;
    return copy;
  }

  toObject() {
    const copy = { ...this };
    return copy;
  }

  async save() {
    if (this.passwordHash && !this.passwordHash.startsWith('$2')) {
      const salt = await bcrypt.genSalt(10);
      this.passwordHash = await bcrypt.hash(this.passwordHash, salt);
    }
    const idx = store.users.findIndex((u) => u._id === this._id);
    const plainObj = { ...this };
    if (idx >= 0) {
      store.users[idx] = plainObj;
    } else {
      store.users.push(plainObj);
    }
    return this;
  }

  static findOne(query) {
    const promise = (async () => {
      const found = store.users.find((u) => {
        if (query.email && u.email.toLowerCase() !== query.email.toLowerCase()) return false;
        if (query._id && u._id !== query._id.toString()) return false;
        if (query.businessId && String(u.businessId) !== String(query.businessId)) return false;
        if (query.role && u.role !== query.role) return false;
        return true;
      });
      return found ? new UserModel(found) : null;
    })();

    promise.select = function () {
      return promise;
    };
    return promise;
  }

  static findById(id) {
    const promise = (async () => {
      const found = store.users.find((u) => u._id === id?.toString());
      if (!found) return null;
      const user = new UserModel(found);
      user.populate = async function (field) {
        if (field === 'businessId' && user.businessId) {
          const biz = await BusinessModel.findById(user.businessId);
          user.businessId = biz;
        }
        return user;
      };
      return user;
    })();

    promise.populate = function (field) {
      return (async () => {
        const user = await promise;
        if (user && user.populate) {
          return await user.populate(field);
        }
        return user;
      })();
    };
    return promise;
  }

  static find(query = {}) {
    const promise = (async () => {
      return store.users
        .filter((u) => {
          if (query.businessId && String(u.businessId) !== String(query.businessId)) return false;
          if (query.role && u.role !== query.role) return false;
          return true;
        })
        .map((u) => new UserModel(u));
    })();

    promise.select = function () {
      return promise;
    };
    return promise;
  }

  static async findByIdAndDelete(id) {
    const idx = store.users.findIndex((u) => u._id === id?.toString());
    if (idx >= 0) {
      const deleted = store.users.splice(idx, 1)[0];
      return new UserModel(deleted);
    }
    return null;
  }

  static async deleteMany() {
    store.users = [];
    return { deletedCount: 0 };
  }
}

class BusinessModel {
  constructor(data) {
    this._id = data._id ? data._id.toString() : generateId();
    this.ownerId = data.ownerId ? data.ownerId.toString() : null;
    this.name = data.name;
    this.category = data.category || 'Other';
    this.description = data.description || '';
    this.phone = data.phone || '';
    this.address = data.address;
    this.location = data.location || { type: 'Point', coordinates: [0, 0] };
    this.timezone = data.timezone || 'UTC';
    this.isActive = data.isActive !== undefined ? data.isActive : true;

    const rawSettings = data.settings || {};
    this.settings = {
      maxQueueSize: rawSettings.maxQueueSize || 0,
      avgServiceTimeDefault: rawSettings.avgServiceTimeDefault || 5,
      approachingThreshold: rawSettings.approachingThreshold || 3,
      noShowGraceMinutes: rawSettings.noShowGraceMinutes || 5,
      allowRemoteJoin: rawSettings.allowRemoteJoin !== false,
      toObject: function () {
        return {
          maxQueueSize: this.maxQueueSize,
          avgServiceTimeDefault: this.avgServiceTimeDefault,
          approachingThreshold: this.approachingThreshold,
          noShowGraceMinutes: this.noShowGraceMinutes,
          allowRemoteJoin: this.allowRemoteJoin
        };
      }
    };

    const counterList = (data.counters || []).map((c) => ({
      _id: c._id ? c._id.toString() : generateId(),
      name: c.name,
      isActive: c.isActive !== undefined ? c.isActive : true,
      staffId: c.staffId ? c.staffId.toString() : null
    }));

    counterList.id = function (counterId) {
      return this.find((c) => c._id === counterId?.toString()) || null;
    };
    counterList.pull = function (counterId) {
      const idx = this.findIndex((c) => c._id === counterId?.toString());
      if (idx >= 0) {
        this.splice(idx, 1);
      }
    };

    // Override push to auto-generate _id
    const origPush = counterList.push;
    counterList.push = function (c) {
      if (!c._id) {
        c._id = generateId();
      }
      return origPush.call(this, c);
    };

    this.counters = counterList;
    this.createdAt = data.createdAt || new Date().toISOString();
  }

  toObject() {
    return JSON.parse(JSON.stringify(this));
  }

  async save() {
    this.counters.forEach((c) => {
      if (!c._id) c._id = generateId();
    });

    const plainObj = {
      _id: this._id,
      ownerId: this.ownerId,
      name: this.name,
      category: this.category,
      description: this.description,
      phone: this.phone,
      address: this.address,
      location: this.location,
      timezone: this.timezone,
      isActive: this.isActive,
      settings: this.settings.toObject ? this.settings.toObject() : this.settings,
      counters: this.counters.map((c) => ({
        _id: c._id,
        name: c.name,
        isActive: c.isActive,
        staffId: c.staffId
      })),
      createdAt: this.createdAt
    };

    const idx = store.businesses.findIndex((b) => b._id === this._id);
    if (idx >= 0) {
      store.businesses[idx] = plainObj;
    } else {
      store.businesses.push(plainObj);
    }
    return this;
  }

  static findById(id) {
    const promise = (async () => {
      const found = store.businesses.find((b) => b._id === id?.toString());
      if (!found) return null;
      return new BusinessModel(found);
    })();

    promise.populate = function () {
      return promise;
    };
    return promise;
  }

  static find(query = {}) {
    const promise = (async () => {
      return store.businesses.map((b) => new BusinessModel(b));
    })();
    return promise;
  }

  static async findOne(query) {
    const found = store.businesses.find((b) => {
      if (query._id && b._id !== query._id.toString()) return false;
      if (query.ownerId && String(b.ownerId) !== String(query.ownerId)) return false;
      return true;
    });
    if (!found) return null;
    return new BusinessModel(found);
  }

  static async updateOne(filter, update) {
    return { modifiedCount: 1 };
  }

  static async deleteMany() {
    store.businesses = [];
    return { deletedCount: 0 };
  }
}

class QueueModel {
  constructor(data) {
    this._id = data._id ? data._id.toString() : generateId();
    this.businessId = data.businessId ? data.businessId.toString() : null;
    this.date = data.date || new Date().toISOString().split('T')[0];
    this.status = data.status || 'open';
    this.tokenSeq = data.tokenSeq !== undefined ? data.tokenSeq : 0;
    this.nowServing = (data.nowServing || []).map((ns) => ({
      counterId: ns.counterId ? ns.counterId.toString() : null,
      tokenId: ns.tokenId ? ns.tokenId.toString() : null
    }));
    this.createdAt = data.createdAt || new Date().toISOString();
  }

  toObject() {
    return JSON.parse(JSON.stringify(this));
  }

  async save() {
    const plainObj = {
      _id: this._id,
      businessId: this.businessId,
      date: this.date,
      status: this.status,
      tokenSeq: this.tokenSeq,
      nowServing: this.nowServing.map((ns) => ({
        counterId: ns.counterId,
        tokenId: ns.tokenId
      })),
      createdAt: this.createdAt
    };

    const idx = store.queues.findIndex((q) => q._id === this._id);
    if (idx >= 0) {
      store.queues[idx] = plainObj;
    } else {
      store.queues.push(plainObj);
    }
    return this;
  }

  static findOne(query) {
    const promise = (async () => {
      const found = store.queues.find((q) => {
        if (query.businessId && String(q.businessId) !== String(query.businessId)) return false;
        if (query.date && q.date !== query.date) return false;
        if (query._id && q._id !== query._id.toString()) return false;
        return true;
      });
      return found ? new QueueModel(found) : null;
    })();
    return promise;
  }

  static findById(id) {
    const promise = (async () => {
      const found = store.queues.find((q) => q._id === id?.toString());
      return found ? new QueueModel(found) : null;
    })();
    return promise;
  }

  static find(query = {}) {
    const promise = (async () => {
      return store.queues
        .filter((q) => {
          if (query.businessId && String(q.businessId) !== String(query.businessId)) return false;
          if (query.date && q.date !== query.date) return false;
          return true;
        })
        .map((q) => new QueueModel(q));
    })();
    return promise;
  }

  static async deleteMany() {
    store.queues = [];
    return { deletedCount: 0 };
  }
}

class TokenModel {
  constructor(data) {
    this._id = data._id ? data._id.toString() : generateId();
    this.queueId = data.queueId ? data.queueId.toString() : null;
    this.businessId = data.businessId ? data.businessId.toString() : null;
    this.userId = data.userId ? data.userId.toString() : null;
    this.walkInName = data.walkInName || null;
    this.tokenNumber = data.tokenNumber;
    this.tokenLabel = data.tokenLabel;
    this.status = data.status || 'waiting';
    this.counterId = data.counterId ? data.counterId.toString() : null;
    this.joinedAt = data.joinedAt || new Date().toISOString();
    this.calledAt = data.calledAt || null;
    this.serviceStartedAt = data.serviceStartedAt || null;
    this.completedAt = data.completedAt || null;
    this.estimatedWaitAtJoin = data.estimatedWaitAtJoin || 0;
    this.source = data.source || 'remote';
    this.notifiedFlags = data.notifiedFlags || { approachingSent: false, calledSent: false, skippedSent: false };
    this.createdAt = data.createdAt || new Date().toISOString();
  }

  toObject() {
    return JSON.parse(JSON.stringify(this));
  }

  async save() {
    const plainObj = {
      _id: this._id,
      queueId: this.queueId,
      businessId: this.businessId,
      userId: this.userId,
      walkInName: this.walkInName,
      tokenNumber: this.tokenNumber,
      tokenLabel: this.tokenLabel,
      status: this.status,
      counterId: this.counterId,
      joinedAt: this.joinedAt,
      calledAt: this.calledAt,
      serviceStartedAt: this.serviceStartedAt,
      completedAt: this.completedAt,
      estimatedWaitAtJoin: this.estimatedWaitAtJoin,
      source: this.source,
      notifiedFlags: this.notifiedFlags,
      createdAt: this.createdAt
    };

    const idx = store.tokens.findIndex((t) => t._id === this._id);
    if (idx >= 0) {
      store.tokens[idx] = plainObj;
    } else {
      store.tokens.push(plainObj);
    }
    return this;
  }

  static findOne(query) {
    const promise = (async () => {
      const found = store.tokens.find((t) => {
        if (query._id && t._id !== query._id.toString()) return false;
        if (query.queueId && String(t.queueId) !== String(query.queueId)) return false;
        if (query.businessId && String(t.businessId) !== String(query.businessId)) return false;
        if (query.userId && String(t.userId) !== String(query.userId)) return false;
        if (query.tokenNumber && t.tokenNumber !== query.tokenNumber) return false;
        if (query.status) {
          if (typeof query.status === 'object' && query.status !== null && Array.isArray(query.status['$in'])) {
            if (!query.status['$in'].includes(t.status)) return false;
          } else if (t.status !== query.status) {
            return false;
          }
        }
        return true;
      });
      if (!found) return null;

      const token = new TokenModel(found);
      token.populate = async function (field) {
        if (field === 'businessId' && token.businessId) {
          token.businessId = await BusinessModel.findById(token.businessId);
        } else if (field === 'userId' && token.userId) {
          token.userId = await UserModel.findById(token.userId);
        }
        return token;
      };
      return token;
    })();

    promise.populate = function (field) {
      return (async () => {
        const token = await promise;
        if (token && token.populate) {
          return await token.populate(field);
        }
        return token;
      })();
    };

    return promise;
  }

  static findById(id) {
    return TokenModel.findOne({ _id: id });
  }

  static find(query = {}) {
    const promise = (async () => {
      const results = store.tokens.filter((t) => {
        if (query._id && t._id !== query._id.toString()) return false;
        if (query.queueId && String(t.queueId) !== String(query.queueId)) return false;
        if (query.businessId && String(t.businessId) !== String(query.businessId)) return false;
        if (query.userId && String(t.userId) !== String(query.userId)) return false;
        if (query.status) {
          if (typeof query.status === 'object' && query.status !== null && Array.isArray(query.status['$in'])) {
            if (!query.status['$in'].includes(t.status)) return false;
          } else if (t.status !== query.status) {
            return false;
          }
        }
        return true;
      });

      return results.sort((a, b) => a.tokenNumber - b.tokenNumber).map((t) => new TokenModel(t));
    })();

    promise.sort = function () {
      return promise;
    };
    return promise;
  }

  static async countDocuments(query = {}) {
    const list = await TokenModel.find(query);
    return list.length;
  }

  static async deleteMany() {
    store.tokens = [];
    return { deletedCount: 0 };
  }
}

module.exports = {
  store,
  User: UserModel,
  Business: BusinessModel,
  Queue: QueueModel,
  Token: TokenModel,
  generateId
};

