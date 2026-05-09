-- 0002_seed_locations.sql
-- Generated from src/db/seeds/agencies.ts by scripts/generate-seed-sql.ts.
-- Do not edit by hand. Re-run `npm run db:gen-seed` after changing the seed.
-- Source-of-truth count: 18 rows.

INSERT INTO locations (
  key, name, category, hotline, address, url, opening_hours,
  multilingual_blurb, latitude, longitude, walking_directions,
  active, source, updated_at
) VALUES ('hdb_essential_maintenance', 'HDB Essential Maintenance Service Unit', 'housing', '1800-225-5432', NULL, NULL, '24 hours for essential maintenance', '{"en":"For urgent HDB estate maintenance issues such as lift faults and water leaks.","zh-Hans":"处理紧急组屋维修问题，例如电梯故障和漏水。"}', NULL, NULL, NULL, 1, 'seed', '2026-05-09T00:00:00+08:00');
INSERT INTO locations (
  key, name, category, hotline, address, url, opening_hours,
  multilingual_blurb, latitude, longitude, walking_directions,
  active, source, updated_at
) VALUES ('hdb_branch_office', 'HDB Branch Office (general enquiries)', 'housing', '1800-225-5432', NULL, NULL, 'Mon–Fri 8am–5pm', '{"en":"General HDB matters: rental, upgrading, mailbox, common-area issues.","zh-Hans":"组屋一般事务：租赁、提升、信箱与公共区域问题。"}', NULL, NULL, NULL, 1, 'seed', '2026-05-09T00:00:00+08:00');
INSERT INTO locations (
  key, name, category, hotline, address, url, opening_hours,
  multilingual_blurb, latitude, longitude, walking_directions,
  active, source, updated_at
) VALUES ('lta_customer_service', 'Land Transport Authority Customer Service', 'transport', '1800-225-5582', NULL, NULL, 'Mon–Fri 8.30am–6.30pm, Sat 8.30am–1pm', '{"en":"Bus, MRT, taxi and concession-card matters.","zh-Hans":"公交、地铁、德士与乐龄卡相关事宜。"}', NULL, NULL, NULL, 1, 'seed', '2026-05-09T00:00:00+08:00');
INSERT INTO locations (
  key, name, category, hotline, address, url, opening_hours,
  multilingual_blurb, latitude, longitude, walking_directions,
  active, source, updated_at
) VALUES ('transport_aid_silver_generation', 'Silver Generation Transport Aid', 'transport', NULL, NULL, NULL, NULL, '{"en":"Subsidised transport help for medical appointments through SGO and partner agencies.","zh-Hans":"通过乐龄助理处与合作机构提供的就医交通资助。"}', NULL, NULL, NULL, 1, 'seed', '2026-05-09T00:00:00+08:00');
INSERT INTO locations (
  key, name, category, hotline, address, url, opening_hours,
  multilingual_blurb, latitude, longitude, walking_directions,
  active, source, updated_at
) VALUES ('aic_eldercare_hotline', 'Agency for Integrated Care Hotline', 'healthcare', '1800-650-6060', NULL, NULL, 'Mon–Fri 8.30am–8.30pm, Sat 8.30am–4pm', '{"en":"Information on home care, community care, day care and senior support services.","zh-Hans":"查询居家护理、社区护理、日间护理与乐龄支援服务。"}', NULL, NULL, NULL, 1, 'seed', '2026-05-09T00:00:00+08:00');
INSERT INTO locations (
  key, name, category, hotline, address, url, opening_hours,
  multilingual_blurb, latitude, longitude, walking_directions,
  active, source, updated_at
) VALUES ('scdf_emergency', 'SCDF Emergency Ambulance', 'healthcare', '995', NULL, NULL, '24 hours', '{"en":"Medical emergencies and ambulance dispatch. Call only for genuine emergencies.","zh-Hans":"医疗紧急情况与救护车调派。仅在真正紧急时拨打。"}', NULL, NULL, NULL, 1, 'seed', '2026-05-09T00:00:00+08:00');
INSERT INTO locations (
  key, name, category, hotline, address, url, opening_hours,
  multilingual_blurb, latitude, longitude, walking_directions,
  active, source, updated_at
) VALUES ('police_non_emergency', 'Singapore Police Non-Emergency', 'legal', '1800-255-0000', NULL, NULL, '24 hours', '{"en":"Non-urgent police matters. For emergencies dial 999.","zh-Hans":"非紧急警务事项。如有紧急情况请拨999。"}', NULL, NULL, NULL, 1, 'seed', '2026-05-09T00:00:00+08:00');
INSERT INTO locations (
  key, name, category, hotline, address, url, opening_hours,
  multilingual_blurb, latitude, longitude, walking_directions,
  active, source, updated_at
) VALUES ('legal_aid_bureau', 'Legal Aid Bureau', 'legal', '1800-325-1424', NULL, NULL, 'Mon–Fri 8.30am–5pm', '{"en":"Civil legal aid for those who qualify on means and merits.","zh-Hans":"为符合经济与案件条件的居民提供民事法律援助。"}', NULL, NULL, NULL, 1, 'seed', '2026-05-09T00:00:00+08:00');
INSERT INTO locations (
  key, name, category, hotline, address, url, opening_hours,
  multilingual_blurb, latitude, longitude, walking_directions,
  active, source, updated_at
) VALUES ('family_service_centre', 'Family Service Centre (nearest branch)', 'social_services', NULL, NULL, NULL, NULL, '{"en":"Counselling, family support and social services. Refer to nearest FSC.","zh-Hans":"辅导、家庭支援与社会服务。可前往最靠近的家庭服务中心。"}', NULL, NULL, NULL, 1, 'seed', '2026-05-09T00:00:00+08:00');
INSERT INTO locations (
  key, name, category, hotline, address, url, opening_hours,
  multilingual_blurb, latitude, longitude, walking_directions,
  active, source, updated_at
) VALUES ('silver_generation_office', 'Silver Generation Office', 'social_services', '1800-650-6060', NULL, NULL, NULL, '{"en":"Outreach and information for seniors on schemes and benefits.","zh-Hans":"为乐龄居民提供计划与福利的资讯与上门关怀。"}', NULL, NULL, NULL, 1, 'seed', '2026-05-09T00:00:00+08:00');
INSERT INTO locations (
  key, name, category, hotline, address, url, opening_hours,
  multilingual_blurb, latitude, longitude, walking_directions,
  active, source, updated_at
) VALUES ('comcare_hotline', 'ComCare Hotline', 'financial_assistance', '1800-222-0000', NULL, NULL, 'Mon–Fri 8.30am–6pm, Sat 8.30am–1pm', '{"en":"Financial assistance for low-income individuals and families.","zh-Hans":"为低收入个人与家庭提供经济援助。"}', NULL, NULL, NULL, 1, 'seed', '2026-05-09T00:00:00+08:00');
INSERT INTO locations (
  key, name, category, hotline, address, url, opening_hours,
  multilingual_blurb, latitude, longitude, walking_directions,
  active, source, updated_at
) VALUES ('cpf_senior_hotline', 'CPF Senior Helpline', 'financial_assistance', '1800-227-1188', NULL, NULL, 'Mon–Fri 8am–5.30pm', '{"en":"CPF withdrawals, retirement payouts and Medisave matters.","zh-Hans":"公积金提款、退休金与保健储蓄相关事宜。"}', NULL, NULL, NULL, 1, 'seed', '2026-05-09T00:00:00+08:00');
INSERT INTO locations (
  key, name, category, hotline, address, url, opening_hours,
  multilingual_blurb, latitude, longitude, walking_directions,
  active, source, updated_at
) VALUES ('peoples_association', 'People''s Association (Community Centre)', 'elderly_activity', '6225-5322', NULL, NULL, NULL, '{"en":"Senior activities, courses and Community Centre programmes.","zh-Hans":"乐龄活动、课程与民众俱乐部项目。"}', NULL, NULL, NULL, 1, 'seed', '2026-05-09T00:00:00+08:00');
INSERT INTO locations (
  key, name, category, hotline, address, url, opening_hours,
  multilingual_blurb, latitude, longitude, walking_directions,
  active, source, updated_at
) VALUES ('active_ageing_centre', 'Active Ageing Centre (nearest branch)', 'elderly_activity', NULL, NULL, NULL, NULL, '{"en":"Drop-in centres for seniors offering activities, befriending and light support.","zh-Hans":"乐龄活动中心，提供活动、陪伴与轻度支援服务。"}', NULL, NULL, NULL, 1, 'seed', '2026-05-09T00:00:00+08:00');
INSERT INTO locations (
  key, name, category, hotline, address, url, opening_hours,
  multilingual_blurb, latitude, longitude, walking_directions,
  active, source, updated_at
) VALUES ('skillsfuture_singapore', 'SkillsFuture Singapore', 'digital_help', '6785-5785', NULL, NULL, 'Mon–Fri 9am–6pm', '{"en":"Digital and skills training, including senior-friendly courses.","zh-Hans":"数码与技能培训，包括乐龄友善课程。"}', NULL, NULL, NULL, 1, 'seed', '2026-05-09T00:00:00+08:00');
INSERT INTO locations (
  key, name, category, hotline, address, url, opening_hours,
  multilingual_blurb, latitude, longitude, walking_directions,
  active, source, updated_at
) VALUES ('sg_digital_office_seniors_go_digital', 'Seniors Go Digital', 'digital_help', NULL, NULL, NULL, NULL, '{"en":"1-on-1 help with mobile apps, Singpass and government e-services.","zh-Hans":"提供手机应用、Singpass与政府电子服务的一对一指导。"}', NULL, NULL, NULL, 1, 'seed', '2026-05-09T00:00:00+08:00');
INSERT INTO locations (
  key, name, category, hotline, address, url, opening_hours,
  multilingual_blurb, latitude, longitude, walking_directions,
  active, source, updated_at
) VALUES ('mp_meet_the_people_session', 'MP Meet-the-People Session', 'mp_meet_the_people', NULL, NULL, NULL, 'Weekly, varies by constituency', '{"en":"Weekly session where residents can request help from their elected MP.","zh-Hans":"每周一次的接见居民活动，可向民选议员寻求协助。"}', NULL, NULL, NULL, 1, 'seed', '2026-05-09T00:00:00+08:00');
INSERT INTO locations (
  key, name, category, hotline, address, url, opening_hours,
  multilingual_blurb, latitude, longitude, walking_directions,
  active, source, updated_at
) VALUES ('rc_visit', 'Residents'' Committee Visit', 'rc_visit', NULL, NULL, NULL, NULL, '{"en":"Local Residents'' Committee volunteers can follow up on neighbourhood and welfare matters.","zh-Hans":"居民委员会志工可跟进社区与福利相关事宜。"}', NULL, NULL, NULL, 1, 'seed', '2026-05-09T00:00:00+08:00');
