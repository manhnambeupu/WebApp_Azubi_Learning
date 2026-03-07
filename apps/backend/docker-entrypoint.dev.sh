#!/bin/sh
set -e

echo "⏳ Running Prisma generate..."
npx prisma generate

echo "⏳ Pushing database schema..."
npx prisma db push --skip-generate

echo "⏳ Seeding database..."
npx prisma db seed || echo "⚠️  Seed skipped (may already exist)"

echo "✅ Database ready. Starting dev server..."
exec npm run start:dev
