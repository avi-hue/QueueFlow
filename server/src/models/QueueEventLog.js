const mongoose = require('mongoose');

const queueEventLogSchema = new mongoose.Schema(
  {
    businessId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Business',
      required: true,
      index: true
    },
    queueId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Queue',
      required: true
    },
    tokenId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Token',
      required: true
    },
    event: {
      type: String,
      enum: ['joined', 'called', 'started', 'completed', 'skipped', 'cancelled', 'no_show'],
      required: true
    },
    at: {
      type: Date,
      default: Date.now,
      index: true
    },
    meta: {
      type: mongoose.Schema.Types.Mixed,
      default: {}
    }
  },
  {
    timestamps: true
  }
);

const QueueEventLog = mongoose.model('QueueEventLog', queueEventLogSchema);
module.exports = QueueEventLog;
