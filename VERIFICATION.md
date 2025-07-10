# Authentication and Verification in UBER-DOC

## Login Verification

The system now enforces verification checks for doctors and businesses:

1. **Doctors**: Doctors can only log in if their account has been verified by an administrator. 
   - Upon registration, a doctor account is created with `isVerified: false` by default.
   - An admin must approve the doctor's account in the admin dashboard.
   - Until verified, login attempts will show "Account not verified. Please wait for admin approval."

2. **Businesses**: Similarly, businesses can only log in after admin verification.
   - New business accounts are created with `isVerified: false`.
   - An admin must approve the business account before they can log in.
   - Unverified businesses will see an appropriate error message when attempting to log in.

3. **Administrators**: Admin accounts do not require verification as they are typically created directly by system operators.

## Verification Process

1. Administrators can see pending verifications in their dashboard.
2. The verification process includes checking credentials, licenses, and other provided information.
3. Once verified, the user receives access to their respective dashboard.

## Implementation Details

- The verification check happens on the server in the login controller before password validation.
- If a user is not verified, a 403 Forbidden response is returned with a descriptive message.
- Frontend login forms display user-friendly error messages for verification failures.
