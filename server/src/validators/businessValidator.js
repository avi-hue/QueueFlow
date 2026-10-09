const { z } = require('zod');

const updateProfileSchema = z.object({
  body: z.object({
    name: z.string().min(2).optional(),
    category: z.string().optional(),
    description: z.string().optional(),
    phone: z.string().optional(),
    address: z.string().min(3).optional(),
    location: z
      .object({
        type: z.literal('Point').optional(),
        coordinates: z.array(z.number()).length(2)
      })
      .optional(),
    openingHours: z
      .array(
        z.object({
          day: z.number().min(0).max(6),
          open: z.string(),
          close: z.string(),
          isClosed: z.boolean().optional()
        })
      )
      .optional(),
    timezone: z.string().optional(),
    isActive: z.boolean().optional(),
    settings: z
      .object({
        maxQueueSize: z.number().min(0).optional(),
        avgServiceTimeDefault: z.number().min(1).optional(),
        approachingThreshold: z.number().min(1).optional(),
        noShowGraceMinutes: z.number().min(1).optional(),
        allowRemoteJoin: z.boolean().optional()
      })
      .optional()
  })
});

const counterSchema = z.object({
  body: z.object({
    name: z.string().min(1, 'Counter name is required'),
    isActive: z.boolean().optional().default(true),
    staffId: z.string().nullable().optional()
  })
});

const updateCounterSchema = z.object({
  params: z.object({
    id: z.string().min(1, 'Counter ID required')
  }),
  body: z.object({
    name: z.string().min(1).optional(),
    isActive: z.boolean().optional(),
    staffId: z.string().nullable().optional()
  })
});

const staffSchema = z.object({
  body: z.object({
    name: z.string().min(2, 'Name is required'),
    email: z.string().email('Valid email required'),
    password: z.string().min(6, 'Password must be at least 6 characters'),
    phone: z.string().optional()
  })
});

module.exports = {
  updateProfileSchema,
  counterSchema,
  updateCounterSchema,
  staffSchema
};
