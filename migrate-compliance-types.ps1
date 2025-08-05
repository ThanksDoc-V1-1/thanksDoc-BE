# Migration script to copy compliance document types from localhost to production
# Source: http://localhost:1337/api/compliance-document-types
# Destination: https://thanks-doc-be-production.up.railway.app/api/compliance-document-types

$productionBaseUrl = "https://thanks-doc-be-production.up.railway.app/api"
$localhostBaseUrl = "http://localhost:1337/api"

# Define all compliance document types to migrate (excluding id and documentId)
$complianceTypes = @(
    @{
        key = "medical_license"
        name = "Medical License"
        description = "Valid medical practice license"
        required = $true
        isActive = $true
        displayOrder = 0
        validationRules = $null
        allowedFileTypes = @("pdf", "doc", "docx", "jpg", "jpeg", "png")
        maxFileSize = 10485760
        autoExpiry = $true
        validityYears = 3
        expiryWarningDays = 30
    },
    @{
        key = "gmc_registration"
        name = "GMC Registration"
        description = "General Medical Council registration certificate"
        required = $true
        isActive = $true
        displayOrder = 1
        validationRules = $null
        allowedFileTypes = @("pdf", "doc", "docx", "jpg", "jpeg", "png")
        maxFileSize = 10485760
        autoExpiry = $null
        validityYears = $null
        expiryWarningDays = $null
    },
    @{
        key = "medical_indemnity"
        name = "Medical Indemnity"
        description = "Professional indemnity insurance certificate"
        required = $true
        isActive = $true
        displayOrder = 2
        validationRules = $null
        allowedFileTypes = @("pdf", "doc", "docx", "jpg", "jpeg", "png")
        maxFileSize = 10485760
        autoExpiry = $null
        validityYears = $null
        expiryWarningDays = $null
    },
    @{
        key = "dbs_check"
        name = "DBS Check"
        description = "Disclosure and Barring Service check"
        required = $true
        isActive = $true
        displayOrder = 3
        validationRules = $null
        allowedFileTypes = @("pdf", "doc", "docx", "jpg", "jpeg", "png")
        maxFileSize = 10485760
        autoExpiry = $null
        validityYears = $null
        expiryWarningDays = $null
    },
    @{
        key = "right_to_work"
        name = "Right to Work"
        description = "UK right to work documentation"
        required = $true
        isActive = $true
        displayOrder = 4
        validationRules = $null
        allowedFileTypes = @("pdf", "doc", "docx", "jpg", "jpeg", "png")
        maxFileSize = 10485760
        autoExpiry = $null
        validityYears = $null
        expiryWarningDays = $null
    },
    @{
        key = "photo_id"
        name = "Photo ID"
        description = "Government issued photo identification"
        required = $true
        isActive = $true
        displayOrder = 5
        validationRules = $null
        allowedFileTypes = @("pdf", "doc", "docx", "jpg", "jpeg", "png")
        maxFileSize = 10485760
        autoExpiry = $null
        validityYears = $null
        expiryWarningDays = $null
    },
    @{
        key = "current_performers_list"
        name = "Current Performers List"
        description = "NHS England Performers List registration"
        required = $true
        isActive = $true
        displayOrder = 2
        validationRules = $null
        allowedFileTypes = @("pdf", "doc", "docx", "jpg", "jpeg", "png")
        maxFileSize = 10485760
        autoExpiry = $null
        validityYears = $null
        expiryWarningDays = $null
    },
    @{
        key = "cct_certificate"
        name = "CCT Certificate"
        description = "Certificate of Completion of Training"
        required = $true
        isActive = $true
        displayOrder = 3
        validationRules = $null
        allowedFileTypes = @("pdf", "doc", "docx", "jpg", "jpeg", "png")
        maxFileSize = 10485760
        autoExpiry = $null
        validityYears = $null
        expiryWarningDays = $null
    },
    @{
        key = "gp_cv"
        name = "GP CV"
        description = "Current curriculum vitae"
        required = $true
        isActive = $true
        displayOrder = 8
        validationRules = $null
        allowedFileTypes = @("pdf", "doc", "docx", "jpg", "jpeg", "png")
        maxFileSize = 10485760
        autoExpiry = $null
        validityYears = $null
        expiryWarningDays = $null
    },
    @{
        key = "occupational_health"
        name = "Occupational Health"
        description = "Occupational health clearance certificate"
        required = $true
        isActive = $true
        displayOrder = 9
        validationRules = $null
        allowedFileTypes = @("pdf", "doc", "docx", "jpg", "jpeg", "png")
        maxFileSize = 10485760
        autoExpiry = $null
        validityYears = $null
        expiryWarningDays = $null
    },
    @{
        key = "professional_references"
        name = "Professional References"
        description = "Professional references from previous employers"
        required = $true
        isActive = $true
        displayOrder = 10
        validationRules = $null
        allowedFileTypes = @("pdf", "doc", "docx", "jpg", "jpeg", "png")
        maxFileSize = 10485760
        autoExpiry = $null
        validityYears = $null
        expiryWarningDays = $null
    },
    @{
        key = "appraisal_revalidation"
        name = "Appraisal & Revalidation"
        description = "GMC appraisal and revalidation certificates"
        required = $true
        isActive = $true
        displayOrder = 11
        validationRules = $null
        allowedFileTypes = @("pdf", "doc", "docx", "jpg", "jpeg", "png")
        maxFileSize = 10485760
        autoExpiry = $null
        validityYears = $null
        expiryWarningDays = $null
    },
    @{
        key = "basic_life_support"
        name = "Basic Life Support"
        description = "Basic life support training certificate"
        required = $true
        isActive = $true
        displayOrder = 12
        validationRules = $null
        allowedFileTypes = @("pdf", "doc", "docx", "jpg", "jpeg", "png")
        maxFileSize = 10485760
        autoExpiry = $null
        validityYears = $null
        expiryWarningDays = $null
    },
    @{
        key = "information_governance"
        name = "Information Governance"
        description = "Information governance training certificate"
        required = $true
        isActive = $true
        displayOrder = 15
        validationRules = $null
        allowedFileTypes = @("pdf", "doc", "docx", "jpg", "jpeg", "png")
        maxFileSize = 10485760
        autoExpiry = $null
        validityYears = $null
        expiryWarningDays = $null
    },
    @{
        key = "autism_learning_disability"
        name = "Autism & Learning Disability"
        description = "Autism and learning disability training certificate"
        required = $true
        isActive = $true
        displayOrder = 16
        validationRules = $null
        allowedFileTypes = @("pdf", "doc", "docx", "jpg", "jpeg", "png")
        maxFileSize = 10485760
        autoExpiry = $null
        validityYears = $null
        expiryWarningDays = $null
    },
    @{
        key = "equality_diversity"
        name = "Equality & Diversity"
        description = "Equality and diversity training certificate"
        required = $true
        isActive = $true
        displayOrder = 17
        validationRules = $null
        allowedFileTypes = @("pdf", "doc", "docx", "jpg", "jpeg", "png")
        maxFileSize = 10485760
        autoExpiry = $null
        validityYears = $null
        expiryWarningDays = $null
    },
    @{
        key = "health_safety_welfare"
        name = "Health, Safety & Welfare"
        description = "Health, safety and welfare training certificate"
        required = $true
        isActive = $true
        displayOrder = 18
        validationRules = $null
        allowedFileTypes = @("pdf", "doc", "docx", "jpg", "jpeg", "png")
        maxFileSize = 10485760
        autoExpiry = $null
        validityYears = $null
        expiryWarningDays = $null
    },
    @{
        key = "conflict_resolution"
        name = "Conflict Resolution"
        description = "Conflict resolution training certificate"
        required = $true
        isActive = $true
        displayOrder = 19
        validationRules = $null
        allowedFileTypes = @("pdf", "doc", "docx", "jpg", "jpeg", "png")
        maxFileSize = 10485760
        autoExpiry = $null
        validityYears = $null
        expiryWarningDays = $null
    },
    @{
        key = "fire_safety"
        name = "Fire Safety"
        description = "Fire safety training certificate"
        required = $true
        isActive = $true
        displayOrder = 20
        validationRules = $null
        allowedFileTypes = @("pdf", "doc", "docx", "jpg", "jpeg", "png")
        maxFileSize = 10485760
        autoExpiry = $null
        validityYears = $null
        expiryWarningDays = $null
    },
    @{
        key = "infection_prevention"
        name = "Infection Prevention"
        description = "Infection prevention and control training certificate"
        required = $true
        isActive = $true
        displayOrder = 21
        validationRules = $null
        allowedFileTypes = @("pdf", "doc", "docx", "jpg", "jpeg", "png")
        maxFileSize = 10485760
        autoExpiry = $true
        validityYears = 1
        expiryWarningDays = 7
    },
    @{
        key = "moving_handling"
        name = "Moving & Handling"
        description = "Moving and handling training certificate"
        required = $true
        isActive = $true
        displayOrder = 22
        validationRules = $null
        allowedFileTypes = @("pdf", "doc", "docx", "jpg", "jpeg", "png")
        maxFileSize = 10485760
        autoExpiry = $null
        validityYears = $null
        expiryWarningDays = $null
    },
    @{
        key = "preventing_radicalisation"
        name = "Preventing Radicalisation"
        description = "Preventing radicalisation (Prevent) training certificate"
        required = $true
        isActive = $true
        displayOrder = 23
        validationRules = $null
        allowedFileTypes = @("pdf", "doc", "docx", "jpg", "jpeg", "png")
        maxFileSize = 10485760
        autoExpiry = $null
        validityYears = $null
        expiryWarningDays = $null
    },
    @{
        key = "mulago_doc"
        name = "Mulago doc"
        description = "The test docs"
        required = $true
        isActive = $true
        displayOrder = 0
        validationRules = $null
        allowedFileTypes = @("pdf", "doc", "docx", "jpg", "jpeg", "png")
        maxFileSize = 10485760
        autoExpiry = $true
        validityYears = 1
        expiryWarningDays = 7
    }
)

Write-Host "Starting migration of compliance document types..." -ForegroundColor Green
Write-Host "Total documents to migrate: $($complianceTypes.Count)" -ForegroundColor Cyan

$successCount = 0
$errorCount = 0

foreach ($docType in $complianceTypes) {
    try {
        Write-Host "Migrating: $($docType.name) ($($docType.key))" -ForegroundColor Yellow
        
        # Prepare the data for Strapi v5 format
        $payload = @{
            data = $docType
        }
        
        $jsonPayload = $payload | ConvertTo-Json -Depth 10
        
        # Send POST request to production
        $response = Invoke-WebRequest -Uri "$productionBaseUrl/compliance-document-types" `
                                    -Method POST `
                                    -ContentType "application/json" `
                                    -Body $jsonPayload
        
        if ($response.StatusCode -eq 200 -or $response.StatusCode -eq 201) {
            Write-Host "✓ Successfully migrated: $($docType.name)" -ForegroundColor Green
            $successCount++
        } else {
            Write-Host "✗ Failed to migrate: $($docType.name) (Status: $($response.StatusCode))" -ForegroundColor Red
            $errorCount++
        }
        
        # Small delay to avoid overwhelming the server
        Start-Sleep -Milliseconds 500
        
    } catch {
        Write-Host "✗ Error migrating $($docType.name): $($_.Exception.Message)" -ForegroundColor Red
        $errorCount++
    }
}

Write-Host "`nMigration Summary:" -ForegroundColor Cyan
Write-Host "Successful migrations: $successCount" -ForegroundColor Green
Write-Host "Failed migrations: $errorCount" -ForegroundColor Red

if ($errorCount -eq 0) {
    Write-Host "`nAll compliance document types migrated successfully!" -ForegroundColor Green
} else {
    Write-Host "`nSome migrations failed. Please check the errors above." -ForegroundColor Yellow
}
