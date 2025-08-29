# Service Request Filtering Bug Fix

## Problem
Doctors were receiving service requests for all services, even if they didn't offer those specific services.

## Root Cause
In the `getAvailableRequests` method, the query `{ doctor: null }` was returning ALL unassigned requests to ALL doctors, regardless of service compatibility.

## Solution
Modified the query to:
1. Filter unassigned requests by services the doctor actually offers
2. Exclude requests the doctor has already declined
3. Maintain existing functionality for assigned requests

## Files Changed
- `/src/api/service-request/controllers/service-request.js`
- Method: `getAvailableRequests`

## Test Scenario
{
  "scenario": "Business requests 'General Consultation' service",
  "doctors": [
    {
      "id": 1,
      "name": "Dr. Smith",
      "services": [
        "General Consultation",
        "Emergency Care"
      ],
      "shouldSeeRequest": true,
      "reason": "Offers General Consultation service"
    },
    {
      "id": 2,
      "name": "Dr. Jones",
      "services": [
        "Cardiology",
        "Surgery"
      ],
      "shouldSeeRequest": false,
      "reason": "Does not offer General Consultation service"
    },
    {
      "id": 3,
      "name": "Dr. Brown",
      "services": [
        "General Consultation",
        "Pediatrics"
      ],
      "shouldSeeRequest": true,
      "reason": "Offers General Consultation service"
    }
  ],
  "beforeFix": "All 3 doctors would see the request",
  "afterFix": "Only Dr. Smith and Dr. Brown would see the request"
}

## Verification Steps
1. Restart Strapi server
2. Create service requests for different services
3. Check that doctors only see requests matching their services
4. Verify declined requests don't reappear
