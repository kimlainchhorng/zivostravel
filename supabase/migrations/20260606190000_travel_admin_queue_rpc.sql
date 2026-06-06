-- Narrow Travel operations queue for the central Zivo Admin control plane.
-- Service-role only. Covers flight, hotel, rental car, and bus booking intents.

create or replace function public.zivo_travel_admin_queue(
  p_limit integer default 50
)
returns table (
  id text,
  customer text,
  product text,
  route text,
  status text,
  risk text,
  amount text,
  "lastUpdate" text
)
language sql
stable
security invoker
set search_path = public
as $$
  select
    coalesce(i.booking_reference, i.id::text) as id,
    coalesce(i.user_id::text, 'Guest checkout') as customer,
    case i.service_type
      when 'flight' then 'Flight'
      when 'hotel' then 'Hotel'
      when 'rental_car' then 'Rental Car'
      when 'bus' then 'Bus'
      else initcap(replace(i.service_type, '_', ' '))
    end as product,
    coalesce(
      nullif(trim(concat_ws(' -> ', nullif(i.origin, ''), nullif(i.destination, ''))), ''),
      nullif(i.result_title, ''),
      nullif(i.provider, ''),
      'Travel booking'
    ) as route,
    initcap(replace(i.status, '_', ' ')) as status,
    case
      when i.status in ('expired', 'cancelled') then 'High'
      when i.status in ('draft', 'pending_checkout') then 'Medium'
      else 'Low'
    end as risk,
    concat(i.currency, ' ', to_char(i.total, 'FM999999990.00')) as amount,
    to_char(coalesce(i.updated_at, i.created_at), 'Mon DD HH24:MI') as "lastUpdate"
  from public.zivo_travel_booking_intents i
  where i.status <> 'paid'
  order by
    case
      when i.status in ('expired', 'cancelled') then 1
      when i.status in ('draft', 'pending_checkout') then 2
      else 3
    end,
    coalesce(i.updated_at, i.created_at) desc
  limit least(greatest(coalesce(p_limit, 50), 1), 100);
$$;

revoke all on function public.zivo_travel_admin_queue(integer) from public;
grant execute on function public.zivo_travel_admin_queue(integer) to service_role;
