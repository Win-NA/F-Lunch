# Deployment Guide

## Overview

Environment

Development

Staging

Production

Deployment Strategy

Frontend

Vercel

Backend

Railway

Database

Supabase PostgreSQL

Image Storage

Cloudinary

---

# Project Structure

/client

Next.js

/server

NestJS

/database

Prisma

/docs

AI Context

---

# Development Environment

Requirements

Node.js

>=22

Package Manager

npm

Database

PostgreSQL

Recommended IDE

Visual Studio Code

---

# Environment Variables

Backend

PORT

DATABASE_URL

JWT_SECRET

JWT_REFRESH_SECRET

CLOUDINARY_CLOUD_NAME

CLOUDINARY_API_KEY

CLOUDINARY_API_SECRET

NODE_ENV

Frontend

NEXT_PUBLIC_API_URL

NEXT_PUBLIC_APP_NAME

NEXT_PUBLIC_CLOUDINARY_NAME

---

# Local Development

Start Database

↓

Run Backend

↓

Run Frontend

↓

Open Browser

---

Backend

http://localhost:3000

Frontend

http://localhost:3001

Swagger

http://localhost:3000/api

---

# Build Process

Backend

npm run build

Frontend

npm run build

---

# Deployment Flow

Developer

↓

GitHub

↓

Railway

↓

Backend

↓

Vercel

↓

Frontend

↓

Production

---

# CI/CD

Every push to

main

↓

Automatic Deployment

Feature Branch

↓

Manual Merge

---

# Database Migration

Development

prisma migrate dev

Production

prisma migrate deploy

Never modify production database manually.

---

# Logging

Development

Console Logger

Production

Structured Logger

Future

Winston

Pino

---

# Monitoring

Health Check Endpoint

GET

/health

Returns

Status

Version

Database Connection

Server Time

---

# Error Handling

Validation Error

400

Authentication Error

401

Permission Error

403

Business Error

409

Server Error

500

---

# Backup

Database

Daily Backup

Cloudinary

Cloud Backup

Source Code

GitHub

---

# Security

HTTPS

Enabled

Helmet

Enabled

CORS

Enabled

JWT

Enabled

Environment Variables

Never commit to Git

---

# Performance

Enable GZIP

Pagination

Lazy Loading

Database Index

Image Optimization

---

# Production Checklist

Environment Variables

Configured

Database Connected

Swagger Disabled

HTTPS Enabled

CORS Configured

Logging Enabled

Health Check Working

Cloudinary Connected

---

# AI Development Rules

AI must never hardcode secrets.

AI must always use environment variables.

AI must separate development and production configuration.

AI must never commit .env files.

AI must use Prisma migrations.

AI must generate Docker support only if requested.