import Deal from '../models/deal.model.js';
import cloudinary from '../lib/cloudinary.js';

// Create a new deal
export const createDeal = async (req, res) => {
  try {
    const { fullName, email, phoneNumber, walletAddress, message, paymentScreenshot } = req.body;
    
    if (!fullName || !email || !phoneNumber || !walletAddress || !message) {
      return res.status(400).json({ message: 'All fields are required' });
    }

    let paymentScreenshotUrl;
    if (paymentScreenshot && paymentScreenshot.startsWith('data:')) {
      try {
        const uploadResponse = await cloudinary.uploader.upload(paymentScreenshot, { 
          folder: 'deal_screenshots',
          resource_type: 'auto'
        });
        paymentScreenshotUrl = uploadResponse.secure_url;
      } catch (error) {
        return res.status(400).json({ message: 'Failed to upload payment screenshot' });
      }
    } else {
      return res.status(400).json({ message: 'Payment screenshot is required as base64' });
    }

    const deal = new Deal({
      fullName,
      email,
      phoneNumber,
      walletAddress,
      paymentScreenshot: paymentScreenshotUrl,
      message
    });

    await deal.save();

    // Emit socket event for new deal
    if (req.io) {
      req.io.emit('new_deal', deal);
    }

    res.status(201).json({
      message: 'Deal created successfully',
      deal
    });
  } catch (error) {
    console.error('Error creating deal:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Get all deals
export const getAllDeals = async (req, res) => {
  try {
    const deals = await Deal.find().sort({ createdAt: -1 });
    res.status(200).json(deals);
  } catch (error) {
    console.error('Error fetching deals:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Delete a deal
export const deleteDeal = async (req, res) => {
  try {
    const { id } = req.params;
    
    const deal = await Deal.findByIdAndDelete(id);
    
    if (!deal) {
      return res.status(404).json({ message: 'Deal not found' });
    }

    res.status(200).json({ message: 'Deal deleted successfully' });
  } catch (error) {
    console.error('Error deleting deal:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Update deal status
export const updateDeal = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!status || !['pending', 'approved', 'rejected'].includes(status)) {
      return res.status(400).json({ message: 'Valid status is required (pending, approved, rejected)' });
    }

    const deal = await Deal.findByIdAndUpdate(
      id,
      { status },
      { new: true }
    );

    if (!deal) {
      return res.status(404).json({ message: 'Deal not found' });
    }

    // Emit socket event for status update
    if (req.io) {
      req.io.emit('deal_status_updated', deal);
    }

    res.status(200).json({
      message: 'Deal status updated successfully',
      deal
    });
  } catch (error) {
    console.error('Error updating deal:', error);
    res.status(500).json({ message: 'Server error' });
  }
};
