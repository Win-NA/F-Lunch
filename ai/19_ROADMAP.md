# F-Lunch Development Roadmap

## Purpose

This roadmap defines the complete development plan for F-Lunch.

Every feature must follow the roadmap.

AI must never skip phases or implement future features before completing the current phase.

The primary goal is to build a working MVP first, then gradually expand.

---

# Project Vision

F-Lunch is a campus food receiving platform.

Students continue ordering food using:

- GrabFood
- ShopeeFood
- BeFood

F-Lunch only helps students receive food when they cannot leave class.

The project focuses on solving a real problem inside university campuses.

---

# Development Principles

Priority Order

1. Build MVP

↓

2. Validate with users

↓

3. Improve user experience

↓

4. Expand features

↓

5. Scale to other campuses

Never optimize before validation.

Never build features without user demand.

---

# Phase 1 — Project Setup

Objective

Prepare the development environment.

Tasks

- Create Git repository
- Configure project structure
- Setup React Native (Expo)
- Setup backend
- Setup database
- Configure Git workflow
- Configure AI Brain
- Prepare Figma UI

Deliverable

Development environment ready.

Status

Completed

---

# Phase 2 — MVP Core

Objective

Develop the minimum product that proves the idea.

Student Features

- Login
- Register
- Create receiving request
- View request status
- View notifications
- View request history
- Leave feedback

Receiver Features

- Login
- View available requests
- Accept request
- Mark food received
- Notify student
- Complete request

Admin Features

- Dashboard
- Manage users
- Manage receivers
- Manage requests
- View feedback

Deliverable

A complete food receiving workflow.

Priority

Highest

---

# MVP Workflow

Student Login

↓

Create Request

↓

Receiver Accepts

↓

Receiver Receives Food

↓

Student Receives Notification

↓

Student Picks Up Food

↓

Student Confirms Completion

↓

Feedback

This workflow must always work.

---

# Phase 3 — UX Improvement

Objective

Improve usability.

Features

- Better notifications
- Search requests
- Request filters
- Dark mode
- Better profile
- Improved loading
- Better animations
- Better empty states

Priority

Medium

---

# Phase 4 — Smart Features

Objective

Increase convenience.

Possible Features

- QR verification
- Campus pickup map
- Pickup timer
- Estimated arrival
- Favorite pickup points
- Push notification improvements

Only implement after MVP validation.

---

# Phase 5 — Expansion

Objective

Support more campuses.

Examples

FPT University

↓

HUTECH

↓

UTE

↓

UIT

↓

UEH

Database must support multiple campuses.

---

# Future Features

Possible

- Referral program
- Loyalty points
- Campus announcements
- Campus events
- AI support chatbot
- Analytics dashboard

Not required for MVP.

---

# Technical Milestones

Milestone 1

Project setup complete.

Milestone 2

Authentication complete.

Milestone 3

Database complete.

Milestone 4

API complete.

Milestone 5

Student module complete.

Milestone 6

Receiver module complete.

Milestone 7

Admin module complete.

Milestone 8

Testing complete.

Milestone 9

Beta release.

Milestone 10

Public release.

---

# MVP Acceptance Criteria

Authentication works.

Student can create request.

Receiver can accept request.

Receiver can mark food received.

Student receives notification.

Student can confirm pickup.

Feedback works.

Admin dashboard works.

No critical bugs.

---

# Priority Matrix

Critical

Authentication

Permissions

Create Request

Accept Request

Receive Food

Notifications

Database

API

High

History

Feedback

Profile

Search

Medium

Settings

Dark Mode

Statistics

Low

Animations

Themes

Achievements

---

# Release Plan

Alpha

Internal testing by Team 189.

Beta

Testing with selected FPT students.

Release Candidate

Bug fixing only.

Version 1.0

Public MVP.

---

# Success Metrics

Technical

- No critical bugs
- Stable API
- Responsive UI
- Fast loading

Business

- Number of users
- Number of requests
- Completion rate
- User satisfaction

Validation

- Students understand the workflow
- Students are willing to use the service
- Receivers can complete requests efficiently

---

# Risks

Low User Adoption

Mitigation

Conduct user interviews and surveys.

--------------------------------

Receiver Shortage

Mitigation

Recruit student collaborators.

--------------------------------

Notification Delay

Mitigation

Use Firebase Cloud Messaging.

--------------------------------

Incorrect Pickup

Mitigation

Use QR verification.

--------------------------------

Scalability Issues

Mitigation

Keep architecture modular.

---

# Out of Scope (Version 1)

The following are NOT included in the MVP:

- Food ordering
- Food payment
- Delivery driver management
- Restaurant management
- Food recommendations
- Loyalty program
- AI chatbot
- Campus-wide logistics

---

# AI Development Rules

AI must always build features according to the roadmap.

AI must not implement future features before the current phase is complete.

AI must prioritize a stable MVP over feature quantity.

Every completed phase must be tested before moving to the next.

---

# Definition of Done

A feature is considered complete only when:

✓ Code compiles successfully.

✓ Business rules are implemented.

✓ Permissions are correct.

✓ Validation is complete.

✓ API works correctly.

✓ UI follows the design system.

✓ Tests pass.

✓ Documentation is updated.

✓ Code is reviewed.

Only then may development proceed to the next feature.

---

# Final Goal

Build a simple, reliable, and scalable MVP that solves a real problem for students at FPT University.

Do not chase unnecessary features.

Solve one problem extremely well before expanding.