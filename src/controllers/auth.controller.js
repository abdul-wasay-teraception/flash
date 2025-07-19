
import User from '../models/user.model.js';
import jwt from 'jsonwebtoken';

// Admin login
export const loginAdmin = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required' });
    }

    // Find admin user
    const admin = await User.findOne({ email, role: 'admin' });
    
    if (!admin) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    // Check password
    const isPasswordValid = await admin.comparePassword(password);
    
    if (!isPasswordValid) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    // Generate JWT token
    const token = jwt.sign(
      { id: admin._id, email: admin.email, role: admin.role },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    // Set cookie
    res.cookie('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
    });

    res.status(200).json({
      message: 'Login successful',
      token: token, // Add token to response for frontend storage
      admin: {
        id: admin._id,
        email: admin.email,
        role: admin.role
      }
    });
  } catch (error) {
    console.error('Error logging in admin:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Admin logout
export const logoutAdmin = async (req, res) => {
  try {
    res.clearCookie('token');
    res.status(200).json({ message: 'Logout successful' });
  } catch (error) {
    console.error('Error logging out admin:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Get admin profile
export const getAdminProfile = async (req, res) => {
  try {
    const admin = await User.findById(req.user.id).select('-password');
    
    if (!admin) {
      return res.status(404).json({ message: 'Admin not found' });
    }

    res.status(200).json(admin);
  } catch (error) {
    console.error('Error fetching admin profile:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Create default admin (used during initialization)
export const createDefaultAdmin = async () => {
  try {
    const existingAdmin = await User.findOne({ email: 'admin@flash.com' });
    
    if (!existingAdmin) {
      const admin = new User({
        email: 'admin@flash.com',
        password: 'flash@123',
        role: 'admin'
      });
      
      await admin.save();
      console.log('✅ Default admin created successfully');
    } else {
      console.log('👤 Default admin already exists');
    }
  } catch (error) {
    console.error('❌ Error creating default admin:', error);
  }
};

