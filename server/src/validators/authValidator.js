const { z } = require('zod');

const registerSchema = z.object({
  body: z.object({
    name: z.string().min(2, 'Name must be at least 2 characters'),
    email: z.string().email('Valid email address required'),
    password: z.string().min(6, 'Password must be at least 6 characters'),
    phone: z.string().optional(),
    role: z.enum(['customer', 'owner']).optional().default('customer'),
    business: z
      .object({
        name: z.string().min(2, 'Business name required'),
        category: z.string().optional(),
        description: z.string().optional(),
        phone: z.string().optional(),
        address: z.string().min(3, 'Business address required'),
        coordinates: z.array(z.number()).length(2).optional() // [lng, lat]
      })
      .optional()
  })
});

const loginSchema = z.object({
  body: z.object({
    email: z.string().email('Valid email address required'),
    password: z.string().min(1, 'Password is required')
  })
});

const refreshSchema = z.object({
  body: z
    .object({
      refreshToken: z.string().optional()
    })
    .optional()
});

module.exports = {
  registerSchema,
  loginSchema,
  refreshSchema
};
