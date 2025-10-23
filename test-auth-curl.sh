#!/bin/bash
# Test authentication using curl from host

echo "🔐 Testing Red Bull Racing Authentication"
echo "=========================================="

# Test 1: Get CSRF token
echo ""
echo "1. Getting CSRF token..."
CSRF_RESPONSE=$(curl -s -c cookies.txt http://localhost:3001/api/auth/csrf)
CSRF_TOKEN=$(echo $CSRF_RESPONSE | grep -o '"csrfToken":"[^"]*' | cut -d'"' -f4)
echo "   CSRF Token: ${CSRF_TOKEN:0:20}..."

# Test 2: Sign in as SUPER_ADMIN
echo ""
echo "2. Testing login as admin@redbullracing.com (SUPER_ADMIN)..."
SIGNIN_RESPONSE=$(curl -s -b cookies.txt -c cookies.txt \
  -X POST \
  -H "Content-Type: application/json" \
  http://localhost:3001/api/auth/callback/credentials \
  -d "{\"csrfToken\":\"$CSRF_TOKEN\",\"email\":\"admin@redbullracing.com\",\"password\":\"Admin123!\",\"redirect\":false}")

echo "   Response: ${SIGNIN_RESPONSE:0:100}"

# Test 3: Get session
echo ""
echo "3. Checking session..."
SESSION=$(curl -s -b cookies.txt http://localhost:3001/api/auth/session)
echo "   Session: $SESSION"

# Test 4: Check if we can access protected endpoint
echo ""
echo "4. Testing protected endpoint /api/stats/dashboard..."
STATS=$(curl -s -b cookies.txt http://localhost:3001/api/stats/dashboard)
echo "   Stats Response: ${STATS:0:200}"

echo ""
echo "=========================================="
echo "✅ Authentication test complete!"
