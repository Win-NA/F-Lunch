# API Design

## Overview

Architecture Style:

RESTful API

Base URL

/api/v1

Response Format

```json
{
    "success": true,
    "message": "Success",
    "data": {}
}
```

Error Format

```json
{
    "success": false,
    "message": "Error message",
    "errors": []
}
```

---

# Authentication APIs

## Register

POST

/auth/register

Description

Create a new student account.

Request

```json
{
    "studentCode": "SE190001",
    "fullName": "Nguyen Van A",
    "email": "abc@fpt.edu.vn",
    "password": "123456"
}
```

Response

Student Profile

---

## Login

POST

/auth/login

Request

```json
{
    "email":"abc@fpt.edu.vn",
    "password":"123456"
}
```

Response

```json
{
    "accessToken":"",
    "refreshToken":"",
    "user":{}
}
```

---

## Logout

POST

/auth/logout

Require JWT

---

## Refresh Token

POST

/auth/refresh

---

# Student APIs

## Get Profile

GET

/student/profile

Require JWT

---

## Update Profile

PUT

/student/profile

Require JWT

---

## Create Receiving Request

POST

/request

Description

Student creates a food receiving request.

Request

```json
{
    "platform":"GrabFood",
    "restaurantName":"McDonald's",
    "orderCode":"GF123456",
    "driverName":"Nguyen A",
    "driverPhone":"0909xxxxxx",
    "pickupLocation":"Gate A",
    "expectedArrival":"2026-07-05T11:30:00"
}
```

Response

Receiving Request

---

## My Requests

GET

/request/my

Return all requests of current student.

---

## Request Detail

GET

/request/:id

---

## Cancel Request

PUT

/request/:id/cancel

Business Rule

Only CREATED request can be cancelled.

---

# Receiver APIs

## Get Available Requests

GET

/receiver/request

Return all waiting requests.

---

## Accept Request

POST

/receiver/request/:id/accept

Business Rules

- Receiver must be AVAILABLE.
- Request must be WAITING.

---

## Update Receiving Status

PUT

/receiver/request/:id/status

Status

WAITING

↓

ACCEPTED

↓

RECEIVED

↓

READY_FOR_PICKUP

↓

COMPLETED

---

## Complete Pickup

POST

/receiver/request/:id/complete

Description

Receiver confirms that student picked up food.

---

# Feedback APIs

## Create Feedback

POST

/feedback

Request

```json
{
    "requestId":"",
    "rating":5,
    "comment":"Very good."
}
```

---

## My Feedback

GET

/feedback/my

---

# Notification APIs

## Get Notifications

GET

/notification

---

## Mark As Read

PUT

/notification/:id/read

---

# Admin APIs

## Dashboard

GET

/admin/dashboard

Return

- Total Requests
- Active Receivers
- Completed Requests
- Revenue

---

## Users

GET

/admin/users

---

## Receivers

GET

/admin/receivers

---

## Requests

GET

/admin/requests

---

## Feedback

GET

/admin/feedback

---

# HTTP Status Code

200 OK

201 Created

204 No Content

400 Bad Request

401 Unauthorized

403 Forbidden

404 Not Found

409 Conflict

422 Validation Error

500 Internal Server Error

---

# API Security

JWT Authentication

Role Based Authorization

Request Validation

Rate Limiting

Password Hashing

CORS

Helmet

---

# Future APIs

Payment

Wallet

QR Verification

Realtime Tracking

Chat

Push Notification

Analytics