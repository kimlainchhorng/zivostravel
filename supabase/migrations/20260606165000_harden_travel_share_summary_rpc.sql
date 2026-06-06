-- Harden the Travel bridge RPC so anonymous callers cannot execute it.
-- The function also checks auth.uid(), but explicit grants keep the API surface small.

revoke all on function public.zivo_travel_share_summary(uuid, integer) from public;
revoke all on function public.zivo_travel_share_summary(uuid, integer) from anon;
grant execute on function public.zivo_travel_share_summary(uuid, integer) to authenticated;
