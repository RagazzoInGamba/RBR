/**
 * Red Bull Racing - Groups API Test Suite
 * Automated testing for all Groups Management endpoints
 */

const BASE_URL = 'http://localhost:3001';

// ANSI color codes for terminal output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[36m',
  gray: '\x1b[90m',
};

function log(emoji, message, color = colors.reset) {
  console.log(`${color}${emoji} ${message}${colors.reset}`);
}

function logError(message, details = '') {
  console.error(`${colors.red}❌ ${message}${colors.reset}`);
  if (details) console.error(`${colors.gray}   ${details}${colors.reset}`);
}

function logSuccess(message, details = '') {
  console.log(`${colors.green}✅ ${message}${colors.reset}`);
  if (details) console.log(`${colors.gray}   ${details}${colors.reset}`);
}

function logInfo(message) {
  console.log(`${colors.blue}ℹ️  ${message}${colors.reset}`);
}

async function testGroupsAPI() {
  log('🧪', 'Red Bull Racing - Groups API Test Suite', colors.bright);
  console.log('');

  const results = {
    passed: 0,
    failed: 0,
    total: 0,
  };

  let createdGroupId = null;

  try {
    // ============================================
    // TEST 1: CREATE GROUP (POST)
    // ============================================
    results.total++;
    log('1️⃣', 'Testing POST /api/customer/groups (Create)', colors.yellow);

    try {
      const createPayload = {
        name: 'Test Automated Group',
        description: 'Gruppo creato da test automatico per verificare funzionalità CRUD',
        isActive: true,
      };

      logInfo(`Payload: ${JSON.stringify(createPayload, null, 2)}`);

      const createRes = await fetch(`${BASE_URL}/api/customer/groups`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(createPayload),
      });

      const createData = await createRes.json();

      if (!createRes.ok) {
        throw new Error(`HTTP ${createRes.status}: ${createData.error || 'Unknown error'}`);
      }

      createdGroupId = createData.group?.id || createData.id;

      if (!createdGroupId) {
        throw new Error('No group ID returned in response');
      }

      logSuccess(`Group created successfully`, `ID: ${createdGroupId}`);
      results.passed++;
    } catch (error) {
      logError('Create group failed', error.message);
      results.failed++;
    }

    console.log('');

    // ============================================
    // TEST 2: LIST ALL GROUPS (GET)
    // ============================================
    results.total++;
    log('2️⃣', 'Testing GET /api/customer/groups (List All)', colors.yellow);

    try {
      const listRes = await fetch(`${BASE_URL}/api/customer/groups`);
      const listData = await listRes.json();

      if (!listRes.ok) {
        throw new Error(`HTTP ${listRes.status}: ${listData.error || 'Unknown error'}`);
      }

      const groups = listData.groups || [];

      if (!Array.isArray(groups)) {
        throw new Error('Response groups is not an array');
      }

      logSuccess(`Listed ${groups.length} groups`);

      if (createdGroupId) {
        const found = groups.find(g => g.id === createdGroupId);
        if (found) {
          logInfo(`Created group found in list: "${found.name}"`);
        } else {
          throw new Error('Created group not found in list');
        }
      }

      results.passed++;
    } catch (error) {
      logError('List groups failed', error.message);
      results.failed++;
    }

    console.log('');

    // ============================================
    // TEST 3: GET SINGLE GROUP (GET by ID)
    // ============================================
    if (createdGroupId) {
      results.total++;
      log('3️⃣', `Testing GET /api/customer/groups/${createdGroupId} (Get Single)`, colors.yellow);

      try {
        const getRes = await fetch(`${BASE_URL}/api/customer/groups/${createdGroupId}`);
        const getData = await getRes.json();

        if (!getRes.ok) {
          throw new Error(`HTTP ${getRes.status}: ${getData.error || 'Unknown error'}`);
        }

        const group = getData.group || getData;

        if (group.id !== createdGroupId) {
          throw new Error(`ID mismatch: expected ${createdGroupId}, got ${group.id}`);
        }

        logSuccess(`Retrieved group successfully`, `Name: "${group.name}"`);
        logInfo(`Description: ${group.description || 'N/A'}`);
        logInfo(`Active: ${group.isActive}`);
        logInfo(`Members: ${group._count?.members || 0}`);

        results.passed++;
      } catch (error) {
        logError('Get single group failed', error.message);
        results.failed++;
      }

      console.log('');
    }

    // ============================================
    // TEST 4: UPDATE GROUP (PATCH)
    // ============================================
    if (createdGroupId) {
      results.total++;
      log('4️⃣', `Testing PATCH /api/customer/groups/${createdGroupId} (Update)`, colors.yellow);

      try {
        const updatePayload = {
          name: 'Updated Test Group',
          description: 'Descrizione aggiornata dal test automatico',
          isActive: false,
        };

        logInfo(`Payload: ${JSON.stringify(updatePayload, null, 2)}`);

        const updateRes = await fetch(`${BASE_URL}/api/customer/groups/${createdGroupId}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(updatePayload),
        });

        const updateData = await updateRes.json();

        if (!updateRes.ok) {
          throw new Error(`HTTP ${updateRes.status}: ${updateData.error || 'Unknown error'}`);
        }

        const updated = updateData.group || updateData;

        if (updated.name !== updatePayload.name) {
          throw new Error(`Name not updated: expected "${updatePayload.name}", got "${updated.name}"`);
        }

        if (updated.isActive !== updatePayload.isActive) {
          throw new Error(`isActive not updated: expected ${updatePayload.isActive}, got ${updated.isActive}`);
        }

        logSuccess('Group updated successfully');
        logInfo(`New name: "${updated.name}"`);
        logInfo(`New status: ${updated.isActive ? 'Active' : 'Inactive'}`);

        results.passed++;
      } catch (error) {
        logError('Update group failed', error.message);
        results.failed++;
      }

      console.log('');
    }

    // ============================================
    // TEST 5: DELETE GROUP (DELETE)
    // ============================================
    if (createdGroupId) {
      results.total++;
      log('5️⃣', `Testing DELETE /api/customer/groups/${createdGroupId} (Delete)`, colors.yellow);

      try {
        const deleteRes = await fetch(`${BASE_URL}/api/customer/groups/${createdGroupId}`, {
          method: 'DELETE',
        });

        const deleteData = await deleteRes.json();

        if (!deleteRes.ok) {
          throw new Error(`HTTP ${deleteRes.status}: ${deleteData.error || 'Unknown error'}`);
        }

        logSuccess('Group deleted successfully');

        // Verify deletion
        logInfo('Verifying deletion...');
        const verifyRes = await fetch(`${BASE_URL}/api/customer/groups/${createdGroupId}`);

        if (verifyRes.status === 404) {
          logSuccess('Deletion verified - group not found (404)');
        } else if (verifyRes.status === 200) {
          throw new Error('Group still exists after deletion');
        }

        results.passed++;
      } catch (error) {
        logError('Delete group failed', error.message);
        results.failed++;
      }

      console.log('');
    }

    // ============================================
    // SUMMARY
    // ============================================
    console.log('');
    log('📊', 'Test Summary', colors.bright);
    console.log('━'.repeat(50));
    console.log(`Total Tests:  ${results.total}`);
    console.log(`${colors.green}Passed:       ${results.passed}${colors.reset}`);
    console.log(`${colors.red}Failed:       ${results.failed}${colors.reset}`);
    console.log(`Success Rate: ${((results.passed / results.total) * 100).toFixed(1)}%`);
    console.log('━'.repeat(50));

    if (results.failed === 0) {
      log('✅', 'All tests passed! Groups API is fully functional.', colors.green);
      process.exit(0);
    } else {
      log('❌', `${results.failed} test(s) failed. Please review errors above.`, colors.red);
      process.exit(1);
    }

  } catch (error) {
    console.log('');
    logError('Test suite encountered a fatal error', error.message);
    console.error(error);
    process.exit(1);
  }
}

// Run tests
testGroupsAPI();
