-- Let the appearance preference follow the device by default. Rows keep
-- whatever they already chose; 'system' resolves to light or dark on the
-- client (lib/settings.ts → resolveAppearance).
alter table public.settings
  alter column appearance set default 'system';
