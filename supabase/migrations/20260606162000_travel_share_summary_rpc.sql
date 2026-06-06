-- Share-safe Travel summary for the ZivosMedia aggregation bridge.
-- This is conservative during bridge mode: it returns public service/catalog
-- readiness only until booking tables are moved into the Travel project.

create or replace function public.zivo_travel_share_summary(
  p_user_id uuid,
  p_limit integer default 10
)
returns jsonb
language plpgsql
stable
security invoker
set search_path = public
as $$
declare
  v_limit integer := least(greatest(coalesce(p_limit, 10), 1), 25);
  v_services jsonb := '[]'::jsonb;
  v_links jsonb := '[]'::jsonb;
begin
  if auth.uid() is null or auth.uid() <> p_user_id then
    return jsonb_build_object(
      'mode', 'unauthorized',
      'cards', '[]'::jsonb
    );
  end if;

  if to_regclass('public.zivo_travel_service_catalog') is not null then
    execute
      'select coalesce(jsonb_agg(to_jsonb(t)), ''[]''::jsonb)
       from (
         select *
         from public.zivo_travel_service_catalog
         limit $1
       ) t'
      using v_limit
      into v_services;
  end if;

  if to_regclass('public.zivo_travel_backend_links') is not null then
    execute
      'select coalesce(jsonb_agg(to_jsonb(t)), ''[]''::jsonb)
       from (
         select *
         from public.zivo_travel_backend_links
         limit $1
       ) t'
      using v_limit
      into v_links;
  end if;

  return jsonb_build_object(
    'mode', 'bridge_staging',
    'cards', jsonb_build_array(
      jsonb_build_object(
        'kind', 'travel_project_readiness',
        'service_catalog', v_services,
        'backend_links', v_links
      )
    )
  );
end;
$$;

revoke all on function public.zivo_travel_share_summary(uuid, integer) from public;
revoke all on function public.zivo_travel_share_summary(uuid, integer) from anon;
grant execute on function public.zivo_travel_share_summary(uuid, integer) to authenticated;
