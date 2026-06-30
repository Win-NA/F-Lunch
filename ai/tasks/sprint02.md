# Sprint 02 — Core MVP

Version: 1.0

Duration:
Week 2

Goal:

Build the core business workflow of F-Lunch.

This sprint implements the Minimum Viable Product (MVP) that validates the idea of receiving food on behalf of students.

--------------------------------------------------

# Sprint Objective

At the end of Sprint 02 the project must support:

✓ Student creates a receiving request

✓ Receiver accepts a request

✓ Receiver confirms food received

✓ Student receives notification

✓ Student picks up food

✓ Pickup history is recorded

--------------------------------------------------

# Deliverables

Receiving Request Module

Receiver Module

Notification Module

Pickup Module

Dashboard

--------------------------------------------------

# Feature List

## 1. Student Dashboard

Status

TODO

Description

Create the student dashboard displaying:

- Active requests
- Request history
- Current request status
- Notifications

Acceptance Criteria

Students can view all requests and statuses.

--------------------------------------------------

## 2. Create Receiving Request

Status

TODO

Description

Students create a request after ordering from GrabFood, ShopeeFood or BeFood.

Required Information

- Platform
- Order Code
- Merchant Name
- Estimated Arrival Time
- Pickup Location
- Note (Optional)

Acceptance Criteria

A valid request is created successfully.

--------------------------------------------------

## 3. Request Management

Status

TODO

Description

Students can:

- View request
- Cancel request (before accepted)
- View request status

Status Flow

Pending

↓

Accepted

↓

Food Received

↓

Completed

↓

Cancelled

Acceptance Criteria

Status changes follow business rules.

--------------------------------------------------

## 4. Receiver Dashboard

Status

TODO

Description

Receiver can view:

Pending Requests

Accepted Requests

Completed Requests

Acceptance Criteria

Receiver dashboard updates in real time.

--------------------------------------------------

## 5. Accept Request

Status

TODO

Description

Receiver accepts one pending request.

Business Rules

One request can only have one receiver.

Acceptance Criteria

Duplicate acceptance is prevented.

--------------------------------------------------

## 6. Receive Food

Status

TODO

Description

Receiver confirms:

Food has been received.

Information stored:

Receive Time

Receiver

Photo (Optional)

Acceptance Criteria

Status changes to Food Received.

--------------------------------------------------

## 7. Notification Module

Status

TODO

Description

Notify student when:

Request Accepted

Food Received

Ready for Pickup

Acceptance Criteria

Notification appears immediately.

--------------------------------------------------

## 8. Pickup Confirmation

Status

TODO

Description

Student confirms pickup.

Receiver also confirms handover.

Acceptance Criteria

Request becomes Completed.

--------------------------------------------------

## 9. Pickup History

Status

TODO

Description

Store completed requests.

History includes:

Merchant

Platform

Date

Receiver

Status

Acceptance Criteria

History is searchable.

--------------------------------------------------

## 10. Receiver Statistics

Status

TODO

Description

Receiver can view:

Completed Requests

Average Response Time

Acceptance Criteria

Statistics update automatically.

--------------------------------------------------

# Business Rules

Students cannot edit accepted requests.

Only receivers can accept requests.

Only assigned receiver can confirm food received.

Completed requests are read-only.

Cancelled requests cannot be restored.

--------------------------------------------------

# Definition of Done

Sprint is complete only when:

Students create requests.

Receivers accept requests.

Receivers confirm receiving food.

Students receive notifications.

Students confirm pickup.

History is saved.

No business rule violations.

--------------------------------------------------

# Out of Scope

Admin Management

Analytics

Reports

Payment Gateway

QR Verification

Multi-campus Support

These belong to Sprint 03.

--------------------------------------------------

# AI Instructions

Implement features one by one.

Explain every new API.

Explain every database modification.

Follow project documentation.

Do not implement Sprint 03 features.

Wait for approval before continuing.