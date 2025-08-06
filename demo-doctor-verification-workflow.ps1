# Doctor Verification System - Complete Workflow Demo

Write-Host "🎯 Doctor Verification System - Complete Workflow Demo" -ForegroundColor Green
Write-Host "This demo shows how the system automatically manages doctor verification" -ForegroundColor Cyan
Write-Host "based on compliance document verification and expiry status.`n" -ForegroundColor Cyan

$baseUrl = "http://localhost:1337/api"

# Helper function to display doctor status
function Show-DoctorStatus {
    param($doctorId, $stepName)
    
    Write-Host "📊 $stepName - Doctor Status:" -ForegroundColor Yellow
    try {
        $response = Invoke-RestMethod -Uri "$baseUrl/doctors/$doctorId" -Method GET
        $doctor = $response.data
        $status = if ($doctor.isVerified) { "✅ VERIFIED" } else { "❌ NOT VERIFIED" }
        Write-Host "   $status" -ForegroundColor $(if ($doctor.isVerified) { "Green" } else { "Red" })
        if ($doctor.verificationStatusReason) {
            Write-Host "   Reason: $($doctor.verificationStatusReason)" -ForegroundColor Gray
        }
        return $doctor.isVerified
    } catch {
        Write-Host "   ❌ Error getting doctor status: $($_.Exception.Message)" -ForegroundColor Red
        return $false
    }
}

# Helper function to get a document ID for testing
function Get-TestDocumentId {
    param($doctorId)
    
    try {
        $response = Invoke-RestMethod -Uri "$baseUrl/compliance-documents/doctor/$doctorId" -Method GET
        if ($response.success -and $response.data.documents.Count -gt 0) {
            return $response.data.documents[0].id
        }
    } catch {
        Write-Host "❌ Error getting documents: $($_.Exception.Message)" -ForegroundColor Red
    }
    return $null
}

# Step 1: Get a test doctor
Write-Host "Step 1: Getting test doctor..." -ForegroundColor Magenta
try {
    $response = Invoke-RestMethod -Uri "$baseUrl/doctors" -Method GET
    if ($response.data -and $response.data.Count -gt 0) {
        $doctor = $response.data[0]
        $doctorId = $doctor.id
        Write-Host "✅ Using doctor: $($doctor.firstName) $($doctor.lastName) (ID: $doctorId)`n" -ForegroundColor Green
    } else {
        Write-Host "❌ No doctors found. Please create a doctor first.`n" -ForegroundColor Red
        exit 1
    }
} catch {
    Write-Host "❌ Failed to get doctors: $($_.Exception.Message)`n" -ForegroundColor Red
    exit 1
}

# Step 2: Show initial status
$initialStatus = Show-DoctorStatus -doctorId $doctorId -stepName "Step 2"
Write-Host ""

# Step 3: Update verification status to see current state
Write-Host "Step 3: Checking current compliance status..." -ForegroundColor Magenta
try {
    $response = Invoke-RestMethod -Uri "$baseUrl/compliance-documents/doctors/$doctorId/update-verification" -Method POST
    if ($response.success) {
        $check = $response.data.verificationCheck
        Write-Host "📋 Compliance Status:" -ForegroundColor Yellow
        Write-Host "   Required documents: $($check.totalRequired)" -ForegroundColor Cyan
        Write-Host "   Verified documents: $($check.verifiedCount)" -ForegroundColor Cyan
        Write-Host "   Missing documents: $($check.missingDocuments.Count)" -ForegroundColor Cyan
        Write-Host "   Rejected documents: $($check.rejectedDocuments.Count)" -ForegroundColor Cyan
        Write-Host "   Expired documents: $($check.expiredDocuments.Count)" -ForegroundColor Cyan
        
        if ($check.missingDocuments.Count -gt 0) {
            Write-Host "   Missing: $($check.missingDocuments -join ', ')" -ForegroundColor Red
        }
        if ($check.rejectedDocuments.Count -gt 0) {
            Write-Host "   Rejected: $($check.rejectedDocuments -join ', ')" -ForegroundColor Red
        }
        if ($check.expiredDocuments.Count -gt 0) {
            Write-Host "   Expired: $($check.expiredDocuments -join ', ')" -ForegroundColor Red
        }
    }
} catch {
    Write-Host "❌ Error checking compliance status: $($_.Exception.Message)" -ForegroundColor Red
}
Write-Host ""

# Step 4: Demonstrate document verification impact
$documentId = Get-TestDocumentId -doctorId $doctorId
if ($documentId) {
    Write-Host "Step 4: Demonstrating document verification impact..." -ForegroundColor Magenta
    
    # First, reject a document to show impact
    Write-Host "📄 Rejecting a document to show verification impact..." -ForegroundColor Yellow
    try {
        $body = @{
            verificationStatus = "rejected"
            notes = "Demo: Testing automatic verification system"
        } | ConvertTo-Json
        
        $response = Invoke-RestMethod -Uri "$baseUrl/compliance-documents/$documentId/verify" -Method PUT -Body $body -ContentType "application/json"
        if ($response.success) {
            Write-Host "✅ Document rejected successfully" -ForegroundColor Green
            if ($response.doctorVerificationUpdate) {
                $update = $response.doctorVerificationUpdate
                if ($update.statusChanged) {
                    Write-Host "🔄 Doctor verification status automatically changed!" -ForegroundColor Yellow
                    Write-Host "   From: $($update.previousStatus) → To: $($update.newStatus)" -ForegroundColor Cyan
                }
            }
        }
    } catch {
        Write-Host "❌ Error rejecting document: $($_.Exception.Message)" -ForegroundColor Red
    }
    
    # Show status after rejection
    Show-DoctorStatus -doctorId $doctorId -stepName "After Document Rejection"
    Write-Host ""
    
    # Now verify the document to show it can be restored
    Write-Host "📄 Now verifying the document to restore status..." -ForegroundColor Yellow
    try {
        $body = @{
            verificationStatus = "verified"
            notes = "Demo: Restoring document verification"
        } | ConvertTo-Json
        
        $response = Invoke-RestMethod -Uri "$baseUrl/compliance-documents/$documentId/verify" -Method PUT -Body $body -ContentType "application/json"
        if ($response.success) {
            Write-Host "✅ Document verified successfully" -ForegroundColor Green
            if ($response.doctorVerificationUpdate) {
                $update = $response.doctorVerificationUpdate
                if ($update.statusChanged) {
                    Write-Host "🔄 Doctor verification status automatically updated!" -ForegroundColor Yellow
                    Write-Host "   From: $($update.previousStatus) → To: $($update.newStatus)" -ForegroundColor Cyan
                }
            }
        }
    } catch {
        Write-Host "❌ Error verifying document: $($_.Exception.Message)" -ForegroundColor Red
    }
    
    # Show final status
    Show-DoctorStatus -doctorId $doctorId -stepName "After Document Verification"
    Write-Host ""
} else {
    Write-Host "Step 4: Skipped - No documents found for testing`n" -ForegroundColor Yellow
}

# Step 5: Test bulk verification update
Write-Host "Step 5: Testing bulk verification update for all doctors..." -ForegroundColor Magenta
try {
    $response = Invoke-RestMethod -Uri "$baseUrl/compliance-documents/doctors/update-all-verification" -Method POST
    if ($response.success) {
        $result = $response.data
        Write-Host "✅ Bulk verification update completed:" -ForegroundColor Green
        Write-Host "   Total doctors: $($result.total)" -ForegroundColor Cyan
        Write-Host "   Updated: $($result.updated)" -ForegroundColor Cyan
        Write-Host "   Unchanged: $($result.unchanged)" -ForegroundColor Cyan
        Write-Host "   Errors: $($result.errors)" -ForegroundColor Cyan
    }
} catch {
    Write-Host "❌ Error in bulk update: $($_.Exception.Message)" -ForegroundColor Red
}
Write-Host ""

# Summary
Write-Host "🎉 Demo completed! Here's what we demonstrated:" -ForegroundColor Green
Write-Host ""
Write-Host "✅ Key Features Demonstrated:" -ForegroundColor Yellow
Write-Host "   1. Automatic verification status checking based on compliance documents" -ForegroundColor White
Write-Host "   2. Real-time updates when documents are verified/rejected" -ForegroundColor White
Write-Host "   3. Detailed compliance status reporting" -ForegroundColor White
Write-Host "   4. Bulk verification updates for all doctors" -ForegroundColor White
Write-Host "   5. Comprehensive logging and error handling" -ForegroundColor White
Write-Host ""
Write-Host "🔧 System Behavior:" -ForegroundColor Yellow
Write-Host "   • Doctors are verified ONLY when ALL required documents are verified" -ForegroundColor White
Write-Host "   • ANY rejected or expired document automatically unverifies the doctor" -ForegroundColor White
Write-Host "   • Status updates happen automatically on document changes" -ForegroundColor White
Write-Host "   • Manual triggers available for bulk operations" -ForegroundColor White
Write-Host ""
Write-Host "📋 Integration Points:" -ForegroundColor Yellow
Write-Host "   • Document upload → triggers verification check" -ForegroundColor White
Write-Host "   • Document verification → triggers verification update" -ForegroundColor White
Write-Host "   • Document expiry → triggers verification update" -ForegroundColor White
Write-Host "   • Manual API endpoints for on-demand updates" -ForegroundColor White
