begin;

create extension if not exists pgcrypto;

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text not null default '',
  role text not null default 'reader' check (role in ('reader', 'admin')),
  created_at timestamptz not null default now()
);

create table if not exists public.categories (
  id uuid primary key default gen_random_uuid(),
  name text not null unique check (char_length(trim(name)) between 2 and 80),
  description text not null default '',
  created_at timestamptz not null default now()
);

create table if not exists public.books (
  id uuid primary key default gen_random_uuid(),
  title text not null check (char_length(trim(title)) between 2 and 180),
  author text not null check (char_length(trim(author)) between 2 and 140),
  category_id uuid references public.categories(id) on delete set null,
  description text not null default '' check (char_length(description) <= 10000),
  cover_image_path text,
  pdf_file_path text,
  featured boolean not null default false,
  published boolean not null default false,
  allow_download boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.contact_messages (
  id uuid primary key default gen_random_uuid(),
  full_name text not null check (char_length(trim(full_name)) between 2 and 100),
  email text not null check (char_length(email) <= 254),
  subject text not null check (char_length(trim(subject)) between 2 and 160),
  message text not null check (char_length(trim(message)) between 10 and 4000),
  created_at timestamptz not null default now()
);

create index if not exists books_published_created_idx on public.books (published, created_at desc);
create index if not exists books_category_idx on public.books (category_id);
create index if not exists books_title_search_idx on public.books using gin (to_tsvector('simple', title || ' ' || author || ' ' || description));
create index if not exists contact_messages_created_idx on public.contact_messages (created_at desc);

create or replace function public.is_library_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.profiles p
    where p.id = (select auth.uid()) and p.role = 'admin'
  );
$$;
revoke all on function public.is_library_admin() from public;
grant execute on function public.is_library_admin() to anon, authenticated;

create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create or replace function public.handle_library_profile()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, full_name, role)
  values (new.id, coalesce(new.raw_user_meta_data ->> 'full_name', ''), 'reader')
  on conflict (id) do nothing;
  return new;
end;
$$;

 drop trigger if exists books_set_updated_at on public.books;
create trigger books_set_updated_at before update on public.books
for each row execute function public.set_updated_at();
drop trigger if exists on_auth_user_created_library_profile on auth.users;
create trigger on_auth_user_created_library_profile after insert on auth.users
for each row execute function public.handle_library_profile();

alter table public.profiles enable row level security;
alter table public.categories enable row level security;
alter table public.books enable row level security;
alter table public.contact_messages enable row level security;

grant select on public.profiles to authenticated;
grant select on public.categories to anon, authenticated;
grant insert, update, delete on public.categories to authenticated;
grant select on public.books to anon, authenticated;
grant insert, update, delete on public.books to authenticated;
grant insert on public.contact_messages to anon, authenticated;
grant select, delete on public.contact_messages to authenticated;

 drop policy if exists profiles_select_self_or_admin on public.profiles;
create policy profiles_select_self_or_admin on public.profiles for select to authenticated
using (id = (select auth.uid()) or (select public.is_library_admin()));
drop policy if exists categories_public_read on public.categories;
create policy categories_public_read on public.categories for select to anon, authenticated using (true);
drop policy if exists categories_admin_insert on public.categories;
create policy categories_admin_insert on public.categories for insert to authenticated with check ((select public.is_library_admin()));
drop policy if exists categories_admin_update on public.categories;
create policy categories_admin_update on public.categories for update to authenticated using ((select public.is_library_admin())) with check ((select public.is_library_admin()));
drop policy if exists categories_admin_delete on public.categories;
create policy categories_admin_delete on public.categories for delete to authenticated using ((select public.is_library_admin()));
drop policy if exists books_read_published_or_admin on public.books;
create policy books_read_published_or_admin on public.books for select to anon, authenticated using (published = true or (select public.is_library_admin()));
drop policy if exists books_admin_insert on public.books;
create policy books_admin_insert on public.books for insert to authenticated with check ((select public.is_library_admin()));
drop policy if exists books_admin_update on public.books;
create policy books_admin_update on public.books for update to authenticated using ((select public.is_library_admin())) with check ((select public.is_library_admin()));
drop policy if exists books_admin_delete on public.books;
create policy books_admin_delete on public.books for delete to authenticated using ((select public.is_library_admin()));
drop policy if exists contact_messages_public_submit on public.contact_messages;
create policy contact_messages_public_submit on public.contact_messages for insert to anon, authenticated with check (
  char_length(trim(full_name)) between 2 and 100 and char_length(email) between 3 and 254
  and position('@' in email) > 1 and char_length(trim(subject)) between 2 and 160
  and char_length(trim(message)) between 10 and 4000
);
drop policy if exists contact_messages_admin_read on public.contact_messages;
create policy contact_messages_admin_read on public.contact_messages for select to authenticated using ((select public.is_library_admin()));
drop policy if exists contact_messages_admin_delete on public.contact_messages;
create policy contact_messages_admin_delete on public.contact_messages for delete to authenticated using ((select public.is_library_admin()));

insert into public.categories (name, description) values
 ('Mathematics','Numbers, patterns, and practical problem-solving.'),
 ('English','Reading, writing, language, and communication.'),
 ('Science','Explore the natural world through curiosity and evidence.'),
 ('Computer Science','Computational thinking, programming, and digital ideas.'),
 ('Information Technology','Digital tools, information, and technology skills.'),
 ('History','People, places, and stories from the past.'),
 ('General Knowledge','A little more about the world around us.'),
 ('Literature','Stories, poetry, and thoughtful reading.'),
 ('Islamic Studies','Learning resources for Islamic studies.'),
 ('Other Educational Books','More useful learning across subjects.')
on conflict (name) do nothing;

insert into public.books (title,author,category_id,description,published,featured,allow_download)
select '[DEMO] A Gentle Introduction to Mathematics','kareemi_writes sample',c.id,'Illustrative sample entry. Replace with a rights-cleared book before publishing.',false,false,false from public.categories c where c.name='Mathematics'
on conflict do nothing;

insert into storage.buckets (id,name,public,file_size_limit,allowed_mime_types)
values ('book-covers','book-covers',true,5242880,array['image/jpeg','image/png','image/webp']),
       ('book-pdfs','book-pdfs',false,52428800,array['application/pdf'])
on conflict (id) do update set public=excluded.public,file_size_limit=excluded.file_size_limit,allowed_mime_types=excluded.allowed_mime_types;

create policy "Public can view covers for published books" on storage.objects for select to anon, authenticated
using (bucket_id='book-covers' and exists(select 1 from public.books b where b.cover_image_path=name and b.published=true));
create policy "Admins upload covers" on storage.objects for insert to authenticated
with check (bucket_id='book-covers' and (select public.is_library_admin()));
create policy "Admins update covers" on storage.objects for update to authenticated
using (bucket_id='book-covers' and (select public.is_library_admin())) with check (bucket_id='book-covers' and (select public.is_library_admin()));
create policy "Admins delete covers" on storage.objects for delete to authenticated
using (bucket_id='book-covers' and (select public.is_library_admin()));
create policy "Readers can view PDFs for published books" on storage.objects for select to anon, authenticated
using (bucket_id='book-pdfs' and exists(select 1 from public.books b where b.pdf_file_path=name and b.published=true));
create policy "Admins upload PDFs" on storage.objects for insert to authenticated
with check (bucket_id='book-pdfs' and (select public.is_library_admin()));
create policy "Admins update PDFs" on storage.objects for update to authenticated
using (bucket_id='book-pdfs' and (select public.is_library_admin())) with check (bucket_id='book-pdfs' and (select public.is_library_admin()));
create policy "Admins delete PDFs" on storage.objects for delete to authenticated
using (bucket_id='book-pdfs' and (select public.is_library_admin()));

commit;
