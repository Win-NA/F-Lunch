# Database Schema Guide

## Purpose

This document defines the complete database design for F-Lunch.

All AI-generated database schemas, Prisma models, migrations, services, and APIs must follow this guide.

Business rules always take priority over implementation.

---

# Database Technology

Database

PostgreSQL

ORM

Prisma ORM

Primary Key

UUID

Timestamp

createdAt

updatedAt

Soft Delete

Not used in MVP

---

# Naming Convention

Tables

Plural

Examples

users

receiving_requests

notifications

feedbacks

Columns

camelCase

Examples

fullName

studentId

receiverId

pickupTime

Foreign Keys

xxxId

Example

studentId

receiverId

notificationId

---

# Entity Relationship

User

↓

Receiving Request

↓

Notification

↓

Feedback

---

# Table: users

Purpose

Store all system users.

Columns

id

UUID

Primary Key

fullName

String

Required

email

String

Unique

password

String

Hashed using bcrypt

phoneNumber

String

Optional

avatar

String

Optional

role

Enum

student

receiver

admin

status

Enum

active

inactive

createdAt

DateTime

updatedAt

DateTime

Business Rules

Email must be unique.

Password is always hashed.

Admin accounts are created manually.

Only active users can log in.

---

# Table: receiving_requests

Purpose

Store food receiving requests.

Columns

id

UUID

Primary Key

studentId

Foreign Key → users.id

receiverId

Foreign Key → users.id

Nullable

foodPlatform

Enum

GrabFood

ShopeeFood

BeFood

Other

orderCode

String

Required

pickupLocation

String

Default

FPT Main Gate

pickupTime

DateTime

status

Enum

PENDING

ACCEPTED

RECEIVED

COMPLETED

CANCELLED

note

String

Optional

createdAt

DateTime

updatedAt

DateTime

Business Rules

Student creates request.

Receiver accepts request.

One request has only one receiver.

Completed requests cannot be edited.

Cancelled requests cannot return to previous status.

---

# Request Status Flow

PENDING

↓

ACCEPTED

↓

RECEIVED

↓

COMPLETED

Alternative

PENDING

↓

CANCELLED

---

# Table: notifications

Purpose

Store user notifications.

Columns

id

UUID

Primary Key

userId

Foreign Key

title

String

message

String

type

Enum

SYSTEM

REQUEST

REMINDER

SUCCESS

WARNING

isRead

Boolean

Default

false

createdAt

DateTime

Business Rules

Notifications cannot be deleted in MVP.

Read status can be updated.

---

# Table: feedbacks

Purpose

Collect feedback after completed requests.

Columns

id

UUID

Primary Key

requestId

Foreign Key

studentId

Foreign Key

rating

Integer

Range

1~5

comment

String

Optional

createdAt

DateTime

Business Rules

Only completed requests can receive feedback.

One request can have only one feedback.

Rating must be between 1 and 5.

---

# Relationships

User

1

↓

N

Receiving Request

(Student)

--------------------------------

User

1

↓

N

Receiving Request

(Receiver)

--------------------------------

Receiving Request

1

↓

N

Notification

--------------------------------

Receiving Request

1

↓

1

Feedback

---

# Indexes

Users

email

Receiving Requests

studentId

receiverId

status

pickupTime

Notifications

userId

isRead

Feedbacks

requestId

---

# Enums

UserRole

STUDENT

RECEIVER

ADMIN

--------------------------------

UserStatus

ACTIVE

INACTIVE

--------------------------------

FoodPlatform

GRABFOOD

SHOPEEFOOD

BEFOOD

OTHER

--------------------------------

RequestStatus

PENDING

ACCEPTED

RECEIVED

COMPLETED

CANCELLED

--------------------------------

NotificationType

SYSTEM

REQUEST

REMINDER

SUCCESS

WARNING

---

# Cascade Rules

Delete User

Restricted

Delete Request

Restricted

Delete Feedback

Cascade with Request

Delete Notification

Restricted

---

# MVP Scope

Included

Users

Receiving Requests

Notifications

Feedback

Excluded

Payments

Wallet

Coupons

Chat

GPS Tracking

Order Grouping

Food Ordering

Restaurant Management

---

# Future Expansion

Receiver Schedule

Campus Pickup Points

Reward Points

Order Grouping

QR Pickup

Real-time Tracking

University Expansion

---

# Prisma Rules

Use UUID for all IDs.

Use Prisma Relations.

Never duplicate foreign keys.

Use Prisma Enums.

Use createdAt and updatedAt in every table.

Use @default(now()).

Use @updatedAt.

Never store plaintext passwords.

---

# Migration Rules

Every schema change requires a new migration.

Never modify old migrations.

Development

prisma migrate dev

Production

prisma migrate deploy

---

# AI Development Rules

AI must generate Prisma schema based only on this document.

AI must never invent new tables without approval.

AI must never remove existing relationships.

AI must always use enums defined here.

AI must keep database normalized.

AI must maintain referential integrity.

AI must generate migrations compatible with PostgreSQL.

Business Rules always override technical convenience.