/**
 * Playwright E2E Test - Login Flow
 * Test completo del flusso di autenticazione NextAuth v5
 */

import { test, expect } from '@playwright/test';

test.describe('Login Flow - NextAuth v5', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to login page
    await page.goto('http://localhost:3001/login');
  });

  test('Login con SUPER_ADMIN - dovrebbe redirectare a /super-admin', async ({ page }) => {
    console.log('🧪 TEST: Login SUPER_ADMIN');

    // Fill login form
    await page.fill('input[type="email"]', 'admin@redbullracing.com');
    await page.fill('input[type="password"]', 'Admin123!');

    // Screenshot pre-login
    await page.screenshot({ path: 'test-results/01-login-form-filled.png' });

    // Submit form
    await page.click('button[type="submit"]');

    // Wait for navigation (max 10 seconds)
    console.log('⏳ Waiting for navigation...');
    await page.waitForURL('**/*', { timeout: 10000 });

    // Get current URL
    const currentURL = page.url();
    console.log(`📍 Current URL: ${currentURL}`);

    // Screenshot post-login
    await page.screenshot({ path: 'test-results/02-after-login-click.png' });

    // Wait for redirect to complete and cookies to be set
    await page.waitForTimeout(2000);

    const finalURL = page.url();
    console.log(`📍 Final URL after wait: ${finalURL}`);

    // Check cookies AFTER redirect (NextAuth v5 uses 'authjs.session-token')
    const cookies = await page.context().cookies();
    const sessionCookie = cookies.find(c => c.name === 'authjs.session-token');
    console.log(`🍪 Session Cookie: ${sessionCookie ? 'FOUND ✅' : 'MISSING ❌'}`);
    if (sessionCookie) {
      console.log(`   Value length: ${sessionCookie.value.length} chars`);
    }

    // Screenshot final state
    await page.screenshot({ path: 'test-results/03-final-state.png' });

    // Get page title
    const title = await page.title();
    console.log(`📄 Page Title: ${title}`);

    // Get page text to see what's visible
    const bodyText = await page.locator('body').textContent();
    console.log(`📝 Page contains "Reindirizzamento"?: ${bodyText?.includes('Reindirizzamento') ? 'YES' : 'NO'}`);
    console.log(`📝 Page contains "Dashboard"?: ${bodyText?.includes('Dashboard') ? 'YES' : 'NO'}`);

    // Expectations
    expect(sessionCookie, 'Session cookie should be set').toBeDefined();
    expect(finalURL, 'Should redirect away from /login').not.toContain('/login');
    expect(finalURL, 'Should redirect to /super-admin OR /auth/success').toMatch(/\/(super-admin|auth\/success)/);
  });

  test('Login con CUSTOMER_ADMIN - dovrebbe redirectare a /customer-admin', async ({ page }) => {
    console.log('🧪 TEST: Login CUSTOMER_ADMIN');

    await page.fill('input[type="email"]', 'manager@redbullracing.com');
    await page.fill('input[type="password"]', 'Manager123!');

    await page.screenshot({ path: 'test-results/04-manager-form-filled.png' });

    await page.click('button[type="submit"]');
    await page.waitForURL('**/*', { timeout: 10000 });

    const currentURL = page.url();
    console.log(`📍 Manager URL: ${currentURL}`);

    await page.screenshot({ path: 'test-results/05-manager-final.png' });

    // Wait for redirect to complete
    await page.waitForTimeout(2000);
    const finalURL = page.url();
    console.log(`📍 Manager Final URL: ${finalURL}`);

    // Check cookies AFTER redirect
    const cookies = await page.context().cookies();
    const sessionCookie = cookies.find(c => c.name === 'authjs.session-token');
    console.log(`🍪 Manager Cookie: ${sessionCookie ? 'FOUND ✅' : 'MISSING ❌'}`);

    expect(sessionCookie).toBeDefined();
    expect(finalURL).not.toContain('/login');
    expect(finalURL).toMatch(/\/(customer-admin|auth\/success)/);
  });

  test('Login fallito - credenziali sbagliate', async ({ page }) => {
    console.log('🧪 TEST: Login fallito');

    await page.fill('input[type="email"]', 'wrong@email.com');
    await page.fill('input[type="password"]', 'wrongpassword');
    await page.click('button[type="submit"]');

    // Should stay on login page
    await page.waitForTimeout(2000);
    const currentURL = page.url();
    console.log(`📍 After failed login: ${currentURL}`);

    await page.screenshot({ path: 'test-results/06-failed-login.png' });

    expect(currentURL).toContain('/login');
  });

  test('Network inspection - trace tutte le richieste', async ({ page }) => {
    console.log('🧪 TEST: Network Trace');

    // Listen to all network requests
    const requests: any[] = [];
    page.on('request', request => {
      requests.push({
        url: request.url(),
        method: request.method(),
        headers: request.headers()
      });
    });

    const responses: any[] = [];
    page.on('response', response => {
      responses.push({
        url: response.url(),
        status: response.status(),
        headers: response.headers()
      });
    });

    // Login
    await page.fill('input[type="email"]', 'admin@redbullracing.com');
    await page.fill('input[type="password"]', 'Admin123!');
    await page.click('button[type="submit"]');

    await page.waitForURL('**/*', { timeout: 10000 });
    await page.waitForTimeout(3000);

    // Log all requests
    console.log('\n📡 NETWORK REQUESTS:');
    requests.forEach((req, i) => {
      if (req.url.includes('auth') || req.url.includes('api')) {
        console.log(`  ${i + 1}. ${req.method} ${req.url}`);
      }
    });

    console.log('\n📥 NETWORK RESPONSES:');
    responses.forEach((res, i) => {
      if (res.url.includes('auth') || res.url.includes('api')) {
        console.log(`  ${i + 1}. ${res.status} ${res.url}`);
        if (res.headers['set-cookie']) {
          console.log(`      Set-Cookie: ${res.headers['set-cookie']}`);
        }
        if (res.headers['location']) {
          console.log(`      Location: ${res.headers['location']}`);
        }
      }
    });
  });
});
