const mongoose = require('mongoose');
require('dotenv').config();

// Import old models
const OldUser = require('../models/User');
const OldEmployer = require('../models/Employer');

// Import new models
const Auth = require('../models/Auth');
const UserProfile = require('../models/UserDetails'); // This is now UserProfile
const EmployerProfile = require('../models/EmployerProfile');

async function migrateUsers() {
  console.log('🔄 Starting User migration...');
  
  try {
    const oldUsers = await OldUser.find({});
    console.log(`Found ${oldUsers.length} users to migrate`);
    
    for (const oldUser of oldUsers) {
      console.log(`Migrating user: ${oldUser.email}`);
      
      // Create Auth record
      const authData = {
        email: oldUser.email,
        password: oldUser.password,
        role: oldUser.role || 'user',
        googleId: oldUser.googleId,
        authProvider: oldUser.authProvider || 'local',
        resetPasswordToken: oldUser.resetPasswordToken,
        resetPasswordExpires: oldUser.resetPasswordExpires,
        isActive: true,
        isEmailVerified: true, // Assume existing users are verified
        profileModel: 'UserProfile'
      };
      
      const auth = new Auth(authData);
      await auth.save();
      
      // Create UserProfile record
      const nameParts = oldUser.name ? oldUser.name.trim().split(' ') : ['User'];
      const firstName = nameParts[0] || 'User';
      const lastName = nameParts.length > 1 ? nameParts.slice(1).join(' ') : 'User';
      
      const profileData = {
        authId: auth._id,
        firstName: firstName,
        lastName: lastName,
        phone: oldUser.phone,
        profilePhoto: oldUser.profilePhoto,
        avatar: oldUser.avatar,
        title: oldUser.title,
        bio: oldUser.bio,
        currentRole: oldUser.currentRole,
        yearsOfExperience: oldUser.yearsOfExperience,
        experienceLevel: oldUser.experienceLevel && oldUser.experienceLevel !== '' ? oldUser.experienceLevel : null,
        skills: oldUser.skills || [],
        education: oldUser.education ? {
          degree: oldUser.education,
          field: '',
          institution: '',
          graduationYear: null
        } : {},
        resume: oldUser.resume,
        location: oldUser.location ? {
          city: oldUser.location,
          address: '',
          state: '',
          country: '',
          zipCode: ''
        } : {},
        website: oldUser.website,
        portfolio: oldUser.portfolio,
        socialMedia: oldUser.socialMedia || {},
        preferences: {
          jobTypes: oldUser.preferredJobTypes || [],
          industries: oldUser.preferredFields || [],
          workArrangement: (oldUser.remotePreference && oldUser.remotePreference !== '') ? oldUser.remotePreference : 'any',
          salaryRange: {
            min: oldUser.expectedSalary?.min,
            max: oldUser.expectedSalary?.max,
            currency: oldUser.expectedSalary?.currency || 'USD'
          },
          availability: (oldUser.noticePeriod && oldUser.noticePeriod !== '') ? oldUser.noticePeriod : null,
          willingToRelocate: oldUser.willingToRelocate || false
        },
        workAuthorization: (oldUser.workAuthorization && oldUser.workAuthorization !== '') ? oldUser.workAuthorization : null,
        languages: oldUser.languages?.map(lang => ({
          language: lang,
          proficiency: 'conversational'
        })) || [],
        achievements: oldUser.achievements?.map(achievement => ({
          title: achievement,
          description: '',
          date: null,
          issuer: ''
        })) || [],
        isOnboarded: oldUser.isOnboarded || false,
        lastActiveAt: oldUser.updatedAt || new Date(),
        isActive: true,
        createdAt: oldUser.createdAt,
        updatedAt: oldUser.updatedAt
      };
      
      const userProfile = new UserProfile(profileData);
      await userProfile.save();
      
      // Update auth with profile reference
      auth.profileId = userProfile._id;
      await auth.save();
      
      console.log(`✅ Migrated user: ${oldUser.email}`);
    }
    
    console.log('🎉 User migration completed successfully!');
  } catch (error) {
    console.error('❌ Error during user migration:', error);
    throw error;
  }
}

async function migrateEmployers() {
  console.log('🔄 Starting Employer migration...');
  
  try {
    const oldEmployers = await OldEmployer.find({});
    console.log(`Found ${oldEmployers.length} employers to migrate`);
    
    for (const oldEmployer of oldEmployers) {
      console.log(`Migrating employer: ${oldEmployer.companyEmail}`);
      
      // Create Auth record
      const authData = {
        email: oldEmployer.companyEmail,
        password: oldEmployer.password,
        role: oldEmployer.role || 'employer',
        googleId: oldEmployer.googleId,
        authProvider: oldEmployer.authProvider || 'local',
        resetPasswordToken: oldEmployer.resetPasswordToken,
        resetPasswordExpires: oldEmployer.resetPasswordExpires,
        isActive: oldEmployer.isActive !== false,
        isEmailVerified: true, // Assume existing employers are verified
        lastLoginAt: oldEmployer.lastLoginAt,
        profileModel: 'EmployerProfile'
      };
      
      const auth = new Auth(authData);
      await auth.save();
      
      // Create EmployerProfile record
      const profileData = {
        authId: auth._id,
        companyName: oldEmployer.companyName,
        companyPhone: oldEmployer.companyPhone,
        contactPersonName: oldEmployer.contactPersonName,
        contactPersonTitle: oldEmployer.contactPersonTitle,
        contactPersonEmail: oldEmployer.contactPersonEmail,
        contactPersonPhone: oldEmployer.contactPersonPhone,
        companyDescription: oldEmployer.companyDescription,
        industry: oldEmployer.industry,
        companySize: oldEmployer.companySize,
        foundedYear: oldEmployer.foundedYear,
        headquarters: oldEmployer.headquarters || {},
        website: oldEmployer.website,
        socialMedia: {
          linkedIn: oldEmployer.linkedinProfile,
          twitter: oldEmployer.twitterHandle,
          facebook: '',
          instagram: ''
        },
        isVerified: oldEmployer.isVerified || false,
        verificationDocument: oldEmployer.verificationDocument,
        verificationStatus: oldEmployer.verificationStatus || 'pending',
        verificationNotes: oldEmployer.verificationNotes,
        companyValues: oldEmployer.companyValues || [],
        benefits: oldEmployer.benefits || [],
        workCulture: oldEmployer.workCulture,
        companyLogo: oldEmployer.companyLogo,
        companyImages: oldEmployer.companyImages || [],
        profilePhoto: oldEmployer.profilePhoto,
        subscriptionPlan: oldEmployer.subscriptionPlan || 'free',
        subscriptionStartDate: oldEmployer.subscriptionStartDate,
        subscriptionEndDate: oldEmployer.subscriptionEndDate,
        jobPostingLimit: oldEmployer.jobPostingLimit || 3,
        jobPostingsUsed: oldEmployer.jobPostingsUsed || 0,
        settings: {
          autoApproveApplications: oldEmployer.autoApproveApplications || false,
          requireCoverLetter: false,
          allowAnonymousApplications: false,
          showSalaryRange: true
        },
        notifications: {
          email: oldEmployer.emailNotifications !== false,
          sms: oldEmployer.smsNotifications || false,
          newApplications: true,
          jobExpiring: true,
          subscriptionReminders: true
        },
        analytics: {
          profileViews: oldEmployer.profileViews || 0,
          totalJobPosts: oldEmployer.totalJobPosts || 0,
          activeJobPosts: 0,
          totalApplicationsReceived: oldEmployer.totalApplicationsReceived || 0,
          averageApplicationsPerJob: 0,
          topSkillsRequested: []
        },
        isActive: oldEmployer.isActive !== false,
        lastActiveAt: oldEmployer.lastLoginAt || oldEmployer.updatedAt || new Date(),
        createdAt: oldEmployer.createdAt,
        updatedAt: oldEmployer.updatedAt
      };
      
      const employerProfile = new EmployerProfile(profileData);
      await employerProfile.save();
      
      // Update auth with profile reference
      auth.profileId = employerProfile._id;
      await auth.save();
      
      console.log(`✅ Migrated employer: ${oldEmployer.companyEmail}`);
    }
    
    console.log('🎉 Employer migration completed successfully!');
  } catch (error) {
    console.error('❌ Error during employer migration:', error);
    throw error;
  }
}

async function runMigration() {
  try {
    console.log('🚀 Starting database migration to separated auth and profile models...');
    console.log('📊 Connecting to MongoDB...');
    
    await mongoose.connect(process.env.MONGODB_URI, {
      serverSelectionTimeoutMS: 10000,
      socketTimeoutMS: 45000,
    });
    
    console.log('✅ Connected to MongoDB');
    
    // Check if migration has already been run
    const existingAuthCount = await Auth.countDocuments();
    if (existingAuthCount > 0) {
      console.log('⚠️  Migration appears to have been run already. Auth collection has records.');
      console.log('   If you want to re-run the migration, please clear the Auth, UserProfile, and EmployerProfile collections first.');
      return;
    }
    
    // Run migrations
    await migrateUsers();
    await migrateEmployers();
    
    console.log('\\n🎉 Migration completed successfully!');
    console.log('\\n📊 Migration Summary:');
    console.log(`   Auth records created: ${await Auth.countDocuments()}`);
    console.log(`   UserProfile records created: ${await UserProfile.countDocuments()}`);
    console.log(`   EmployerProfile records created: ${await EmployerProfile.countDocuments()}`);
    
    console.log('\\n⚠️  IMPORTANT: After verifying the migration:');
    console.log('   1. Update your authentication routes to use the new models');
    console.log('   2. Test the application thoroughly');
    console.log('   3. Consider backing up the old User and Employer collections');
    console.log('   4. Once satisfied, you can drop the old collections');
    
  } catch (error) {
    console.error('❌ Migration failed:', error);
  } finally {
    await mongoose.connection.close();
    console.log('📪 Database connection closed');
  }
}

// Run migration if called directly
if (require.main === module) {
  runMigration();
}

module.exports = { runMigration, migrateUsers, migrateEmployers };
