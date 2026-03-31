# Test delete customer with CSRF token
$uri = "http://localhost:3001"

# Step 1: Login
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

Write-Host "✅ Admin logged in"

# Step 2: Create test customer
$createCustomerBody = @{
    name = "Test"
    surname = "Delete"
    email = "testdelete_$(Get-Random)@test.com"
    phone = "+905551234567"
    job = "QA"
    companyName = "TestCorp"
} | ConvertTo-Json

# Try to create via auth endpoint
$createResponse = Invoke-WebRequest -Uri "$uri/api/auth/register" `
    -Method POST `
    -Headers @{'Content-Type'='application/json'} `
    -Body $createCustomerBody `
    -UseBasicParsing -WebSession $session -ErrorAction SilentlyContinue

Write-Host "✅ Test customer creation attempted"

# Step 3: Get customer list to find testable customer
$dashboardResponse = Invoke-WebRequest -Uri "$uri/api/admin/dashboard" `
    -UseBasicParsing -WebSession $session
$dashboardData = $dashboardResponse.Content | ConvertFrom-Json

$customers = $dashboardData.customers
Write-Host "  Found $($customers.Count) customers"

if ($customers.Count -gt 0) {
    $testCustomerId = $customers[0].id
    Write-Host "  Using customer ID: $testCustomerId"
    
    # Step 4: Get CSRF token
    $meResponse = Invoke-WebRequest -Uri "$uri/api/admin/me" -UseBasicParsing -WebSession $session
    $meData = $meResponse.Content | ConvertFrom-Json
    $csrfToken = $meData.csrfToken
    
    # Step 5: Try delete with CSRF token
    $deleteBody = @{
        _csrf = $csrfToken
    } | ConvertTo-Json
    
    Write-Host "`n🧪 Testing DELETE request with CSRF token..."
    try {
        $deleteResponse = Invoke-WebRequest -Uri "$uri/api/admin/customers/$testCustomerId" `
            -Method DELETE `
            -Headers @{'Content-Type'='application/json'} `
            -Body $deleteBody `
            -UseBasicParsing `
            -WebSession $session
        
        Write-Host "✅ DELETE successful (HTTP $($deleteResponse.StatusCode))"
        Write-Host "  Message: $($deleteResponse.Content)"
    } catch {
        Write-Host "❌ DELETE failed: $($_.Exception.Message)"
        Write-Host "  Response: $($_.ErrorDetails.Message)"
    }
} else {
    Write-Host "❌ No customers available for test"
}
