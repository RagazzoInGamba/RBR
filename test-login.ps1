# Test login script for NextAuth v5
$body = @{
    email = "manager@redbullracing.com"
    password = "Manager123!"
} | ConvertTo-Json

Write-Host "Testing login for manager@redbullracing.com..." -ForegroundColor Cyan

# First get CSRF token
$csrfResponse = Invoke-WebRequest -Uri "http://localhost:3001/api/auth/csrf" -SessionVariable session
$csrf = ($csrfResponse.Content | ConvertFrom-Json).csrfToken

Write-Host "CSRF Token: $csrf" -ForegroundColor Yellow

# Now attempt login with signIn
$loginBody = "email=manager@redbullracing.com&password=Manager123!&redirect=false&json=true&csrfToken=$csrf"

try {
    $response = Invoke-WebRequest `
        -Uri "http://localhost:3001/api/auth/callback/credentials" `
        -Method POST `
        -Body $loginBody `
        -WebSession $session `
        -ContentType "application/x-www-form-urlencoded"

    Write-Host "Response Status: $($response.StatusCode)" -ForegroundColor Green
    Write-Host "Response Body:" -ForegroundColor Cyan
    $response.Content | ConvertFrom-Json | ConvertTo-Json -Depth 5

    # Check session
    Write-Host "`nChecking session..." -ForegroundColor Cyan
    $sessionResponse = Invoke-WebRequest -Uri "http://localhost:3001/api/auth/session" -WebSession $session
    Write-Host "Session:" -ForegroundColor Green
    $sessionResponse.Content | ConvertFrom-Json | ConvertTo-Json -Depth 5
} catch {
    Write-Host "Error: $_" -ForegroundColor Red
    Write-Host "Response: $($_.Exception.Response)" -ForegroundColor Red
}
