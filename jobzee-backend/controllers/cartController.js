const Cart = require('../models/Cart');
const Product = require('../models/Product');
const { validationResult } = require('express-validator');

// GET /api/cart - Get user's cart
const getCart = async (req, res) => {
  try {
    const { userId, userType } = req;
    
    const cart = await Cart.findActiveCart(userId, userType);
    
    if (!cart) {
      return res.json({
        success: true,
        cart: null,
        items: [],
        summary: {
          subtotal: 0,
          discount: 0,
          tax: 0,
          total: 0,
          currency: 'INR',
          itemCount: 0,
          productCount: 0
        }
      });
    }

    // Populate product details
    await cart.populate('items.product');
    
    // Filter out unavailable products
    cart.items = cart.items.filter(item => 
      item.product && 
      item.product.isAvailable && 
      !item.product.deletedAt
    );
    
    // Save cart if items were removed
    if (cart.isModified()) {
      await cart.save();
    }

    res.json({
      success: true,
      cart: cart.toJSON(),
      items: cart.items,
      summary: {
        subtotal: cart.subtotal,
        discount: cart.discount,
        tax: cart.tax,
        total: cart.total,
        currency: cart.currency,
        itemCount: cart.itemCount,
        productCount: cart.productCount,
        appliedCoupons: cart.appliedCoupons,
        shippingInfo: cart.shippingInfo
      }
    });
  } catch (error) {
    console.error('Error fetching cart:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch cart'
    });
  }
};

// GET /api/cart/summary - Get cart summary
const getCartSummary = async (req, res) => {
  try {
    const { userId, userType } = req;
    
    const cart = await Cart.findActiveCart(userId, userType);
    
    if (!cart) {
      return res.json({
        success: true,
        summary: {
          itemCount: 0,
          productCount: 0,
          total: 0,
          currency: 'INR'
        }
      });
    }

    res.json({
      success: true,
      summary: {
        itemCount: cart.itemCount,
        productCount: cart.productCount,
        total: cart.total,
        currency: cart.currency
      }
    });
  } catch (error) {
    console.error('Error fetching cart summary:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch cart summary'
    });
  }
};

// POST /api/cart/add - Add item to cart
const addToCart = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { userId, userType } = req;
    const { productId, quantity = 1 } = req.body;

    // Verify product exists and is available
    const product = await Product.findById(productId);
    if (!product || !product.isAvailable) {
      return res.status(404).json({
        success: false,
        message: 'Product not found or not available'
      });
    }

    // Check stock for physical products
    if (!product.isUnlimited && product.stock < quantity) {
      return res.status(400).json({
        success: false,
        message: `Only ${product.stock} items available in stock`
      });
    }

    // Get or create cart
    let cart = await Cart.findActiveCart(userId, userType);
    if (!cart) {
      cart = await Cart.createCart(userId, userType);
    }

    // Add item to cart
    await cart.addItem(productId, quantity);

    // Return updated cart summary
    res.status(201).json({
      success: true,
      message: 'Item added to cart successfully',
      summary: {
        itemCount: cart.itemCount,
        productCount: cart.productCount,
        total: cart.total,
        currency: cart.currency
      }
    });
  } catch (error) {
    console.error('Error adding to cart:', error);
    
    if (error.message.includes('available in stock')) {
      return res.status(400).json({
        success: false,
        message: error.message
      });
    }
    
    res.status(500).json({
      success: false,
      message: 'Failed to add item to cart'
    });
  }
};

// PUT /api/cart/update/:productId - Update cart item quantity
const updateCartItem = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { userId, userType } = req;
    const { productId } = req.params;
    const { quantity } = req.body;

    const cart = await Cart.findActiveCart(userId, userType);
    if (!cart) {
      return res.status(404).json({
        success: false,
        message: 'Cart not found'
      });
    }

    // If quantity is 0, remove the item
    if (quantity === 0) {
      await cart.removeItem(productId);
    } else {
      await cart.updateItemQuantity(productId, quantity);
    }

    res.json({
      success: true,
      message: quantity === 0 ? 'Item removed from cart' : 'Cart item updated successfully',
      summary: {
        itemCount: cart.itemCount,
        productCount: cart.productCount,
        total: cart.total,
        currency: cart.currency
      }
    });
  } catch (error) {
    console.error('Error updating cart item:', error);
    
    if (error.message.includes('not found in cart') || error.message.includes('available in stock')) {
      return res.status(400).json({
        success: false,
        message: error.message
      });
    }
    
    res.status(500).json({
      success: false,
      message: 'Failed to update cart item'
    });
  }
};

// DELETE /api/cart/remove/:productId - Remove item from cart
const removeFromCart = async (req, res) => {
  try {
    const { userId, userType } = req;
    const { productId } = req.params;

    const cart = await Cart.findActiveCart(userId, userType);
    if (!cart) {
      return res.status(404).json({
        success: false,
        message: 'Cart not found'
      });
    }

    await cart.removeItem(productId);

    res.json({
      success: true,
      message: 'Item removed from cart successfully',
      summary: {
        itemCount: cart.itemCount,
        productCount: cart.productCount,
        total: cart.total,
        currency: cart.currency
      }
    });
  } catch (error) {
    console.error('Error removing from cart:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to remove item from cart'
    });
  }
};

// DELETE /api/cart/clear - Clear entire cart
const clearCart = async (req, res) => {
  try {
    const { userId, userType } = req;

    const cart = await Cart.findActiveCart(userId, userType);
    if (!cart) {
      return res.json({
        success: true,
        message: 'Cart is already empty'
      });
    }

    await cart.clearCart();

    res.json({
      success: true,
      message: 'Cart cleared successfully',
      summary: {
        itemCount: 0,
        productCount: 0,
        total: 0,
        currency: cart.currency
      }
    });
  } catch (error) {
    console.error('Error clearing cart:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to clear cart'
    });
  }
};

// POST /api/cart/coupon - Apply coupon to cart
const applyCoupon = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { userId, userType } = req;
    const { code, discount = 10, type = 'percentage' } = req.body;

    const cart = await Cart.findActiveCart(userId, userType);
    if (!cart) {
      return res.status(404).json({
        success: false,
        message: 'Cart not found'
      });
    }

    if (cart.items.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Cannot apply coupon to empty cart'
      });
    }

    // For demo purposes, we'll accept any coupon code
    // In production, you'd validate against a coupons collection
    await cart.applyCoupon(code.toUpperCase(), discount, type);

    res.json({
      success: true,
      message: 'Coupon applied successfully',
      coupon: {
        code: code.toUpperCase(),
        discount,
        type
      },
      summary: {
        subtotal: cart.subtotal,
        discount: cart.discount,
        tax: cart.tax,
        total: cart.total,
        currency: cart.currency
      }
    });
  } catch (error) {
    console.error('Error applying coupon:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to apply coupon'
    });
  }
};

// DELETE /api/cart/coupon/:code - Remove coupon from cart
const removeCoupon = async (req, res) => {
  try {
    const { userId, userType } = req;
    const { code } = req.params;

    const cart = await Cart.findActiveCart(userId, userType);
    if (!cart) {
      return res.status(404).json({
        success: false,
        message: 'Cart not found'
      });
    }

    await cart.removeCoupon(code.toUpperCase());

    res.json({
      success: true,
      message: 'Coupon removed successfully',
      summary: {
        subtotal: cart.subtotal,
        discount: cart.discount,
        tax: cart.tax,
        total: cart.total,
        currency: cart.currency
      }
    });
  } catch (error) {
    console.error('Error removing coupon:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to remove coupon'
    });
  }
};

module.exports = {
  getCart,
  getCartSummary,
  addToCart,
  updateCartItem,
  removeFromCart,
  clearCart,
  applyCoupon,
  removeCoupon
};