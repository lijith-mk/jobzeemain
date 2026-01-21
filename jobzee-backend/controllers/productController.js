const Product = require('../models/Product');
const Cart = require('../models/Cart');
const { validationResult } = require('express-validator');

// GET /api/products - Get all products (public)
const getProducts = async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 20, 
      category, 
      search, 
      minPrice, 
      maxPrice,
      sort = 'createdAt',
      order = 'desc',
      featured
    } = req.query;

    const skip = (page - 1) * limit;
    let query = { 
      status: 'active', 
      isVisible: true, 
      deletedAt: null 
    };

    // Apply filters
    if (category && category !== 'all') {
      query.category = category;
    }

    if (minPrice || maxPrice) {
      query.price = {};
      if (minPrice) query.price.$gte = parseFloat(minPrice);
      if (maxPrice) query.price.$lte = parseFloat(maxPrice);
    }

    if (featured === 'true') {
      query.isFeatured = true;
    }

    let productsQuery;

    // Handle search vs regular query
    if (search && search.trim()) {
      productsQuery = Product.searchProducts(search.trim(), {
        category: category !== 'all' ? category : undefined,
        minPrice: minPrice ? parseFloat(minPrice) : undefined,
        maxPrice: maxPrice ? parseFloat(maxPrice) : undefined,
        limit: parseInt(limit),
        skip
      });
    } else {
      // Sort options
      const sortOptions = {};
      sortOptions[sort] = order === 'asc' ? 1 : -1;

      productsQuery = Product.find(query)
        .populate('seller', 'name')
        .sort(sortOptions)
        .limit(parseInt(limit))
        .skip(skip);
    }

    const [products, totalCount] = await Promise.all([
      productsQuery,
      Product.countDocuments(query)
    ]);

    // Get categories for filtering
    const categories = await Product.distinct('category', { 
      status: 'active', 
      isVisible: true, 
      deletedAt: null 
    });

    res.json({
      success: true,
      products,
      pagination: {
        current: parseInt(page),
        total: Math.ceil(totalCount / limit),
        count: totalCount,
        hasNext: page * limit < totalCount,
        hasPrev: page > 1
      },
      filters: {
        categories: categories.sort(),
        totalProducts: totalCount
      }
    });
  } catch (error) {
    console.error('Error fetching products:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to fetch products' 
    });
  }
};

// GET /api/products/featured - Get featured products
const getFeaturedProducts = async (req, res) => {
  try {
    const { limit = 8 } = req.query;
    
    const products = await Product.getFeaturedProducts(parseInt(limit));
    
    res.json({
      success: true,
      products
    });
  } catch (error) {
    console.error('Error fetching featured products:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to fetch featured products' 
    });
  }
};

// GET /api/products/categories - Get all categories
const getCategories = async (req, res) => {
  try {
    const categories = await Product.distinct('category', { 
      status: 'active', 
      isVisible: true, 
      deletedAt: null 
    });

    // Get category counts
    const categoryCounts = await Product.aggregate([
      {
        $match: { 
          status: 'active', 
          isVisible: true, 
          deletedAt: null 
        }
      },
      {
        $group: {
          _id: '$category',
          count: { $sum: 1 }
        }
      },
      {
        $sort: { _id: 1 }
      }
    ]);

    const categoryData = categoryCounts.map(item => ({
      name: item._id,
      count: item.count
    }));

    res.json({
      success: true,
      categories: categoryData
    });
  } catch (error) {
    console.error('Error fetching categories:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to fetch categories' 
    });
  }
};

// GET /api/products/:id - Get product by ID (public)
const getProductById = async (req, res) => {
  try {
    const { id } = req.params;
    
    const product = await Product.findOne({
      $or: [
        { _id: id },
        { slug: id }
      ],
      status: 'active',
      isVisible: true,
      deletedAt: null
    }).populate('seller', 'name');

    if (!product) {
      return res.status(404).json({ 
        success: false, 
        message: 'Product not found' 
      });
    }

    // Increment product views (async, don't wait)
    product.incrementViews().catch(err => 
      console.error('Error incrementing views:', err)
    );

    // Get related products
    const relatedProducts = await Product.find({
      category: product.category,
      _id: { $ne: product._id },
      status: 'active',
      isVisible: true,
      deletedAt: null
    })
    .populate('seller', 'name')
    .limit(4)
    .sort({ createdAt: -1 });

    res.json({
      success: true,
      product,
      relatedProducts
    });
  } catch (error) {
    console.error('Error fetching product:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to fetch product' 
    });
  }
};

// POST /api/products - Create product (Admin only)
const createProduct = async (req, res) => {
  try {
    // Check validation results
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const productData = {
      ...req.body,
      seller: req.admin.id,
      sellerName: req.admin.name || req.admin.email
    };

    const product = new Product(productData);
    await product.save();

    res.status(201).json({
      success: true,
      message: 'Product created successfully',
      product
    });
  } catch (error) {
    console.error('Error creating product:', error);
    
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: 'Product with this SKU or slug already exists'
      });
    }

    res.status(500).json({ 
      success: false, 
      message: 'Failed to create product' 
    });
  }
};

// PUT /api/products/:id - Update product (Admin only)
const updateProduct = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { id } = req.params;
    const updateData = req.body;

    const product = await Product.findOneAndUpdate(
      { _id: id, deletedAt: null },
      updateData,
      { new: true, runValidators: true }
    );

    if (!product) {
      return res.status(404).json({ 
        success: false, 
        message: 'Product not found' 
      });
    }

    res.json({
      success: true,
      message: 'Product updated successfully',
      product
    });
  } catch (error) {
    console.error('Error updating product:', error);
    
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: 'Product with this SKU or slug already exists'
      });
    }

    res.status(500).json({ 
      success: false, 
      message: 'Failed to update product' 
    });
  }
};

// DELETE /api/products/:id - Soft delete product (Admin only)
const deleteProduct = async (req, res) => {
  try {
    const { id } = req.params;

    const product = await Product.findOneAndUpdate(
      { _id: id, deletedAt: null },
      {
        deletedAt: new Date(),
        deletedBy: req.admin.id,
        status: 'archived'
      },
      { new: true }
    );

    if (!product) {
      return res.status(404).json({ 
        success: false, 
        message: 'Product not found' 
      });
    }

    // Remove this product from all active carts and recalculate totals
    try {
      const carts = await Cart.find({ 'items.product': id, isActive: true });
      for (const c of carts) {
        c.items = c.items.filter((it) => String(it.product) !== String(id));
        await c.save();
      }
    } catch (cleanupErr) {
      console.warn('Cart cleanup after product delete failed:', cleanupErr?.message || cleanupErr);
    }

    res.json({
      success: true,
      message: 'Product deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting product:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to delete product' 
    });
  }
};

// POST /api/products/:id/reviews - Add product review (Auth required)
const addProductReview = async (req, res) => {
  try {
    const { id } = req.params;
    const { rating, comment } = req.body;

    if (!rating || rating < 1 || rating > 5) {
      return res.status(400).json({
        success: false,
        message: 'Rating must be between 1 and 5'
      });
    }

    const product = await Product.findOne({
      _id: id,
      status: 'active',
      deletedAt: null
    });

    if (!product) {
      return res.status(404).json({ 
        success: false, 
        message: 'Product not found' 
      });
    }

    // Determine user info based on auth type
    let userId, userType, userName;
    if (req.user) {
      userId = req.user.id;
      userType = 'user';
      userName = req.user.name;
    } else if (req.employer) {
      userId = req.employer.id;
      userType = 'employer';
      userName = req.employer.companyName;
    } else {
      return res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
    }

    // Check if user already reviewed this product
    const existingReview = product.reviews.find(review => 
      (review.user && review.user.toString() === userId.toString()) ||
      (review.employer && review.employer.toString() === userId.toString())
    );

    if (existingReview) {
      return res.status(400).json({
        success: false,
        message: 'You have already reviewed this product'
      });
    }

    const reviewData = {
      [userType]: userId,
      userName,
      rating: parseInt(rating),
      comment: comment || ''
    };

    await product.addReview(reviewData);

    res.status(201).json({
      success: true,
      message: 'Review added successfully',
      rating: {
        average: product.rating.average,
        count: product.rating.count
      }
    });
  } catch (error) {
    console.error('Error adding product review:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to add review' 
    });
  }
};

// GET /api/products/:id/reviews - Get product reviews
const getProductReviews = async (req, res) => {
  try {
    const { id } = req.params;
    const { page = 1, limit = 10 } = req.query;

    const product = await Product.findOne({
      _id: id,
      deletedAt: null
    }).select('reviews rating');

    if (!product) {
      return res.status(404).json({ 
        success: false, 
        message: 'Product not found' 
      });
    }

    // Filter and paginate reviews
    const visibleReviews = product.reviews.filter(review => !review.isHidden);
    const totalReviews = visibleReviews.length;
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + parseInt(limit);
    const paginatedReviews = visibleReviews
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
      .slice(startIndex, endIndex);

    res.json({
      success: true,
      reviews: paginatedReviews,
      rating: product.rating,
      pagination: {
        current: parseInt(page),
        total: Math.ceil(totalReviews / limit),
        count: totalReviews,
        hasNext: endIndex < totalReviews,
        hasPrev: page > 1
      }
    });
  } catch (error) {
    console.error('Error fetching product reviews:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to fetch reviews' 
    });
  }
};

// GET /api/admin/products - Get all products for admin (Admin only)
const getAdminProducts = async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 20, 
      status,
      category,
      search,
      sort = 'createdAt',
      order = 'desc'
    } = req.query;

    const skip = (page - 1) * limit;
    let query = { deletedAt: null };

    // Apply filters
    if (status && status !== 'all') {
      query.status = status;
    }
    if (category && category !== 'all') {
      query.category = category;
    }
    if (search && search.trim()) {
      query.$or = [
        { name: { $regex: search.trim(), $options: 'i' } },
        { description: { $regex: search.trim(), $options: 'i' } },
        { tags: { $in: [new RegExp(search.trim(), 'i')] } }
      ];
    }

    // Sort options
    const sortOptions = {};
    sortOptions[sort] = order === 'asc' ? 1 : -1;

    const [products, totalCount] = await Promise.all([
      Product.find(query)
        .populate('seller', 'name email')
        .sort(sortOptions)
        .limit(parseInt(limit))
        .skip(skip),
      Product.countDocuments(query)
    ]);

    res.json({
      success: true,
      products,
      pagination: {
        current: parseInt(page),
        total: Math.ceil(totalCount / limit),
        count: totalCount,
        hasNext: page * limit < totalCount,
        hasPrev: page > 1
      }
    });
  } catch (error) {
    console.error('Error fetching admin products:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to fetch products' 
    });
  }
};

// GET /api/admin/products/stats - Get product statistics (Admin only)
const getProductStats = async (req, res) => {
  try {
    const [
      totalStats,
      categoryStats,
      statusStats,
      recentProducts
    ] = await Promise.all([
      // Total products stats
      Product.aggregate([
        { $match: { deletedAt: null } },
        {
          $group: {
            _id: null,
            total: { $sum: 1 },
            active: { $sum: { $cond: [{ $eq: ['$status', 'active'] }, 1, 0] } },
            totalViews: { $sum: '$views' },
            totalSales: { $sum: '$sales' },
            averagePrice: { $avg: '$price' }
          }
        }
      ]),

      // Category stats
      Product.aggregate([
        { $match: { deletedAt: null, status: 'active' } },
        {
          $group: {
            _id: '$category',
            count: { $sum: 1 },
            totalSales: { $sum: '$sales' }
          }
        },
        { $sort: { count: -1 } }
      ]),

      // Status stats
      Product.aggregate([
        { $match: { deletedAt: null } },
        {
          $group: {
            _id: '$status',
            count: { $sum: 1 }
          }
        }
      ]),

      // Recent products
      Product.find({ deletedAt: null })
        .sort({ createdAt: -1 })
        .limit(5)
        .select('name status createdAt views sales')
    ]);

    res.json({
      success: true,
      stats: {
        total: totalStats[0] || { 
          total: 0, active: 0, totalViews: 0, 
          totalSales: 0, averagePrice: 0 
        },
        categories: categoryStats,
        statuses: statusStats,
        recent: recentProducts
      }
    });
  } catch (error) {
    console.error('Error fetching product stats:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to fetch product statistics' 
    });
  }
};

module.exports = {
  getProducts,
  getFeaturedProducts,
  getCategories,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct,
  addProductReview,
  getProductReviews,
  getAdminProducts,
  getProductStats
};