const express = require('express');
const router = express.Router();
const businessController = require('../controllers/businessController');

// Public business detail
router.get('/:id', businessController.getPublicBusiness);

module.exports = router;
