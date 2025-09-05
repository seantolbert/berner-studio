-- Seed baseline templates for development/demo use.
-- Run locally via: supabase db reset (auto-runs this file)
-- Run remote via:  supabase db query < supabase/seed.sql

insert into public.templates (id, name, size, strip3_enabled, strips, "order") values
(
  'classic-two-strip',
  'Classic Two Strip',
  'regular',
  false,
  '[
    ["maple","walnut","maple","walnut","maple","walnut","maple","walnut","maple","walnut","maple","walnut"],
    ["walnut","maple","walnut","maple","walnut","maple","walnut","maple","walnut","maple","walnut","maple"],
    ["maple","maple","maple","maple","maple","maple","maple","maple","maple","maple","maple","maple"]
  ]'::jsonb,
  '[
    {"stripNo":1,"reflected":false},{"stripNo":2,"reflected":false},
    {"stripNo":1,"reflected":false},{"stripNo":2,"reflected":false},
    {"stripNo":1,"reflected":false},{"stripNo":2,"reflected":false},
    {"stripNo":1,"reflected":false},{"stripNo":2,"reflected":false},
    {"stripNo":1,"reflected":false},{"stripNo":2,"reflected":false},
    {"stripNo":1,"reflected":false},{"stripNo":2,"reflected":false},
    {"stripNo":1,"reflected":false},{"stripNo":2,"reflected":false}
  ]'::jsonb
)
on conflict (id) do nothing;

insert into public.templates (id, name, size, strip3_enabled, strips, "order") values
(
  'tri-tone',
  'Tri-Tone',
  'large',
  true,
  '[
    ["maple","maple","maple","maple","maple","maple","maple","maple","maple","maple","maple","maple","maple","maple"],
    ["walnut","walnut","walnut","walnut","walnut","walnut","walnut","walnut","walnut","walnut","walnut","walnut","walnut","walnut"],
    ["purpleheart","purpleheart","purpleheart","purpleheart","purpleheart","purpleheart","purpleheart","purpleheart","purpleheart","purpleheart","purpleheart","purpleheart","purpleheart","purpleheart"]
  ]'::jsonb,
  '[
    {"stripNo":1,"reflected":false},{"stripNo":2,"reflected":true},
    {"stripNo":3,"reflected":false},{"stripNo":1,"reflected":true},
    {"stripNo":2,"reflected":false},{"stripNo":3,"reflected":true},
    {"stripNo":1,"reflected":false},{"stripNo":2,"reflected":true},
    {"stripNo":3,"reflected":false},{"stripNo":1,"reflected":true},
    {"stripNo":2,"reflected":false},{"stripNo":3,"reflected":true},
    {"stripNo":1,"reflected":false},{"stripNo":2,"reflected":true},
    {"stripNo":3,"reflected":false},{"stripNo":1,"reflected":true}
  ]'::jsonb
)
on conflict (id) do nothing;

insert into public.templates (id, name, size, strip3_enabled, strips, "order") values
(
  'power-stripe',
  'Power Stripe',
  'regular',
  false,
  '[
    ["cherry","cherry","cherry","cherry","cherry","cherry","padauk","maple","padauk","cherry","cherry","cherry"],
    ["cherry","cherry","cherry","cherry","cherry","cherry","maple","padauk","maple","cherry","cherry","cherry"]
  ]'::jsonb,
  '[
    {"stripNo":1,"reflected":false},{"stripNo":2,"reflected":false},
    {"stripNo":1,"reflected":false},{"stripNo":2,"reflected":false},
    {"stripNo":1,"reflected":false},{"stripNo":2,"reflected":false},
    {"stripNo":1,"reflected":false},{"stripNo":2,"reflected":false},
    {"stripNo":2,"reflected":false},{"stripNo":1,"reflected":false},
    {"stripNo":2,"reflected":false},{"stripNo":1,"reflected":false},
    {"stripNo":2,"reflected":false},{"stripNo":1,"reflected":false}
  ]'::jsonb
)
on conflict (id) do nothing;

