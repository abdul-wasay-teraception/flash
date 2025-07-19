import jwt from 'jsonwebtoken';
import User from '../models/user.model.js';

export const protectRoute = async (req, res, next) => {
    try {
        // Check token from cookies or Authorization header
        let token;
        
        // Check cookies first
        if (req.cookies && req.cookies.token) {
            token = req.cookies.token;
        } 
        // Then check Authorization header
        else if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
            token = req.headers.authorization.split(' ')[1];
        }
        
        if (!token) {
            return res.status(401).json({ message: "Unauthorized - No token provided" });
        }

        let decoded;
        try {
            decoded = jwt.verify(token, process.env.JWT_SECRET);
        } catch (jwtError) {
            return res.status(401).json({ message: "Unauthorized - Invalid or expired token" });
        }

        if (!decoded) {
            return res.status(401).json({ message: "Unauthorized - Invalid token" });
        }
        
        // Find admin user
        const user = await User.findById(decoded.id).select("-password");
        
        if (!user || user.role !== 'admin') {
            return res.status(401).json({ message: "Unauthorized - Admin access required" });
        }
        
        // Set user on request object
        req.user = user;
        req.user.id = user._id.toString();
        
        next();
    } catch (error) {
        console.error("Auth middleware error:", error);
        return res.status(500).json({ message: "Server error" });
    }
};