const mongoose = require('mongoose');

const hourlyStatSchema = new mongoose.Schema(
  {
    businessId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Business',
      required: true
    },
    date: {
      type: String, // YYYY-MM-DD
      required: true
    },
    dayOfWeek: {
      type: Number, // 0-6
      required: true
    },
    hour: {
      type: Number, // 0-23
      required: true
    },
    arrivals: {
      type: Number,
      default: 0
    },
    served: {
      type: Number,
      default: 0
    },
    skipped: {
      type: Number,
      default: 0
    },
    cancelled: {
      type: Number,
      default: 0
    },
    avgWaitMin: {
      type: Number,
      default: 0
    },
    avgServiceMin: {
      type: Number,
      default: 0
    },
    peakQueueLength: {
      type: Number,
      default: 0
    },
    activeCounters: {
      type: Number,
      default: 1
    }
  },
  {
    timestamps: true
  }
);

hourlyStatSchema.index({ businessId: 1, date: 1, hour: 1 }, { unique: true });

const HourlyStat = mongoose.model('HourlyStat', hourlyStatSchema);
module.exports = HourlyStat;
