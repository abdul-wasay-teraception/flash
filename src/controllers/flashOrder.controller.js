import FlashOrder from '../models/flashOrder.model.js';
import cloudinary from '../lib/cloudinary.js';

// Create a new flash order
export const createFlashOrder = async (req, res) => {
  try {
    const { fullName, whatsappNumber, walletAddress, plan, transactionId, screenshot } = req.body;
    
    if (!fullName || !whatsappNumber || !walletAddress || !plan || !transactionId) {
      return res.status(400).json({ message: 'All fields are required' });
    }

    let screenshotUrl;
    if (screenshot && screenshot.startsWith('data:')) {
      try {
        const uploadResponse = await cloudinary.uploader.upload(screenshot, { 
          folder: 'flash_order_screenshots',
          resource_type: 'auto'
        });
        screenshotUrl = uploadResponse.secure_url;
      } catch (error) {
        return res.status(400).json({ message: 'Failed to upload screenshot' });
      }
    } else {
      return res.status(400).json({ message: 'Screenshot is required as base64' });
    }

    const flashOrder = new FlashOrder({
      fullName,
      whatsappNumber,
      walletAddress,
      plan,
      transactionId,
      screenshot: screenshotUrl
    });

    await flashOrder.save();

    // Emit socket event for new flash order
    if (req.io) {
      req.io.emit('new_flash_order', flashOrder);
    }

    res.status(201).json({
      message: 'Flash order created successfully',
      flashOrder
    });
  } catch (error) {
    console.error('Error creating flash order:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Get all flash orders
export const getAllFlashOrders = async (req, res) => {
  try {
    const flashOrders = await FlashOrder.find().sort({ createdAt: -1 });
    res.status(200).json(flashOrders);
  } catch (error) {
    console.error('Error fetching flash orders:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Delete a flash order
export const deleteFlashOrder = async (req, res) => {
  try {
    const { id } = req.params;
    
    const flashOrder = await FlashOrder.findByIdAndDelete(id);
    
    if (!flashOrder) {
      return res.status(404).json({ message: 'Flash order not found' });
    }

    res.status(200).json({ message: 'Flash order deleted successfully' });
  } catch (error) {
    console.error('Error deleting flash order:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Update flash order status
export const updateFlashOrder = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!status || !['pending', 'approved', 'rejected'].includes(status)) {
      return res.status(400).json({ message: 'Valid status is required (pending, approved, rejected)' });
    }

    const flashOrder = await FlashOrder.findByIdAndUpdate(
      id,
      { status },
      { new: true }
    );

    if (!flashOrder) {
      return res.status(404).json({ message: 'Flash order not found' });
    }

    // Emit socket event for status update
    if (req.io) {
      req.io.emit('flash_order_status_updated', flashOrder);
    }

    res.status(200).json({
      message: 'Flash order status updated successfully',
      flashOrder
    });
  } catch (error) {
    console.error('Error updating flash order:', error);
    res.status(500).json({ message: 'Server error' });
  }
};
