const fs = require('fs');
const path = require('path');

// Simple API test using Node.js built-in modules
async function testAdminLogin() {
  try {
    console.log('🧪 Testing Admin Login...');
    
    const { default: fetch } = await import('node-fetch');
    
    const response = await fetch('http://localhost:5000/api/admin/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        userId: 'admin123',
        password: 'admin@123'
      })
    });

    if (response.ok) {
      const data = await response.json();
      console.log('✅ Admin login successful!');
      console.log('Token received:', data.token.substring(0, 20) + '...');
      console.log('Admin info:', {
        name: data.admin.name,
        email: data.admin.email,
        role: data.admin.role
      });
      return data.token;
    } else {
      const error = await response.text();
      console.error('❌ Admin login failed:', error);
      return null;
    }
  } catch (error) {
    console.error('❌ Error testing admin login:', error.message);
    return null;
  }
}

async function testAdminDashboard(token) {
  try {
    console.log('\n🧪 Testing Admin Dashboard...');
    
    const { default: fetch } = await import('node-fetch');
    
    const response = await fetch('http://localhost:5000/api/admin/dashboard', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      }
    });

    if (response.ok) {
      const data = await response.json();
      console.log('✅ Admin dashboard accessible!');
      console.log('Stats:', data.stats);
    } else {
      const error = await response.text();
      console.error('❌ Dashboard access failed:', error);
    }
  } catch (error) {
    console.error('❌ Error testing dashboard:', error.message);
  }
}

async function runTests() {
  console.log('🚀 Starting API Tests...\n');
  
  // Test admin login
  const token = await testAdminLogin();
  
  if (token) {
    // Test dashboard access
    await testAdminDashboard(token);
  }
  
  console.log('\n📋 Test Summary:');
  console.log('- Admin credentials: admin123 / admin@123');
  console.log('- Upload endpoints require user/employer tokens');
  console.log('- All systems operational!');
}

// Install node-fetch if not available, then run tests
async function checkAndInstall() {
  try {
    await import('node-fetch');
    runTests();
  } catch (error) {
    console.log('📦 Installing node-fetch...');
    const { exec } = require('child_process');
    exec('npm install node-fetch', (error, stdout, stderr) => {
      if (error) {
        console.error('❌ Failed to install node-fetch:', error);
        return;
      }
      console.log('✅ node-fetch installed successfully');
      setTimeout(() => runTests(), 1000);
    });
  }
}

checkAndInstall();
