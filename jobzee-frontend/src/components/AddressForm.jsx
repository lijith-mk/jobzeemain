import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';

const AddressForm = ({ 
  onAddressSubmit, 
  initialData = null, 
  isEdit = false, 
  onCancel = null,
  showBillingForm = false 
}) => {
  const [formData, setFormData] = useState({
    fullName: '',
    phone: '',
    street: '',
    city: '',
    state: '',
    pincode: '',
    country: 'India',
    landmark: '',
    addressType: 'home',
    isDefault: false
  });
  
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (initialData) {
      setFormData({
        fullName: initialData.fullName || '',
        phone: initialData.phone || '',
        street: initialData.street || '',
        city: initialData.city || '',
        state: initialData.state || '',
        pincode: initialData.pincode || '',
        country: initialData.country || 'India',
        landmark: initialData.landmark || '',
        addressType: initialData.addressType || 'home',
        isDefault: initialData.isDefault || false
      });
    }
  }, [initialData]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
    
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.fullName.trim()) {
      newErrors.fullName = 'Full name is required';
    } else if (formData.fullName.trim().length < 2) {
      newErrors.fullName = 'Full name must be at least 2 characters';
    }
    
    if (!formData.phone.trim()) {
      newErrors.phone = 'Phone number is required';
    } else if (!/^[+]?[\d\s\-\(\)]{10,15}$/.test(formData.phone)) {
      newErrors.phone = 'Please enter a valid phone number';
    }
    
    if (!formData.street.trim()) {
      newErrors.street = 'Street address is required';
    } else if (formData.street.trim().length < 5) {
      newErrors.street = 'Street address must be at least 5 characters';
    }
    
    if (!formData.city.trim()) {
      newErrors.city = 'City is required';
    }
    
    if (!formData.state.trim()) {
      newErrors.state = 'State is required';
    }
    
    if (!formData.pincode.trim()) {
      newErrors.pincode = 'Pincode is required';
    } else if (!/^[0-9]{5,10}$/.test(formData.pincode)) {
      newErrors.pincode = 'Please enter a valid pincode (5-10 digits)';
    }
    
    if (formData.landmark && formData.landmark.length > 100) {
      newErrors.landmark = 'Landmark cannot exceed 100 characters';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      toast.error('Please fix the errors below');
      return;
    }
    
    setLoading(true);
    try {
      await onAddressSubmit(formData);
    } catch (error) {
      console.error('Address submission error:', error);
    } finally {
      setLoading(false);
    }
  };

  const InputField = ({ name, label, type = 'text', required = true, placeholder, maxLength }) => (
    <div className="space-y-1">
      <label className="block text-sm font-medium text-gray-700">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      <input
        type={type}
        name={name}
        value={formData[name]}
        onChange={handleChange}
        placeholder={placeholder}
        maxLength={maxLength}
        className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors ${
          errors[name] ? 'border-red-500' : 'border-gray-300'
        }`}
      />
      {errors[name] && (
        <p className="text-sm text-red-600">{errors[name]}</p>
      )}
    </div>
  );

  return (
    <div className="bg-white rounded-2xl shadow-xl p-8 max-w-2xl mx-auto">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          {isEdit ? 'Edit Address' : showBillingForm ? 'Billing Address' : 'Shipping Address'}
        </h2>
        <p className="text-gray-600">
          {isEdit 
            ? 'Update your address information below' 
            : showBillingForm 
              ? 'Enter your billing address for the order'
              : 'Enter your shipping address for delivery'
          }
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Personal Information */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <InputField
            name="fullName"
            label="Full Name"
            placeholder="Enter your full name"
            maxLength={100}
          />
          <InputField
            name="phone"
            label="Phone Number"
            type="tel"
            placeholder="Enter your phone number"
          />
        </div>

        {/* Address Information */}
        <div className="space-y-4">
          <InputField
            name="street"
            label="Street Address"
            placeholder="Enter your street address, building, apartment"
            maxLength={200}
          />
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <InputField
              name="city"
              label="City"
              placeholder="Enter city"
              maxLength={50}
            />
            <InputField
              name="state"
              label="State"
              placeholder="Enter state"
              maxLength={50}
            />
            <InputField
              name="pincode"
              label="Pincode"
              placeholder="Enter pincode"
              maxLength={10}
            />
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="block text-sm font-medium text-gray-700">
                Country
              </label>
              <select
                name="country"
                value={formData.country}
                onChange={handleChange}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="India">India</option>
                <option value="United States">United States</option>
                <option value="United Kingdom">United Kingdom</option>
                <option value="Canada">Canada</option>
                <option value="Australia">Australia</option>
                <option value="Other">Other</option>
              </select>
            </div>
            
            <InputField
              name="landmark"
              label="Landmark (Optional)"
              placeholder="Nearby landmark"
              required={false}
              maxLength={100}
            />
          </div>
        </div>

        {/* Additional Options */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-1">
            <label className="block text-sm font-medium text-gray-700">
              Address Type
            </label>
            <select
              name="addressType"
              value={formData.addressType}
              onChange={handleChange}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="home">Home</option>
              <option value="office">Office</option>
              <option value="other">Other</option>
            </select>
          </div>
          
          <div className="flex items-center space-x-3 pt-8">
            <input
              type="checkbox"
              name="isDefault"
              checked={formData.isDefault}
              onChange={handleChange}
              className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
            />
            <label className="text-sm font-medium text-gray-700">
              Set as default address
            </label>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 pt-6">
          <button
            type="submit"
            disabled={loading}
            className="flex-1 bg-gradient-to-r from-blue-600 to-blue-700 text-white px-6 py-3 rounded-lg font-semibold hover:from-blue-700 hover:to-blue-800 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
          >
            {loading ? (
              <>
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                {isEdit ? 'Updating...' : 'Saving...'}
              </>
            ) : (
              isEdit ? 'Update Address' : 'Save Address'
            )}
          </button>
          
          {onCancel && (
            <button
              type="button"
              onClick={onCancel}
              className="flex-1 bg-gray-200 text-gray-800 px-6 py-3 rounded-lg font-semibold hover:bg-gray-300 transition-colors"
            >
              Cancel
            </button>
          )}
        </div>
      </form>
    </div>
  );
};

export default AddressForm;
