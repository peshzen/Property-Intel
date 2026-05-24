-- Demo seed data for local development.
insert into public.reports (id,user_id,address,city,county,state,zip,estimated_arv,upset_price,star_rating,report_data)
values ('11111111-1111-1111-1111-111111111111','00000000-0000-0000-0000-000000000000','123 Demo Ave','Austin','Travis','TX','78701',420000,285000,4,'{"summary":"Promising cash-flow candidate."}')
on conflict do nothing;
