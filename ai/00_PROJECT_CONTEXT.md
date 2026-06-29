# F-Lunch Project Context

## Project Information

| Item | Description |
|------|-------------|
| Project Name | F-Lunch |
| Version | 1.0 |
| Project Type | Mobile Application |
| Domain | Campus Food Receiving Platform |
| Team | Team 189 |
| Organization | FPT University Ho Chi Minh Campus |

---

# Project Overview

F-Lunch is a campus food receiving platform designed specifically for university students.

The application **does not sell food**, **does not cook food**, and **does not replace existing food delivery platforms** such as GrabFood, ShopeeFood or BeFood.

Instead, F-Lunch helps students receive food that they have already ordered from third-party delivery applications when they are unable to leave class.

---

# Problem Statement

Many students experience difficulties receiving food during class hours.

Common situations include:

- Lecturers do not allow students to leave the classroom.
- Delivery drivers cannot enter academic buildings.
- Students miss delivery phone calls.
- Friends are unavailable to receive food on their behalf.
- Food becomes cold while waiting.

These situations lead to wasted food, cancelled orders and poor user experience.

---

# Proposed Solution

Students continue ordering food using existing delivery applications.

Examples include:

- GrabFood
- ShopeeFood
- BeFood

After placing an order, the student creates a receiving request inside F-Lunch.

The workflow is:

1. Student creates a receiving request.
2. A F-Lunch receiver accepts the request.
3. The receiver waits at the campus pickup location.
4. The delivery driver hands over the food.
5. The receiver verifies the order.
6. Food is safely stored.
7. Student receives a notification.
8. Student picks up the food later.

---

# Core Features

The MVP includes the following features:

- User authentication
- Create receiving request
- Receiver accepts request
- Order status tracking
- Push notifications
- QR Code verification
- Pickup confirmation
- Pickup history
- User feedback

---

# Out of Scope

F-Lunch will **NOT** implement the following:

- Food ordering
- Restaurant management
- Food delivery
- Cooking services
- Food payment processing
- Driver management
- Marketplace functionality

The application is designed only to support the food receiving process.

---

# Target Users

### Primary Users

- FPT University students

### Secondary Users

- Campus food receivers
- Administrators

### Future Expansion

- Other universities
- Office campuses
- Business parks

---

# Business Model

Students pay a small receiving fee for each successful request.

Estimated service fee:

- 2,000 VND
- 5,000 VND

Additional revenue sources may include:

- Premium subscriptions
- Partner promotions
- Campus advertising

---

# Minimum Viable Product (MVP)

The MVP workflow is intentionally simple.

```
Student Login
        │
        ▼
Create Receiving Request
        │
        ▼
Receiver Accepts Request
        │
        ▼
Driver Arrives
        │
        ▼
Receiver Confirms Food
        │
        ▼
Food Stored
        │
        ▼
Student Notification
        │
        ▼
Student Pickup
        │
        ▼
Feedback
```

The objective is to validate market demand before implementing advanced features.

---

# Project Goals

The primary objective is to validate whether students are willing to pay for a reliable campus food receiving service.

The MVP should:

- Solve a real problem.
- Be inexpensive to develop.
- Be easy to deploy.
- Collect user feedback quickly.
- Support future scalability.

---

# Product Vision

F-Lunch aims to become the standard campus food receiving platform for universities in Vietnam.

Rather than competing with food delivery companies, F-Lunch complements their services by solving the final campus pickup problem.

---

# AI Development Constraints

When generating code or proposing features, always follow these rules.

### Never transform F-Lunch into:

- GrabFood
- ShopeeFood
- BeFood
- A restaurant management system
- A food marketplace

### Always remember:

F-Lunch is a **Food Receiving Platform**.

It is **NOT** a Food Ordering Platform.