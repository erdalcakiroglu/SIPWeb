# SQL Performance Intelligence™ Backend

Authentication and license server backend for the [SQL Performance Intelligence™](https://sqlperformance.ai) desktop application.

## Features

- Login, registration, email activation, and account page
- SQLite storage in `data/SQLPerf.db`
- Trial license API
- Short-lived activation-code API
- Device-bound commercial activation API
- Token refresh and deactivation API
- `.lic` export API for offline delivery
- Ed25519-signed `SPAI1` license tokens
- **Admin License Management**: Create, update, and manage customer licenses
- **License Expiration Control**: Set and modify license expiration dates
- **License Status Management**: Update license status (active, suspended, trial_active, revoked, expired)
- **Per-Customer License Quota**: Admins can set maxLicenses limit per customer

## Project Overview

This backend provides a comprehensive licensing and authentication system for the SQL Performance Intelligence desktop application. It handles:

1. **User Management**: Registration, login, email verification, password recovery, and account management
2. **License Management**: Trial licenses, commercial license activation via activation codes, device-bound licensing, and license validation
3. **Admin Panel**: Administrative interface for managing users, licenses, and system configuration
4. **Security**: Rate limiting, secure password hashing (

