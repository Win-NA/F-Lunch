# Database Safety & Anti-Data-Loss Rules

## 🛑 Strict Rules Against Data Loss

1. **NEVER run destructive database commands**:
   - DO NOT run `npx prisma db seed` without explicit user confirmation.
   - DO NOT run `npx prisma migrate reset` or `prisma db push --force-reset`.
   - DO NOT run raw SQL queries containing `DELETE FROM "User"`, `TRUNCATE`, or `DROP TABLE`.

2. **Use Non-Destructive Inserters / Upserts**:
   - Always use Prisma `upsert` or `findUnique` + conditional create instead of `deleteMany()`.
   - Protect live production/development data stored in Supabase/PostgreSQL.

3. **Seeding Strategy**:
   - `prisma/seed.ts` MUST use non-destructive `upsert` operations.
   - Existing active user accounts (`se180055ledonhatanh@gmail.com`, `anhldnse180055@fpt.edu.vn`, `nhatanh@gmail.com`) must be preserved at all times.
