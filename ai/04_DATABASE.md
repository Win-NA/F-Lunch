# Database Design

## Overview

Database: PostgreSQL

ORM: Prisma

Naming Convention:

- Table: PascalCase
- Column: camelCase
- Primary Key: id
- Foreign Key: xxxId

All timestamps use UTC.

---

# Entity Relationship

Student

↓

ReceivingRequest

↓

ReceiverAssignment

↓

PickupHistory

↓

Feedback

---

# Table: Student

Purpose

Store all student accounts.

Fields

id

UUID

Primary Key

studentCode

String

Unique

Example:

SE190001

fullName

String

email

String

Unique

Only accepts @fpt.edu.vn

phone

String

avatar

String

nullable

password

String

hashed

status

Enum

ACTIVE

INACTIVE

createdAt

DateTime

updatedAt

DateTime

Business Rules

- Student code unique.
- Email unique.
- Password always hashed.
- One student can create many receiving requests.

---

# Table: Receiver

Purpose

Store receiver information.

Fields

id

UUID

studentId

FK

currentStatus

AVAILABLE

BUSY

OFFLINE

rating

Float

completedOrders

Integer

createdAt

updatedAt

Business Rules

- One receiver belongs to one student.
- Receiver can accept multiple requests.
- Receiver can only accept requests while AVAILABLE.

---

# Table: ReceivingRequest

Purpose

Store food receiving requests.

Fields

id

UUID

studentId

FK

platform

Enum

GrabFood

ShopeeFood

BeFood

Other

orderCode

String

restaurantName

String

driverName

nullable

driverPhone

nullable

pickupLocation

String

expectedArrival

DateTime

status

Enum

CREATED

WAITING

ACCEPTED

RECEIVED

READY_FOR_PICKUP

COMPLETED

CANCELLED

createdAt

updatedAt

Business Rules

- One request belongs to one student.
- Request can only have one receiver.
- Completed request cannot be edited.

---

# Table: ReceiverAssignment

Purpose

Store which receiver accepted which request.

Fields

id

UUID

receiverId

FK

requestId

FK

acceptedAt

receivedAt

completedAt

Business Rules

- One assignment per request.
- Receiver cannot accept two active requests simultaneously (MVP).

---

# Table: PickupHistory

Purpose

Store pickup confirmation.

Fields

id

UUID

requestId

FK

pickupTime

confirmedBy

receiver

student

verificationMethod

QR

Manual

Business Rules

- Every completed request must have pickup history.

---

# Table: Feedback

Purpose

Store student feedback.

Fields

id

UUID

requestId

FK

studentId

FK

rating

1~5

comment

nullable

createdAt

Business Rules

- One feedback per request.

---

# Relationships

Student

1

↓

Many

ReceivingRequest

ReceivingRequest

1

↓

1

ReceiverAssignment

Receiver

1

↓

Many

ReceiverAssignment

ReceivingRequest

1

↓

1

PickupHistory

ReceivingRequest

1

↓

0..1

Feedback

---

# Future Tables

Notification

Payment

Wallet

Coupon

Campus

Building

Floor
