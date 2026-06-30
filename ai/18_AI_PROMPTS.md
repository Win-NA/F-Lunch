# AI Development Prompt Rules

## Purpose

This document defines how AI should think before generating code for the F-Lunch project.

AI must follow these rules for every task.

The goal is to produce maintainable, consistent, scalable and production-ready code.

---

# AI Mindset

Before writing any code, AI must answer the following questions internally:

1. What problem am I solving?

2. Which existing module is responsible for this feature?

3. Does similar functionality already exist?

4. Can I reuse existing components?

5. What business rules apply?

6. What permissions are required?

7. What validations are required?

8. What edge cases exist?

9. How should this be tested?

10. Will this affect other modules?

Only after answering these questions should AI begin coding.

---

# Code Generation Workflow

Every feature must follow this order.

Step 1

Understand the requirement.

↓

Step 2

Read related documentation.

↓

Step 3

Locate affected modules.

↓

Step 4

Design the implementation.

↓

Step 5

Generate code.

↓

Step 6

Generate tests.

↓

Step 7

Review generated code.

↓

Step 8

Refactor if necessary.

↓

Step 9

Verify against business rules.

↓

Step 10

Finish.

---

# Required Output Structure

Whenever AI generates code, the response should include:

1. Requirement Summary

2. Technical Approach

3. Files to Create

4. Files to Modify

5. Database Changes

6. API Changes

7. Frontend Changes

8. Backend Changes

9. Validation Rules

10. Security Considerations

11. Test Cases

12. Final Code

---

# Coding Principles

AI must always write code that is:

Readable

Reusable

Modular

Maintainable

Type-safe

Documented

Testable

Scalable

Secure

---

# Before Creating New Files

AI must first search for existing files.

If a suitable file already exists,

modify it instead of creating duplicates.

---

# Before Creating New Components

Check existing components.

Reuse whenever possible.

Do not create:

Button2

RequestCardNew

NotificationCardV2

Use existing components.

---

# Business Rule Verification

Before implementing any feature, AI must verify:

Student permissions

Receiver permissions

Admin permissions

Authentication requirements

Database constraints

Notification logic

Status transitions

---

# Database Rules

AI must never modify the database schema without checking:

Existing relations

Foreign keys

Indexes

Cascade rules

Migration impact

Always generate migrations.

Never edit production tables manually.

---

# API Rules

Every API must include:

Authentication

Authorization

Validation

Error handling

Proper status codes

Logging

Response format

---

# UI Rules

UI must follow:

Color palette

Spacing

Typography

Component library

Responsive design

Accessibility

Never hardcode colors or spacing.

---

# Security Rules

Always validate input.

Never trust client data.

Never expose passwords.

Never expose JWT secrets.

Never expose internal IDs unnecessarily.

Always sanitize user input.

---

# Error Handling Rules

Never ignore exceptions.

Always provide meaningful error messages.

Log server errors.

Hide internal implementation details from users.

---

# Logging Rules

Log:

Authentication events

Errors

Request creation

Receiver actions

Admin actions

Do not log:

Passwords

Tokens

Sensitive personal information

---

# Performance Rules

Avoid unnecessary database queries.

Avoid duplicate API requests.

Use pagination.

Reuse components.

Lazy load when appropriate.

---

# Testing Rules

Every feature must include:

Unit tests

Integration tests

Validation tests

Permission tests

Critical business flow tests

---

# Documentation Rules

Whenever AI creates:

API

Database

Business Logic

Complex Function

AI must write comments explaining:

Purpose

Input

Output

Possible errors

---

# Refactoring Rules

If duplicated code exceeds two occurrences,

extract into:

Utility

Hook

Service

Helper

Component

Never duplicate business logic.

---

# Git Rules

Each feature should have:

One branch

One feature

One pull request

One clear commit history

---

# AI Self Review Checklist

Before finishing, AI must verify:

✓ Code compiles

✓ Types are correct

✓ Tests pass

✓ Business rules respected

✓ Permissions correct

✓ Validation complete

✓ No duplicated code

✓ Documentation updated

✓ UI consistent

✓ Security checked

---

# Things AI Must Never Do

Never invent business requirements.

Never create unnecessary features.

Never change project architecture.

Never remove existing functionality without instruction.

Never bypass authentication.

Never skip validation.

Never ignore error handling.

Never generate placeholder code for production.

Never leave TODO comments in completed features.

---

# Project Scope Reminder

F-Lunch is NOT:

- A food ordering platform
- A delivery service
- A payment gateway

F-Lunch IS:

- A campus food receiving platform
- A request management system
- A coordination tool between students and receivers

All generated code must respect this scope.

---

# Final Instruction

Quality is more important than speed.

Correctness is more important than cleverness.

Consistency is more important than creativity.

Every feature must align with the architecture, business rules, and project vision defined in the documentation.