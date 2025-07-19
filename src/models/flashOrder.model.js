import mongoose from 'mongoose';

const flashOrderSchema = new mongoose.Schema({
  fullName: {
    type: String,
    required: true,
    trim: true
  },
  whatsappNumber: {
    type: String,
    required: true,
    trim: true
  },
  walletAddress: {
    type: String,
    required: true,
    trim: true
  },
  plan: {
    type: String,
    required: true,
    trim: true
  },
  transactionId: {
    type: String,
    required: true,
    trim: true
  },
  screenshot: {
    type: String, // Cloudinary URL
    required: true
  },
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected'],
    default: 'pending'
  }
}, {
  timestamps: true
});

const FlashOrder = mongoose.model('FlashOrder', flashOrderSchema);

export default FlashOrder;
