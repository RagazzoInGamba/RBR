/**
 * Red Bull Racing - Complete API Testing Suite
 * Tests all 32+ endpoints with detailed reporting
 */

const https = require('http');

const BASE_URL = 'http://localhost:3001';
const API_URL = `${BASE_URL}/api`;

// Test results tracking
const testResults = [];
let totalTests = 0;
let passedTests = 0;
let failedTests = 0;

// Authentication cookies
let authCookies = {};

// Colors for console
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
};

/**
 * Make HTTP request
 */
function makeRequest(method, path, data = null, cookies = null) {
  return new Promise((resolve, reject) => {
    const url = new URL(API_URL + path);
    const options = {
      method,
      hostname: url.hostname,
      port: url.port,
      path: url.pathname + url.search,
      headers: {
        'Content-Type': 'application/json',
      },
    };

    if (cookies) {
      options.headers['Cookie'] = cookies;
    }

    if (data) {
      const jsonData = JSON.stringify(data);
      options.headers['Content-Length'] = Buffer.byteLength(jsonData);
    }

    const startTime = Date.now();
    const req = https.request(options, (res) => {
      let body = '';
      res.on('data', (chunk) => (body += chunk));
      res.on('end', () => {
        const duration = Date.now() - startTime;
        try {
          const parsedBody = body ? JSON.parse(body) : null;
          resolve({
            statusCode: res.statusCode,
            headers: res.headers,
            body: parsedBody,
            duration,
          });
        } catch (e) {
          resolve({
            statusCode: res.statusCode,
            headers: res.headers,
            body: body,
            duration,
          });
        }
      });
    });

    req.on('error', reject);

    if (data) {
      req.write(JSON.stringify(data));
    }

    req.end();
  });
}

/**
 * Test endpoint
 */
async function testEndpoint(config) {
  const { method, path, description, data, expectedStatus, cookies, category } = config;

  totalTests++;
  const testNum = totalTests;

  console.log(`\n${colors.blue}[TEST ${testNum}]${colors.reset} ${description}`);
  console.log(`  → ${method} ${path}`);

  try {
    const response = await makeRequest(method, path, data, cookies);
    const { statusCode, body, duration } = response;

    const passed = statusCode === expectedStatus;

    if (passed) {
      console.log(
        `  ${colors.green}✓ PASS${colors.reset} - Status: ${statusCode}, Time: ${duration}ms`
      );
      passedTests++;
      testResults.push({
        status: 'PASS',
        category,
        description,
        statusCode,
        duration,
        expected: expectedStatus,
      });
    } else {
      console.log(
        `  ${colors.red}✗ FAIL${colors.reset} - Expected: ${expectedStatus}, Got: ${statusCode}, Time: ${duration}ms`
      );
      if (body && typeof body === 'object') {
        console.log(`  Response:`, JSON.stringify(body).substring(0, 200));
      }
      failedTests++;
      testResults.push({
        status: 'FAIL',
        category,
        description,
        statusCode,
        duration,
        expected: expectedStatus,
        response: body,
      });
    }

    return response;
  } catch (error) {
    console.log(`  ${colors.red}✗ ERROR${colors.reset} - ${error.message}`);
    failedTests++;
    testResults.push({
      status: 'ERROR',
      category,
      description,
      error: error.message,
      expected: expectedStatus,
    });
    return null;
  }
}

/**
 * Login helper
 */
async function login(email, password) {
  console.log(`\n${colors.cyan}🔐 Logging in as ${email}...${colors.reset}`);

  const response = await makeRequest('POST', '/auth/callback/credentials', {
    email,
    password,
    redirect: false,
  });

  if (response && response.headers['set-cookie']) {
    const cookies = response.headers['set-cookie']
      .map((cookie) => cookie.split(';')[0])
      .join('; ');
    console.log(`  ${colors.green}✓ Login successful${colors.reset}`);
    return cookies;
  }

  console.log(`  ${colors.red}✗ Login failed${colors.reset}`);
  return null;
}

/**
 * Main test suite
 */
async function runTests() {
  console.log('='.repeat(60));
  console.log('Red Bull Racing - Complete API Testing Suite');
  console.log('='.repeat(60));
  console.log(`Base URL: ${BASE_URL}`);
  console.log(`Starting tests at: ${new Date().toISOString()}\n`);

  // ================================================
  // 1. HEALTH CHECK
  // ================================================
  console.log(`\n${colors.yellow}=== 1. HEALTH CHECK ===${colors.reset}`);

  await testEndpoint({
    method: 'GET',
    path: '/health',
    description: 'Health check endpoint',
    expectedStatus: 200,
    category: 'Health',
  });

  // ================================================
  // 2. AUTHENTICATION
  // ================================================
  console.log(`\n${colors.yellow}=== 2. AUTHENTICATION ===${colors.reset}`);

  // Login as Super Admin
  authCookies.superAdmin = await login('admin@redbullracing.com', 'Admin123!');
  authCookies.kitchenAdmin = await login('chef@redbullracing.com', 'Chef123!');
  authCookies.customerAdmin = await login('manager@redbullracing.com', 'Manager123!');
  authCookies.endUser = await login('driver@redbullracing.com', 'Driver123!');

  if (!authCookies.superAdmin) {
    console.log(
      `\n${colors.red}❌ CRITICAL: Cannot proceed without authentication${colors.reset}`
    );
    process.exit(1);
  }

  // ================================================
  // 3. ADMIN USER APIs
  // ================================================
  console.log(`\n${colors.yellow}=== 3. ADMIN USER APIs (6 endpoints) ===${colors.reset}`);

  await testEndpoint({
    method: 'GET',
    path: '/admin/users',
    description: 'Get all users (Super Admin)',
    expectedStatus: 200,
    cookies: authCookies.superAdmin,
    category: 'Admin Users',
  });

  const newUserResponse = await testEndpoint({
    method: 'POST',
    path: '/admin/users',
    description: 'Create new user',
    data: {
      email: 'test.engineer@redbullracing.com',
      password: 'TestPass123!',
      firstName: 'Test',
      lastName: 'Engineer',
      role: 'END_USER',
      department: 'Engineering',
      employeeId: 'RBR-TEST-001',
    },
    expectedStatus: 201,
    cookies: authCookies.superAdmin,
    category: 'Admin Users',
  });

  let createdUserId = null;
  if (newUserResponse && newUserResponse.body && newUserResponse.body.id) {
    createdUserId = newUserResponse.body.id;
  }

  await testEndpoint({
    method: 'POST',
    path: '/admin/users',
    description: 'Create user with duplicate email (should fail)',
    data: {
      email: 'test.engineer@redbullracing.com',
      password: 'TestPass123!',
      firstName: 'Duplicate',
      lastName: 'User',
      role: 'END_USER',
    },
    expectedStatus: 400,
    cookies: authCookies.superAdmin,
    category: 'Admin Users',
  });

  await testEndpoint({
    method: 'POST',
    path: '/admin/users',
    description: 'Create user with weak password (should fail)',
    data: {
      email: 'weak@redbullracing.com',
      password: 'weak',
      firstName: 'Weak',
      lastName: 'Password',
      role: 'END_USER',
    },
    expectedStatus: 400,
    cookies: authCookies.superAdmin,
    category: 'Admin Users',
  });

  if (createdUserId) {
    await testEndpoint({
      method: 'GET',
      path: `/admin/users/${createdUserId}`,
      description: 'Get user by ID',
      expectedStatus: 200,
      cookies: authCookies.superAdmin,
      category: 'Admin Users',
    });

    await testEndpoint({
      method: 'PATCH',
      path: `/admin/users/${createdUserId}`,
      description: 'Update user',
      data: {
        firstName: 'Updated',
        lastName: 'Name',
        department: 'Updated Department',
      },
      expectedStatus: 200,
      cookies: authCookies.superAdmin,
      category: 'Admin Users',
    });
  }

  await testEndpoint({
    method: 'GET',
    path: '/admin/users/999999',
    description: 'Get non-existent user (should fail)',
    expectedStatus: 404,
    cookies: authCookies.superAdmin,
    category: 'Admin Users',
  });

  // ================================================
  // 4. KITCHEN RECIPE APIs
  // ================================================
  console.log(`\n${colors.yellow}=== 4. KITCHEN RECIPE APIs (5 endpoints) ===${colors.reset}`);

  await testEndpoint({
    method: 'GET',
    path: '/kitchen/recipes',
    description: 'Get all recipes',
    expectedStatus: 200,
    cookies: authCookies.superAdmin,
    category: 'Kitchen Recipes',
  });

  const newRecipeResponse = await testEndpoint({
    method: 'POST',
    path: '/kitchen/recipes',
    description: 'Create new recipe',
    data: {
      name: 'Test Pasta Carbonara',
      description: 'Classic Italian pasta dish',
      category: 'FIRST_COURSE',
      mealType: 'LUNCH',
      ingredients: [
        { name: 'Spaghetti', quantity: 200, unit: 'g' },
        { name: 'Guanciale', quantity: 100, unit: 'g' },
        { name: 'Eggs', quantity: 2, unit: 'pcs' },
        { name: 'Pecorino Romano', quantity: 50, unit: 'g' },
      ],
      allergens: ['EGGS', 'GLUTEN', 'DAIRY'],
      preparationTime: 20,
      basePrice: 12.5,
      isAvailable: true,
    },
    expectedStatus: 201,
    cookies: authCookies.kitchenAdmin,
    category: 'Kitchen Recipes',
  });

  let createdRecipeId = null;
  if (newRecipeResponse && newRecipeResponse.body && newRecipeResponse.body.id) {
    createdRecipeId = newRecipeResponse.body.id;
  }

  if (createdRecipeId) {
    await testEndpoint({
      method: 'GET',
      path: `/kitchen/recipes/${createdRecipeId}`,
      description: 'Get recipe by ID',
      expectedStatus: 200,
      cookies: authCookies.kitchenAdmin,
      category: 'Kitchen Recipes',
    });

    await testEndpoint({
      method: 'PATCH',
      path: `/kitchen/recipes/${createdRecipeId}`,
      description: 'Update recipe',
      data: {
        name: 'Updated Pasta Carbonara',
        basePrice: 13.5,
      },
      expectedStatus: 200,
      cookies: authCookies.kitchenAdmin,
      category: 'Kitchen Recipes',
    });
  }

  await testEndpoint({
    method: 'DELETE',
    path: '/kitchen/recipes/999999',
    description: 'Delete non-existent recipe (should fail)',
    expectedStatus: 404,
    cookies: authCookies.kitchenAdmin,
    category: 'Kitchen Recipes',
  });

  // ================================================
  // 5. KITCHEN MENU APIs
  // ================================================
  console.log(`\n${colors.yellow}=== 5. KITCHEN MENU APIs (5 endpoints) ===${colors.reset}`);

  await testEndpoint({
    method: 'GET',
    path: '/kitchen/menus',
    description: 'Get all menus',
    expectedStatus: 200,
    cookies: authCookies.kitchenAdmin,
    category: 'Kitchen Menus',
  });

  const newMenuResponse = await testEndpoint({
    method: 'POST',
    path: '/kitchen/menus',
    description: 'Create new menu',
    data: {
      name: 'Test Daily Menu',
      description: 'Test menu for automated testing',
      mealType: 'LUNCH',
      date: '2025-10-30',
      recipes: [1, 2, 3],
      isActive: true,
    },
    expectedStatus: 201,
    cookies: authCookies.kitchenAdmin,
    category: 'Kitchen Menus',
  });

  let createdMenuId = null;
  if (newMenuResponse && newMenuResponse.body && newMenuResponse.body.id) {
    createdMenuId = newMenuResponse.body.id;
  }

  if (createdMenuId) {
    await testEndpoint({
      method: 'GET',
      path: `/kitchen/menus/${createdMenuId}`,
      description: 'Get menu by ID',
      expectedStatus: 200,
      cookies: authCookies.kitchenAdmin,
      category: 'Kitchen Menus',
    });

    await testEndpoint({
      method: 'PATCH',
      path: `/kitchen/menus/${createdMenuId}`,
      description: 'Update menu',
      data: {
        name: 'Updated Test Menu',
        description: 'Updated description',
      },
      expectedStatus: 200,
      cookies: authCookies.kitchenAdmin,
      category: 'Kitchen Menus',
    });
  }

  await testEndpoint({
    method: 'DELETE',
    path: '/kitchen/menus/999999',
    description: 'Delete non-existent menu (should fail)',
    expectedStatus: 404,
    cookies: authCookies.kitchenAdmin,
    category: 'Kitchen Menus',
  });

  // ================================================
  // 6. KITCHEN ORDERS APIs
  // ================================================
  console.log(`\n${colors.yellow}=== 6. KITCHEN ORDERS APIs (2 endpoints) ===${colors.reset}`);

  await testEndpoint({
    method: 'GET',
    path: '/kitchen/orders',
    description: 'Get all kitchen orders',
    expectedStatus: 200,
    cookies: authCookies.kitchenAdmin,
    category: 'Kitchen Orders',
  });

  // ================================================
  // 7. BOOKING APIs - CRITICAL VALIDATION
  // ================================================
  console.log(
    `\n${colors.yellow}=== 7. BOOKING APIs - CRITICAL VALIDATION (5+ endpoints) ===${colors.reset}`
  );

  await testEndpoint({
    method: 'GET',
    path: '/booking',
    description: 'Get user bookings',
    expectedStatus: 200,
    cookies: authCookies.endUser,
    category: 'Booking',
  });

  await testEndpoint({
    method: 'GET',
    path: '/booking/rules?mealType=LUNCH',
    description: 'Get LUNCH booking rules',
    expectedStatus: 200,
    cookies: authCookies.endUser,
    category: 'Booking',
  });

  await testEndpoint({
    method: 'GET',
    path: '/booking/rules?mealType=DINNER',
    description: 'Get DINNER booking rules',
    expectedStatus: 200,
    cookies: authCookies.endUser,
    category: 'Booking',
  });

  // Valid LUNCH booking
  const validLunchBooking = await testEndpoint({
    method: 'POST',
    path: '/booking',
    description: 'Create valid LUNCH booking (FIRST_COURSE + BEVERAGE)',
    data: {
      menuId: 1,
      mealType: 'LUNCH',
      scheduledFor: '2025-10-25T12:00:00Z',
      items: [
        { recipeId: 1, quantity: 1, category: 'FIRST_COURSE' },
        { recipeId: 5, quantity: 1, category: 'BEVERAGE' },
      ],
      specialRequests: 'No salt please',
    },
    expectedStatus: 201,
    cookies: authCookies.endUser,
    category: 'Booking',
  });

  let createdBookingId = null;
  if (validLunchBooking && validLunchBooking.body && validLunchBooking.body.id) {
    createdBookingId = validLunchBooking.body.id;
  }

  // Invalid LUNCH - missing FIRST_COURSE
  await testEndpoint({
    method: 'POST',
    path: '/booking',
    description: 'LUNCH booking without FIRST_COURSE (should fail)',
    data: {
      menuId: 1,
      mealType: 'LUNCH',
      scheduledFor: '2025-10-25T12:00:00Z',
      items: [{ recipeId: 5, quantity: 1, category: 'BEVERAGE' }],
    },
    expectedStatus: 400,
    cookies: authCookies.endUser,
    category: 'Booking',
  });

  // Invalid LUNCH - missing BEVERAGE
  await testEndpoint({
    method: 'POST',
    path: '/booking',
    description: 'LUNCH booking without BEVERAGE (should fail)',
    data: {
      menuId: 1,
      mealType: 'LUNCH',
      scheduledFor: '2025-10-25T12:00:00Z',
      items: [{ recipeId: 1, quantity: 1, category: 'FIRST_COURSE' }],
    },
    expectedStatus: 400,
    cookies: authCookies.endUser,
    category: 'Booking',
  });

  // Invalid LUNCH - too many APPETIZERS (max 1)
  await testEndpoint({
    method: 'POST',
    path: '/booking',
    description: 'LUNCH booking with 2 APPETIZERS (should fail, max 1)',
    data: {
      menuId: 1,
      mealType: 'LUNCH',
      scheduledFor: '2025-10-25T12:00:00Z',
      items: [
        { recipeId: 1, quantity: 1, category: 'FIRST_COURSE' },
        { recipeId: 2, quantity: 2, category: 'APPETIZER' },
        { recipeId: 5, quantity: 1, category: 'BEVERAGE' },
      ],
    },
    expectedStatus: 400,
    cookies: authCookies.endUser,
    category: 'Booking',
  });

  // Valid DINNER booking
  await testEndpoint({
    method: 'POST',
    path: '/booking',
    description: 'Create valid DINNER booking (SECOND_COURSE + SIDE_DISH + BEVERAGE)',
    data: {
      menuId: 1,
      mealType: 'DINNER',
      scheduledFor: '2025-10-25T19:00:00Z',
      items: [
        { recipeId: 3, quantity: 1, category: 'SECOND_COURSE' },
        { recipeId: 4, quantity: 1, category: 'SIDE_DISH' },
        { recipeId: 5, quantity: 1, category: 'BEVERAGE' },
      ],
    },
    expectedStatus: 201,
    cookies: authCookies.endUser,
    category: 'Booking',
  });

  if (createdBookingId) {
    await testEndpoint({
      method: 'GET',
      path: `/booking/${createdBookingId}`,
      description: 'Get booking by ID',
      expectedStatus: 200,
      cookies: authCookies.endUser,
      category: 'Booking',
    });

    await testEndpoint({
      method: 'PATCH',
      path: `/booking/${createdBookingId}`,
      description: 'Update booking',
      data: {
        specialRequests: 'Updated: Extra napkins please',
      },
      expectedStatus: 200,
      cookies: authCookies.endUser,
      category: 'Booking',
    });
  }

  // ================================================
  // 8. CUSTOMER ADMIN APIs
  // ================================================
  console.log(
    `\n${colors.yellow}=== 8. CUSTOMER ADMIN APIs (5 endpoints) ===${colors.reset}`
  );

  await testEndpoint({
    method: 'GET',
    path: '/customer/employees',
    description: 'Get all employees',
    expectedStatus: 200,
    cookies: authCookies.customerAdmin,
    category: 'Customer Admin',
  });

  const newEmployeeResponse = await testEndpoint({
    method: 'POST',
    path: '/customer/employees',
    description: 'Create new employee',
    data: {
      email: 'mechanic@redbullracing.com',
      password: 'Mechanic123!',
      firstName: 'Pit',
      lastName: 'Crew',
      role: 'END_USER',
      department: 'Garage',
      employeeId: 'RBR-MECH-001',
    },
    expectedStatus: 201,
    cookies: authCookies.customerAdmin,
    category: 'Customer Admin',
  });

  let createdEmployeeId = null;
  if (newEmployeeResponse && newEmployeeResponse.body && newEmployeeResponse.body.id) {
    createdEmployeeId = newEmployeeResponse.body.id;
  }

  if (createdEmployeeId) {
    await testEndpoint({
      method: 'GET',
      path: `/customer/employees/${createdEmployeeId}`,
      description: 'Get employee by ID',
      expectedStatus: 200,
      cookies: authCookies.customerAdmin,
      category: 'Customer Admin',
    });

    await testEndpoint({
      method: 'PATCH',
      path: `/customer/employees/${createdEmployeeId}`,
      description: 'Update employee',
      data: {
        firstName: 'Updated',
        department: 'Updated Garage',
      },
      expectedStatus: 200,
      cookies: authCookies.customerAdmin,
      category: 'Customer Admin',
    });
  }

  await testEndpoint({
    method: 'DELETE',
    path: '/customer/employees/999999',
    description: 'Delete non-existent employee (should fail)',
    expectedStatus: 404,
    cookies: authCookies.customerAdmin,
    category: 'Customer Admin',
  });

  // ================================================
  // 9. STATS APIs
  // ================================================
  console.log(`\n${colors.yellow}=== 9. STATS APIs (5 endpoints) ===${colors.reset}`);

  await testEndpoint({
    method: 'GET',
    path: '/stats/super-admin',
    description: 'Get super admin stats',
    expectedStatus: 200,
    cookies: authCookies.superAdmin,
    category: 'Stats',
  });

  await testEndpoint({
    method: 'GET',
    path: '/stats/kitchen',
    description: 'Get kitchen stats',
    expectedStatus: 200,
    cookies: authCookies.kitchenAdmin,
    category: 'Stats',
  });

  await testEndpoint({
    method: 'GET',
    path: '/stats/customer-admin',
    description: 'Get customer admin stats',
    expectedStatus: 200,
    cookies: authCookies.customerAdmin,
    category: 'Stats',
  });

  await testEndpoint({
    method: 'GET',
    path: '/stats/user',
    description: 'Get user stats',
    expectedStatus: 200,
    cookies: authCookies.endUser,
    category: 'Stats',
  });

  await testEndpoint({
    method: 'GET',
    path: '/stats/dashboard',
    description: 'Get dashboard stats',
    expectedStatus: 200,
    cookies: authCookies.superAdmin,
    category: 'Stats',
  });

  // ================================================
  // 10. MENU APIs
  // ================================================
  console.log(`\n${colors.yellow}=== 10. MENU APIs (1 endpoint) ===${colors.reset}`);

  await testEndpoint({
    method: 'GET',
    path: '/menu/available',
    description: 'Get available menus',
    expectedStatus: 200,
    cookies: authCookies.endUser,
    category: 'Menu',
  });

  // ================================================
  // FINAL REPORT
  // ================================================
  printFinalReport();
}

/**
 * Print final report
 */
function printFinalReport() {
  console.log('\n' + '='.repeat(60));
  console.log(`${colors.yellow}FINAL TEST REPORT${colors.reset}`);
  console.log('='.repeat(60));
  console.log(`Total Tests: ${totalTests}`);
  console.log(`${colors.green}Passed: ${passedTests}${colors.reset}`);
  console.log(`${colors.red}Failed: ${failedTests}${colors.reset}`);
  const successRate = Math.round((passedTests / totalTests) * 100);
  console.log(`Success Rate: ${successRate}%`);
  console.log('='.repeat(60));

  // Group results by category
  const categories = {};
  testResults.forEach((result) => {
    if (!categories[result.category]) {
      categories[result.category] = { passed: 0, failed: 0 };
    }
    if (result.status === 'PASS') {
      categories[result.category].passed++;
    } else {
      categories[result.category].failed++;
    }
  });

  console.log(`\n${colors.cyan}Results by Category:${colors.reset}`);
  Object.entries(categories).forEach(([category, stats]) => {
    const total = stats.passed + stats.failed;
    const rate = Math.round((stats.passed / total) * 100);
    console.log(
      `  ${category}: ${colors.green}${stats.passed}${colors.reset}/${total} (${rate}%)`
    );
  });

  // List failed tests
  const failedResults = testResults.filter((r) => r.status !== 'PASS');
  if (failedResults.length > 0) {
    console.log(`\n${colors.red}Failed Tests:${colors.reset}`);
    failedResults.forEach((result, index) => {
      console.log(
        `  ${index + 1}. ${result.description} - Expected ${result.expected}, Got ${result.statusCode || 'ERROR'}`
      );
      if (result.response && result.response.error) {
        console.log(`     Error: ${result.response.error}`);
      }
    });
  }

  // Calculate average response time for passed tests
  const passedWithTime = testResults.filter((r) => r.status === 'PASS' && r.duration);
  if (passedWithTime.length > 0) {
    const avgTime =
      passedWithTime.reduce((sum, r) => sum + r.duration, 0) / passedWithTime.length;
    console.log(`\n${colors.cyan}Performance:${colors.reset}`);
    console.log(`  Average Response Time: ${avgTime.toFixed(2)}ms`);
  }

  console.log('\n' + '='.repeat(60));

  if (failedTests === 0) {
    console.log(`${colors.green}🎉 ALL TESTS PASSED!${colors.reset}\n`);
    process.exit(0);
  } else {
    console.log(`${colors.red}⚠️  SOME TESTS FAILED${colors.reset}\n`);
    process.exit(1);
  }
}

// Run the tests
runTests().catch((error) => {
  console.error(`${colors.red}Fatal error:${colors.reset}`, error);
  process.exit(1);
});
