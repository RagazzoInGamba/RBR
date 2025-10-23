# Simple session test
Write-Host "Checking session endpoint..." -ForegroundColor Cyan

try {
    $response = Invoke-WebRequest -Uri "http://localhost:3001/api/auth/session" -UseBasicParsing
    Write-Host "Status: $($response.StatusCode)" -ForegroundColor Green
    Write-Host "Content:" -ForegroundColor Yellow
    $response.Content
    Write-Host ""
    Write-Host "Headers:" -ForegroundColor Yellow
    $response.Headers | Format-Table
} catch {
    Write-Host "Error: $_" -ForegroundColor Red
}
