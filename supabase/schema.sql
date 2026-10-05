-- Tabla para los mensajes del formulario de contacto y de presupuesto de eventos.
-- Ejecutar en Supabase → SQL Editor cuando se conecte la base de datos.

create table if not exists public.contact_messages (
  id               uuid primary key default gen_random_uuid(),
  created_at       timestamptz not null default now(),
  kind             text not null check (kind in ('contacto', 'evento')),
  nombre           text not null check (char_length(nombre) between 2 and 100),
  email            text not null check (char_length(email) <= 160),
  telefono         text check (char_length(telefono) <= 20),
  asunto           text check (char_length(asunto) <= 140),
  tipo_evento      text check (char_length(tipo_evento) <= 40),
  fecha_evento     date,
  lugar            text check (char_length(lugar) <= 140),
  mensaje          text not null check (char_length(mensaje) between 10 and 3000),
  consentimiento   boolean not null check (consentimiento),
  consentimiento_at timestamptz not null,
  atendido         boolean not null default false
);

-- RLS activado y sin políticas públicas: nadie puede leer ni escribir con la clave anónima.
-- Solo el servidor (clave service_role, guardada como variable de entorno) inserta filas.
alter table public.contact_messages enable row level security;

create index if not exists contact_messages_created_at_idx on public.contact_messages (created_at desc);

-- Conservación (RGPD): borrar mensajes atendidos de más de 12 meses.
-- Programarlo con pg_cron o revisarlo manualmente:
-- delete from public.contact_messages where atendido and created_at < now() - interval '12 months';
