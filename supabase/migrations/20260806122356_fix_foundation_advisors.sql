drop index if exists public.profiles_onboarding_lookup_idx;

create policy "Service role manages rate-limit buckets"
on public.rate_limit_buckets
for all
to service_role
using (true)
with check (true);
