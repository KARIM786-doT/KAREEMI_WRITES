# kareemi_writes

A responsive static educational library built with HTML, CSS, and vanilla JavaScript. Supabase provides the live catalog, administrator authentication, contact form, and book storage. The static frontend has no build step and can be opened via `index.html` for offline/demo browsing or served from any static host.

## Local preview

Open `index.html` in Microsoft Edge to view the demo experience. In direct `file://` mode, browser security and Supabase CORS rules can prevent live API calls; use a local static server or deployed Vercel URL for live Supabase functionality. There is no frontend build command.

## Supabase setup

A connected Supabase project is provisioned for this workspace. The schema is in `supabase/schema.sql` and was applied to the connected project. It creates `profiles`, `categories`, `books`, and `contact_messages`, RLS policies, seeded categories, a clearly unpublished demo book, and the `book-covers` / private `book-pdfs` buckets.

1. `js/config.js` is configured with this connected project's URL and **publishable** key. The publishable key is intended for browser use; never put a service-role/secret key in browser code. If you deploy this project under another Supabase project, replace both public values.
2. Email/password authentication is enabled through Supabase Auth. Create the initial administrator account using the Supabase Auth user-management controls; there is no public registration form.
3. Find that account's UUID in the Auth users list. In the Supabase SQL editor, promote that specific account with: `update public.profiles set role = 'admin' where id = 'AUTH_USER_UUID';`. Do not expose admin role editing to the browser. Every new account is created as `reader` by a database trigger.
4. Confirm both storage buckets are present: `book-covers` is public for published covers, and `book-pdfs` is private. Policies restrict uploads/management to admins and PDF reads to published books. The reader requests short-lived signed URLs rather than storing public PDF links.
5. Contact messages are insert-only to visitors; only an authenticated administrator may read or delete them. Honeypot and input limits are included as basic spam controls. For a high-traffic deployment, put an edge/server-side rate limit in front of contact submission.

The admin pages are `login.html` and `admin/`. They verify the authenticated user and their database-controlled `profiles.role`, while database RLS remains the actual authorization boundary.

## Deploy to Vercel

1. Push this folder to a GitHub repository.
2. Import the repository into Vercel. Use the project root, no build command, and no output-directory override; Vercel serves the static HTML files directly.
3. Configure `js/config.js` with the public Supabase URL/key, then commit that browser configuration (it is public by design). Alternatively, inject those two public values at deploy time with your preferred static-file workflow.
4. Add your own deployment domain in Vercel's Domains settings and follow the displayed DNS records at your registrar. Replace `example.com` in `robots.txt` and `sitemap.xml` with the final domain.

`vercel.json` provides security headers and a report-only CSP baseline. Review CSP reports and any required third-party origins before switching to an enforcing policy.

## Included pages

Home, library/search, book details, PDF reader, categories, about, services, contact, admin login, and protected admin dashboard/book/category/message management. If Supabase credentials are placeholders, the home and library use clearly labeled illustrative demo books; data submission and admin actions do not pretend to work while disconnected.
