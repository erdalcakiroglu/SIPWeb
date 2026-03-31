# Test admin login with session handling
$postBody = @{email='admin@sqlperformance.ai'; password='test123456'} | ConvertTo-Json

$response = Invoke-WebRequest -Uri "http://localhost:3001/api/admin/login" `
  -Method POST `
  -Headers @{'Content-Type'='application/json'} `
  -Body $postBody `
  -UseBasicParsing `
  -SessionVariable sess

Write-Host "=== Login Response ==="
$response.Content | ConvertFrom-Json | ConvertTo-Json -Depth 2

Write-Host "`n=== Session Cookies ==="
$sess.Cookies.GetCookies([uri]"http://localhost:3001") | Select-Object -ExpandProperty Name

Write-Host "`n=== Accessing /admin with session ==="
$adminResponse = Invoke-WebRequest -Uri "http://localhost:3001/admin" -WebSession $sess -UseBasicParsing
$adminResponse.StatusCode
