# Patient Request System - Complete Flow Summary
# PowerShell script to demonstrate the patient request system

Write-Host "🎯 PATIENT REQUEST SYSTEM - COMPLETE FLOW DEMONSTRATION" -ForegroundColor Green
Write-Host "=" * 60 -ForegroundColor Yellow

# Step 1: Check Backend Status
Write-Host "`n📡 Step 1: Checking Backend Status..." -ForegroundColor Cyan
try {
    $backendCheck = Invoke-RestMethod -Uri "http://localhost:1337/api/services" -Method Get -TimeoutSec 5
    Write-Host "✅ Backend is running on http://localhost:1337" -ForegroundColor Green
    Write-Host "   Available services: $($backendCheck.data.Count)" -ForegroundColor White
} catch {
    Write-Host "❌ Backend not accessible" -ForegroundColor Red
    exit 1
}

# Step 2: Check Frontend Status  
Write-Host "`n🌐 Step 2: Checking Frontend Status..." -ForegroundColor Cyan
try {
    $frontendCheck = Invoke-WebRequest -Uri "http://localhost:3001" -Method Get -TimeoutSec 5 -UseBasicParsing
    Write-Host "✅ Frontend is running on http://localhost:3001" -ForegroundColor Green
} catch {
    Write-Host "❌ Frontend not accessible" -ForegroundColor Red
    Write-Host "   Please start frontend with: npm run dev" -ForegroundColor Yellow
}

# Step 3: Display Patient Request URLs
Write-Host "`n🔗 Step 3: Patient Request System URLs..." -ForegroundColor Cyan
Write-Host "📱 Patient Request Page: http://localhost:3001/patient/request" -ForegroundColor White
Write-Host "📝 Simple Landing Page: http://localhost:3001/request-doctor.html" -ForegroundColor White

# Step 4: Show Recent Patient Requests
Write-Host "`n📋 Step 4: Recent Patient Requests..." -ForegroundColor Cyan
try {
    $recentRequests = Invoke-RestMethod -Uri "http://localhost:1337/api/service-requests?filters[isPatientRequest][$eq]=true&populate=*&sort=createdAt:desc" -Method Get
    
    if ($recentRequests.data.Count -gt 0) {
        Write-Host "✅ Found $($recentRequests.data.Count) patient requests" -ForegroundColor Green
        
        $recentRequests.data | Select-Object -First 5 | ForEach-Object {
            $status = if ($_.status -eq "accepted") { "✅ Accepted" } elseif ($_.status -eq "pending") { "⏳ Pending" } else { "❓ $($_.status)" }
            $doctor = if ($_.doctor) { "$($_.doctor.firstName) $($_.doctor.lastName)" } else { "None assigned" }
            
            Write-Host "   • ID: $($_.id) | $($_.patientFirstName) $($_.patientLastName) | $status | Doctor: $doctor" -ForegroundColor White
        }
    } else {
        Write-Host "ℹ️ No patient requests found yet" -ForegroundColor Yellow
    }
} catch {
    Write-Host "❌ Could not fetch patient requests" -ForegroundColor Red
}

# Step 5: Available Doctors
Write-Host "`n👨‍⚕️ Step 5: Available Doctors..." -ForegroundColor Cyan
try {
    $doctors = Invoke-RestMethod -Uri "http://localhost:1337/api/doctors?filters[isVerified][$eq]=true&filters[isAvailable][$eq]=true" -Method Get
    
    Write-Host "✅ Found $($doctors.data.Count) verified & available doctors" -ForegroundColor Green
    $doctors.data | ForEach-Object {
        Write-Host "   • Dr. $($_.firstName) $($_.lastName) | $($_.specialization) | Phone: $($_.phone)" -ForegroundColor White
    }
} catch {
    Write-Host "❌ Could not fetch doctors" -ForegroundColor Red
}

Write-Host "`n" + "=" * 60 -ForegroundColor Yellow
Write-Host "🎉 PATIENT REQUEST SYSTEM STATUS COMPLETE!" -ForegroundColor Green
Write-Host "`n📱 To test the patient flow:" -ForegroundColor Cyan
Write-Host "   1. Open: http://localhost:3001/patient/request" -ForegroundColor White
Write-Host "   2. Fill in patient details (name, phone, email)" -ForegroundColor White
Write-Host "   3. Select a service from the available options" -ForegroundColor White
Write-Host "   4. Complete payment (test mode)" -ForegroundColor White
Write-Host "   5. Request will be sent to all available doctors" -ForegroundColor White
Write-Host "   6. When doctor accepts, patient gets WhatsApp & email notification" -ForegroundColor White
Write-Host "`n🔧 Backend API Endpoints:" -ForegroundColor Cyan
Write-Host "   • POST /api/service-requests/patient-request - Create patient request" -ForegroundColor White
Write-Host "   • PUT /api/service-requests/:id/accept - Doctor accepts request" -ForegroundColor White
Write-Host "   • GET /api/service-requests?filters[isPatientRequest][$eq]=true - List patient requests" -ForegroundColor White
Write-Host ""
