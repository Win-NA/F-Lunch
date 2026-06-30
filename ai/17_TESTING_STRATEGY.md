# Testing Strategy

## Purpose

This document defines how F-Lunch is tested.

Testing is mandatory for every new feature.

AI must always generate tests together with production code.

Never create a feature without considering testing.

---

# Testing Goals

Ensure

- Correct functionality
- Stable business logic
- Safe refactoring
- Reliable API
- Good user experience

---

# Testing Pyramid

                E2E
             Integration
            Unit Testing

Priority

1. Unit Test

2. Integration Test

3. End-to-End Test

---

# Testing Types

## Unit Test

Purpose

Test a single function.

Examples

- Validate email

- Calculate request status

- QR verification

- Permission checker

- Notification formatter

No database.

No API.

No network.

---

## Integration Test

Purpose

Verify multiple modules work together.

Examples

Student

↓

Create Request

↓

Database

↓

Receiver Accept

↓

Notification Sent

---

## End-to-End Test

Purpose

Simulate a real user.

Examples

Student Login

↓

Create Request

↓

Receiver Login

↓

Accept Request

↓

Receive Food

↓

Student Pickup

↓

Leave Feedback

---

# What Must Be Tested

Authentication

Authorization

API

Database

Business Rules

Validation

Notification

UI State

Error Handling

---

# Authentication Tests

Student Login

Receiver Login

Admin Login

Wrong Password

Invalid Email

Expired Session

Logout

Refresh Token

Unauthorized Access

---

# Authorization Tests

Student

Cannot access Admin API.

Receiver

Cannot manage users.

Admin

Can manage everything.

---

# Business Rule Tests

Student cannot accept requests.

Receiver cannot modify users.

Completed request cannot be edited.

Cancelled request cannot become completed.

QR can only be scanned once.

Duplicate request is rejected.

---

# Validation Tests

Email

Password

Phone Number

Request Note

Pickup Location

Required Fields

Maximum Length

Minimum Length

---

# API Tests

Every endpoint must verify

Status Code

Response Body

Validation

Authorization

Database Change

Error Response

---

# UI Tests

Loading State

Error State

Empty State

Success State

Disabled Button

Retry Button

Navigation

---

# Notification Tests

Request Accepted

Request Received

Ready For Pickup

Completed

Cancelled

---

# Database Tests

Create

Update

Delete

Read

Soft Delete

Transaction

Rollback

---

# Error Tests

400

401

403

404

409

422

429

500

---

# Performance Tests

API Response

Target

<500ms

Database Query

<200ms

Login

<2 seconds

Screen Load

<3 seconds

---

# Security Tests

SQL Injection

XSS

CSRF

JWT Validation

Permission Check

Password Hash

Sensitive Data Exposure

---

# Mobile Tests

Small Screen

Medium Screen

Large Screen

Portrait

Landscape

Slow Internet

Offline Mode (Future)

---

# Browser Tests

Chrome

Edge

Firefox

Safari

---

# Test Naming Convention

Unit

shouldCreateRequest()

shouldRejectDuplicateRequest()

shouldValidateEmail()

Integration

student_can_create_request()

receiver_can_accept_request()

E2E

complete_food_receiving_flow()

---

# Mocking Rules

Mock

Firebase

Email

Notification

Third-party API

Never mock

Business Logic

Validation

Permission

---

# Test Folder Structure

tests

├── unit

├── integration

├── e2e

├── mocks

└── fixtures

---

# Code Coverage

Minimum

80%

Business Logic

90%

Critical Flow

100%

Authentication

100%

Permission

100%

QR Verification

100%

---

# MVP Critical Flow

Student Login

↓

Create Request

↓

Receiver Accept

↓

Receiver Receive Food

↓

Student Pickup

↓

Leave Feedback

This entire flow must always pass before release.

---

# Regression Testing

Whenever fixing a bug

1. Reproduce bug

2. Write test

3. Fix bug

4. Run tests

5. Verify no regression

Never fix a bug without adding a test.

---

# AI Testing Rules

AI must always generate

Unit Test

before finishing Business Logic.

AI must always test

API

Validation

Permission

Business Rules

AI must never leave TODO tests.

AI must never skip tests because of time.

Testing is considered part of feature development.

No feature is complete until all required tests pass.