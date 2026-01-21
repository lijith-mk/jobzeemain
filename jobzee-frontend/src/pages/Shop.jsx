import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import { useCart } from '../contexts/CartContext';
import AddToCartButton from '../components/AddToCartButton';

import API_BASE_URL from '../config/api';
const Shop = () => {
  const [products, setProducts] = useState([]);
  const [featuredProducts, setFeaturedProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [filters, setFilters] = useState({
    category: 'all',
    search: '',
    minPrice: '',
    maxPrice: '',
    sort: 'createdAt',
    order: 'desc'
  });
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({});
  const [currentPage, setCurrentPage] = useState(1);
  const { formatPrice } = useCart();

  useEffect(() => {
    fetchFeaturedProducts();
    fetchCategories();
    fetchProducts();
  }, []);

  useEffect(() => {
    fetchProducts();
  }, [filters, currentPage]);

  const fetchFeaturedProducts = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/products/featured?limit=6`);
      const data = await response.json();
      if (data.success) {
        setFeaturedProducts(data.products);
      }
    } catch (error) {
      console.error('Error fetching featured products:', error);
    }
  };

  const fetchCategories = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/products/categories`);
      const data = await response.json();
      if (data.success) {
        setCategories(data.categories);
      }
    } catch (error) {
      console.error('Error fetching categories:', error);
    }
  };

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: currentPage,
        limit: 12,
        ...filters
      });
      
      const response = await fetch(`${API_BASE_URL}/api/products?${params}`);
      const data = await response.json();
      
      if (data.success) {
        setProducts(data.products);
        setPagination(data.pagination);
      } else {
        toast.error(data.message || 'Failed to fetch products');
      }
    } catch (error) {
      console.error('Error fetching products:', error);
      toast.error('Failed to fetch products');
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
    setCurrentPage(1);
  };

  const handleSearch = (e) => {
    e.preventDefault();
    fetchProducts();
  };


  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white py-16">
        <div className="container mx-auto px-4">
          <div className="text-center">
            <h1 className="text-5xl font-bold mb-4">Career Development Store</h1>
            <p className="text-xl mb-8">Enhance your career with our curated selection of courses, templates, and tools</p>
            <div className="max-w-2xl mx-auto">
              <form onSubmit={handleSearch} className="flex">
                <input
                  type="text"
                  placeholder="Search products..."
                  value={filters.search}
                  onChange={(e) => handleFilterChange('search', e.target.value)}
                  className="flex-1 px-4 py-3 rounded-l-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-300"
                />
                <button
                  type="submit"
                  className="px-6 py-3 bg-orange-500 hover:bg-orange-600 rounded-r-lg font-semibold transition-colors"
                >
                  Search
                </button>
              </form>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        {/* Featured Products */}
        {featuredProducts.length > 0 && (
          <section className="mb-12">
            <h2 className="text-3xl font-bold mb-8 text-gray-800">Featured Products</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {featuredProducts.map(product => (
                <div key={product._id} className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow">
                  <div className="relative">
                    <img
                      src={product.images?.[0]?.url || '/api/placeholder/300/200'}
                      alt={product.name}
                      className="w-full h-48 object-cover"
                    />
                    <div className="absolute top-2 left-2">
                      <span className="bg-orange-500 text-white px-2 py-1 rounded-full text-xs font-semibold">
                        Featured
                      </span>
                    </div>
                  </div>
                  <div className="p-4">
                    <h3 className="font-semibold text-lg mb-2 text-gray-800">{product.name}</h3>
                    <p className="text-gray-600 text-sm mb-3 line-clamp-2">{product.shortDescription}</p>
                    <div className="flex justify-between items-center mb-3">
                      <div>
                        <span className="text-2xl font-bold text-blue-600">
                          {formatPrice(product.discountedPrice || product.price, product.currency)}
                        </span>
                        {product.discountedPrice && (
                          <span className="text-gray-400 line-through ml-2">
                            {formatPrice(product.price, product.currency)}
                          </span>
                        )}
                      </div>
                      <span className="text-yellow-500">
                        {'★'.repeat(Math.round(product.rating?.average || 0))}
                        {'☆'.repeat(5 - Math.round(product.rating?.average || 0))}
                      </span>
                    </div>
                    <div className="flex gap-2">
                      <Link
                        to={`/shop/products/${product._id}`}
                        className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-800 py-2 px-4 rounded text-center transition-colors font-medium"
                      >
                        View Details
                      </Link>
                      <div className="flex-1">
                        <AddToCartButton 
                          product={product} 
                          variant="primary" 
                          size="md"
                          className="w-full"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Filters and Products */}
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Sidebar Filters */}
          <div className="lg:w-1/4">
            <div className="bg-white rounded-lg shadow-md p-6 sticky top-20">
              {/* Mini Cart removed */}

              <h3 className="font-bold text-lg mb-4 text-gray-800">Filters</h3>
              
              {/* Category Filter */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">Category</label>
                <select
                  value={filters.category}
                  onChange={(e) => handleFilterChange('category', e.target.value)}
                  className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="all">All Categories</option>
                  {categories.map(category => (
                    <option key={category.name} value={category.name}>
                      {category.name} ({category.count})
                    </option>
                  ))}
                </select>
              </div>

              {/* Price Range */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">Price Range</label>
                <div className="flex gap-2">
                  <input
                    type="number"
                    placeholder="Min"
                    value={filters.minPrice}
                    onChange={(e) => handleFilterChange('minPrice', e.target.value)}
                    className="w-1/2 p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <input
                    type="number"
                    placeholder="Max"
                    value={filters.maxPrice}
                    onChange={(e) => handleFilterChange('maxPrice', e.target.value)}
                    className="w-1/2 p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              {/* Sort By */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">Sort By</label>
                <select
                  value={`${filters.sort}-${filters.order}`}
                  onChange={(e) => {
                    const [sort, order] = e.target.value.split('-');
                    setFilters(prev => ({ ...prev, sort, order }));
                  }}
                  className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="createdAt-desc">Newest First</option>
                  <option value="createdAt-asc">Oldest First</option>
                  <option value="price-asc">Price: Low to High</option>
                  <option value="price-desc">Price: High to Low</option>
                  <option value="rating.average-desc">Highest Rated</option>
                  <option value="sales-desc">Most Popular</option>
                </select>
              </div>
            </div>
          </div>

          {/* Products Grid */}
          <div className="lg:w-3/4">
            {loading ? (
              <div className="text-center py-8">
                <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                <p className="mt-2 text-gray-600">Loading products...</p>
              </div>
            ) : (
              <>
                {/* Results Info */}
                <div className="flex justify-between items-center mb-6">
                  <p className="text-gray-600">
                    Showing {products.length} of {pagination.count} products
                  </p>
                </div>

                {/* Products Grid */}
                {products.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
                    {products.map(product => (
                      <div key={product._id} className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow">
                        <div className="relative">
                          <img
                            src={product.images?.[0]?.url || '/api/placeholder/300/200'}
                            alt={product.name}
                            className="w-full h-48 object-cover"
                          />
                          <div className="absolute top-2 left-2">
                            <span className="bg-blue-500 text-white px-2 py-1 rounded-full text-xs font-semibold">
                              {product.category}
                            </span>
                          </div>
                        </div>
                        <div className="p-4">
                          <h3 className="font-semibold text-lg mb-2 text-gray-800">{product.name}</h3>
                          <p className="text-gray-600 text-sm mb-3 line-clamp-2">{product.shortDescription}</p>
                          <div className="flex justify-between items-center mb-3">
                            <div>
                              <span className="text-2xl font-bold text-blue-600">
                                {formatPrice(product.discountedPrice || product.price, product.currency)}
                              </span>
                              {product.discountedPrice && (
                                <span className="text-gray-400 line-through ml-2">
                                  {formatPrice(product.price, product.currency)}
                                </span>
                              )}
                            </div>
                            <span className="text-yellow-500">
                              {'★'.repeat(Math.round(product.rating?.average || 0))}
                              {'☆'.repeat(5 - Math.round(product.rating?.average || 0))}
                            </span>
                          </div>
                          <div className="flex gap-2">
                            <Link
                              to={`/shop/products/${product._id}`}
                              className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-800 py-2 px-4 rounded text-center transition-colors font-medium"
                            >
                              View Details
                            </Link>
                            <div className="flex-1">
                              <AddToCartButton 
                                product={product} 
                                variant="primary" 
                                size="md"
                                className="w-full"
                              />
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <p className="text-gray-600">No products found matching your criteria.</p>
                  </div>
                )}

                {/* Pagination */}
                {pagination.total > 1 && (
                  <div className="flex justify-center gap-2">
                    <button
                      onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                      disabled={!pagination.hasPrev}
                      className="px-4 py-2 bg-gray-200 text-gray-700 rounded disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Previous
                    </button>
                    
                    {[...Array(Math.min(5, pagination.total))].map((_, i) => {
                      const page = i + 1;
                      return (
                        <button
                          key={page}
                          onClick={() => setCurrentPage(page)}
                          className={`px-4 py-2 rounded ${
                            page === currentPage
                              ? 'bg-blue-600 text-white'
                              : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                          }`}
                        >
                          {page}
                        </button>
                      );
                    })}
                    
                    <button
                      onClick={() => setCurrentPage(prev => Math.min(pagination.total, prev + 1))}
                      disabled={!pagination.hasNext}
                      className="px-4 py-2 bg-gray-200 text-gray-700 rounded disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Next
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Shop;