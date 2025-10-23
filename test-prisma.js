const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient({ 
  log: ['query', 'error', 'warn'] 
});

async function test() {
  try {
    console.log('=== TESTING PRISMA CONNECTION ===');
    
    const count = await prisma.user.count();
    console.log('✅ Users count:', count);
    
    const user = await prisma.user.findUnique({
      where: { email: 'admin@redbullracing.com' }
    });
    
    if (!user) {
      console.log('❌ User NOT FOUND');
      return;
    }
    
    console.log('✅ Found user:', user.email);
    console.log('✅ Role:', user.role);
    console.log('✅ Has password:', user.password ? 'YES' : 'NO');
    
    // Test password verification
    const testPassword = 'Admin123!';
    const isValid = await bcrypt.compare(testPassword, user.password);
    console.log('✅ Password test (Admin123!):', isValid ? 'VALID' : 'INVALID');
    
  } catch (error) {
    console.error('❌ ERROR:', error.message);
    console.error(error.stack);
  } finally {
    await prisma.disconnect();
  }
}

test();
