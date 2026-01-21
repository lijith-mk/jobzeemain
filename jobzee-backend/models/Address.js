const mongoose = require('mongoose');

const addressSchema = new mongoose.Schema({
  // User identification - either regular user or employer
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    sparse: true
  },
  employer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Employer',
    sparse: true
  },
  userType: {
    type: String,
    enum: ['user', 'employer'],
    required: [true, 'User type is required']
  },
  
  // Address details
  fullName: {
    type: String,
    required: [true, 'Full name is required'],
    trim: true,
    maxlength: [100, 'Full name cannot exceed 100 characters']
  },
  phone: {
    type: String,
    required: [true, 'Phone number is required'],
    trim: true,
    match: [/^[+]?[\d\s\-\(\)]{10,15}$/, 'Please enter a valid phone number']
  },
  street: {
    type: String,
    required: [true, 'Street address is required'],
    trim: true,
    maxlength: [200, 'Street address cannot exceed 200 characters']
  },
  city: {
    type: String,
    required: [true, 'City is required'],
    trim: true,
    maxlength: [50, 'City name cannot exceed 50 characters']
  },
  state: {
    type: String,
    required: [true, 'State is required'],
    trim: true,
    maxlength: [50, 'State name cannot exceed 50 characters']
  },
  pincode: {
    type: String,
    required: [true, 'Pincode is required'],
    trim: true,
    match: [/^[0-9]{5,10}$/, 'Please enter a valid pincode']
  },
  country: {
    type: String,
    required: [true, 'Country is required'],
    trim: true,
    maxlength: [50, 'Country name cannot exceed 50 characters'],
    default: 'India'
  },
  landmark: {
    type: String,
    trim: true,
    maxlength: [100, 'Landmark cannot exceed 100 characters']
  },
  
  // Address metadata
  isDefault: {
    type: Boolean,
    default: false
  },
  addressType: {
    type: String,
    enum: ['home', 'office', 'other'],
    default: 'home'
  },
  isActive: {
    type: Boolean,
    default: true
  },
  
  // Timestamps
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Indexes for better performance
addressSchema.index({ user: 1, userType: 1, isActive: 1 });
addressSchema.index({ employer: 1, userType: 1, isActive: 1 });
addressSchema.index({ isDefault: 1 });

// Ensure only one default address per user/employer
addressSchema.pre('save', async function(next) {
  if (this.isDefault && this.isModified('isDefault')) {
    // Remove default status from other addresses
    await this.constructor.updateMany(
      { 
        [this.userType]: this[this.userType], 
        userType: this.userType,
        _id: { $ne: this._id },
        isActive: true
      },
      { $set: { isDefault: false } }
    );
  }
  next();
});

// Virtual for formatted address
addressSchema.virtual('formattedAddress').get(function() {
  const parts = [
    this.street,
    this.city,
    this.state,
    this.pincode,
    this.country
  ].filter(Boolean);
  
  return parts.join(', ');
});

// Virtual for short address (for display in lists)
addressSchema.virtual('shortAddress').get(function() {
  return `${this.city}, ${this.state} - ${this.pincode}`;
});

// Static method to get user's addresses
addressSchema.statics.getUserAddresses = async function(userId, userType) {
  return await this.find({
    [userType]: userId,
    userType: userType,
    isActive: true
  }).sort({ isDefault: -1, createdAt: -1 });
};

// Static method to get default address
addressSchema.statics.getDefaultAddress = async function(userId, userType) {
  return await this.findOne({
    [userType]: userId,
    userType: userType,
    isDefault: true,
    isActive: true
  });
};

// Static method to create address
addressSchema.statics.createAddress = async function(addressData, userId, userType) {
  // If this is set as default, remove default from others
  if (addressData.isDefault) {
    await this.updateMany(
      { [userType]: userId, userType: userType, isActive: true },
      { $set: { isDefault: false } }
    );
  }
  
  const address = new this({
    ...addressData,
    [userType]: userId,
    userType: userType
  });
  
  return await address.save();
};

// Static method to update address
addressSchema.statics.updateAddress = async function(addressId, addressData, userId, userType) {
  // If this is set as default, remove default from others
  if (addressData.isDefault) {
    await this.updateMany(
      { [userType]: userId, userType: userType, isActive: true, _id: { $ne: addressId } },
      { $set: { isDefault: false } }
    );
  }
  
  return await this.findOneAndUpdate(
    { _id: addressId, [userType]: userId, userType: userType, isActive: true },
    { $set: { ...addressData, updatedAt: new Date() } },
    { new: true }
  );
};

// Static method to delete address
addressSchema.statics.deleteAddress = async function(addressId, userId, userType) {
  return await this.findOneAndUpdate(
    { _id: addressId, [userType]: userId, userType: userType, isActive: true },
    { $set: { isActive: false, updatedAt: new Date() } },
    { new: true }
  );
};

// Ensure virtuals are included in JSON output
addressSchema.set('toJSON', { virtuals: true });
addressSchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('Address', addressSchema);
