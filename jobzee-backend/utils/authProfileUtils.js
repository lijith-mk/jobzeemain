const Auth = require('../models/Auth');
const UserProfile = require('../models/UserDetails');
const EmployerProfile = require('../models/EmployerProfile');

class AuthProfileUtils {
  /**
   * Get complete user data (auth + profile)
   * @param {string} email - User email
   * @returns {Object} Combined auth and profile data
   */
  static async getUserByEmail(email) {
    const auth = await Auth.findOne({ email, role: 'user' }).lean();
    if (!auth) return null;

    const profile = await UserProfile.findOne({ authId: auth._id }).lean();
    
    return {
      auth,
      profile,
      // Combined fields for backward compatibility
      id: auth._id,
      email: auth.email,
      role: auth.role,
      isActive: auth.isActive,
      name: profile ? `${profile.firstName} ${profile.lastName}`.trim() : '',
      ...profile
    };
  }

  /**
   * Get complete employer data (auth + profile)
   * @param {string} email - Employer email
   * @returns {Object} Combined auth and profile data
   */
  static async getEmployerByEmail(email) {
    const auth = await Auth.findOne({ email, role: 'employer' }).lean();
    if (!auth) return null;

    const profile = await EmployerProfile.findOne({ authId: auth._id }).lean();
    
    return {
      auth,
      profile,
      // Combined fields for backward compatibility
      id: auth._id,
      email: auth.email,
      role: auth.role,
      isActive: auth.isActive,
      companyName: profile?.companyName,
      ...profile
    };
  }

  /**
   * Get any user by email regardless of role
   * @param {string} email - User email
   * @returns {Object} Combined auth and profile data
   */
  static async getAnyUserByEmail(email) {
    const auth = await Auth.findOne({ email }).lean();
    if (!auth) return null;

    let profile = null;
    
    if (auth.role === 'user') {
      profile = await UserProfile.findOne({ authId: auth._id }).lean();
    } else if (auth.role === 'employer') {
      profile = await EmployerProfile.findOne({ authId: auth._id }).lean();
    }
    
    return {
      auth,
      profile,
      id: auth._id,
      email: auth.email,
      role: auth.role,
      isActive: auth.isActive
    };
  }

  /**
   * Create new user (auth + profile)
   * @param {Object} userData - User data
   * @returns {Object} Created user data
   */
  static async createUser(userData) {
    const { email, password, firstName, lastName, phone, ...profileData } = userData;

    // Create auth record
    const auth = new Auth({
      email,
      password,
      role: 'user',
      authProvider: 'local',
      profileModel: 'UserProfile',
      isEmailVerified: false
    });
    await auth.save();

    // Create profile record
    const profile = new UserProfile({
      authId: auth._id,
      firstName,
      lastName,
      phone,
      ...profileData
    });
    await profile.save();

    // Update auth with profile reference
    auth.profileId = profile._id;
    await auth.save();

    return this.getUserByEmail(email);
  }

  /**
   * Create new employer (auth + profile)
   * @param {Object} employerData - Employer data
   * @returns {Object} Created employer data
   */
  static async createEmployer(employerData) {
    const { email, password, companyName, contactPersonName, ...profileData } = employerData;

    // Create auth record
    const auth = new Auth({
      email,
      password,
      role: 'employer',
      authProvider: 'local',
      profileModel: 'EmployerProfile',
      isEmailVerified: false
    });
    await auth.save();

    // Create profile record
    const profile = new EmployerProfile({
      authId: auth._id,
      companyName,
      contactPersonName,
      ...profileData
    });
    await profile.save();

    // Update auth with profile reference
    auth.profileId = profile._id;
    await auth.save();

    return this.getEmployerByEmail(email);
  }

  /**
   * Update user profile
   * @param {string} userId - Auth ID
   * @param {Object} updateData - Data to update
   * @returns {Object} Updated user data
   */
  static async updateUserProfile(userId, updateData) {
    const auth = await Auth.findById(userId);
    if (!auth || auth.role !== 'user') {
      throw new Error('User not found');
    }

    const profile = await UserProfile.findOneAndUpdate(
      { authId: userId },
      updateData,
      { new: true, runValidators: true }
    );

    return {
      auth: auth.toObject(),
      profile: profile.toObject()
    };
  }

  /**
   * Update employer profile
   * @param {string} employerId - Auth ID
   * @param {Object} updateData - Data to update
   * @returns {Object} Updated employer data
   */
  static async updateEmployerProfile(employerId, updateData) {
    const auth = await Auth.findById(employerId);
    if (!auth || auth.role !== 'employer') {
      throw new Error('Employer not found');
    }

    const profile = await EmployerProfile.findOneAndUpdate(
      { authId: employerId },
      updateData,
      { new: true, runValidators: true }
    );

    return {
      auth: auth.toObject(),
      profile: profile.toObject()
    };
  }

  /**
   * Delete user (auth + profile)
   * @param {string} userId - Auth ID
   * @returns {boolean} Success status
   */
  static async deleteUser(userId) {
    const auth = await Auth.findById(userId);
    if (!auth) return false;

    // Delete profile based on role
    if (auth.role === 'user') {
      await UserProfile.findOneAndDelete({ authId: userId });
    } else if (auth.role === 'employer') {
      await EmployerProfile.findOneAndDelete({ authId: userId });
    }

    // Delete auth record
    await Auth.findByIdAndDelete(userId);
    
    return true;
  }

  /**
   * Verify password
   * @param {string} email - User email
   * @param {string} password - Password to verify
   * @returns {Object|null} User data if valid, null if invalid
   */
  static async verifyPassword(email, password) {
    const auth = await Auth.findOne({ email });
    if (!auth) return null;

    const isValid = await auth.comparePassword(password);
    if (!isValid) {
      // Increment login attempts on failed login
      await auth.incLoginAttempts();
      return null;
    }

    // Reset login attempts on successful login
    if (auth.loginAttempts > 0) {
      await auth.resetLoginAttempts();
    }

    // Update last login
    auth.lastLoginAt = new Date();
    await auth.save();

    return this.getAnyUserByEmail(email);
  }

  /**
   * Get user with populated profile
   * @param {string} userId - Auth ID
   * @returns {Object} User with profile populated
   */
  static async getUserWithProfile(userId) {
    const auth = await Auth.findById(userId)
      .populate({
        path: 'profileId',
        model: function(doc) {
          return doc.profileModel;
        }
      })
      .lean();

    if (!auth) return null;

    return {
      ...auth,
      profile: auth.profileId
    };
  }

  /**
   * Search users with profiles
   * @param {Object} searchCriteria - Search criteria
   * @param {Object} options - Query options (limit, skip, sort)
   * @returns {Array} Array of users with profiles
   */
  static async searchUsers(searchCriteria = {}, options = {}) {
    const { limit = 20, skip = 0, sort = { createdAt: -1 } } = options;
    
    // Build auth query
    const authQuery = {};
    if (searchCriteria.email) {
      authQuery.email = new RegExp(searchCriteria.email, 'i');
    }
    if (searchCriteria.role) {
      authQuery.role = searchCriteria.role;
    }
    if (searchCriteria.isActive !== undefined) {
      authQuery.isActive = searchCriteria.isActive;
    }

    const auths = await Auth.find(authQuery)
      .limit(limit)
      .skip(skip)
      .sort(sort)
      .lean();

    // Get profiles for each auth
    const results = [];
    for (const auth of auths) {
      let profile = null;
      if (auth.role === 'user') {
        profile = await UserProfile.findOne({ authId: auth._id }).lean();
      } else if (auth.role === 'employer') {
        profile = await EmployerProfile.findOne({ authId: auth._id }).lean();
      }
      
      results.push({
        auth,
        profile,
        id: auth._id,
        email: auth.email,
        role: auth.role
      });
    }

    return results;
  }

  /**
   * Get profile completion percentage
   * @param {string} userId - Auth ID
   * @returns {number} Completion percentage
   */
  static async getProfileCompletion(userId) {
    const auth = await Auth.findById(userId);
    if (!auth) return 0;

    let profile = null;
    if (auth.role === 'user') {
      profile = await UserProfile.findOne({ authId: userId });
    } else if (auth.role === 'employer') {
      profile = await EmployerProfile.findOne({ authId: userId });
    }

    return profile?.profileCompleteness || 0;
  }
}

module.exports = AuthProfileUtils;
