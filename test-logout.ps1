# Test logout with CSRF token
$uri = "http://localhost:3001"

# Step 1: Login
Write-Host "Step 1: Admin login..."
$loginBody = @{
    email = "admin@sqlperformance.ai"
    password = "Jk8%sk93/ks.U"
} | ConvertTo-Json

$loginResponse = Invoke-WebRequest -Uri "$uri/api/admin/login" `
    -Method POST `
    -Headers @{'Content-Type'='application/json'} `
    -Body $loginBody `
    -UseBasicParsing `
    -SessionVariable session

$loginData = $loginResponse.Content | ConvertFrom-Json
Write-Host "  Login successful: $($loginData.message)"
Write-Host "  CSRF Token: $($loginData.csrfToken.Substring(0, 20))..."

# Step 2: Get current session CSRF token via /api/admin/me
Write-Host "`nStep 2: Getting CSRF token from /api/admin/me..."
$meResponse = Invoke-WebRequest -Uri "$uri/api/admin/me" -UseBasicParsing -WebSession $session
$meData = $meResponse.Content | ConvertFrom-Json
$csrfToken = $meData.csrfToken
Write-Host "  CSRF Token: $($csrfToken.Substring(0, 20))..."

# Step 3: Logout with CSRF token
Write-Host "`nStep 3: Admin logout with CSRF token..."
$logoutBody = @{
    _csrf = $csrfToken
} | ConvertTo-Json

try {
    $logoutResponse = Invoke-WebRequest -Uri "$uri/api/admin/logout" `
        -Method POST `
        -Headers @{'Content-Type'='application/json'} `
        -Body $logoutBody `
        -UseBasicParsing `
        -WebSession $session

    $logoutData = $logoutResponse.Content | ConvertFrom-Json
    Write-Host "  Status: $($logoutResponse.StatusCode)"
    Write-Host "  Message: $($logoutData.message)"
} catch {
    Write-Host "  ERROR: $($_.Exception.Message)"
}

# Step 4: Verify session cleared
Write-Host "`nStep 4: Verifying session cleared..."
$meAfterLogout = Invoke-WebRequest -Uri "$uri/api/admin/me" -UseBasicParsing -WebSession $session
$meAfterData = $meAfterLogout.Content | ConvertFrom-Json
Write-Host "  Authenticated after logout: $($meAfterData.authenticated)"

Write-Host "`n✅ LOGOUT TEST COMPLETE"
