# Business Rules

## Overview

F-Lunch is a food receiving platform.

F-Lunch does NOT sell food.

F-Lunch does NOT cook food.

F-Lunch does NOT deliver food.

Students continue ordering food using third-party delivery platforms such as:

- GrabFood
- ShopeeFood
- BeFood

F-Lunch only manages the process of receiving food on behalf of students inside the campus.

---

# Core Business Flow

Student

↓

Order food on GrabFood / ShopeeFood / BeFood

↓

Create Receiving Request

↓

Request enters WAITING status

↓

Receiver accepts request

↓

Receiver waits at pickup point

↓

Delivery driver arrives

↓

Receiver verifies order

↓

Receiver stores food safely

↓

Student receives notification

↓

Student picks up food

↓

Receiver confirms pickup

↓

Request completed

---

# Request Lifecycle

CREATED

↓

WAITING

↓

ACCEPTED

↓

RECEIVED

↓

READY_FOR_PICKUP

↓

COMPLETED

Possible alternative status

↓

CANCELLED

---

# Business Rule 1

Creating Request

Student must:

- Login
- Fill all required fields
- Select delivery platform
- Enter order code
- Enter expected arrival time

After successful creation:

Status = WAITING

---

# Business Rule 2

Accepting Request

Only receivers with status AVAILABLE may accept requests.

Once accepted:

Receiver becomes BUSY.

The request status changes to ACCEPTED.

Only one receiver may accept a request.

---

# Business Rule 3

Meeting Delivery Driver

Receiver verifies:

- Driver name
- Driver phone
- Order code

If verification fails:

Receiver must reject receiving the order.

---

# Business Rule 4

Receiving Food

Receiver marks request as RECEIVED.

System records:

Receiving Time

Receiver

Location

---

# Business Rule 5

Food Storage

Food must be stored at the designated pickup area.

Receiver must never leave food unattended.

Receiver must keep the food safe until pickup.

---

# Business Rule 6

Student Notification

Immediately after food is received:

System sends notification.

Example

"Your food has arrived.
Please collect it at Pickup Point A."

---

# Business Rule 7

Student Pickup

Student shows:

QR Code

or

Request ID

Receiver verifies.

After verification:

Status = COMPLETED

---

# Business Rule 8

Feedback

Only completed requests may receive feedback.

Each request allows only one feedback.

Rating range:

1 ~ 5

---

# Business Rule 9

Cancellation

Students may cancel requests only when status is:

CREATED

or

WAITING

After receiver accepts:

Cancellation is not allowed.

---

# Business Rule 10

Receiver Availability

AVAILABLE

↓

Accept Request

↓

BUSY

↓

Complete Request

↓

AVAILABLE

Receiver cannot manually change status while processing a request.

---

# Business Rule 11

Notification Events

Send notification when:

- Request created
- Receiver accepted
- Food received
- Ready for pickup
- Pickup completed
- Request cancelled

---

# Business Rule 12

Request Ownership

Students may only view their own requests.

Receivers may only update assigned requests.

Admins may view all requests.

---

# Business Rule 13

Editing Request

Students may edit requests only before acceptance.

Accepted requests become read-only.

Completed requests are immutable.

---

# Business Rule 14

Pickup Verification

Student provides:

QR Code

or

Unique Request ID

Receiver verifies identity before handing over food.

---

# Business Rule 15

Time Validation

Expected arrival time must be:

Later than current time.

Maximum:

3 hours ahead.

---

# Business Rule 16

Duplicate Requests

Students cannot create multiple active requests for the same order code.

Order code must be unique while active.

---

# Business Rule 17

Receiver Capacity (MVP)

One receiver may handle only one active request at a time.

Future versions may support multiple requests.

---

# Business Rule 18

Exception Handling

If delivery driver cancels:

Request becomes CANCELLED.

If student does not collect food within the allowed time:

Request remains READY_FOR_PICKUP.

Admin may review overdue requests manually.

---

# Business Rule 19

Data Validation

Student email must end with:

@fpt.edu.vn

Driver phone must be valid.

Expected arrival must be valid datetime.

Rating must be between 1 and 5.

---

# Business Rule 20

Audit Logging

System records:

Request creation

Request acceptance

Status changes

Pickup confirmation

Feedback submission

Logs cannot be modified.

---

# Future Business Rules

QR Pickup

Multiple Pickup Stations

Campus Locker

Real-time Driver Tracking

Shared Pickup

Wallet Payment

Reward Points

Multi-Campus Support

---

# AI Development Rules

AI must never transform F-Lunch into a food ordering platform.

AI must never generate restaurant management features.

AI must never generate menu management.

AI must never generate payment for food.

AI must focus only on food receiving workflow.

Every API must follow the request lifecycle.

Business rules take precedence over technical implementation.