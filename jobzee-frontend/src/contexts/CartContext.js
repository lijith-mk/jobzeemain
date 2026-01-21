import React, { createContext, useContext, useReducer, useEffect } from 'react';
import { toast } from 'react-toastify';

import API_BASE_URL from '../config/api';
// Cart Context
const CartContext = createContext();

// Initial State
const initialState = {
  items: [],
  summary: {
    itemCount: 0,
    productCount: 0,
    subtotal: 0,
    discount: 0,
    tax: 0,
    total: 0,
    currency: 'INR',
    appliedCoupons: []
  },
  isLoading: false,
  isInitialized: false
};

// Action Types
const CART_ACTIONS = {
  SET_LOADING: 'SET_LOADING',
  SET_CART: 'SET_CART',
  UPDATE_SUMMARY: 'UPDATE_SUMMARY',
  CLEAR_CART: 'CLEAR_CART',
  SET_INITIALIZED: 'SET_INITIALIZED'
};

// Reducer
const cartReducer = (state, action) => {
  switch (action.type) {
    case CART_ACTIONS.SET_LOADING:
      return {
        ...state,
        isLoading: action.payload
      };
    
    case CART_ACTIONS.SET_CART:
      return {
        ...state,
        items: action.payload.items || [],
        summary: action.payload.summary || initialState.summary,
        isLoading: false
      };
    
    case CART_ACTIONS.UPDATE_SUMMARY:
      return {
        ...state,
        summary: { ...state.summary, ...action.payload }
      };
    
    case CART_ACTIONS.CLEAR_CART:
      return {
        ...state,
        items: [],
        summary: { ...initialState.summary, currency: state.summary.currency }
      };
    
    case CART_ACTIONS.SET_INITIALIZED:
      return {
        ...state,
        isInitialized: action.payload
      };
    
    default:
      return state;
  }
};

// API Base URL - using imported value with /api suffix
const API_URL = `${API_BASE_URL}/api`;

// Utility function to get auth headers
const getAuthHeaders = () => {
  const userToken = localStorage.getItem('token'); // Regular user token
  const employerToken = localStorage.getItem('employerToken'); // Employer token
  
  const headers = {
    'Content-Type': 'application/json'
  };
  
  if (userToken) {
    headers.Authorization = `Bearer ${userToken}`;
  } else if (employerToken) {
    headers.Authorization = `Bearer ${employerToken}`;
  }
  
  return headers;
};

// Custom hook to use Cart Context
export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
};

// Cart Provider Component
export const CartProvider = ({ children }) => {
  const [state, dispatch] = useReducer(cartReducer, initialState);

  // Fetch cart data
  const fetchCart = async (showLoader = false) => {
    try {
      if (showLoader) {
        dispatch({ type: CART_ACTIONS.SET_LOADING, payload: true });
      }

      const headers = getAuthHeaders();
      if (!headers.Authorization) {
        // No authentication, set empty cart
        dispatch({
          type: CART_ACTIONS.SET_CART,
          payload: {
            items: [],
            summary: initialState.summary
          }
        });
        dispatch({ type: CART_ACTIONS.SET_INITIALIZED, payload: true });
        return;
      }

      const response = await fetch(`${API_URL}/cart`, {
        headers
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          dispatch({
            type: CART_ACTIONS.SET_CART,
            payload: {
              items: data.items || [],
              summary: data.summary || initialState.summary
            }
          });
        }
      } else {
        // Handle auth errors silently
        dispatch({
          type: CART_ACTIONS.SET_CART,
          payload: {
            items: [],
            summary: initialState.summary
          }
        });
      }
    } catch (error) {
      console.error('Error fetching cart:', error);
      dispatch({
        type: CART_ACTIONS.SET_CART,
        payload: {
          items: [],
          summary: initialState.summary
        }
      });
    } finally {
      dispatch({ type: CART_ACTIONS.SET_LOADING, payload: false });
      dispatch({ type: CART_ACTIONS.SET_INITIALIZED, payload: true });
    }
  };

  // Fetch cart summary only
  const fetchCartSummary = async () => {
    try {
      const headers = getAuthHeaders();
      if (!headers.Authorization) return;

      const response = await fetch(`${API_URL}/cart/summary`, {
        headers
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          dispatch({
            type: CART_ACTIONS.UPDATE_SUMMARY,
            payload: data.summary
          });
        }
      }
    } catch (error) {
      console.error('Error fetching cart summary:', error);
    }
  };

  // Add item to cart
  const addToCart = async (productId, quantity = 1) => {
    try {
      const headers = getAuthHeaders();
      if (!headers.Authorization) {
        toast.error('Please login to add items to cart');
        return false;
      }

      const response = await fetch(`${API_URL}/cart/add`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ productId, quantity })
      });

      const data = await response.json();

      if (response.ok && data.success) {
        // Update summary immediately
        dispatch({
          type: CART_ACTIONS.UPDATE_SUMMARY,
          payload: data.summary
        });
        
        // Refresh full cart data
        await fetchCart();
        
        toast.success(data.message || 'Item added to cart');
        return true;
      } else {
        toast.error(data.message || 'Failed to add item to cart');
        return false;
      }
    } catch (error) {
      console.error('Error adding to cart:', error);
      toast.error('Failed to add item to cart');
      return false;
    }
  };

  // Update cart item quantity
  const updateCartItem = async (productId, quantity) => {
    try {
      const headers = getAuthHeaders();
      if (!headers.Authorization) return false;

      const response = await fetch(`${API_URL}/cart/update/${productId}`, {
        method: 'PUT',
        headers,
        body: JSON.stringify({ quantity })
      });

      const data = await response.json();

      if (response.ok && data.success) {
        dispatch({
          type: CART_ACTIONS.UPDATE_SUMMARY,
          payload: data.summary
        });
        
        await fetchCart();
        return true;
      } else {
        toast.error(data.message || 'Failed to update cart item');
        return false;
      }
    } catch (error) {
      console.error('Error updating cart item:', error);
      toast.error('Failed to update cart item');
      return false;
    }
  };

  // Remove item from cart
  const removeFromCart = async (productId) => {
    try {
      const headers = getAuthHeaders();
      if (!headers.Authorization) return false;

      const response = await fetch(`${API_URL}/cart/remove/${productId}`, {
        method: 'DELETE',
        headers
      });

      const data = await response.json();

      if (response.ok && data.success) {
        dispatch({
          type: CART_ACTIONS.UPDATE_SUMMARY,
          payload: data.summary
        });
        
        await fetchCart();
        toast.success(data.message || 'Item removed from cart');
        return true;
      } else {
        toast.error(data.message || 'Failed to remove item from cart');
        return false;
      }
    } catch (error) {
      console.error('Error removing from cart:', error);
      toast.error('Failed to remove item from cart');
      return false;
    }
  };

  // Clear entire cart
  const clearCart = async () => {
    try {
      const headers = getAuthHeaders();
      if (!headers.Authorization) return false;

      const response = await fetch(`${API_URL}/cart/clear`, {
        method: 'DELETE',
        headers
      });

      const data = await response.json();

      if (response.ok && data.success) {
        dispatch({ type: CART_ACTIONS.CLEAR_CART });
        toast.success(data.message || 'Cart cleared successfully');
        return true;
      } else {
        toast.error(data.message || 'Failed to clear cart');
        return false;
      }
    } catch (error) {
      console.error('Error clearing cart:', error);
      toast.error('Failed to clear cart');
      return false;
    }
  };

  // Apply coupon
  const applyCoupon = async (code, discount = 10, type = 'percentage') => {
    try {
      const headers = getAuthHeaders();
      if (!headers.Authorization) return false;

      const response = await fetch(`${API_URL}/cart/coupon`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ code, discount, type })
      });

      const data = await response.json();

      if (response.ok && data.success) {
        dispatch({
          type: CART_ACTIONS.UPDATE_SUMMARY,
          payload: data.summary
        });
        
        await fetchCart();
        toast.success(data.message || 'Coupon applied successfully');
        return true;
      } else {
        toast.error(data.message || 'Failed to apply coupon');
        return false;
      }
    } catch (error) {
      console.error('Error applying coupon:', error);
      toast.error('Failed to apply coupon');
      return false;
    }
  };

  // Remove coupon
  const removeCoupon = async (code) => {
    try {
      const headers = getAuthHeaders();
      if (!headers.Authorization) return false;

      const response = await fetch(`${API_URL}/cart/coupon/${code}`, {
        method: 'DELETE',
        headers
      });

      const data = await response.json();

      if (response.ok && data.success) {
        dispatch({
          type: CART_ACTIONS.UPDATE_SUMMARY,
          payload: data.summary
        });
        
        await fetchCart();
        toast.success(data.message || 'Coupon removed successfully');
        return true;
      } else {
        toast.error(data.message || 'Failed to remove coupon');
        return false;
      }
    } catch (error) {
      console.error('Error removing coupon:', error);
      toast.error('Failed to remove coupon');
      return false;
    }
  };

  // Utility function to format price
  const formatPrice = (price, currency = 'INR') => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 2
    }).format(price);
  };

  // Initialize cart on mount and auth changes
  useEffect(() => {
    const initCart = async () => {
      await fetchCart(false);
    };
    
    initCart();

    // Listen for authentication changes
    const handleAuthChange = () => {
      fetchCart(false);
    };

    window.addEventListener('authChange', handleAuthChange);
    return () => window.removeEventListener('authChange', handleAuthChange);
  }, []);

  // Context value
  const value = {
    // State
    items: state.items,
    summary: state.summary,
    isLoading: state.isLoading,
    isInitialized: state.isInitialized,
    
    // Actions
    fetchCart,
    fetchCartSummary,
    addToCart,
    updateCartItem,
    removeFromCart,
    clearCart,
    applyCoupon,
    removeCoupon,
    
    // Utilities
    formatPrice
  };

  return (
    <CartContext.Provider value={value}>
      {children}
    </CartContext.Provider>
  );
};

export default CartContext;