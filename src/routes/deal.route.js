import express from 'express';
import { createDeal, getAllDeals, deleteDeal, updateDeal } from '../controllers/deal.controller.js';
import { protectRoute } from '../middleware/auth.middleware.js';

const router = express.Router();

// Public route to create a deal
router.post('/', createDeal);

// Protected routes (admin only)
router.get('/', protectRoute, getAllDeals);
router.put('/:id', protectRoute, updateDeal);
router.delete('/:id', protectRoute, deleteDeal);

export default router;
