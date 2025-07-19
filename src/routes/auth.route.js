import express from 'express';
import { loginAdmin, logoutAdmin, getAdminProfile } from '../controllers/auth.controller.js';
import { protectRoute } from '../middleware/auth.middleware.js';

const router = express.Router();

// Admin authentication routes
router.post('/login', loginAdmin);
router.post('/logout', logoutAdmin);
router.get('/profile', protectRoute, getAdminProfile);

export default router;