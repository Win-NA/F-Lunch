# UI Component Library

## Purpose

This document defines all reusable UI components used in F-Lunch.

AI must always reuse existing components before creating new ones.

Consistency is more important than speed.

---

# Design System

Style

Modern

Minimal

Student Friendly

Rounded Corner

Soft Shadow

Orange Theme

Light Mode First

Responsive

---

# Color Palette

Primary

#FF6B00

Secondary

#FF9F43

Success

#22C55E

Warning

#FACC15

Danger

#EF4444

Info

#3B82F6

Background

#F8F9FA

Card

#FFFFFF

Border

#E5E7EB

Title

#111827

Body

#4B5563

Caption

#9CA3AF

---

# Typography

Heading 1

32px

Bold

Heading 2

24px

Bold

Heading 3

20px

SemiBold

Body

16px

Regular

Small Text

14px

Caption

12px

---

# Border Radius

Small

8px

Medium

12px

Large

16px

Extra Large

24px

Button

16px

Card

16px

Input

12px

---

# Spacing

Extra Small

4px

Small

8px

Medium

16px

Large

24px

Extra Large

32px

Section

48px

---

# Shadows

Card

Soft Shadow

Modal

Medium Shadow

Floating Button

Large Shadow

Avoid heavy shadows.

---

# Layout Components

AppLayout

Purpose

Main application layout.

Contains

Header

Body

Bottom Navigation

Safe Area

--------------------------------

AuthLayout

Purpose

Login

Register

Forgot Password

--------------------------------

DashboardLayout

Purpose

Student dashboard

Receiver dashboard

Admin dashboard

---

# Navigation Components

Bottom Navigation

Top App Bar

Back Button

Drawer

Tab Navigation

Breadcrumb (Admin only)

---

# Buttons

Primary Button

Orange background

White text

Main actions

--------------------------------

Secondary Button

White background

Orange border

--------------------------------

Danger Button

Red

--------------------------------

Outline Button

Gray Border

--------------------------------

Icon Button

Icon Only

--------------------------------

Floating Action Button

Circular

Bottom Right

---

# Inputs

Text Input

Email Input

Password Input

Phone Input

OTP Input

Search Input

Text Area

Dropdown

Radio Group

Checkbox Group

Switch

Date Picker

Time Picker

---

# Cards

Food Request Card

Shows

Status

Pickup Time

Platform

Receiver

--------------------------------

Notification Card

--------------------------------

Feedback Card

--------------------------------

Profile Card

--------------------------------

Statistics Card

---

# Status Badge

Pending

Orange

Accepted

Blue

Received

Purple

Completed

Green

Cancelled

Red

---

# Dialog Components

Confirmation Dialog

Delete Dialog

Logout Dialog

Success Dialog

Error Dialog

Loading Dialog

---

# Loading Components

Loading Spinner

Loading Skeleton

Full Screen Loader

Button Loader

---

# Empty States

No Requests

No Notifications

No Feedback

No Search Result

No Internet

---

# Error States

404

403

500

Network Error

Permission Denied

Unexpected Error

---

# Notification Components

Toast

Snackbar

Banner

Success Alert

Warning Alert

Error Alert

---

# Avatar

Small

Medium

Large

Online Indicator

Role Badge

---

# Tables (Admin)

User Table

Request Table

Feedback Table

Receiver Table

Pagination

Sorting

Search

Filtering

---

# List Components

Request List

Notification List

Feedback List

User List

Receiver Queue

---

# QR Components

QR Display

QR Scanner

QR Verification Result

---

# Maps

Not included in MVP.

---

# Icons

Use Lucide React only.

Avoid mixing icon libraries.

---

# Animations

Fade In

Slide Up

Button Press

Loading Spinner

Avoid unnecessary animations.

---

# Responsive Rules

Support

Android

iOS

Tablet

Desktop Web (Future)

---

# Accessibility

Minimum touch size

44px

Readable font

High contrast

Accessible buttons

---

# Naming Convention

Component

PascalCase

Example

RequestCard.tsx

Button.tsx

NotificationCard.tsx

Hook

camelCase

Example

useNotification.ts

---

# Folder Structure

components

├── buttons

├── cards

├── dialogs

├── forms

├── inputs

├── layouts

├── loading

├── navigation

├── qr

├── tables

├── typography

└── common

---

# Reuse Rules

Before creating a component:

Search existing library.

Reuse whenever possible.

Never duplicate components with similar functionality.

---

# AI Development Rules

AI must always use this component library.

AI must never create duplicate buttons.

AI must never create duplicate cards.

AI must follow spacing rules.

AI must follow typography rules.

AI must follow color palette.

AI must prioritize consistency over creativity.
