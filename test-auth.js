/**
 * Authentication Test Script
 * Tests login for all user roles
 */

const testUsers = [
  { email: 'admin@redbullracing.com', password: 'Admin123!', role: 'SUPER_ADMIN' },
  { email: 'chef@redbullracing.com', password: 'Chef123!', role: 'KITCHEN_ADMIN' },
  { email: 'manager@redbullracing.com', password: 'Manager123!', role: 'CUSTOMER_ADMIN' },
  { email: 'driver@redbullracing.com', password: 'Driver123!', role: 'END_USER' },
];

async function testLogin(user) {
  try {
    console.log(`\n🔐 Testing login for ${user.email} (${user.role})...`);

    // Test using NextAuth signIn endpoint
    const response = await fetch('http://localhost:3001/api/auth/callback/credentials', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: user.email,
        password: user.password,
        redirect: false,
      }),
    });

    const data = await response.text();
    console.log(`   Status: ${response.status}`);
    console.log(`   Response: ${data.substring(0, 100)}...`);

    if (response.status === 200 || response.status === 302) {
      console.log(`   ✅ Login successful for ${user.role}`);
      return true;
    } else {
      console.log(`   ❌ Login failed for ${user.role}`);
      return false;
    }
  } catch (error) {
    console.log(`   ❌ Error: ${error.message}`);
    return false;
  }
}

async function main() {
  console.log('🚀 Red Bull Racing - Authentication Test Suite\n');
  console.log('='.repeat(60));

  let passed = 0;
  let failed = 0;

  for (const user of testUsers) {
    const result = await testLogin(user);
    if (result) {
      passed++;
    } else {
      failed++;
    }
  }

  console.log('\n' + '='.repeat(60));
  console.log(`\n📊 Test Results:`);
  console.log(`   ✅ Passed: ${passed}/${testUsers.length}`);
  console.log(`   ❌ Failed: ${failed}/${testUsers.length}`);
  console.log(`\n${passed === testUsers.length ? '🎉 ALL TESTS PASSED!' : '⚠️  SOME TESTS FAILED'}\n`);
}

main();
