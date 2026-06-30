# Frontend Architecture

## Overview

Frontend Framework

Next.js 15

Language

TypeScript

UI Framework

Tailwind CSS

Component Library

shadcn/ui

State Management

Zustand

HTTP Client

Axios

Form Library

React Hook Form

Validation

Zod

Icons

Lucide React

Notifications

Sonner

---

# Folder Structure

client
│
├── app
├── components
├── features
├── hooks
├── layouts
├── lib
├── providers
├── services
├── stores
├── styles
├── types
├── utils
└── middleware.ts

---

# App Directory

app/

Contains:

- Routing
- Layout
- Page
- Loading
- Error
- Not Found

Use App Router.

---

# Components

components/

Contains reusable UI components.

Examples

Button

Input

Dialog

Badge

Avatar

Card

Navbar

Sidebar

Modal

Table

Pagination

---

# Features

features/

Each feature owns its own logic.

Example

features/

auth/

request/

receiver/

profile/

notification/

feedback/

admin/

---

# Services

services/

Responsible for API communication.

Example

auth.service.ts

request.service.ts

receiver.service.ts

notification.service.ts

---

# Stores

stores/

Global application state.

Example

auth.store.ts

notification.store.ts

theme.store.ts

---

# Hooks

hooks/

Reusable custom hooks.

Example

useAuth()

useRequest()

usePagination()

useNotification()

---

# Utils

utils/

Contains helper functions.

Example

formatDate()

formatCurrency()

generateQRCode()

validateEmail()

---

# Types

types/

Shared interfaces.

Example

User

Request

Notification

Feedback

Receiver

---

# API Layer

Never call Axios directly inside components.

Correct

Component

↓

Service

↓

Axios

↓

Backend

---

# Component Rules

One component

One responsibility

Keep components small.

Avoid files larger than 300 lines.

---

# State Management

Local State

useState

Feature State

Zustand

Server State

API

Never duplicate server data.

---

# Forms

Use React Hook Form.

Use Zod validation.

Never manually validate forms.

---

# Styling

Tailwind CSS only.

Avoid inline CSS.

Avoid custom CSS unless necessary.

Use responsive design.

---

# Responsive Breakpoints

Mobile

Tablet

Desktop

Large Desktop

UI must work on all devices.

---

# Authentication

JWT stored securely.

Protect private routes.

Redirect unauthenticated users to Login.

---

# Error Handling

Loading

Show Skeleton

Empty Data

Show Empty State

Error

Show Error Component

---

# Performance

Use lazy loading.

Use dynamic import when needed.

Optimize images.

Avoid unnecessary re-render.

---

# Naming Convention

Components

PascalCase

Example

StudentCard.tsx

Hooks

camelCase

Example

useAuth.ts

Stores

camelCase

Example

authStore.ts

---

# Page Structure

Page

↓

Layout

↓

Feature

↓

Component

↓

UI

---

# Reusable Principle

Before creating a new component:

Search existing components.

Reuse if possible.

Do not duplicate UI.

---

# AI Development Rules

AI must create reusable components.

AI must separate UI and business logic.

AI must never call APIs directly inside components.

AI must follow feature-based architecture.

AI must keep components clean and maintainable.