# Full admin login flow test - simulating browser behavior
$uri = "http://localhost:3001"

# Step 1: Get login page (sets initial session)
Write-Host "Step 1: Accessing admin login page..."
$loginPageResponse = Invoke-WebRequest -Uri "$uri/admin/login" -UseBasicParsing -SessionVariable session
Write-Host "  Status: $($loginPageResponse.StatusCode)"

# Step 2: Get CSRF token from /api/admin/me before login
Write-Host "`nStep 2: Getting CSRF token before login..."
$meBeforeLogin = Invoke-WebRequest -Uri "$uri/api/admin/me" -UseBasicParsing -WebSession $session
$meBeforeData = $meBeforeLogin.Content | ConvertFrom-Json
Write-Host "  Authenticated: $($meBeforeData.authenticated)"
Write-Host "  CSRF Token: $($meBeforeData.csrfToken.Substring(0, 20))..."

# Step 3: Login with credentials (credentials: 'include' equivalent)
Write-Host "`nStep 3: Attempting admin login..."
$loginBody = @{
    email = "admin@sqlperformance.ai"
    password = "test123456"
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

# Step 4: Verify session is set - check /api/admin/me after login
Write-Host "`nStep 4: Verifying session after login..."
$meAfterLogin = Invoke-WebRequest -Uri "$uri/api/admin/me" -UseBasicParsing -WebSession $session
$meAfterData = $meAfterLogin.Content | ConvertFrom-Json
Write-Host "  Authenticated: $($meAfterData.authenticated)"
Write-Host "  Admin Email: $($meAfterData.admin.email)"

# Step 5: Access admin dashboard with session
Write-Host "`nStep 5: Accessing /admin dashboard..."
try {
    $adminPageResponse = Invoke-WebRequest -Uri "$uri/admin" -UseBasicParsing -WebSession $session
    Write-Host "  Status: $($adminPageResponse.StatusCode)"
    Write-Host "  Page loaded: $(if($adminPageResponse.Content -match 'Admin Panel') { 'YES' } else { 'NO' })"
} catch {
    Write-Host "  ERROR: $_"
}

Write-Host "`n✅ LOGIN FLOW COMPLETE"
