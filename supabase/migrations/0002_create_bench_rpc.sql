-- RPC used by the "add bench" flow to safely construct the PostGIS geography point
create function public.create_bench(
  p_name text,
  p_description text,
  p_lat double precision,
  p_lng double precision,
  p_address text,
  p_district text,
  p_tags text[]
)
returns table (id uuid)
language plpgsql
as $$
declare
  new_id uuid;
begin
  insert into public.benches (name, description, location, address, district, tags, created_by)
  values (
    p_name,
    nullif(p_description, ''),
    st_setsrid(st_makepoint(p_lng, p_lat), 4326)::geography,
    nullif(p_address, ''),
    nullif(p_district, ''),
    coalesce(p_tags, '{}'),
    auth.uid()
  )
  returning benches.id into new_id;

  return query select new_id;
end;
$$;
