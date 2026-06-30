# Authentication & Authorization

## Overview

Authentication Method

JWT (JSON Web Token)

Authorization

Role-Based Access Control (RBAC)

Password Encryption

bcrypt

Token Type

Access Token

Refresh Token

---

# User Roles

There are only three roles in MVP.

## Student

Can

- Register account
- Login
- Create receiving request
- View own requests
- Cancel own request
- View notifications
- Submit feedback
- Update profile

Cannot

- Accept requests
- View other students
- Access admin features

---

## Receiver

Receiver is also a student.

Additional permissions

Can

- View waiting requests
- Accept request
- Update request status
- Complete request
- View own receiving history

Cannot

- Delete requests
- Access admin dashboard

---

## Admin

Can

- View dashboard
- View all users
- View all requests
- View receiver statistics
- View feedback
- Manage announcements

Cannot

- Receive food
- Create receiving request

---

# Login Flow

Student

↓

Enter Email

↓

Enter Password

↓

Validate

↓

Generate JWT

↓

Generate Refresh Token

↓

Return Tokens

↓

Login Success

---

# Registration Flow

Student

↓

Student Code

↓

Full Name

↓

FPT Email

↓

Password

↓

Hash Password

↓

Save Database

↓

Login

---

# Password Rules

Minimum

8 characters

Must contain

Uppercase Letter

Lowercase Letter

Number

Special Character

Example

Password@123

Never store plaintext password.

Always hash using bcrypt.

---

# Email Rules

Only allow

@fpt.edu.vn

Example

abc@fpt.edu.vn

Reject

@gmail.com

@yahoo.com

@hotmail.com

Reason

Only FPT students can use MVP.

---

# JWT

Access Token

Expiration

1 hour

Contains

User ID

Role

Student Code

Refresh Token

Expiration

30 days

Stored securely

---

# Protected Routes

Require JWT

/profile

/request

/feedback

/receiver

/admin

Public Routes

/login

/register

/health

---

# Authorization Rules

Student

Only access own data.

Receiver

Can only update assigned request.

Admin

Can access all resources.

---

# Account Status

ACTIVE

Normal account.

INACTIVE

Cannot login.

SUSPENDED

Blocked by administrator.

---

# Logout

Remove Refresh Token

Invalidate Session

Return Success

---

# Forgot Password

Future Feature

Flow

Email

↓

OTP

↓

Verification

↓

Reset Password

---

# Refresh Token

Client sends Refresh Token.

↓

Server validates.

↓

Generate new Access Token.

↓

Return new Access Token.

---

# Security Rules

Use HTTPS only.

Never expose password.

Never expose Refresh Token in API response after login refresh.

Validate every request.

Rate limit login API.

Hash password using bcrypt.

Use Helmet middleware.

Enable CORS.

Sanitize inputs.

Prevent SQL Injection.

Prevent XSS.

Prevent CSRF where applicable.

---

# Session Rules

One user can login on multiple devices.

Future version may support session management.

---

# Middleware

Authentication Middleware

Authorization Guard

Validation Pipe

Logging Middleware

Exception Filter

---

# Future Authentication

Google Login

Microsoft Login

FPT SSO

Face ID

Fingerprint

OTP Login

---

# AI Development Rules

AI must never store plaintext passwords.

AI must always use bcrypt.

AI must implement JWT authentication.

AI must separate authentication from authorization.

AI must protect every private endpoint.

AI must validate JWT before executing business logic.