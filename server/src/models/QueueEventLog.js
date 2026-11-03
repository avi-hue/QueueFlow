const { store, generateId } = require('../db/inMemoryStore');

class QueueEventLogModel {
  constructor(data) {
    this._id = data._id ? data._id.toString() : generateId();
    this.businessId = data.businessId ? data.businessId.toString() : null;
    this.queueId = data.queueId ? data.queueId.toString() : null;
    this.tokenId = data.tokenId ? data.tokenId.toString() : null;
    this.event = data.event;
    this.at = data.at || new Date().toISOString();
    this.meta = data.meta || {};
    this.createdAt = data.createdAt || new Date().toISOString();
  }

  async save() {
    const plain = { ...this };
    store.logs.push(plain);
    return this;
  }

  static async create(data) {
    const log = new QueueEventLogModel(data);
    return await log.save();
  }

  static find(query = {}) {
    const promise = (async () => {
      return store.logs
        .filter((l) => {
          if (query.businessId && String(l.businessId) !== String(query.businessId)) return false;
          if (query.event && l.event !== query.event) return false;
          return true;
        })
        .map((l) => new QueueEventLogModel(l));
    })();
    return promise;
  }
}

module.exports = QueueEventLogModel;
