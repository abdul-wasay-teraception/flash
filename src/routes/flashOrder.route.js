import express from 'express';
import { createFlashOrder, getAllFlashOrders, deleteFlashOrder, updateFlashOrder } from '../controllers/flashOrder.controller.js';
import { protectRoute } from '../middleware/auth.middleware.js';

const router = express.Router();

// Public route to create a flash order
router.post('/', createFlashOrder);

// Protected routes (admin only)
router.get('/', protectRoute, getAllFlashOrders);
router.put('/:id', protectRoute, updateFlashOrder);
router.delete('/:id', protectRoute, deleteFlashOrder);

export default router;
