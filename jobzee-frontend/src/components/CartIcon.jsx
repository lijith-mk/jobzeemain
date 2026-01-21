import React from 'react';
import { Link } from 'react-router-dom';
import { ShoppingCartIcon } from '@heroicons/react/24/outline';
import { useCart } from '../contexts/CartContext';

const CartIcon = ({ className = '', showLabel = true, size = 'md' }) => {
  const { summary, isLoading } = useCart();

  const sizeClasses = {
    sm: 'h-5 w-5',
    md: 'h-6 w-6',
    lg: 'h-8 w-8'
  };

  const badgeSizeClasses = {
    sm: 'h-4 w-4 text-xs',
    md: 'h-5 w-5 text-xs',
    lg: 'h-6 w-6 text-sm'
  };

  return (
    <Link
      to="/cart"
      className={`relative flex items-center gap-2 text-gray-700 hover:text-blue-600 transition-colors ${className}`}
    >
      <div className="relative">
        <ShoppingCartIcon className={sizeClasses[size]} />
        
        {/* Cart item count badge */}
        {summary.itemCount > 0 && (
          <div className={`
            absolute -top-2 -right-2 
            ${badgeSizeClasses[size]}
            bg-orange-500 text-white rounded-full 
            flex items-center justify-center font-bold
            animate-pulse
            shadow-sm
          `}>
            {summary.itemCount > 99 ? '99+' : summary.itemCount}
          </div>
        )}

        {/* Loading indicator */}
        {isLoading && (
          <div className="absolute -top-1 -right-1">
            <div className="h-3 w-3 bg-blue-500 rounded-full animate-pulse"></div>
          </div>
        )}
      </div>

      {/* Cart label and total */}
      {showLabel && (
        <div className="hidden md:flex flex-col">
          <span className="text-sm font-medium">Cart</span>
          {summary.itemCount > 0 ? (
            <span className="text-xs text-gray-500">
              {summary.itemCount} item{summary.itemCount !== 1 ? 's' : ''} • ₹{summary.total.toFixed(2)}
            </span>
          ) : (
            <span className="text-xs text-gray-500">Empty</span>
          )}
        </div>
      )}
    </Link>
  );
};

export default CartIcon;