# How to launch SportPark (step by step)

These steps are written for Windows, since that's what this machine runs.

## 1. Start MySQL

The project expects a MySQL/MariaDB server (via XAMPP in dev).

1. Open the **XAMPP Control Panel**.
2. Click **Start** next to **MySQL**.
   - Alternatively, run `mysql_start.bat` if you have one set up.

## 2. Create the database (first time only)

Open a MySQL client (e.g. phpMyAdmin from XAMPP, or the `mysql` CLI) and run:

```sql
CREATE DATABASE sportpark CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

You only need to do this once, unless you drop the database later.

## 3. Set up environment variables (first time only)

1. Copy `.env.example` to a new file named `.env` in the project root.
2. Fill in the values:
   - `DATABASE_URL` — defaults to `mysql://root@localhost:3306/sportpark`, which matches a stock XAMPP install. Leave as-is unless your MySQL setup differs.
   - `ENCRYPTION_KEY` — generate one by running:
     ```bash
     node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
     ```
     Paste the output as the value.
   - `APP_ORIGIN` — leave as `http://localhost:5173` for local dev.
   - `NODE_ENV` — leave as `development`.

## 4. Install dependencies

From the project root (`c:\Users\sabi2\SportPark`):

```bash
npm install
```

(`bun install` also works if you use Bun — there's a `bun.lock` committed.)

## 5. Run database migrations and seed data

```bash
npm run db:migrate     # creates tables, generates the Prisma client
npm run db:seed        # adds sample events + a demo admin account
```

The seed command prints a demo admin login (email/password) in the terminal — save it, you'll need it to access `/admin`.

## 6. Start the app

```bash
npm run dev
```

Open your browser at **http://localhost:5173**.

- Public schedule: `http://localhost:5173/`
- Admin login: `http://localhost:5173/admin/login` (use the credentials printed by `npm run db:seed`)

## Other useful commands

| Command | What it does |
|---|---|
| `npm run build` | Production build → `dist/` |
| `npm run preview` | Preview the production build locally |
| `npm run lint` | Run ESLint |
| `npm run format` | Run Prettier |
| `npm run db:studio` | Opens Prisma Studio, a GUI for browsing/editing the database |
| `npm run db:generate` | Regenerate the Prisma client (rarely needed manually) |

## Troubleshooting

- **Can't connect to the database**: make sure MySQL is running in XAMPP and `DATABASE_URL` in `.env` matches your setup.
- **Prisma errors after pulling new changes**: re-run `npm run db:migrate` to apply any new migrations.
- **Forgot the admin password**: there's no reset flow yet — either re-run `npm run db:seed` or update the password hash directly in the `admins` table.
