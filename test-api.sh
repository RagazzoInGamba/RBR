#!/bin/bash

# Red Bull Racing API Testing Suite
# Comprehensive testing of all 32+ API endpoints

BASE_URL="http://localhost:3001"
API_URL="$BASE_URL/api"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Test counters
TOTAL_TESTS=0
PASSED_TESTS=0
FAILED_TESTS=0

# Test results array
declare -a TEST_RESULTS=()

# Function to test endpoint
test_endpoint() {
    local method=$1
    local endpoint=$2
    local description=$3
    local data=$4
    local expected_status=$5
    local auth_token=$6

    TOTAL_TESTS=$((TOTAL_TESTS + 1))

    echo -e "\n${BLUE}[TEST $TOTAL_TESTS]${NC} $description"
    echo "  → $method $endpoint"

    local start_time=$(date +%s%3N)

    if [ -n "$auth_token" ]; then
        if [ -n "$data" ]; then
            response=$(curl -s -w "\n%{http_code}" -X $method "$API_URL$endpoint" \
                -H "Content-Type: application/json" \
                -H "Cookie: $auth_token" \
                -d "$data")
        else
            response=$(curl -s -w "\n%{http_code}" -X $method "$API_URL$endpoint" \
                -H "Cookie: $auth_token")
        fi
    else
        if [ -n "$data" ]; then
            response=$(curl -s -w "\n%{http_code}" -X $method "$API_URL$endpoint" \
                -H "Content-Type: application/json" \
                -d "$data")
        else
            response=$(curl -s -w "\n%{http_code}" -X $method "$API_URL$endpoint")
        fi
    fi

    local end_time=$(date +%s%3N)
    local duration=$((end_time - start_time))

    status_code=$(echo "$response" | tail -n1)
    body=$(echo "$response" | sed '$d')

    if [ "$status_code" == "$expected_status" ]; then
        echo -e "  ${GREEN}✓ PASS${NC} - Status: $status_code, Time: ${duration}ms"
        PASSED_TESTS=$((PASSED_TESTS + 1))
        TEST_RESULTS+=("✅ $description")
    else
        echo -e "  ${RED}✗ FAIL${NC} - Expected: $expected_status, Got: $status_code, Time: ${duration}ms"
        echo "  Body: ${body:0:200}"
        FAILED_TESTS=$((FAILED_TESTS + 1))
        TEST_RESULTS+=("❌ $description - Expected $expected_status, got $status_code")
    fi
}

echo "=========================================="
echo "Red Bull Racing API Testing Suite"
echo "=========================================="
echo "Base URL: $BASE_URL"
echo "Starting tests..."

# ================================================
# 1. HEALTH CHECK
# ================================================
echo -e "\n${YELLOW}=== 1. HEALTH CHECK ===${NC}"

test_endpoint "GET" "/health" "Health check endpoint" "" "200" ""

# ================================================
# 2. AUTHENTICATION TESTS
# ================================================
echo -e "\n${YELLOW}=== 2. AUTHENTICATION ===${NC}"

# Login with valid credentials (Super Admin)
login_response=$(curl -s -c cookies.txt -X POST "$API_URL/auth/callback/credentials" \
    -H "Content-Type: application/json" \
    -d '{"email":"admin@redbullracing.com","password":"RBR2024!Admin"}')

AUTH_COOKIE=$(cat cookies.txt | grep "next-auth.session-token" | awk '{print $6":"$7}')
echo "Auth cookie: $AUTH_COOKIE"

# ================================================
# 3. ADMIN USER APIs (6 endpoints)
# ================================================
echo -e "\n${YELLOW}=== 3. ADMIN USER APIs ===${NC}"

test_endpoint "GET" "/admin/users" "Get all users" "" "200" "$AUTH_COOKIE"

new_user_data='{
  "email":"test.user@redbullracing.com",
  "password":"TestPass123!",
  "firstName":"Test",
  "lastName":"User",
  "role":"USER",
  "department":"Engineering",
  "employeeId":"RBR-TEST-001"
}'
test_endpoint "POST" "/admin/users" "Create new user" "$new_user_data" "201" "$AUTH_COOKIE"

test_endpoint "GET" "/admin/users/1" "Get user by ID" "" "200" "$AUTH_COOKIE"

update_user_data='{"firstName":"Updated","lastName":"Name"}'
test_endpoint "PATCH" "/admin/users/1" "Update user" "$update_user_data" "200" "$AUTH_COOKIE"

# ================================================
# 4. KITCHEN RECIPE APIs (5 endpoints)
# ================================================
echo -e "\n${YELLOW}=== 4. KITCHEN RECIPE APIs ===${NC}"

test_endpoint "GET" "/kitchen/recipes" "Get all recipes" "" "200" "$AUTH_COOKIE"

new_recipe_data='{
  "name":"Test Recipe",
  "description":"Test Description",
  "category":"FIRST_COURSE",
  "mealType":"LUNCH",
  "ingredients":["pasta","tomato","basil"],
  "allergens":["GLUTEN"],
  "preparationTime":30,
  "basePrice":8.50,
  "isAvailable":true
}'
test_endpoint "POST" "/kitchen/recipes" "Create recipe" "$new_recipe_data" "201" "$AUTH_COOKIE"

test_endpoint "GET" "/kitchen/recipes/1" "Get recipe by ID" "" "200" "$AUTH_COOKIE"

update_recipe_data='{"name":"Updated Recipe Name"}'
test_endpoint "PATCH" "/kitchen/recipes/1" "Update recipe" "$update_recipe_data" "200" "$AUTH_COOKIE"

test_endpoint "DELETE" "/kitchen/recipes/100" "Delete non-existent recipe" "" "404" "$AUTH_COOKIE"

# ================================================
# 5. KITCHEN MENU APIs (5 endpoints)
# ================================================
echo -e "\n${YELLOW}=== 5. KITCHEN MENU APIs ===${NC}"

test_endpoint "GET" "/kitchen/menus" "Get all menus" "" "200" "$AUTH_COOKIE"

new_menu_data='{
  "name":"Test Menu",
  "description":"Test Menu Description",
  "mealType":"LUNCH",
  "date":"2025-10-25",
  "recipes":[1,2,3],
  "isActive":true
}'
test_endpoint "POST" "/kitchen/menus" "Create menu" "$new_menu_data" "201" "$AUTH_COOKIE"

test_endpoint "GET" "/kitchen/menus/1" "Get menu by ID" "" "200" "$AUTH_COOKIE"

update_menu_data='{"name":"Updated Menu Name"}'
test_endpoint "PATCH" "/kitchen/menus/1" "Update menu" "$update_menu_data" "200" "$AUTH_COOKIE"

test_endpoint "DELETE" "/kitchen/menus/100" "Delete non-existent menu" "" "404" "$AUTH_COOKIE"

# ================================================
# 6. KITCHEN ORDERS APIs (2 endpoints)
# ================================================
echo -e "\n${YELLOW}=== 6. KITCHEN ORDERS APIs ===${NC}"

test_endpoint "GET" "/kitchen/orders" "Get all kitchen orders" "" "200" "$AUTH_COOKIE"

# ================================================
# 7. BOOKING APIs - CRITICAL VALIDATION (5 endpoints)
# ================================================
echo -e "\n${YELLOW}=== 7. BOOKING APIs (CRITICAL) ===${NC}"

test_endpoint "GET" "/booking" "Get user bookings" "" "200" "$AUTH_COOKIE"

test_endpoint "GET" "/booking/rules?mealType=LUNCH" "Get booking rules for LUNCH" "" "200" "$AUTH_COOKIE"

# Valid booking with LUNCH requirements
valid_booking='{
  "menuId":1,
  "mealType":"LUNCH",
  "scheduledFor":"2025-10-25T12:00:00Z",
  "items":[
    {"recipeId":1,"quantity":1,"category":"FIRST_COURSE"},
    {"recipeId":5,"quantity":1,"category":"BEVERAGE"}
  ],
  "specialRequests":"No onions please"
}'
test_endpoint "POST" "/booking" "Create valid LUNCH booking" "$valid_booking" "201" "$AUTH_COOKIE"

# Invalid booking - missing FIRST_COURSE
invalid_booking_no_first='{
  "menuId":1,
  "mealType":"LUNCH",
  "scheduledFor":"2025-10-25T12:00:00Z",
  "items":[
    {"recipeId":5,"quantity":1,"category":"BEVERAGE"}
  ]
}'
test_endpoint "POST" "/booking" "Create LUNCH booking without FIRST_COURSE (should fail)" "$invalid_booking_no_first" "400" "$AUTH_COOKIE"

# Invalid booking - missing BEVERAGE
invalid_booking_no_beverage='{
  "menuId":1,
  "mealType":"LUNCH",
  "scheduledFor":"2025-10-25T12:00:00Z",
  "items":[
    {"recipeId":1,"quantity":1,"category":"FIRST_COURSE"}
  ]
}'
test_endpoint "POST" "/booking" "Create LUNCH booking without BEVERAGE (should fail)" "$invalid_booking_no_beverage" "400" "$AUTH_COOKIE"

# Invalid booking - too many APPETIZERS
invalid_booking_too_many='{
  "menuId":1,
  "mealType":"LUNCH",
  "scheduledFor":"2025-10-25T12:00:00Z",
  "items":[
    {"recipeId":1,"quantity":1,"category":"FIRST_COURSE"},
    {"recipeId":2,"quantity":2,"category":"APPETIZER"},
    {"recipeId":5,"quantity":1,"category":"BEVERAGE"}
  ]
}'
test_endpoint "POST" "/booking" "Create LUNCH booking with too many APPETIZERS (should fail)" "$invalid_booking_too_many" "400" "$AUTH_COOKIE"

test_endpoint "GET" "/booking/1" "Get booking by ID" "" "200" "$AUTH_COOKIE"

# ================================================
# 8. CUSTOMER ADMIN APIs (5 endpoints)
# ================================================
echo -e "\n${YELLOW}=== 8. CUSTOMER ADMIN APIs ===${NC}"

test_endpoint "GET" "/customer/employees" "Get all employees" "" "200" "$AUTH_COOKIE"

# ================================================
# 9. STATS APIs (5 endpoints)
# ================================================
echo -e "\n${YELLOW}=== 9. STATS APIs ===${NC}"

test_endpoint "GET" "/stats/super-admin" "Get super admin stats" "" "200" "$AUTH_COOKIE"

test_endpoint "GET" "/stats/kitchen" "Get kitchen stats" "" "200" "$AUTH_COOKIE"

test_endpoint "GET" "/stats/customer-admin" "Get customer admin stats" "" "200" "$AUTH_COOKIE"

test_endpoint "GET" "/stats/user" "Get user stats" "" "200" "$AUTH_COOKIE"

test_endpoint "GET" "/stats/dashboard" "Get dashboard stats" "" "200" "$AUTH_COOKIE"

# ================================================
# 10. MENU APIs (1 endpoint)
# ================================================
echo -e "\n${YELLOW}=== 10. MENU APIs ===${NC}"

test_endpoint "GET" "/menu/available" "Get available menus" "" "200" "$AUTH_COOKIE"

# ================================================
# FINAL REPORT
# ================================================
echo -e "\n=========================================="
echo -e "${YELLOW}FINAL TEST REPORT${NC}"
echo "=========================================="
echo "Total Tests: $TOTAL_TESTS"
echo -e "Passed: ${GREEN}$PASSED_TESTS${NC}"
echo -e "Failed: ${RED}$FAILED_TESTS${NC}"
echo "Success Rate: $((PASSED_TESTS * 100 / TOTAL_TESTS))%"
echo "=========================================="

echo -e "\n${YELLOW}Detailed Results:${NC}"
for result in "${TEST_RESULTS[@]}"; do
    echo "$result"
done

# Cleanup
rm -f cookies.txt

if [ $FAILED_TESTS -eq 0 ]; then
    echo -e "\n${GREEN}🎉 ALL TESTS PASSED!${NC}"
    exit 0
else
    echo -e "\n${RED}⚠️  SOME TESTS FAILED${NC}"
    exit 1
fi
