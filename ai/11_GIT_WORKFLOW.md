# Git Workflow

## Overview

Git Strategy

GitHub Flow

Default Branch

main

Development Branch

develop

Feature Branch Naming

feature/<feature-name>

Bug Fix Branch

fix/<bug-name>

Hotfix Branch

hotfix/<issue>

---

# Branch Rules

Never develop directly on

main

Always create feature branches.

Example

feature/auth

feature/student-profile

feature/request

feature/receiver

feature/admin-dashboard

---

# Commit Convention

Use Conventional Commits.

Examples

feat(auth): implement JWT login

feat(request): create receiving request

feat(receiver): accept request

fix(auth): resolve login validation

fix(request): prevent duplicate order

style(ui): improve home screen

docs(api): update endpoint specification

refactor(service): simplify request service

test(auth): add login tests

---

# Pull Request Rules

Every feature branch

↓

Pull Request

↓

Review

↓

Merge into develop

↓

Merge develop into main

---

# Merge Strategy

Use Squash Merge.

Keep Git history clean.

---

# Versioning

v0.1.0

Project Initialized

v0.2.0

Authentication

v0.3.0

Receiving Request

v0.4.0

Receiver Module

v0.5.0

Notification

v0.6.0

Feedback

v1.0.0

MVP Release

---

# Folder Structure

client

server

docs

assets

---

# AI Agent Workflow

Step 1

Read all documentation inside /docs

↓

Step 2

Understand business rules

↓

Step 3

Generate architecture

↓

Step 4

Generate backend

↓

Step 5

Generate frontend

↓

Step 6

Run tests

↓

Step 7

Fix lint

↓

Step 8

Commit

---

# AI Commit Rules

AI must never modify unrelated files.

One feature

One commit

One pull request

Never generate huge commits.

---

# Branch Strategy

main

↓

develop

↓

feature/auth

↓

feature/request

↓

feature/profile

↓

feature/admin

↓

feature/notification

---

# Code Review Checklist

Business Rules Correct

Permission Correct

API Correct

Database Correct

Validation Complete

UI Consistent

Lint Passed

Build Passed

---

# Release Checklist

Backend Build

Frontend Build

Database Migration

Environment Variables

Deployment

Health Check

Testing

Tag Release

---

# AI Development Rules

AI must read every document before coding.

AI must never ignore Business Rules.

AI must follow Database Design.

AI must follow API Specification.

AI must follow UI Design.

AI must never invent features outside project scope.

AI must ask before changing architecture.