-- PULSO: database authorization is authoritative; browser role controls are never trusted.
create type public.app_role as enum ('resident_guest','municipal_officer','provincial_officer','administrator');
create table public.municipalities (name text primary key, psgc_code text not null unique check (psgc_code ~ '^[0-9]{10}$'));
create table public.barangays (psgc_code text primary key check (psgc_code ~ '^[0-9]{10}$'), name text not null, municipality text not null references public.municipalities(name), unique(psgc_code,municipality));
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text not null default 'Resident' check (length(display_name) between 1 and 150),
  role public.app_role not null default 'resident_guest',
  municipality text references public.municipalities(name),
  check ((role='municipal_officer' and municipality is not null) or (role<>'municipal_officer' and municipality is null))
);
create function public.current_app_role() returns public.app_role language sql stable security definer set search_path='' as $$
  select coalesce((select role from public.profiles where id=auth.uid()),'resident_guest'::public.app_role)
$$;
create function public.can_manage(p_municipality text) returns boolean language sql stable security definer set search_path='' as $$
  select exists(select 1 from public.profiles where id=auth.uid() and (role='provincial_officer' or (role='municipal_officer' and municipality=p_municipality)))
$$;
create function public.is_administrator() returns boolean language sql stable security definer set search_path='' as $$ select public.current_app_role()='administrator' $$;
create function public.handle_new_user() returns trigger language plpgsql security definer set search_path='' as $$
begin
  -- OAuth user metadata can supply a display name, never a trusted role or scope.
  insert into public.profiles(id,display_name) values(new.id,left(coalesce(nullif(new.raw_user_meta_data->>'full_name',''),'Resident'),150));
  return new;
end $$;
create trigger pulso_new_user after insert on auth.users for each row execute function public.handle_new_user();
insert into public.profiles(id,display_name) select id,left(coalesce(nullif(raw_user_meta_data->>'full_name',''),'Resident'),150) from auth.users on conflict(id) do nothing;

create table public.reports (
  id uuid primary key, client_report_id uuid not null unique, owner_id uuid not null references auth.users(id),
  reference_number text not null unique,
  municipality text not null references public.municipalities(name), barangay_code text not null, barangay text not null,
  category text not null check(category in ('flooding','blocked_road','landslide','fire','damaged_structure','power_outage','telecom_outage','water_sanitation','medical_welfare','missing_stranded','agriculture_damage','fisheries_damage','other_concern')),
  description text not null check(length(description) between 10 and 4000),
  latitude double precision not null check(latitude between 13.17 and 13.64),
  longitude double precision not null check(longitude between 121.78 and 122.18),
  location_source text not null check(location_source in ('gps','manual','legacy')),
  landmark text not null default '' check(length(landmark)<=250),
  urgency text not null check(urgency in ('routine','elevated','urgent','immediate_danger')),
  status text not null default 'received' check(status in ('received','under_verification','verified','assigned','action_in_progress','resolved','closed','rejected','duplicate')),
  public_update text not null default '' check(length(public_update)<=2000),
  livelihood_details jsonb check(livelihood_details is null or (jsonb_typeof(livelihood_details)='object' and octet_length(livelihood_details::text)<=2000)),
  observed_at timestamptz not null, created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
  foreign key(barangay_code,municipality) references public.barangays(psgc_code,municipality)
);
create index reports_owner on public.reports(owner_id);
create index reports_municipality_status on public.reports(municipality,status);
create table public.report_private (
  report_id uuid primary key references public.reports(id) on delete cascade,
  reporter_name text check(length(reporter_name)<=150), reporter_contact text check(length(reporter_contact)<=100)
);
create table public.report_reviews (
  report_id uuid primary key references public.reports(id) on delete cascade,
  verification jsonb, assignment jsonb, updated_by uuid not null references auth.users(id), updated_at timestamptz not null default now()
);
create table public.report_audit (
  id uuid primary key default gen_random_uuid(), report_id uuid not null references public.reports(id),
  municipality text not null references public.municipalities(name), actor_id uuid not null references auth.users(id),
  actor_role public.app_role not null, action text not null, previous_status text not null, new_status text not null,
  notes text not null default '' check(length(notes)<=4000), created_at timestamptz not null default now()
);
create index report_audit_municipality on public.report_audit(municipality);

create table public.facilities (
  id text primary key, municipality text not null references public.municipalities(name),
  payload jsonb not null check(jsonb_typeof(payload)='object' and payload->>'id'=id and payload->>'municipality'=municipality)
);
create function public.official_source_valid(p_issuer text,p_url text) returns boolean language sql immutable set search_path='' as $$
  select case p_issuer
    when 'PAGASA' then p_url ~ '^https://([a-z0-9-]+\.)*pagasa\.dost\.gov\.ph/'
    when 'PHIVOLCS' then p_url ~ '^https://([a-z0-9-]+\.)*phivolcs\.dost\.gov\.ph/'
    when 'NDRRMC' then p_url ~ '^https://([a-z0-9-]+\.)*ndrrmc\.gov\.ph/'
    else false end
$$;
create table public.official_advisories (
  id uuid primary key default gen_random_uuid(), status text not null default 'active' check(status in ('active','cancelled')), issuer text not null check(issuer in ('PAGASA','PHIVOLCS','NDRRMC')),
  source_url text not null check(length(source_url)<=2000 and public.official_source_valid(issuer,source_url)),
  title text not null check(length(title) between 5 and 200), content text not null check(length(content) between 10 and 10000),
  category text not null check(category in ('weather','evacuation','hazard')), severity text not null check(severity in ('info','warning','severe','emergency')),
  municipality text references public.municipalities(name), issued_at timestamptz not null, expires_at timestamptz,
  created_by uuid not null default auth.uid() references auth.users(id), created_at timestamptz not null default now(),
  check(expires_at is null or expires_at>issued_at)
);
create table public.system_config (key text primary key check(key in ('facility_notice','preparedness_notice')), value text not null check(length(value)<=2000), updated_at timestamptz not null default now());

alter table public.municipalities enable row level security;
alter table public.barangays enable row level security;
alter table public.profiles enable row level security;
alter table public.reports enable row level security;
alter table public.report_private enable row level security;
alter table public.report_reviews enable row level security;
alter table public.report_audit enable row level security;
alter table public.facilities enable row level security;
alter table public.official_advisories enable row level security;
alter table public.system_config enable row level security;

create policy public_municipalities on public.municipalities for select to anon,authenticated using(true);
create policy public_barangays on public.barangays for select to anon,authenticated using(true);
create policy own_profile_or_admin on public.profiles for select to authenticated using(id=auth.uid() or public.is_administrator());
create policy own_or_scoped_reports on public.reports for select to authenticated using(owner_id=auth.uid() or public.can_manage(municipality));
create policy own_or_scoped_contacts on public.report_private for select to authenticated using(exists(select 1 from public.reports r where r.id=report_id and (r.owner_id=auth.uid() or public.can_manage(r.municipality))));
create policy scoped_reviews_only on public.report_reviews for select to authenticated using(exists(select 1 from public.reports r where r.id=report_id and public.can_manage(r.municipality)));
create policy scoped_audit_only on public.report_audit for select to authenticated using(public.can_manage(municipality));
create policy public_facilities on public.facilities for select to anon,authenticated using(true);
create policy official_advisories_read on public.official_advisories for select to anon,authenticated using(true);
create policy official_advisories_insert on public.official_advisories for insert to authenticated with check(created_by=auth.uid() and ((public.current_app_role()='provincial_officer') or (municipality is not null and public.can_manage(municipality))));
create policy admin_config on public.system_config for select to authenticated using(public.is_administrator());

-- Intentionally a definer view: public users only see this explicit, sanitized projection.
-- Raw descriptions, reporter identifiers, contact information, verification notes and assignments never appear here.
create view public.public_incidents with (security_barrier=true) as
select id,reference_number,municipality,barangay,category,latitude,longitude,urgency,status,public_update,created_at,updated_at
from public.reports where status in ('verified','assigned','action_in_progress','resolved','closed');

revoke all on all tables in schema public from anon,authenticated;
grant usage on schema public to anon,authenticated;
grant select on public.municipalities,public.barangays,public.facilities,public.official_advisories,public.public_incidents to anon,authenticated;
grant select on public.profiles,public.reports,public.report_private,public.report_reviews,public.report_audit,public.system_config to authenticated;
grant insert (issuer,source_url,title,content,category,severity,municipality,issued_at,expires_at) on public.official_advisories to authenticated;

create function public.submit_report(p_report jsonb) returns jsonb language plpgsql security definer set search_path='' as $$
declare v_user uuid:=auth.uid(); v_id uuid; v_report public.reports; v_barangay public.barangays;
begin
  if v_user is null then raise exception 'Sign in before submitting to the server' using errcode='42501'; end if;
  if octet_length(p_report::text)>16000 then raise exception 'Report is too large'; end if;
  v_id:=(p_report->>'clientReportId')::uuid;
  if v_id is null then raise exception 'Missing client identifier'; end if;
  -- Serialize retries, including requests from separate tabs, before inspecting the existing row.
  perform pg_advisory_xact_lock(hashtextextended(v_id::text,0));
  select * into v_report from public.reports where client_report_id=v_id;
  if found then
    if v_report.owner_id<>v_user then raise exception 'Client identifier belongs to another account' using errcode='42501'; end if;
    return to_jsonb(v_report);
  end if;
  select * into v_barangay from public.barangays where psgc_code=p_report->>'barangayCode' and municipality=p_report->>'municipality';
  if not found then raise exception 'Invalid municipality or PSGC barangay'; end if;
  insert into public.reports(id,client_report_id,owner_id,reference_number,municipality,barangay_code,barangay,category,description,latitude,longitude,location_source,landmark,urgency,observed_at,livelihood_details)
  values(v_id,v_id,v_user,'PULSO-'||extract(year from now())::text||'-'||upper(replace(v_id::text,'-','')),v_barangay.municipality,v_barangay.psgc_code,v_barangay.name,
    p_report->>'category',btrim(p_report->>'description'),(p_report->>'lat')::double precision,(p_report->>'lng')::double precision,p_report->>'locationSource',coalesce(p_report->>'sitioOrLandmark',''),p_report->>'urgency',(p_report->>'observationTime')::timestamptz,nullif(p_report->'livelihoodDetails','null'::jsonb)) returning * into v_report;
  insert into public.report_private(report_id,reporter_name,reporter_contact) values(v_id,nullif(p_report->>'reporterName',''),nullif(p_report->>'reporterContact',''));
  insert into public.report_audit(report_id,municipality,actor_id,actor_role,action,previous_status,new_status) values(v_id,v_barangay.municipality,v_user,public.current_app_role(),'Report received','pending_sync','received');
  return to_jsonb(v_report);
end $$;

create function public.manage_report(p_report_id uuid,p_action text,p_data jsonb) returns jsonb language plpgsql security definer set search_path='' as $$
declare v_report public.reports; v_status text; v_verification jsonb; v_assignment jsonb;
begin
  select * into v_report from public.reports where id=p_report_id for update;
  if not found or not public.can_manage(v_report.municipality) then raise exception 'Report is outside your authorized municipality' using errcode='42501'; end if;
  if octet_length(p_data::text)>12000 then raise exception 'Action is too large'; end if;
  v_status:=v_report.status;
  if p_action in ('verify','duplicate') then
    if p_data->>'basis' not in ('field_check','official_source','second_report','phone_confirmation','photo_evidence') or p_data->>'basis' is null then raise exception 'Invalid verification basis'; end if;
    if p_data->>'confidence' not in ('low','medium','high') or p_data->>'confidence' is null then raise exception 'Invalid confidence'; end if;
    if p_data->>'severityAssessment' not in ('mild','moderate','severe','critical') or p_data->>'severityAssessment' is null then raise exception 'Invalid severity'; end if;
    if length(coalesce(p_data->>'internalNotes',''))>4000 then raise exception 'Notes are too long'; end if;
    if p_action='duplicate' then
      if not exists(select 1 from public.reports where id=(p_data->>'duplicateOfId')::uuid and id<>p_report_id and public.can_manage(municipality)) then raise exception 'Choose an accessible duplicate report'; end if;
    end if;
    v_status:=case when p_action='duplicate' then 'duplicate' else 'verified' end;
    v_verification:=jsonb_build_object('verifierName',(select display_name from public.profiles where id=auth.uid()),'verifierRole',public.current_app_role(),'verifierOffice',v_report.municipality,'verifiedAt',now(),'basis',p_data->>'basis','confidence',p_data->>'confidence','severityAssessment',p_data->>'severityAssessment','internalNotes',p_data->>'internalNotes','publicUpdate',p_data->>'publicUpdate','duplicateOfId',p_data->>'duplicateOfId');
    update public.reports set public_update=coalesce(p_data->>'publicUpdate','') where id=p_report_id;
  elsif p_action='assign' then
    if v_report.status not in ('verified','assigned','action_in_progress') then raise exception 'Verify this report before assignment'; end if;
    if length(coalesce(p_data->>'assignedTo','')) not between 2 and 150 or length(coalesce(p_data->>'actionRequired','')) not between 5 and 2000 then raise exception 'Enter an assignee and action'; end if;
    v_status:='assigned';v_assignment:=jsonb_build_object('assignedTo',p_data->>'assignedTo','assignedOffice',left(p_data->>'assignedOffice',150),'assignedAt',now(),'actionRequired',p_data->>'actionRequired');
  elsif p_action='status' then
    v_status:=p_data->>'status';
    if v_status is null or v_status not in ('under_verification','action_in_progress','resolved','closed','rejected') then raise exception 'Unsupported status transition'; end if;
    if v_status in ('action_in_progress','resolved','closed') and v_report.status not in ('verified','assigned','action_in_progress','resolved') then raise exception 'This incident must be verified first'; end if;
  else raise exception 'Unsupported officer action'; end if;
  insert into public.report_reviews(report_id,verification,assignment,updated_by) values(p_report_id,v_verification,v_assignment,auth.uid())
    on conflict(report_id) do update set verification=coalesce(excluded.verification,public.report_reviews.verification),assignment=coalesce(excluded.assignment,public.report_reviews.assignment),updated_by=auth.uid(),updated_at=now();
  update public.reports set status=v_status,updated_at=now() where id=p_report_id;
  insert into public.report_audit(report_id,municipality,actor_id,actor_role,action,previous_status,new_status,notes) values(p_report_id,v_report.municipality,auth.uid(),public.current_app_role(),p_action,v_report.status,v_status,coalesce(p_data->>'notes',''));
  return (select to_jsonb(r) from public.reports r where id=p_report_id);
end $$;

create function public.admin_set_role(p_user_id uuid,p_role public.app_role,p_municipality text default null) returns void language plpgsql security definer set search_path='' as $$
begin
  if not public.is_administrator() then raise exception 'Administrator access required' using errcode='42501'; end if;
  perform pg_advisory_xact_lock(1740);
  if p_role='municipal_officer' and not exists(select 1 from public.municipalities where name=p_municipality) then raise exception 'Choose a valid municipality'; end if;
  if p_role<>'municipal_officer' and p_municipality is not null then raise exception 'Only municipal officers have a municipality scope'; end if;
  if exists(select 1 from public.profiles where id=p_user_id and role='administrator') and p_role<>'administrator' and (select count(*) from public.profiles where role='administrator')<=1 then raise exception 'Cannot remove the last administrator'; end if;
  update public.profiles set role=p_role,municipality=p_municipality where id=p_user_id;
  if not found then raise exception 'User not found'; end if;
end $$;
create function public.set_system_config(p_key text,p_value text) returns void language plpgsql security definer set search_path='' as $$
begin
  if not public.is_administrator() then raise exception 'Administrator access required' using errcode='42501'; end if;
  insert into public.system_config(key,value) values(p_key,p_value) on conflict(key) do update set value=excluded.value,updated_at=now();
end $$;
create function public.publish_facility(p_facility jsonb) returns void language plpgsql security definer set search_path='' as $$
declare v_scope text:=p_facility->>'municipality';
begin
  if not public.can_manage(v_scope) then raise exception 'Officer scope does not allow this facility' using errcode='42501'; end if;
  if octet_length(p_facility::text)>10000 or length(coalesce(p_facility->>'name','')) not between 3 and 200 then raise exception 'Invalid facility'; end if;
  if not exists(select 1 from public.barangays where name=p_facility->>'barangay' and municipality=v_scope) then raise exception 'Choose a valid barangay'; end if;
  if (p_facility->>'lat')::double precision not between 13.17 and 13.64 or (p_facility->>'lng')::double precision not between 121.78 and 122.18 or p_facility->>'lat' is null or p_facility->>'lng' is null then raise exception 'Provide validated Marinduque coordinates'; end if;
  if (p_facility->>'capacity')::integer<0 or (p_facility->>'currentOccupancy')::integer<0 or p_facility->>'capacity' is null or p_facility->>'currentOccupancy' is null then raise exception 'Provide validated capacity and occupancy'; end if;
  if p_facility->>'contactNumber' is null or length(p_facility->>'contactNumber') not between 5 and 100 then raise exception 'Provide a public facility contact'; end if;
  if p_facility->>'verificationStatus'<>'verified' or p_facility->>'coordinateAccuracy'<>'surveyed' or p_facility->>'verificationStatus' is null or p_facility->>'coordinateAccuracy' is null then raise exception 'Explicit verification is required'; end if;
  if p_facility->>'sourceUrl' !~ '^https://[a-z0-9.-]+/' or p_facility->>'sourceUrl' is null then raise exception 'Provide an HTTPS source record'; end if;
  if exists(select 1 from public.facilities where id=p_facility->>'id' and municipality<>v_scope) then raise exception 'Cannot move a facility across municipality scopes'; end if;
  insert into public.facilities(id,municipality,payload) values(p_facility->>'id',v_scope,p_facility || jsonb_build_object('lastVerified',now())) on conflict(id) do update set payload=excluded.payload;
end $$;

-- Supabase otherwise grants function execution to PUBLIC by default.
revoke all on function public.handle_new_user() from public;
revoke all on function public.submit_report(jsonb),public.manage_report(uuid,text,jsonb),public.admin_set_role(uuid,public.app_role,text),public.set_system_config(text,text),public.publish_facility(jsonb) from public,anon;
grant execute on function public.submit_report(jsonb),public.manage_report(uuid,text,jsonb),public.admin_set_role(uuid,public.app_role,text),public.set_system_config(text,text),public.publish_facility(jsonb) to authenticated;
create view public.public_system_notices with (security_barrier=true) as select key,value from public.system_config;
grant select on public.public_system_notices to anon,authenticated;

-- Retractions preserve the source record and require a fresh, scoped human authorization.
create function public.retract_advisory(p_advisory_id uuid) returns void language plpgsql security definer set search_path='' as $$
declare v_municipality text;
begin
  select municipality into v_municipality from public.official_advisories where id=p_advisory_id for update;
  if not found or not ((v_municipality is not null and public.can_manage(v_municipality)) or public.current_app_role()='provincial_officer') then raise exception 'Advisory is outside your authorized scope' using errcode='42501'; end if;
  update public.official_advisories set status='cancelled' where id=p_advisory_id;
end $$;
revoke all on function public.retract_advisory(uuid) from public,anon;
grant execute on function public.retract_advisory(uuid) to authenticated;
