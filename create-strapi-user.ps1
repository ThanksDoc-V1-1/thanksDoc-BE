# Create Strapi User Script
# This script creates a Strapi user that matches your admin credentials
# so that both custom auth and Strapi auth work

$body = @{
    username = "admin"
    email = "admin@gmail.com"
    password = "12345678"
} | ConvertTo-Json

try {
    Write-Host "Creating Strapi user for admin..."
    $response = Invoke-RestMethod -Uri "https://thanks-doc-be-production.up.railway.app/api/auth/local/register" -Method POST -Body $body -ContentType "application/json"
    Write-Host "✅ Strapi user created successfully"
    Write-Host "User ID: $($response.user.id)"
    Write-Host "JWT Token: $($response.jwt)"
    
    # Test the services API with this Strapi token
    Write-Host "`nTesting services API with Strapi token..."
    $services = Invoke-RestMethod -Uri "https://thanks-doc-be-production.up.railway.app/api/services" -Headers @{"Authorization"="Bearer $($response.jwt)"}
    Write-Host "✅ Services API works with Strapi token! Found $($services.data.Count) services"
    
} catch {
    Write-Host "❌ Error creating user: $($_.Exception.Message)"
    if ($_.ErrorDetails.Message) {
        Write-Host "Response: $($_.ErrorDetails.Message)"
    }
}
