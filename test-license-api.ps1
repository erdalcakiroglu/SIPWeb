# License Management API Test Script

$ErrorActionPreference = 'SilentlyContinue'

Write-Host "=====================================" -ForegroundColor Cyan
Write-Host "License Management API Test" -ForegroundColor Cyan
Write-Host "=====================================" -ForegroundColor Cyan
Write-Host ""

# 1. Get CSRF token
Write-Host "1. Getting CSRF token..." -ForegroundColor Yellow
$meResponse = Invoke-WebRequest -Uri "http://localhost:3001/api/admin/me" -Method GET
$meData = $meResponse.Content | ConvertFrom-Json
$csrfToken = $meData.csrfToken
Write-Host "✓ CSRF token obtained`n" -ForegroundColor Green

# 2. Admin login
Write-Host "2. Testing admin login..." -ForegroundColor Yellow
$loginBody = @{
  email = "erdal@sqlperformance.ai"
  password = "test123456"
} | ConvertTo-Json

$loginResponse = Invoke-WebRequest -Uri "http://localhost:3001/api/admin/login" `
  -Method POST `
  -ContentType "application/json" `
  -Headers @{"X-CSRF-Token" = $csrfToken} `
  -Body $loginBody 2>&1

if ($loginResponse.StatusCode -eq 200) {
  $loginData = $loginResponse.Content | ConvertFrom-Json
  Write-Host "✓ Admin login successful`n" -ForegroundColor Green
  $sessionToken = $loginData.csrfToken
} else {
  Write-Host "✗ Login failed`n" -ForegroundColor Red
  exit 1
}

# 3. Get dashboard
Write-Host "3. Getting dashboard..." -ForegroundColor Yellow
$dashResponse = Invoke-WebRequest -Uri "http://localhost:3001/api/admin/dashboard" `
  -Method GET `
  -Headers @{"X-CSRF-Token" = $sessionToken}

$dashData = $dashResponse.Content | ConvertFrom-Json
Write-Host "✓ Dashboard loaded" -ForegroundColor Green
Write-Host "  Total Customers: $($dashData.summary.totalCustomers)"
Write-Host "  Total Licenses: $($dashData.summary.totalLicenses)`n"

if ($dashData.customers.Length -gt 0) {
  $customer = $dashData.customers[0]
  $customerId = $customer.id
  
  Write-Host "4. Selected test customer" -ForegroundColor Yellow
  Write-Host "  Email: $($customer.email)"
  Write-Host "  Max Licenses Allowed: $($customer.maxLicenses)"
  Write-Host "  Current Active Licenses: $($customer.activeLicenseCount)`n"
  
  # 4. Create license
  if ($customer.activeLicenseCount -lt $customer.maxLicenses) {
    Write-Host "5. Creating new license..." -ForegroundColor Yellow
    $randomId = Get-Random
    $createBody = @{
      licenseName = "Test License #$randomId"
      expiresAt = "2027-12-31T23:59:59Z"
    } | ConvertTo-Json
    
    $createResponse = Invoke-WebRequest -Uri "http://localhost:3001/api/admin/customers/$customerId/licenses" `
      -Method POST `
      -ContentType "application/json" `
      -Headers @{"X-CSRF-Token" = $sessionToken} `
      -Body $createBody 2>&1
    
    if ($createResponse.StatusCode -eq 200) {
      $createData = $createResponse.Content | ConvertFrom-Json
      Write-Host "✓ License created successfully" -ForegroundColor Green
      $newLicense = $createData.detail.licenses[-1]
      Write-Host "  License ID: $($newLicense.id)"
      Write-Host "  License Name: $($newLicense.licenseName)"
      Write-Host "  Status: $($newLicense.status)"
      Write-Host "  Expires At: $($newLicense.expiresAt)`n"
      
      $licenseId = $newLicense.id
      
      # 5. Update license expiration
      Write-Host "6. Updating license expiration date..." -ForegroundColor Yellow
      $updateBody = @{
        expiresAt = "2028-06-30T23:59:59Z"
      } | ConvertTo-Json
      
      $updateResponse = Invoke-WebRequest -Uri "http://localhost:3001/api/admin/customers/$customerId/licenses/$licenseId" `
        -Method PATCH `
        -ContentType "application/json" `
        -Headers @{"X-CSRF-Token" = $sessionToken} `
        -Body $updateBody 2>&1
      
      if ($updateResponse.StatusCode -eq 200) {
        $updateData = $updateResponse.Content | ConvertFrom-Json
        $updatedLicense = $updateData.detail.licenses | Where-Object { $_.id -eq $licenseId }
        Write-Host "✓ License expiration updated" -ForegroundColor Green
        Write-Host "  New Expires At: $($updatedLicense.expiresAt)`n"
      } else {
        Write-Host "✗ Expiration update failed" -ForegroundColor Red
      }
      
      # 6. Update license status
      Write-Host "7. Updating license status..." -ForegroundColor Yellow
      $statusBody = @{
        status = "suspended"
      } | ConvertTo-Json
      
      $statusResponse = Invoke-WebRequest -Uri "http://localhost:3001/api/admin/customers/$customerId/licenses/$licenseId" `
        -Method PATCH `
        -ContentType "application/json" `
        -Headers @{"X-CSRF-Token" = $sessionToken} `
        -Body $statusBody 2>&1
      
      if ($statusResponse.StatusCode -eq 200) {
        $statusData = $statusResponse.Content | ConvertFrom-Json
        $updatedLicense = $statusData.detail.licenses | Where-Object { $_.id -eq $licenseId }
        Write-Host "✓ License status updated" -ForegroundColor Green
        Write-Host "  New Status: $($updatedLicense.status)`n"
      } else {
        Write-Host "✗ Status update failed" -ForegroundColor Red
      }
      
      Write-Host "=====================================" -ForegroundColor Cyan
      Write-Host "✅ All license management tests passed!" -ForegroundColor Green
      Write-Host "=====================================" -ForegroundColor Cyan
    } else {
      Write-Host "✗ License creation failed" -ForegroundColor Red
    }
  } else {
    Write-Host "⚠ Customer has reached max licenses limit ($($customer.maxLicenses))" -ForegroundColor Yellow
  }
} else {
  Write-Host "⚠ No customers found in dashboard" -ForegroundColor Yellow
}
