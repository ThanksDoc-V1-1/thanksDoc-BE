Write-Host "🔍 Checking Mr Ar's compliance documents structure..." -ForegroundColor Green

try {
    $response = Invoke-RestMethod -Uri "http://localhost:1337/api/compliance-documents/doctor/1" -Method GET
    
    if ($response.success -and $response.data.documents) {
        $documents = $response.data.documents
        Write-Host "📋 Found $($documents.Count) documents for Mr Ar" -ForegroundColor Yellow
        
        Write-Host "`n📄 Document Details:" -ForegroundColor Yellow
        for ($i = 0; $i -lt [Math]::Min(3, $documents.Count); $i++) {
            $doc = $documents[$i]
            Write-Host "   Document $($i + 1):" -ForegroundColor Cyan
            Write-Host "     ID: $($doc.id)"
            Write-Host "     Verification Status: $($doc.verificationStatus)"
            Write-Host "     Expiry Date: $($doc.expiryDate)"
            Write-Host "     complianceDocumentType: $($doc.complianceDocumentType)"
            Write-Host "     complianceDocumentType.id: $($doc.complianceDocumentType.id)"
            Write-Host "     complianceDocumentType.name: $($doc.complianceDocumentType.name)"
            Write-Host ""
        }
        
        # Check document types
        Write-Host "📋 Checking compliance document types..." -ForegroundColor Yellow
        $typesResponse = Invoke-RestMethod -Uri "http://localhost:1337/api/compliance-document-types" -Method GET
        
        if ($typesResponse.data) {
            Write-Host "✅ Found $($typesResponse.data.Count) document types:" -ForegroundColor Green
            foreach ($type in $typesResponse.data) {
                $required = if ($type.isRequired) { "✅ REQUIRED" } else { "⚪ Optional" }
                Write-Host "   - $($type.name) (ID: $($type.id)) $required"
            }
        } else {
            Write-Host "❌ No document types found!" -ForegroundColor Red
        }
        
        # Test the updated verification logic
        Write-Host "`n🔄 Testing verification update with fixed service..." -ForegroundColor Yellow
        $updateResponse = Invoke-RestMethod -Uri "http://localhost:1337/api/compliance-documents/doctors/1/update-verification" -Method POST
        
        if ($updateResponse.success) {
            Write-Host "✅ Verification update completed!" -ForegroundColor Green
            $result = $updateResponse.data
            Write-Host "   Status changed: $($result.statusChanged)"
            Write-Host "   Previous status: $($result.previousStatus)"
            Write-Host "   New status: $($result.newStatus)"
            
            if ($result.verificationCheck) {
                $check = $result.verificationCheck
                Write-Host "`n📊 Verification Check Results:" -ForegroundColor Yellow
                Write-Host "   Should be verified: $($check.shouldBeVerified)"
                Write-Host "   Total required: $($check.totalRequired)"
                Write-Host "   Verified count: $($check.verifiedCount)"
                Write-Host "   Missing documents: $($check.missingDocuments.Count)"
                Write-Host "   Rejected documents: $($check.rejectedDocuments.Count)"
                Write-Host "   Expired documents: $($check.expiredDocuments.Count)"
                
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
        } else {
            Write-Host "❌ Verification update failed!" -ForegroundColor Red
            Write-Host "   Error: $($updateResponse.error)"
        }
        
    } else {
        Write-Host "❌ No documents found or API error" -ForegroundColor Red
        Write-Host "Response: $($response | ConvertTo-Json -Depth 3)"
    }
    
} catch {
    Write-Host "❌ Error: $($_.Exception.Message)" -ForegroundColor Red
}
