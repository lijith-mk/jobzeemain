const Order = require('../models/Order');
const Cart = require('../models/Cart');
const Product = require('../models/Product');
const User = require('../models/User');
const Employer = require('../models/Employer');
const Address = require('../models/Address');
const Razorpay = require('razorpay');
const crypto = require('crypto');
const ShopPayment = require('../models/ShopPayment');
const mongoose = require('mongoose');
const { sendOrderConfirmationEmail } = require('../utils/emailService');

// Initialize Razorpay instance
function getRazorpayInstance() {
  const keyId = process.env.RAZORPAY_KEY_ID;
  const keySecret = process.env.RAZORPAY_KEY_SECRET;
  
  if (!keyId || !keySecret) {
    throw new Error('Razorpay keys are not configured. Please check your environment variables.');
  }
  
  // Validate key format (basic validation)
  if (keyId.length < 10 || keySecret.length < 10) {
    throw new Error('Invalid Razorpay keys format. Please check your environment variables.');
  }
  
  try {
    return new Razorpay({ key_id: keyId, key_secret: keySecret });
  } catch (error) {
    throw new Error('Failed to initialize Razorpay instance: ' + error.message);
  }
}

// Normalize incoming address payloads to the new flat shape
function normalizeAddress(input, { requireEmail } = { requireEmail: false }) {
  if (!input) return null;
  // Support old shape { name, phone, address: { street, city, state, country, zipCode } }
  if (input.address) {
    return {
      fullName: input.name || input.fullName,
      email: input.email,
      phone: input.phone,
      street: input.address.street,
      city: input.address.city,
      state: input.address.state,
      pincode: input.address.zipCode || input.pincode,
      country: input.address.country || input.country || 'India',
      landmark: input.landmark
    };
  }
  // Assume already in new shape
  return {
    fullName: input.fullName || input.name,
    email: input.email,
    phone: input.phone,
    street: input.street,
    city: input.city,
    state: input.state,
    pincode: input.pincode || input.zipCode,
    country: input.country || 'India',
    landmark: input.landmark
  };
}

function isAddressComplete(addr, { requireEmail } = { requireEmail: false }) {
  if (!addr) return false;
  const required = ['fullName', 'phone', 'street', 'city', 'state', 'pincode', 'country'];
  if (requireEmail) required.push('email');
  return required.every((k) => typeof addr[k] === 'string' && addr[k].trim().length > 0);
}

// Helper function to get user info from request
const getUserInfo = (req) => {
  // Check if it's an employer (either through req.employer or req.user with employer role)
  if (req.employer) {
    return { id: req.employer.id, type: 'employer', data: req.employer };
  }
  if (req.user && req.user.role === 'employer') {
    return { id: req.user.id, type: 'employer', data: req.user };
  }
  if (req.user) {
    return { id: req.user.id, type: 'user', data: req.user };
  }
  return null;
};

// POST /api/orders/checkout - Create order from cart
const checkout = async (req, res) => {
  try {
    const userInfo = getUserInfo(req);
    console.log('Debug - getUserInfo result:', userInfo);
    console.log('Debug - req.user:', req.user);
    console.log('Debug - req.employer:', req.employer);
    
    if (!userInfo) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
    }

  const { shippingAddress: inShipping, billingAddress: inBilling, orderNotes, paymentMethod = 'razorpay' } = req.body;

    // Normalize/resolve addresses (use default saved address if not provided)
    let shippingAddress = normalizeAddress(inShipping);
    let billingAddress = normalizeAddress(inBilling);
    if (!shippingAddress) {
      const defAddr = await Address.getDefaultAddress(userInfo.id, userInfo.type);
      if (defAddr) {
        shippingAddress = normalizeAddress(defAddr);
      }
    }
    if (!billingAddress) {
      const defAddr = await Address.getDefaultAddress(userInfo.id, userInfo.type);
      if (defAddr) {
        // include email from customerInfo later if missing
        billingAddress = normalizeAddress({ ...defAddr.toObject?.() || defAddr, email: undefined });
      }
    }

    if (!isAddressComplete(shippingAddress)) {
      return res.status(400).json({ success: false, message: 'Complete shipping address is required' });
    }

    // Get user's active cart
    const cart = await Cart.findActiveCart(userInfo.id, userInfo.type);
    if (!cart || cart.items.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Cart is empty'
      });
    }

    // Verify product availability and stock
    for (const item of cart.items) {
      const product = await Product.findById(item.product);
      if (!product || !product.isAvailable) {
        return res.status(400).json({
          success: false,
          message: `Product ${item.productSnapshot?.name || item.product} is no longer available`
        });
      }

      if (!product.isUnlimited && product.stock < item.quantity) {
        return res.status(400).json({
          success: false,
          message: `Only ${product.stock} units of ${product.name} available`
        });
      }
    }

    // Get customer info
    let customerInfo;
    if (userInfo.type === 'user') {
      const user = await User.findById(userInfo.id);
      customerInfo = {
        name: user?.name || 'Unknown User',
        email: user?.email || '',
        phone: user?.phone || ''
      };
    } else {
      const employer = await Employer.findById(userInfo.id);
      
      // Debug logging
      console.log('Debug - Employer data (regular checkout):', {
        id: employer?._id,
        companyName: employer?.companyName,
        companyEmail: employer?.companyEmail,
        contactPersonName: employer?.contactPersonName,
        companyPhone: employer?.companyPhone,
        contactPersonPhone: employer?.contactPersonPhone
      });
      
      customerInfo = {
        name: employer?.contactPersonName || employer?.companyName || 'Unknown Employer',
        email: employer?.companyEmail || employer?.contactPersonEmail || 'employer@example.com',
        phone: employer?.companyPhone || employer?.contactPersonPhone || ''
      };
      
      // Debug logging
      console.log('Debug - Extracted customerInfo (regular checkout):', customerInfo);
    }

    // Ensure billing email fallback from customer info
    if (billingAddress && !billingAddress.email) {
      billingAddress.email = customerInfo?.email || '';
    }
    if (!isAddressComplete(billingAddress, { requireEmail: true })) {
      return res.status(400).json({ success: false, message: 'Complete billing address with email is required' });
    }

    // Create order items from cart
    const orderItems = cart.items.map(item => ({
      product: item.product,
      quantity: item.quantity,
      unitPrice: item.discountedPrice || item.price,
      totalPrice: (item.discountedPrice || item.price) * item.quantity,
      productSnapshot: {
        name: item.productSnapshot?.name || '',
        description: item.productSnapshot?.description || '',
        image: item.productSnapshot?.image || '',
        category: item.productSnapshot?.category || '',
        productType: item.productSnapshot?.productType || 'digital'
      }
    }));

    // Create Razorpay order
    let razorpayOrderId = null;
    let shopPayment = null; // Define shopPayment here
    if (paymentMethod === 'razorpay') {
      try {
        const razorpay = getRazorpayInstance();
        const currency = 'INR';
        const amountInPaise = Math.max(1, Math.round((cart.total || 0) * 100));
        if (!Number.isFinite(amountInPaise) || amountInPaise <= 0) {
          return res.status(400).json({ success: false, message: 'Invalid payable amount' });
        }

        const razorpayOrder = await razorpay.orders.create({
          amount: amountInPaise,
          currency,
          receipt: `order_${Date.now()}`,
          notes: {
            userId: String(userInfo.id),
            userType: userInfo.type,
            cartId: String(cart._id)
          }
        });

        razorpayOrderId = razorpayOrder.id;

        // Record ShopPayment transaction (initiated)
        try {
          shopPayment = await ShopPayment.create({
            [userInfo.type]: userInfo.id,
            userType: userInfo.type,
            amount: cart.total,
            currency,
            gateway: 'razorpay',
            razorpayOrderId: razorpayOrderId,
            status: 'initiated',
            userAgent: req.get('User-Agent'),
            ipAddress: req.ip || req.connection.remoteAddress,
            notes: { cartId: String(cart._id) }
          });
        } catch (e) {
          console.warn('Failed to create ShopPayment record:', e?.message || e);
        }
      } catch (razorpayError) {
        console.error('Razorpay create order failed:', {
          message: razorpayError?.message,
          code: razorpayError?.statusCode || razorpayError?.status,
          data: razorpayError?.error || razorpayError?.response?.data
        });
        return res.status(502).json({
          success: false,
          message: 'Payment gateway error while creating order',
          details: razorpayError?.error?.description || razorpayError?.message || 'Unknown error'
        });
      }
    }

    // Create order
    const orderData = {
      [userInfo.type]: userInfo.id,
      userType: userInfo.type,
      customerInfo,
      items: orderItems,
      subtotal: cart.subtotal,
      discount: cart.discount,
      tax: cart.tax,
      shippingCost: cart.shippingInfo?.cost || 0,
      total: cart.total,
      currency: cart.currency,
      appliedCoupons: cart.appliedCoupons,
      billingAddress,
      shippingAddress,
      orderNotes: orderNotes || '',
      paymentInfo: {
        method: paymentMethod,
        status: 'pending',
        razorpayOrderId
      },
      shippingInfo: {
        method: cart.shippingInfo?.method || 'standard'
      },
      source: 'web',
      userAgent: req.get('User-Agent'),
      ipAddress: req.ip || req.connection.remoteAddress
    };

    const order = new Order(orderData);
    
    // Debug logging
    console.log('Debug - Order object before save (regular checkout):', {
      employerId: order.employer,
      userType: order.userType,
      customerInfo: order.customerInfo,
      billingAddress: order.billingAddress,
      shippingAddress: order.shippingAddress
    });
    
    await order.save();

    // Backfill orderId into ShopPayment if exists
    if (razorpayOrderId && shopPayment) {
      try {
        await ShopPayment.findByIdAndUpdate(
          shopPayment._id,
          { $set: { orderId: order._id } }
        );
      } catch (e) {
        console.warn('Failed to update ShopPayment with orderId:', e?.message || e);
      }
    }

    // For Razorpay, return order details for frontend
    if (paymentMethod === 'razorpay') {
      return res.status(201).json({
        success: true,
        message: 'Order created successfully',
        order: {
          id: order._id,
          orderNumber: order.orderNumber,
          total: order.total,
          currency: order.currency,
          razorpayOrderId,
          razorpayKeyId: process.env.RAZORPAY_KEY_ID
        }
      });
    }

    // For other payment methods, mark as pending
    res.status(201).json({
      success: true,
      message: 'Order created successfully',
      order: {
        id: order._id,
        orderNumber: order.orderNumber,
        status: order.status,
        total: order.total,
        currency: order.currency
      }
    });
  } catch (error) {
    console.error('Error during checkout:', error);
    res.status(500).json({
      success: false,
      message: 'Checkout failed. Please try again later.'
    });
  }
};

// POST /api/orders/verify-payment - Verify Razorpay payment
const verifyPayment = async (req, res) => {
  try {
    const userInfo = getUserInfo(req);
    if (!userInfo) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
    }

    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
      orderId
    } = req.body;

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature || !orderId) {
      return res.status(400).json({
        success: false,
        message: 'Missing payment verification parameters'
      });
    }

    // Verify signature
    const body = `${razorpay_order_id}|${razorpay_payment_id}`;
    const expectedSignature = crypto
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
      .update(body.toString())
      .digest('hex');

    if (expectedSignature !== razorpay_signature) {
      try {
        const order = await Order.findOne({ _id: orderId, [userInfo.type]: userInfo.id });
        if (order) {
          await ShopPayment.findOneAndUpdate(
            { orderId: order._id, razorpayOrderId: razorpay_order_id },
            { $set: { status: 'failed', failedAt: new Date(), failureReason: 'Signature verification failed', razorpayPaymentId: razorpay_payment_id, razorpaySignature: razorpay_signature } }
          );
        }
      } catch (_) {}
      return res.status(400).json({
        success: false,
        message: 'Payment verification failed'
      });
    }

    // Find and update order
    const order = await Order.findOne({
      _id: orderId,
      [userInfo.type]: userInfo.id,
      'paymentInfo.razorpayOrderId': razorpay_order_id
    });

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }

    // Update payment status and ShopPayment in parallel
    const [updatedOrder] = await Promise.all([
      // Update order payment status
      Order.findByIdAndUpdate(
        order._id,
        {
          $set: {
            'paymentInfo.status': 'paid',
            'paymentInfo.paidAt': new Date(),
            'paymentInfo.transactionId': razorpay_payment_id,
            'paymentInfo.razorpayPaymentId': razorpay_payment_id,
            'paymentInfo.razorpaySignature': razorpay_signature
          },
          $push: {
            timeline: {
              status: 'confirmed',
              message: 'Payment received and order confirmed',
              timestamp: new Date()
            }
          }
        },
        { new: true }
      ),
      // Mark ShopPayment success
      ShopPayment.findOneAndUpdate(
        { orderId: order._id, razorpayOrderId: razorpay_order_id },
        {
          $set: {
            status: 'success',
            razorpayPaymentId: razorpay_payment_id,
            razorpaySignature: razorpay_signature,
            completedAt: new Date()
          }
        },
        { new: true }
      )
    ]);

    // Update product stock and sales
    for (const item of order.items) {
      const product = await Product.findById(item.product);
      if (product) {
        await Product.findByIdAndUpdate(
          item.product,
          {
            $inc: { 
              sales: item.quantity,
              stock: -item.quantity 
            }
          }
        );
      }
    }

    // Clear user's cart
    await Cart.findOneAndUpdate(
      { [userInfo.type]: userInfo.id, userType: userInfo.type, isActive: true },
      { $set: { isActive: false } }
    );

    // Send order confirmation email
    try {
      const customerEmail = updatedOrder.customerInfo?.email;
      const customerName = updatedOrder.customerInfo?.name;
      
      if (customerEmail && customerName) {
        await sendOrderConfirmationEmail(customerEmail, customerName, updatedOrder);
        console.log('Order confirmation email sent successfully to:', customerEmail);
      } else {
        console.warn('Could not send order confirmation email - missing customer email or name');
      }
    } catch (emailError) {
      console.error('Failed to send order confirmation email:', emailError);
      // Don't fail the payment verification if email fails
    }

    res.json({
      success: true,
      message: 'Payment verified successfully',
      order: {
        id: order._id,
        orderNumber: order.orderNumber,
        status: order.status,
        paymentStatus: order.paymentInfo.status
      }
    });
  } catch (error) {
    console.error('Error verifying payment:', error);
    res.status(500).json({
      success: false,
      message: 'Payment verification failed'
    });
  }
};

// GET /api/orders - Get user's orders
const getOrders = async (req, res) => {
  try {
    const userInfo = getUserInfo(req);
    if (!userInfo) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
    }

    const { page = 1, limit = 10, status } = req.query;

    const orders = await Order.findByCustomer(userInfo.id, userInfo.type, {
      sort: { createdAt: -1 },
      limit: parseInt(limit),
      skip: (page - 1) * limit
    });

    // Filter by status if provided
    let filteredOrders = orders;
    if (status && status !== 'all') {
      filteredOrders = orders.filter(order => order.status === status);
    }

    const totalCount = await Order.countDocuments({
      [userInfo.type]: userInfo.id,
      userType: userInfo.type,
      ...(status && status !== 'all' ? { status } : {})
    });

    res.json({
      success: true,
      orders: filteredOrders,
      pagination: {
        current: parseInt(page),
        total: Math.ceil(totalCount / limit),
        count: totalCount,
        hasNext: page * limit < totalCount,
        hasPrev: page > 1
      }
    });
  } catch (error) {
    console.error('Error fetching orders:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch orders'
    });
  }
};

// GET /api/orders/:id - Get order details
const getOrderById = async (req, res) => {
  try {
    const userInfo = getUserInfo(req);
    if (!userInfo) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
    }

    const { id } = req.params;

    const order = await Order.findOne({
      _id: id,
      [userInfo.type]: userInfo.id,
      userType: userInfo.type
    }).populate('items.product');

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }

    res.json({
      success: true,
      order
    });
  } catch (error) {
    console.error('Error fetching order:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch order'
    });
  }
};

// POST /api/orders/:id/cancel - Cancel order
const cancelOrder = async (req, res) => {
  try {
    const userInfo = getUserInfo(req);
    if (!userInfo) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
    }

    const { id } = req.params;
    const { reason } = req.body;

    const order = await Order.findOne({
      _id: id,
      [userInfo.type]: userInfo.id,
      userType: userInfo.type
    });

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }

    if (!order.canCancel) {
      return res.status(400).json({
        success: false,
        message: 'Order cannot be cancelled at this stage'
      });
    }

    await order.requestCancellation(reason || 'Customer requested cancellation');

    res.json({
      success: true,
      message: 'Cancellation request submitted successfully',
      order: {
        id: order._id,
        status: order.status,
        cancellation: order.cancellation
      }
    });
  } catch (error) {
    console.error('Error cancelling order:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to cancel order'
    });
  }
};

// GET /api/orders/stats - Get order statistics for user
const getOrderStats = async (req, res) => {
  try {
    const userInfo = getUserInfo(req);
    if (!userInfo) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
    }

    const { startDate, endDate } = req.query;

    const stats = await Order.getOrderStats(userInfo.id, userInfo.type, startDate, endDate);

    const result = stats[0] || {
      totalOrders: 0,
      totalSpent: 0,
      averageOrderValue: 0,
      completedOrders: 0,
      pendingOrders: 0
    };

    res.json({
      success: true,
      stats: result
    });
  } catch (error) {
    console.error('Error fetching order stats:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch order statistics'
    });
  }
};

// Admin routes

// GET /api/admin/orders - Get all orders (Admin only)
const getAdminOrders = async (req, res) => {
  try {
    if (!req.admin) {
      return res.status(403).json({
        success: false,
        message: 'Admin access required'
      });
    }

    const { 
      page = 1, 
      limit = 20, 
      status,
      paymentStatus,
      search,
      startDate,
      endDate
    } = req.query;

    const skip = (page - 1) * limit;
    let query = {};

    // Apply filters
    if (status && status !== 'all') {
      query.status = status;
    }
    if (paymentStatus && paymentStatus !== 'all') {
      query['paymentInfo.status'] = paymentStatus;
    }
    if (search && search.trim()) {
      query.$or = [
        { orderNumber: { $regex: search.trim(), $options: 'i' } },
        { 'customerInfo.name': { $regex: search.trim(), $options: 'i' } },
        { 'customerInfo.email': { $regex: search.trim(), $options: 'i' } }
      ];
    }
    if (startDate || endDate) {
      query.createdAt = {};
      if (startDate) query.createdAt.$gte = new Date(startDate);
      if (endDate) query.createdAt.$lte = new Date(endDate);
    }

    const [orders, totalCount] = await Promise.all([
      Order.find(query)
        .populate('user employer', 'name email companyName companyEmail')
        .populate('items.product', 'name category')
        .sort({ createdAt: -1 })
        .limit(parseInt(limit))
        .skip(skip),
      Order.countDocuments(query)
    ]);

    res.json({
      success: true,
      orders,
      pagination: {
        current: parseInt(page),
        total: Math.ceil(totalCount / limit),
        count: totalCount,
        hasNext: page * limit < totalCount,
        hasPrev: page > 1
      }
    });
  } catch (error) {
    console.error('Error fetching admin orders:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch orders'
    });
  }
};

// PUT /api/admin/orders/:id/status - Update order status (Admin only)
const updateOrderStatus = async (req, res) => {
  try {
    if (!req.admin) {
      return res.status(403).json({
        success: false,
        message: 'Admin access required'
      });
    }

    const { id } = req.params;
    const { status, message, trackingNumber, carrier } = req.body;

    const order = await Order.findById(id);
    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }

    // Update order status and tracking info atomically
    const updateData = {
      status,
      $push: {
        timeline: {
          status,
          message: message || `Order status updated to ${status}`,
          timestamp: new Date(),
          updatedBy: req.admin._id,
          updatedByType: 'Admin'
        }
      }
    };

    // Add tracking info if provided
    if (trackingNumber && carrier) {
      updateData['shippingInfo.trackingNumber'] = trackingNumber;
      updateData['shippingInfo.provider'] = carrier;
      updateData.$push.timeline.message += ` - Tracking: ${trackingNumber}`;
    }

    // Update specific timestamps
    if (status === 'shipped') {
      updateData['shippingInfo.shippedAt'] = new Date();
    } else if (status === 'delivered') {
      updateData['shippingInfo.deliveredAt'] = new Date();
    }

    await Order.findByIdAndUpdate(id, updateData);

    res.json({
      success: true,
      message: 'Order status updated successfully',
      order: {
        id: order._id,
        orderNumber: order.orderNumber,
        status: order.status
      }
    });
  } catch (error) {
    console.error('Error updating order status:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update order status'
    });
  }
};

// GET /api/admin/orders/stats - Get order statistics (Admin only)
const getAdminOrderStats = async (req, res) => {
  try {
    if (!req.admin) {
      return res.status(403).json({
        success: false,
        message: 'Admin access required'
      });
    }

    const { startDate, endDate } = req.query;

    const matchStage = {};
    if (startDate || endDate) {
      matchStage.createdAt = {};
      if (startDate) matchStage.createdAt.$gte = new Date(startDate);
      if (endDate) matchStage.createdAt.$lte = new Date(endDate);
    }

    const [
      totalStats,
      statusStats,
      paymentStatusStats,
      paymentMethodStats,
      itemsSoldStats,
      uniqueCustomersStats,
      revenueByProduct,
      revenueByCategory,
      recentOrders
    ] = await Promise.all([
      // Total orders stats
      Order.aggregate([
        { $match: matchStage },
        {
          $group: {
            _id: null,
            totalOrders: { $sum: 1 },
            totalRevenue: { $sum: '$total' },
            averageOrderValue: { $avg: '$total' },
            // This is kept for backward compatibility; a more
            // accurate totalItemsSold is computed separately below
            totalItems: { $sum: 1 }
          }
        }
      ]),

      // Status stats
      Order.aggregate([
        { $match: matchStage },
        {
          $group: {
            _id: '$status',
            count: { $sum: 1 },
            revenue: { $sum: '$total' }
          }
        }
      ]),

      // Payment status stats (pending/paid/failed/etc)
      Order.aggregate([
        { $match: matchStage },
        {
          $group: {
            _id: '$paymentInfo.status',
            count: { $sum: 1 },
            amount: { $sum: '$total' }
          }
        }
      ]),

      // Payment method stats (razorpay/stripe/cash_on_delivery/wallet/etc)
      Order.aggregate([
        { $match: matchStage },
        {
          $group: {
            _id: '$paymentInfo.method',
            count: { $sum: 1 },
            amount: { $sum: '$total' }
          }
        }
      ]),

      // Total items sold (accurate): unwind items and sum quantity
      Order.aggregate([
        { $match: matchStage },
        { $unwind: '$items' },
        {
          $group: { _id: null, totalItemsSold: { $sum: '$items.quantity' } }
        }
      ]),

      // Unique customers count (users and employers combined)
      Order.aggregate([
        { $match: matchStage },
        {
          $group: {
            _id: null,
            customers: {
              $addToSet: {
                $cond: [
                  { $ifNull: ['$user', false] },
                  { $concat: ['user:', { $toString: '$user' }] },
                  { $concat: ['employer:', { $toString: '$employer' }] }
                ]
              }
            }
          }
        },
        {
          $project: { _id: 0, uniqueCustomers: { $size: '$customers' } }
        }
      ]),

      // Revenue per product (and quantity), with product details
      Order.aggregate([
        { $match: matchStage },
        { $unwind: '$items' },
        {
          $group: {
            _id: '$items.product',
            quantitySold: { $sum: '$items.quantity' },
            revenue: { $sum: '$items.totalPrice' }
          }
        },
        { $sort: { revenue: -1 } },
        { $limit: 50 },
        {
          $lookup: {
            from: 'products',
            localField: '_id',
            foreignField: '_id',
            as: 'product'
          }
        },
        { $unwind: { path: '$product', preserveNullAndEmptyArrays: true } },
        {
          $project: {
            _id: 0,
            productId: '$_id',
            name: '$product.name',
            category: '$product.category',
            stockRemaining: '$product.stock',
            quantitySold: 1,
            revenue: 1
          }
        }
      ]),

      // Revenue per category
      Order.aggregate([
        { $match: matchStage },
        { $unwind: '$items' },
        {
          $group: {
            _id: '$items.productSnapshot.category',
            quantitySold: { $sum: '$items.quantity' },
            revenue: { $sum: '$items.totalPrice' }
          }
        },
        { $sort: { revenue: -1 } }
      ]),

      // Recent orders
      Order.find(matchStage)
        .populate('user employer', 'name companyName')
        .sort({ createdAt: -1 })
        .limit(5)
        .select('orderNumber status total createdAt customerInfo')
    ]);

    const stats = totalStats[0] || {
      totalOrders: 0,
      totalRevenue: 0,
      averageOrderValue: 0,
      totalItems: 0
    };

    const totalItemsSold = itemsSoldStats?.[0]?.totalItemsSold || 0;
    const uniqueCustomers = uniqueCustomersStats?.[0]?.uniqueCustomers || 0;

    res.json({
      success: true,
      stats: {
        total: { ...stats, totalItemsSold, uniqueCustomers },
        statuses: statusStats,
        paymentsByStatus: paymentStatusStats,
        paymentsByMethod: paymentMethodStats,
        revenueByProduct,
        revenueByCategory,
        recent: recentOrders
      }
    });
  } catch (error) {
    console.error('Error fetching admin order stats:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch order statistics'
    });
  }
};

// POST /api/orders/checkout-single - Create order for a single product (does not alter cart)
const checkoutSingle = async (req, res) => {
  try {
    const userInfo = getUserInfo(req);
    console.log('Debug - checkoutSingle getUserInfo result:', userInfo);
    console.log('Debug - checkoutSingle req.user:', req.user);
    console.log('Debug - checkoutSingle req.employer:', req.employer);
    
    if (!userInfo) {
      return res.status(401).json({ success: false, message: 'Authentication required' });
    }

    const { productId, quantity = 1, shippingAddress: inShipping, billingAddress: inBilling, paymentMethod = 'razorpay' } = req.body || {};
    if (!productId || quantity <= 0) {
      return res.status(400).json({ success: false, message: 'productId and positive quantity are required' });
    }

    const product = await Product.findById(productId);
    if (!product || !product.isAvailable) {
      return res.status(400).json({ success: false, message: 'Product not available' });
    }
    if (!product.isUnlimited && product.stock < quantity) {
      return res.status(400).json({ success: false, message: `Only ${product.stock} units available` });
    }

    // Build minimal customer info
    let customerInfo;
    if (userInfo.type === 'user') {
      const user = await User.findById(userInfo.id);
      customerInfo = { 
        name: user?.name || 'Unknown User', 
        email: user?.email || '', 
        phone: user?.phone || '' 
      };
    } else {
      const employer = await Employer.findById(userInfo.id);
      
      // Debug logging
      console.log('Debug - Employer data:', {
        id: employer?._id,
        companyName: employer?.companyName,
        companyEmail: employer?.companyEmail,
        contactPersonName: employer?.contactPersonName,
        companyPhone: employer?.companyPhone,
        contactPersonPhone: employer?.contactPersonPhone
      });
      
      customerInfo = { 
        name: employer?.contactPersonName || employer?.companyName || 'Unknown Employer', 
        email: employer?.companyEmail || employer?.contactPersonEmail || 'employer@example.com', 
        phone: employer?.companyPhone || employer?.contactPersonPhone || '' 
      };
      
      // Debug logging
      console.log('Debug - Extracted customerInfo:', customerInfo);
    }

    // Resolve addresses (single product checkout still needs addresses on order)
    let shippingAddress = normalizeAddress(inShipping);
    let billingAddress = normalizeAddress(inBilling);
    if (!shippingAddress) {
      const defAddr = await Address.getDefaultAddress(userInfo.id, userInfo.type);
      if (defAddr) shippingAddress = normalizeAddress(defAddr);
    }
    if (!billingAddress) {
      const defAddr = await Address.getDefaultAddress(userInfo.id, userInfo.type);
      if (defAddr) billingAddress = normalizeAddress({ ...defAddr.toObject?.() || defAddr, email: undefined });
    }
    if (!isAddressComplete(shippingAddress)) {
      return res.status(400).json({ success: false, message: 'Complete shipping address is required' });
    }
    if (billingAddress && !billingAddress.email) {
      billingAddress.email = customerInfo?.email || '';
    }
    if (!isAddressComplete(billingAddress, { requireEmail: true })) {
      return res.status(400).json({ success: false, message: 'Complete billing address with email is required' });
    }

    // Totals
    const unit = product.discount ? (product.price * (1 - (product.discount.percentage || 0)/100) - (product.discount.amount || 0) || product.price) : product.price;
    const unitPrice = Math.max(0, product.discountedPrice || unit);
    const subtotal = unitPrice * quantity;
    const discount = 0;
    const tax = subtotal * 0.1;
    const shippingCost = 0;
    const total = subtotal - discount + tax + shippingCost;
    const currency = 'INR'; // Force INR for Razorpay compatibility

    // Create Razorpay order
    let razorpayOrderId = null;
    if (paymentMethod === 'razorpay') {
      try {
        const razorpay = getRazorpayInstance();
        const amountPaise = Math.max(1, Math.round(total * 100));
        const rpOrder = await razorpay.orders.create({
          amount: amountPaise,
          currency: 'INR',
          receipt: `order_${Date.now()}`,
          notes: { single: 'true', productId: String(product._id) }
        });
        razorpayOrderId = rpOrder.id;
      } catch (razorpayError) {
        console.error('Razorpay create order failed (single):', {
          message: razorpayError?.message,
          code: razorpayError?.statusCode || razorpayError?.status,
          data: razorpayError?.error || razorpayError?.response?.data
        });
        return res.status(502).json({ success: false, message: 'Payment gateway error while creating order', details: razorpayError?.error?.description || razorpayError?.message || 'Unknown error' });
      }
      try {
        await ShopPayment.create({ orderId: null, [userInfo.type]: userInfo.id, userType: userInfo.type, amount: total, currency, gateway: 'razorpay', razorpayOrderId, status: 'initiated', userAgent: req.get('User-Agent'), ipAddress: req.ip || req.connection.remoteAddress, notes: { mode: 'single' } });
      } catch(_){}
    }

    // Build order
    const orderItems = [{
      product: product._id,
      quantity,
      unitPrice,
      totalPrice: unitPrice * quantity,
      productSnapshot: { name: product.name, description: product.shortDescription || '', image: product.images?.[0]?.url, category: product.category, productType: product.productType || 'digital' }
    }];

    const order = new Order({
      [userInfo.type]: userInfo.id,
      userType: userInfo.type,
      customerInfo,
      items: orderItems,
      subtotal,
      discount,
      tax,
      shippingCost,
      total,
      currency, // Use INR for consistency
      appliedCoupons: [],
      billingAddress: billingAddress || { name: customerInfo.name, email: customerInfo.email, address: { street: 'NA', city: 'NA', state: 'NA', country: 'NA', zipCode: '000000' } },
      shippingAddress: shippingAddress || { name: customerInfo.name, phone: customerInfo.phone, address: { street: 'NA', city: 'NA', state: 'NA', country: 'NA', zipCode: '000000' } },
      paymentInfo: { method: paymentMethod, status: 'pending', razorpayOrderId },
      shippingInfo: { method: product.productType === 'physical' ? 'standard' : 'digital' },
      source: 'web',
      userAgent: req.get('User-Agent'),
      ipAddress: req.ip || req.connection.remoteAddress
    });
    
    // Debug logging
    console.log('Debug - Order object before save:', {
      employerId: order.employer,
      userType: order.userType,
      customerInfo: order.customerInfo,
      billingAddress: order.billingAddress,
      shippingAddress: order.shippingAddress
    });
    
    await order.save();

    if (razorpayOrderId) {
      try { await ShopPayment.findOneAndUpdate({ razorpayOrderId }, { $set: { orderId: order._id } }); } catch(_){}
      return res.status(201).json({ success: true, order: { id: order._id, orderNumber: order.orderNumber, total: order.total, currency: order.currency, razorpayOrderId, razorpayKeyId: process.env.RAZORPAY_KEY_ID } });
    }

    res.status(201).json({ success: true, order: { id: order._id, orderNumber: order.orderNumber, status: order.status, total: order.total, currency: order.currency } });
  } catch (error) {
    console.error('Error during single checkout:', error);
    res.status(500).json({ success: false, message: 'Checkout failed' });
  }
};

// GET /api/admin/products/:productId/purchases - Get purchase details for a specific product (Admin only)
const getProductPurchases = async (req, res) => {
  try {
    if (!req.admin) {
      return res.status(403).json({
        success: false,
        message: 'Admin access required'
      });
    }

    const { productId } = req.params;
    const { 
      page = 1, 
      limit = 20,
      status,
      paymentStatus,
      startDate,
      endDate
    } = req.query;

    // Try to convert productId to ObjectId for consistency
    let productObjectId = productId;
    try {
      if (mongoose.Types.ObjectId.isValid(productId)) {
        productObjectId = new mongoose.Types.ObjectId(productId);
      }
    } catch (e) {
      // If ObjectId conversion fails, use the string as is
      console.warn('Could not convert productId to ObjectId, using as string:', productId);
    }

    const skip = (page - 1) * limit;
    let query = {
      'items.product': productObjectId
    };

    // Apply filters
    if (status && status !== 'all') {
      query.status = status;
    }
    if (paymentStatus && paymentStatus !== 'all') {
      query['paymentInfo.status'] = paymentStatus;
    }
    if (startDate || endDate) {
      query.createdAt = {};
      if (startDate) query.createdAt.$gte = new Date(startDate);
      if (endDate) query.createdAt.$lte = new Date(endDate);
    }

    const [orders, totalCount] = await Promise.all([
      Order.find(query)
        .populate('user employer', 'name email companyName companyEmail phone companyPhone')
        .populate('items.product', 'name category price currency')
        .sort({ createdAt: -1 })
        .limit(parseInt(limit))
        .skip(skip),
      Order.countDocuments(query)
    ]);

    // Get product details
    const product = await Product.findById(productId).select('name category price currency description');

    // Calculate product-specific statistics
    const matchStage = { 'items.product': productObjectId };
    
    // Apply the same filters to the aggregation
    if (status && status !== 'all') {
      matchStage.status = status;
    }
    if (paymentStatus && paymentStatus !== 'all') {
      matchStage['paymentInfo.status'] = paymentStatus;
    }
    if (startDate || endDate) {
      matchStage.createdAt = {};
      if (startDate) matchStage.createdAt.$gte = new Date(startDate);
      if (endDate) matchStage.createdAt.$lte = new Date(endDate);
    }

    const productStats = await Order.aggregate([
      { $match: matchStage },
      { $unwind: '$items' },
      { $match: { 'items.product': productObjectId } },
      {
        $group: {
          _id: null,
          totalQuantitySold: { $sum: '$items.quantity' },
          totalRevenue: { $sum: '$items.totalPrice' },
          totalOrders: { $sum: 1 },
          avgOrderValue: { $avg: '$total' }
        }
      }
    ]);

    res.json({
      success: true,
      product,
      orders,
      stats: productStats[0] || {
        totalQuantitySold: 0,
        totalRevenue: 0,
        totalOrders: 0,
        avgOrderValue: 0
      },
      pagination: {
        current: parseInt(page),
        total: Math.ceil(totalCount / limit),
        count: totalCount,
        hasNext: page * limit < totalCount,
        hasPrev: page > 1
      }
    });
  } catch (error) {
    console.error('Error fetching product purchases:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch product purchases'
    });
  }
};

module.exports = {
  checkout,
  verifyPayment,
  getOrders,
  getOrderById,
  cancelOrder,
  getOrderStats,
  getAdminOrders,
  updateOrderStatus,
  getAdminOrderStats,
  checkoutSingle,
  getProductPurchases
};
