# Backend Architecture

## Overview

Framework

NestJS

Language

TypeScript

ORM

Prisma ORM

Database

PostgreSQL

Authentication

JWT

Validation

class-validator

API Documentation

Swagger

Package Manager

npm

---

# Architecture Pattern

The backend follows a layered architecture.

Request

↓

Controller

↓

Service

↓

Repository (Prisma)

↓

Database

Business logic must only exist inside Services.

Controllers must remain thin.

---

# Folder Structure

server/

├── src
│
├── auth
├── users
├── requests
├── receivers
├── notifications
├── feedback
├── admin
│
├── common
├── config
├── database
├── middleware
├── guards
├── interceptors
├── filters
├── decorators
├── utils
│
└── main.ts

---

# Module Rules

Each module contains

controller

service

dto

entity (optional)

repository

types

constants

Example

auth/

auth.controller.ts

auth.service.ts

auth.repository.ts

dto/

types/

constants/

---

# Controller Rules

Controllers only:

- Receive HTTP requests
- Validate request body
- Call service
- Return response

Controllers must NOT

- Access database
- Write business logic
- Perform calculations

---

# Service Rules

Services contain all business logic.

Responsibilities

- Validation
- Permission checking
- Business rules
- Call repository
- Return result

---

# Repository Rules

Repositories communicate with Prisma.

Responsibilities

- Query database
- Insert data
- Update data
- Delete data

Repositories must NOT contain business logic.

---

# DTO Rules

All request bodies must use DTOs.

Validation

class-validator

Example

CreateRequestDto

UpdateProfileDto

LoginDto

RegisterDto

---

# Exception Handling

Use HttpException.

Examples

BadRequestException

UnauthorizedException

ForbiddenException

ConflictException

NotFoundException

InternalServerErrorException

Never return raw database errors.

---

# Guards

JWT Guard

Protect authenticated routes.

Role Guard

Check permissions.

Owner Guard

Verify ownership.

Receiver Guard

Verify assigned receiver.

---

# Middleware

Logging

Request ID

Request Time

Future

Rate Limiting

---

# Filters

Global Exception Filter

Responsibilities

- Catch unexpected errors
- Return consistent response
- Hide internal details

---

# Interceptors

Response Formatting

Logging

Future

Caching

---

# Configuration

Use ConfigModule.

Never hardcode:

Secrets

URLs

API Keys

Database Credentials

---

# Validation

Enable ValidationPipe globally.

Whitelist

Transform

Forbid Unknown Fields

---

# Response Format

Success

{
    "success": true,
    "message": "...",
    "data": {}
}

Error

{
    "success": false,
    "message": "...",
    "error": {}
}

Keep response format consistent.

---

# Database Access

Only repositories access Prisma.

Never call Prisma inside:

Controllers

Services

Guards

Middleware

---

# Authentication Flow

Login

↓

Validate User

↓

Generate JWT

↓

Return Access Token

↓

Protected API

↓

JWT Guard

↓

Controller

---

# Logging

Log

- Login
- Logout
- Request Created
- Request Accepted
- Request Completed
- Errors

---

# Naming Convention

Controller

AuthController

Service

AuthService

Repository

AuthRepository

DTO

LoginDto

Entity

UserEntity

---

# API Versioning

/api/v1

Future

/api/v2

---

# Swagger

Generate automatically.

Document every endpoint.

Include

Description

Request

Response

Authentication

---

# Dependency Injection

Use NestJS Dependency Injection.

Never manually instantiate services.

Correct

constructor(
    private readonly authService: AuthService
)

Incorrect

const service = new AuthService()

---

# AI Development Rules

AI must generate modular code.

AI must keep controllers thin.

AI must place business logic in services.

AI must use repositories for database access.

AI must follow NestJS best practices.

AI must generate scalable modules.