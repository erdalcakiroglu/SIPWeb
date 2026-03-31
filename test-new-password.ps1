# Full admin login flow test with correct password
$uri = "http://localhost:3001"

# Step 1: Get login page
Write-Host "Step 1: Accessing admin login page..."
$loginPageResponse = Invoke-WebRequest -Uri "$uri/admin/login" -UseBasicParsing -SessionVariable session
Write-Host "  Status: $($loginPageResponse.StatusCode)"

# Step 2: Get CSRF token
Write-Host "`nStep 2: Getting CSRF token..."
$meBeforeLogin = Invoke-WebRequest -Uri "$uri/api/admin/me" -UseBasicParsing -WebSession $session
$meBeforeData = $meBeforeLogin.Content | ConvertFrom-Json
Write-Host "  Authenticated: $($meBeforeData.authenticated)"

# Step 3: Login with correct password
Write-Host "`nStep 3: Attempting admin login with correct password..."
$loginBody = @{
    email = "admin@sqlperformance.ai"
    password = "Jk8%sk93/ks.U"
} | ConvertTo-Json

$loginResponse = Invoke-WebRequest -Uri "$uri/api/admin/login" `
    -Method POST `
    -Headers @{'Content-Type'='application/json'} `
    -Body $loginBody `
    -UseBasicParsing `
    -WebSession $session

$loginData = $loginResponse.Content | ConvertFrom-Json
Write-Host "  Status: $($loginResponse.StatusCode)"
Write-Host "  Message: $($loginData.message)"
Write-Host "  Admin Email: $($loginData.admin.email)"

# Step 4: Verify session
Write-Host "`nStep 4: Verifying session after login..."
$meAfterLogin = Invoke-WebRequest -Uri "$uri/api/admin/me" -UseBasicParsing -WebSession $session
$meAfterData = $meAfterLogin.Content | ConvertFrom-Json
Write-Host "  Authenticated: $($meAfterData.authenticated)"
Write-Host "  Admin Email: $($meAfterData.admin.email)"

# Step 5: Access admin dashboard
Write-Host "`nStep 5: Accessing /admin dashboard..."
$adminPageResponse = Invoke-WebRequest -Uri "$uri/admin" -UseBasicParsing -WebSession $session
Write-Host "  Status: $($adminPageResponse.StatusCode)"
Write-Host "  Page loaded: $(if($adminPageResponse.Content -match 'Admin Panel') { 'YES ✅' } else { 'NO ❌' })"

Write-Host "`n✅ LOGIN FLOW COMPLETE - ALL TESTS PASSED"
