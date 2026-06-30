# Permission Matrix

## Overview

Authorization Model

Role-Based Access Control (RBAC)

Roles

- Student
- Receiver
- Admin

Permission Principle

Least Privilege

Users only receive the minimum permissions required.

---

# Student Permissions

## Profile

View Own Profile

✅ Allowed

Update Own Profile

✅ Allowed

Delete Account

❌ Not Allowed

View Other Student Profiles

❌ Not Allowed

---

## Receiving Request

Create Request

✅ Allowed

View Own Requests

✅ Allowed

Update Request

✅ Allowed

Only while status = CREATED

Cancel Request

✅ Allowed

Only while status = CREATED

Delete Request

❌ Not Allowed

View Other Student Requests

❌ Not Allowed

---

## Feedback

Create Feedback

✅ Allowed

Only after COMPLETED

Edit Feedback

❌ Not Allowed

Delete Feedback

❌ Not Allowed

---

## Notification

View Own Notifications

✅ Allowed

Mark Notification As Read

✅ Allowed

Delete Notification

❌ Not Allowed

---

# Receiver Permissions

Receiver inherits all Student permissions.

Additional Permissions

---

## Request

View Waiting Requests

✅ Allowed

Accept Request

✅ Allowed

Only if Receiver Status = AVAILABLE

Update Request Status

✅ Allowed

Only assigned request

Reject Request

❌ MVP does not support

Transfer Request

❌ MVP does not support

Cancel Assigned Request

❌ Not Allowed

---

## Pickup

Confirm Food Received

✅ Allowed

Generate QR Verification

Future Feature

Complete Pickup

✅ Allowed

Only after student arrives

---

## History

View Own Receiving History

✅ Allowed

View Other Receiver History

❌ Not Allowed

---

# Admin Permissions

Dashboard

✅ Full Access

Users

View Users

✅ Allowed

Create User

❌ Not Required

Update User Status

✅ Allowed

Delete User

❌ Not Allowed

---

Requests

View All Requests

✅ Allowed

Search Requests

✅ Allowed

Filter Requests

✅ Allowed

Update Request

❌ Not Allowed

Delete Request

❌ Not Allowed

---

Receiver

View All Receivers

✅ Allowed

Enable Receiver

✅ Allowed

Disable Receiver

✅ Allowed

View Receiver Statistics

✅ Allowed

---

Feedback

View All Feedback

✅ Allowed

Export Feedback

Future Feature

Delete Feedback

❌ Not Allowed

---

Announcement

Create Announcement

✅ Allowed

Update Announcement

✅ Allowed

Delete Announcement

✅ Allowed

---

# Permission Matrix

| Feature | Student | Receiver | Admin |
|----------|---------|----------|-------|
| Register | ✅ | ✅ | ❌ |
| Login | ✅ | ✅ | ✅ |
| View Profile | ✅ Own | ✅ Own | ✅ All |
| Update Profile | ✅ Own | ✅ Own | ✅ |
| Create Request | ✅ | ❌ | ❌ |
| View Waiting Requests | ❌ | ✅ | ✅ |
| Accept Request | ❌ | ✅ | ❌ |
| Update Request Status | ❌ | ✅ Assigned | ❌ |
| Complete Pickup | ❌ | ✅ | ❌ |
| Feedback | ✅ Own | ❌ | ✅ View |
| Notifications | ✅ Own | ✅ Own | ✅ |
| Dashboard | ❌ | ❌ | ✅ |

---

# Business Permission Rules

Rule 1

Students can only access their own requests.

---

Rule 2

Receivers can only update requests assigned to them.

---

Rule 3

Admin cannot impersonate students.

---

Rule 4

Completed requests become read-only.

---

Rule 5

Cancelled requests cannot be reactivated.

---

Rule 6

Only AVAILABLE receivers may accept new requests.

---

Rule 7

One active assignment per receiver in MVP.

---

Rule 8

Feedback is only allowed after pickup is completed.

---

# Route Protection

Public

/auth/login

/auth/register

/health

---

Student

/profile

/request

/history

/feedback

/notification

---

Receiver

/receiver

/receiver/history

---

Admin

/admin

/admin/users

/admin/dashboard

/admin/receivers

/admin/feedback

---

# Guard Mapping

JWT Guard

Protect all private APIs.

Role Guard

Check user role.

Owner Guard

Ensure student owns the resource.

Receiver Guard

Ensure receiver owns assigned request.

Admin Guard

Restrict admin-only routes.

---

# Validation Rules

Students cannot modify completed requests.

Receivers cannot receive two active requests simultaneously.

Admins cannot change request ownership.

---

# Future Permissions

Campus Manager

Building Manager

Support Staff

Multi-Campus Admin

---

# AI Development Rules

AI must always implement authorization checks before business logic.

AI must never trust client-provided user IDs.

AI must always obtain the authenticated user from the JWT.

AI must validate ownership before returning private resources.

AI must deny access by default unless explicitly permitted.