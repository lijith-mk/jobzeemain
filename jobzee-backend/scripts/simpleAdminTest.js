const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config();

// Define admin schema directly here to avoid any issues
const adminSchema = new mongoose.Schema({
  userId: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  name: { type: String, default: 'System Administrator' },
  email: { type: String, default: 'admin@jobzee.com' },
  role: { type: String, default: 'super_admin' },
  permissions: {
    userManagement: { type: Boolean, default: true },
    employerManagement: { type: Boolean, default: true },
    jobManagement: { type: Boolean, default: true },
    analytics: { type: Boolean, default: true },
    systemSettings: { type: Boolean, default: true }
  },
  lastLogin: { type: Date },
  isActive: { type: Boolean, default: true },
  createdAt: { type: Date, default: Date.now }
});

// Simple password comparison method
adminSchema.methods.comparePassword = async function(candidatePassword) {
  console.log(`Comparing: "${candidatePassword}" with hash: "${this.password}"`);
  const result = await bcrypt.compare(candidatePassword, this.password);
  console.log(`Comparison result: ${result}`);
  return result;
};

async function simpleAdminTest() {
  try {
    // Connect to MongoDB
    const mongoUri = process.env.MONGODB_URI?.includes('mongodb+srv') 
      ? process.env.MONGODB_URI 
      : process.env.MONGO_URI;

    await mongoose.connect(mongoUri);
    console.log('✅ Connected to MongoDB');

    // Create model
    const TestAdmin = mongoose.model('TestAdmin', adminSchema);
    
    // Clear test collection
    await TestAdmin.deleteMany({});
    
    console.log('🧪 Testing with simple password: "admin123"');
    
    // Hash password manually and create admin
    const hashedPassword = await bcrypt.hash('admin123', 10);
    console.log('Hashed password:', hashedPassword);
    
    const testAdmin = await TestAdmin.create({
      userId: 'admin123',
      password: hashedPassword,
      name: 'Test Administrator',
      email: 'admin@test.com'
    });
    
    console.log('✅ Test admin created');
    
    // Test password comparison
    const testPassword = 'admin123';
    const isMatch = await testAdmin.comparePassword(testPassword);
    
    if (isMatch) {
      console.log('🎉 SUCCESS! Password comparison working!');
      
      // Now test the original password
      console.log('\n🔄 Now testing with admin@123 password...');
      
      // Delete and recreate with original password  
      await TestAdmin.deleteMany({});
      const originalHashedPassword = await bcrypt.hash('admin@123', 10);
      
      const originalAdmin = await TestAdmin.create({
        userId: 'admin123',
        password: originalHashedPassword,
        name: 'System Administrator',
        email: 'admin@jobzee.com'
      });
      
      const originalMatch = await originalAdmin.comparePassword('admin@123');
      console.log(`Original password match: ${originalMatch}`);
      
      if (originalMatch) {
        console.log('🎉 Original password working too! Let\'s update the real admin collection...');
        
        // Update the real Admin collection
        const Admin = mongoose.model('Admin');
        await Admin.deleteMany({});
        
        await Admin.create({
          userId: 'admin123',
          password: originalHashedPassword,
          name: 'System Administrator',
          email: 'admin@jobzee.com',
          role: 'super_admin',
          permissions: {
            userManagement: true,
            employerManagement: true,
            jobManagement: true,
            analytics: true,
            systemSettings: true
          },
          isActive: true
        });
        
        console.log('✅ Real admin updated successfully!');
      }
      
    } else {
      console.log('❌ Simple password test failed');
    }
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    mongoose.connection.close();
  }
}

simpleAdminTest();
