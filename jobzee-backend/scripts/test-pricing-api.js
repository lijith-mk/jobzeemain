const fetch = require('node-fetch');

const API_BASE = 'http://localhost:5000/api/pricing';

async function testPricingAPI() {
  console.log('🧪 Testing Pricing API...\n');

  try {
    // Test public pricing plans endpoint
    console.log('1. Testing GET /api/pricing/public');
    const publicResponse = await fetch(`${API_BASE}/public`);
    const publicData = await publicResponse.json();
    
    if (publicData.success) {
      console.log(`✅ Found ${publicData.count} pricing plans`);
      publicData.plans.forEach(plan => {
        console.log(`   - ${plan.name}: ${plan.price.displayPrice}/${plan.price.period}`);
      });
    } else {
      console.log('❌ Failed to fetch public pricing plans');
    }

    console.log('\n2. Testing GET /api/pricing/comparison');
    const comparisonResponse = await fetch(`${API_BASE}/comparison`);
    const comparisonData = await comparisonResponse.json();
    
    if (comparisonData.success) {
      console.log(`✅ Found ${comparisonData.comparison.length} plans for comparison`);
    } else {
      console.log('❌ Failed to fetch pricing comparison');
    }

    console.log('\n3. Testing GET /api/pricing/free');
    const freePlanResponse = await fetch(`${API_BASE}/free`);
    const freePlanData = await freePlanResponse.json();
    
    if (freePlanData.success) {
      console.log(`✅ Free plan details: ${freePlanData.plan.name} - ${freePlanData.plan.price.displayPrice}`);
    } else {
      console.log('❌ Failed to fetch free plan details');
    }

    console.log('\n4. Testing GET /api/pricing/free/features');
    const featuresResponse = await fetch(`${API_BASE}/free/features`);
    const featuresData = await featuresResponse.json();
    
    if (featuresData.success) {
      console.log(`✅ Free plan has ${featuresData.features.length} features`);
    } else {
      console.log('❌ Failed to fetch plan features');
    }

    console.log('\n🎉 All API tests completed!');

  } catch (error) {
    console.error('❌ Error testing API:', error.message);
    console.log('\n💡 Make sure the backend server is running on port 5000');
  }
}

testPricingAPI();
