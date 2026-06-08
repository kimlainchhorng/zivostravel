-- Resolve duplicate Travel admin-queue RPCs by standardizing on
-- zivo_travel_admin_queue(p_limit integer), which is the function called by the
-- Zivo-Admin control plane and shipped in .env.example.
-- zivo_admin_travel_queue() was a parallel no-arg duplicate; it is unused at runtime.
drop function if exists public.zivo_admin_travel_queue();
