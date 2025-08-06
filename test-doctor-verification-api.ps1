# Test Doctor Verification System API Endpoints
Write-Host "🚀 Testing Doctor Verification System API Endpoints" -ForegroundColor Green

$baseUrl = "http://localhost:1337/api"

# Test 1: Get all doctors to find one to test with
Write-Host "`n📋 Test 1: Getting doctors list..." -ForegroundColor Yellow
try {
    $response = Invoke-RestMethod -Uri "$baseUrl/doctors" -Method GET
    if ($response.data -and $response.data.Count -gt 0) {
        $testDoctor = $response.data[0]
        $doctorId = $testDoctor.id
        Write-Host "✅ Found test doctor: $($testDoctor.firstName) $($testDoctor.lastName) (ID: $doctorId)" -ForegroundColor Green
        Write-Host "   Current verification status: $($testDoctor.isVerified)" -ForegroundColor Cyan
    } else {
        Write-Host "❌ No doctors found in database" -ForegroundColor Red
        exit 1
    }
} catch {
    Write-Host "❌ Failed to get doctors: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}

# Test 2: Check doctor's compliance documents
Write-Host "`n📄 Test 2: Getting doctor's compliance documents..." -ForegroundColor Yellow
try {
    $response = Invoke-RestMethod -Uri "$baseUrl/compliance-documents/doctor/$doctorId" -Method GET
    if ($response.success) {
        $documents = $response.data.documents
        Write-Host "✅ Found $($documents.Count) compliance documents:" -ForegroundColor Green
        foreach ($doc in $documents) {
            $verificationStatus = if ($doc.verificationStatus) { $doc.verificationStatus } else { "pending" }
            $status = if ($doc.status) { $doc.status } else { "unknown" }
            Write-Host "   - $($doc.documentType): $verificationStatus ($status)" -ForegroundColor Cyan
            
            if ($doc.expiryDate) {
                $expiryDate = [DateTime]::Parse($doc.expiryDate)
                $daysUntilExpiry = ($expiryDate - (Get-Date)).Days
                Write-Host "     Expires in $daysUntilExpiry days ($($doc.expiryDate))" -ForegroundColor Gray
            }
        }
    } else {
        Write-Host "❌ Failed to get compliance documents" -ForegroundColor Red
    }
} catch {
    Write-Host "❌ Failed to get compliance documents: $($_.Exception.Message)" -ForegroundColor Red
}

# Test 3: Update doctor verification status
Write-Host "`n🔄 Test 3: Updating doctor verification status..." -ForegroundColor Yellow
try {
    $response = Invoke-RestMethod -Uri "$baseUrl/compliance-documents/doctors/$doctorId/update-verification" -Method POST
    if ($response.success) {
        $result = $response.data
        Write-Host "✅ Verification status update completed:" -ForegroundColor Green
        Write-Host "   Success: $($result.success)" -ForegroundColor Cyan
        Write-Host "   Status changed: $($result.statusChanged)" -ForegroundColor Cyan
        if ($result.statusChanged) {
            Write-Host "   Previous status: $($result.previousStatus)" -ForegroundColor Cyan
            Write-Host "   New status: $($result.newStatus)" -ForegroundColor Cyan
        } else {
            Write-Host "   Current status: $($result.currentStatus)" -ForegroundColor Cyan
        }
        
        if ($result.verificationCheck) {
            $check = $result.verificationCheck
            Write-Host "   Should be verified: $($check.shouldBeVerified)" -ForegroundColor Cyan
            Write-Host "   Verified documents: $($check.verifiedCount)/$($check.totalRequired)" -ForegroundColor Cyan
            
            if ($check.missingDocuments -and $check.missingDocuments.Count -gt 0) {
                Write-Host "   Missing documents: $($check.missingDocuments -join ', ')" -ForegroundColor Red
            }
            if ($check.rejectedDocuments -and $check.rejectedDocuments.Count -gt 0) {
                Write-Host "   Rejected documents: $($check.rejectedDocuments -join ', ')" -ForegroundColor Red
            }
            if ($check.expiredDocuments -and $check.expiredDocuments.Count -gt 0) {
                Write-Host "   Expired documents: $($check.expiredDocuments -join ', ')" -ForegroundColor Red
            }
        }
    } else {
        Write-Host "❌ Failed to update verification status" -ForegroundColor Red
    }
} catch {
    Write-Host "❌ Failed to update verification status: $($_.Exception.Message)" -ForegroundColor Red
}

# Test 4: Get updated doctor info
Write-Host "`n👤 Test 4: Getting updated doctor information..." -ForegroundColor Yellow
try {
    $response = Invoke-RestMethod -Uri "$baseUrl/doctors/$doctorId" -Method GET
    if ($response.data) {
        $doctor = $response.data
        Write-Host "✅ Updated doctor information:" -ForegroundColor Green
        Write-Host "   Name: $($doctor.firstName) $($doctor.lastName)" -ForegroundColor Cyan
        Write-Host "   Verification status: $($doctor.isVerified)" -ForegroundColor Cyan
        if ($doctor.verificationStatusUpdatedAt) {
            Write-Host "   Last updated: $($doctor.verificationStatusUpdatedAt)" -ForegroundColor Cyan
        }
        if ($doctor.verificationStatusReason) {
            Write-Host "   Reason: $($doctor.verificationStatusReason)" -ForegroundColor Cyan
        }
    } else {
        Write-Host "❌ Failed to get updated doctor info" -ForegroundColor Red
    }
} catch {
    Write-Host "❌ Failed to get updated doctor info: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host "`n✅ Doctor Verification System API test completed!" -ForegroundColor Green
Write-Host "`n📋 Summary:" -ForegroundColor Yellow
Write-Host "- The system automatically checks doctor verification based on compliance documents" -ForegroundColor White
Write-Host "- Doctors are verified only when ALL required documents are uploaded and verified" -ForegroundColor White
Write-Host "- Verification status is automatically updated when documents expire or are rejected" -ForegroundColor White
Write-Host "- Manual verification updates can be triggered via API endpoints" -ForegroundColor White
