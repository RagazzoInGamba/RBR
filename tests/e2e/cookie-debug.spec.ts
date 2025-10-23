/**
 * Debug Test - Print ALL cookies to understand what's being set
 */

import { test, expect } from '@playwright/test';

test.describe('Cookie Debug', () => {
  test('Print all cookies after login', async ({ page }) => {
    console.log('🧪 DEBUG: Checking all cookies after login');

    // Navigate to login
    await page.goto('http://localhost:3001/login');

    // Fill and submit login form
    await page.fill('input[type="email"]', 'admin@redbullracing.com');
    await page.fill('input[type="password"]', 'Admin123!');
    await page.click('button[type="submit"]');

    // Wait for navigation
    await page.waitForURL('**/*', { timeout: 10000 });
    await page.waitForTimeout(2000);

    // Get ALL cookies
    const allCookies = await page.context().cookies();
    console.log('\n🍪 ALL COOKIES:');
    allCookies.forEach(cookie => {
      console.log(`   Name: ${cookie.name}`);
      console.log(`   Value: ${cookie.value.substring(0, 50)}${cookie.value.length > 50 ? '...' : ''}`);
      console.log(`   Domain: ${cookie.domain}`);
      console.log(`   Path: ${cookie.path}`);
      console.log(`   HttpOnly: ${cookie.httpOnly}`);
      console.log(`   Secure: ${cookie.secure}`);
      console.log(`   SameSite: ${cookie.sameSite}`);
      console.log('   ---');
    });

    console.log(`\n📊 Total cookies: ${allCookies.length}`);

    // Check if any cookie contains 'auth' or 'session'
    const authCookies = allCookies.filter(c =>
      c.name.toLowerCase().includes('auth') ||
      c.name.toLowerCase().includes('session')
    );
    console.log(`🔑 Auth/Session cookies found: ${authCookies.length}`);
    authCookies.forEach(c => console.log(`   - ${c.name}`));

    // Final URL
    const finalURL = page.url();
    console.log(`\n📍 Final URL: ${finalURL}`);

    // Check if we're on the dashboard
    const onDashboard = finalURL.includes('/super-admin');
    console.log(`✅ On Dashboard: ${onDashboard ? 'YES' : 'NO'}`);
  });
});
