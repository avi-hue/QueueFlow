const express = require('express');
const router = express.Router();
const businessController = require('../controllers/businessController');
const { authenticate } = require('../middleware/auth');
const { requireRole, requireBusinessAccess } = require('../middleware/role');
const { validate } = require('../middleware/validate');
const {
  updateProfileSchema,
  counterSchema,
  updateCounterSchema,
  staffSchema
} = require('../validators/businessValidator');

// Owner & Staff profile view
router.get(
  '/profile',
  authenticate,
  requireBusinessAccess,
  requireRole('owner', 'staff'),
  businessController.getProfile
);

// Owner profile edit
router.patch(
  '/profile',
  authenticate,
  requireBusinessAccess,
  requireRole('owner'),
  validate(updateProfileSchema),
  businessController.updateProfile
);

// Counters management (Owner only)
router.post(
  '/counters',
  authenticate,
  requireBusinessAccess,
  requireRole('owner'),
  validate(counterSchema),
  businessController.addCounter
);

router.patch(
  '/counters/:id',
  authenticate,
  requireBusinessAccess,
  requireRole('owner'),
  validate(updateCounterSchema),
  businessController.updateCounter
);

router.delete(
  '/counters/:id',
  authenticate,
  requireBusinessAccess,
  requireRole('owner'),
  businessController.deleteCounter
);

// Staff management (Owner only)
router.get(
  '/staff',
  authenticate,
  requireBusinessAccess,
  requireRole('owner', 'staff'),
  businessController.getStaff
);

router.post(
  '/staff',
  authenticate,
  requireBusinessAccess,
  requireRole('owner'),
  validate(staffSchema),
  businessController.addStaff
);

router.delete(
  '/staff/:id',
  authenticate,
  requireBusinessAccess,
  requireRole('owner'),
  businessController.removeStaff
);

module.exports = router;
