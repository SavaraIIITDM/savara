Apply this migration before using Google login:

```bash
npm run db:migrate
```

If your target DB already has legacy tables from Supabase public schema, this migration keeps existing data and rewires foreign keys to `public.users`.
