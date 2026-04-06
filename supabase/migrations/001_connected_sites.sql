-- ============================================================================
-- vc-event-manager: Tier 2 connected sites schema
-- Run in Supabase SQL editor (Database → SQL Editor → New query)
-- ============================================================================

-- Enable pgsodium for symmetric encryption of WP app passwords at rest
-- (pgsodium is enabled by default on Supabase; Vault is the managed wrapper)
create extension if not exists pgsodium;

-- ----------------------------------------------------------------------------
-- Table: connected_sites
-- ----------------------------------------------------------------------------
create table if not exists public.connected_sites (
  id                        uuid            primary key default gen_random_uuid(),
  user_id                   uuid            not null references auth.users(id) on delete cascade,
  site_url                  text            not null,
  site_name                 text            not null,
  brand_logo_url            text,
  wp_username               text            not null,
  wp_app_password_encrypted text            not null,  -- ciphertext (base64) from pgsodium
  wp_app_password_nonce     text            not null,  -- per-row nonce (base64)
  created_at                timestamptz     not null default now(),
  updated_at                timestamptz     not null default now(),
  unique (user_id, site_url)
);

create index if not exists connected_sites_user_id_idx
  on public.connected_sites (user_id);

-- ----------------------------------------------------------------------------
-- updated_at trigger
-- ----------------------------------------------------------------------------
create or replace function public.tg_set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists set_updated_at on public.connected_sites;
create trigger set_updated_at
  before update on public.connected_sites
  for each row execute function public.tg_set_updated_at();

-- ----------------------------------------------------------------------------
-- Row Level Security — users can only read/write their own rows
-- ----------------------------------------------------------------------------
alter table public.connected_sites enable row level security;

drop policy if exists "connected_sites_select_own" on public.connected_sites;
create policy "connected_sites_select_own"
  on public.connected_sites for select
  using (auth.uid() = user_id);

drop policy if exists "connected_sites_insert_own" on public.connected_sites;
create policy "connected_sites_insert_own"
  on public.connected_sites for insert
  with check (auth.uid() = user_id);

drop policy if exists "connected_sites_update_own" on public.connected_sites;
create policy "connected_sites_update_own"
  on public.connected_sites for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "connected_sites_delete_own" on public.connected_sites;
create policy "connected_sites_delete_own"
  on public.connected_sites for delete
  using (auth.uid() = user_id);

-- ============================================================================
-- Encryption helpers (pgsodium Vault pattern)
-- ============================================================================
-- Create a named key once in Vault: Database → Vault → New key, name: "vc_wp_app_password_key"
-- Then grab its UUID and replace <KEY_ID> below, OR use a server-side Edge Function
-- to call these RPCs with service_role.

-- Encrypt RPC: call from an Edge Function (service_role) — never from client
create or replace function public.encrypt_wp_password(
  p_plaintext text,
  p_key_id    uuid
) returns table (ciphertext text, nonce text)
language plpgsql security definer as $$
declare
  v_nonce bytea := pgsodium.crypto_aead_det_noncegen();
  v_cipher bytea;
begin
  v_cipher := pgsodium.crypto_aead_det_encrypt(
    convert_to(p_plaintext, 'utf8'),
    convert_to('vc_wp_app_password', 'utf8'),  -- associated data / context
    p_key_id,
    v_nonce
  );
  return query select encode(v_cipher, 'base64'), encode(v_nonce, 'base64');
end;
$$;

-- Decrypt RPC: call from an Edge Function (service_role) — never from client
create or replace function public.decrypt_wp_password(
  p_ciphertext text,
  p_nonce      text,
  p_key_id     uuid
) returns text
language plpgsql security definer as $$
declare
  v_plain bytea;
begin
  v_plain := pgsodium.crypto_aead_det_decrypt(
    decode(p_ciphertext, 'base64'),
    convert_to('vc_wp_app_password', 'utf8'),
    p_key_id,
    decode(p_nonce, 'base64')
  );
  return convert_from(v_plain, 'utf8');
end;
$$;

revoke all on function public.encrypt_wp_password(text, uuid) from public, anon, authenticated;
revoke all on function public.decrypt_wp_password(text, text, uuid) from public, anon, authenticated;
-- Only service_role may invoke (used by Edge Functions)
grant execute on function public.encrypt_wp_password(text, uuid) to service_role;
grant execute on function public.decrypt_wp_password(text, text, uuid) to service_role;
