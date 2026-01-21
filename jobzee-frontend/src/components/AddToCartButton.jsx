import React, { useState } from 'react';
import { ShoppingCartIcon, PlusIcon, CheckIcon } from '@heroicons/react/24/outline';
import { useCart } from '../contexts/CartContext';

const AddToCartButton = ({ 
  product, 
  quantity = 1, 
  variant = 'primary', 
  size = 'md',
  showQuantitySelector = false,
  disabled = false,
  className = '' 
}) => {
  const [isAdding, setIsAdding] = useState(false);
  const [localQuantity, setLocalQuantity] = useState(quantity);
  const [justAdded, setJustAdded] = useState(false);
  const { addToCart, formatPrice } = useCart();

  // Check if product is available
  const isAvailable = product && product.isAvailable && (product.isUnlimited || product.stock > 0);
  const isOutOfStock = product && !product.isUnlimited && product.stock === 0;

  const handleAddToCart = async () => {
    if (!product || isAdding || disabled || !isAvailable) return;

    setIsAdding(true);
    
    const success = await addToCart(product._id, localQuantity);
    
    if (success) {
      setJustAdded(true);
      setTimeout(() => setJustAdded(false), 2000);
    }
    
    setIsAdding(false);
  };

  const handleQuantityChange = (newQuantity) => {
    const maxQuantity = product.isUnlimited ? 100 : Math.min(100, product.stock);
    const validQuantity = Math.max(1, Math.min(maxQuantity, newQuantity));
    setLocalQuantity(validQuantity);
  };

  // Button size classes
  const sizeClasses = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-4 py-2 text-base',
    lg: 'px-6 py-3 text-lg'
  };

  // Button variant classes
  const variantClasses = {
    primary: 'bg-orange-500 hover:bg-orange-600 text-white border-orange-500',
    secondary: 'bg-blue-500 hover:bg-blue-600 text-white border-blue-500',
    outline: 'bg-white hover:bg-gray-50 text-gray-800 border-gray-300',
    success: 'bg-green-500 hover:bg-green-600 text-white border-green-500'
  };

  if (!product) {
    return null;
  }

  if (isOutOfStock) {
    return (
      <button
        disabled
        className={`${sizeClasses[size]} font-semibold rounded-lg border-2 transition-all duration-200 bg-gray-300 text-gray-500 border-gray-300 cursor-not-allowed ${className}`}
      >
        Out of Stock
      </button>
    );
  }

  if (!isAvailable) {
    return (
      <button
        disabled
        className={`${sizeClasses[size]} font-semibold rounded-lg border-2 transition-all duration-200 bg-gray-300 text-gray-500 border-gray-300 cursor-not-allowed ${className}`}
      >
        Unavailable
      </button>
    );
  }

  return (
    <div className={`flex flex-col gap-2 ${className}`}>
      {/* Quantity Selector */}
      {showQuantitySelector && (
        <div className="flex items-center gap-2">
          <label className="text-sm font-medium text-gray-700">Qty:</label>
          <div className="flex items-center border border-gray-300 rounded-md">
            <button
              onClick={() => handleQuantityChange(localQuantity - 1)}
              disabled={localQuantity <= 1}
              className="px-2 py-1 text-gray-600 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              -
            </button>
            <input
              type="number"
              value={localQuantity}
              onChange={(e) => handleQuantityChange(parseInt(e.target.value) || 1)}
              min="1"
              max={product.isUnlimited ? 100 : product.stock}
              className="w-16 px-2 py-1 text-center border-0 focus:ring-0"
            />
            <button
              onClick={() => handleQuantityChange(localQuantity + 1)}
              disabled={!product.isUnlimited && localQuantity >= product.stock}
              className="px-2 py-1 text-gray-600 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              +
            </button>
          </div>
          {!product.isUnlimited && (
            <span className="text-xs text-gray-500">
              ({product.stock} available)
            </span>
          )}
        </div>
      )}

      {/* Add to Cart Button */}
      <button
        onClick={handleAddToCart}
        disabled={isAdding || disabled || !isAvailable}
        className={`
          ${sizeClasses[size]} 
          ${justAdded ? variantClasses.success : variantClasses[variant]}
          font-semibold rounded-lg border-2 transition-all duration-200 
          flex items-center justify-center gap-2 min-w-fit
          disabled:opacity-50 disabled:cursor-not-allowed
          hover:transform hover:scale-105 active:transform active:scale-95
          shadow-sm hover:shadow-md
        `}
      >
        {isAdding ? (
          <>
            <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
            Adding...
          </>
        ) : justAdded ? (
          <>
            <CheckIcon className="h-5 w-5" />
            Added!
          </>
        ) : (
          <>
            <ShoppingCartIcon className="h-5 w-5" />
            Add to Cart
            {showQuantitySelector && localQuantity > 1 && (
              <span className="bg-white bg-opacity-20 rounded-full px-2 py-0.5 text-xs">
                {localQuantity}
              </span>
            )}
          </>
        )}
      </button>

      {/* Price Display */}
      {product.price && (
        <div className="text-sm">
          <div className="flex items-center gap-2">
            <span className="font-bold text-lg text-blue-600">
              {formatPrice(product.discountedPrice || product.price, product.currency)}
            </span>
            {product.discountedPrice && product.discountedPrice < product.price && (
              <>
                <span className="text-gray-400 line-through">
                  {formatPrice(product.price, product.currency)}
                </span>
                <span className="text-green-600 text-xs font-medium">
                  {Math.round(((product.price - product.discountedPrice) / product.price) * 100)}% off
                </span>
              </>
            )}
          </div>
          {showQuantitySelector && localQuantity > 1 && (
            <div className="text-xs text-gray-600 mt-1">
              Total: {formatPrice((product.discountedPrice || product.price) * localQuantity, product.currency)}
            </div>
          )}
        </div>
      )}

      {/* Stock warning */}
      {!product.isUnlimited && product.stock <= 5 && product.stock > 0 && (
        <div className="text-xs text-orange-600 font-medium">
          Only {product.stock} left in stock!
        </div>
      )}

      {/* Free shipping indicator */}
      {product.productType === 'digital' && (
        <div className="text-xs text-green-600 font-medium flex items-center gap-1">
          <span>📧</span>
          Instant Digital Delivery
        </div>
      )}
    </div>
  );
};

export default AddToCartButton;