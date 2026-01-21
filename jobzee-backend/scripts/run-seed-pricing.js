#!/usr/bin/env node

const { exec } = require('child_process');
const path = require('path');

console.log('🌱 Seeding pricing plans...\n');

// Run the seed script
const seedScript = path.join(__dirname, 'seedPricingPlans.js');
exec(`node "${seedScript}"`, (error, stdout, stderr) => {
  if (error) {
    console.error('❌ Error running seed script:', error);
    return;
  }
  
  if (stderr) {
    console.error('⚠️  Warnings:', stderr);
  }
  
  console.log(stdout);
  console.log('✅ Pricing plans seeded successfully!');
  console.log('\n📋 Available API endpoints:');
  console.log('  GET /api/pricing/public - Get all pricing plans (public)');
  console.log('  GET /api/pricing/comparison - Get pricing comparison data');
  console.log('  GET /api/pricing/:planId - Get specific plan details');
  console.log('  GET /api/pricing/:planId/features - Get plan features');
  console.log('\n🔧 Admin endpoints (require admin auth):');
  console.log('  GET /api/pricing - Get all plans (admin)');
  console.log('  POST /api/pricing - Create new plan');
  console.log('  PUT /api/pricing/:planId - Update plan');
  console.log('  DELETE /api/pricing/:planId - Delete plan');
  console.log('  PATCH /api/pricing/:planId/toggle - Toggle plan availability');
});
