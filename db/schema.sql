-- Esquema de Flor de Loto Segovia en Neon (Postgres).
-- Se aplica una sola vez (todas las sentencias son idempotentes).

-- ───────── Catálogo ─────────
create table if not exists categories (
  id           text primary key check (id ~ '^[a-z]+$'),
  name         text not null,
  short        text not null,
  path         text not null unique check (path ~ '^/[a-z0-9-]+$'),
  title        text not null,
  description  text not null,
  intro        text not null,
  sort_order   int  not null default 0
);

create table if not exists products (
  id           uuid primary key default gen_random_uuid(),
  slug         text not null unique check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$' and char_length(slug) <= 80),
  category_id  text not null references categories(id),
  subcategory  text check (char_length(subcategory) <= 40),
  name         text not null check (char_length(name) between 2 and 120),
  description  text not null default '' check (char_length(description) <= 2000),
  composition  text[] not null default '{}',
  dimensions   text check (char_length(dimensions) <= 120),
  care         text[] not null default '{}',
  watering     text check (char_length(watering) <= 120),
  occasions    text[] not null default '{}',
  price        numeric(8,2) check (price is null or (price >= 0 and price < 100000)),
  published    boolean not null default true,
  featured     boolean not null default false,   -- aparece en «Los más pedidos» y en el collage de la portada
  sort_order   int not null default 0,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);
create index if not exists products_category_idx on products (category_id, published, sort_order);

create table if not exists product_images (
  id          uuid primary key default gen_random_uuid(),
  product_id  uuid not null references products(id) on delete cascade,
  position    int  not null default 0,
  alt         text check (char_length(alt) <= 200),
  mime        text not null default 'image/webp',
  data_full   bytea not null,   -- WebP hasta 1400 px de ancho
  data_thumb  bytea not null,   -- WebP de 640 px para listados
  created_at  timestamptz not null default now()
);
create index if not exists product_images_product_idx on product_images (product_id, position);

-- ───────── Administrador (una única cuenta) ─────────
create table if not exists admin_users (
  id             boolean primary key default true check (id),   -- fuerza una sola fila
  email          text not null check (email = lower(email)),
  password_hash  text not null,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);

create table if not exists admin_sessions (
  token_hash  text primary key,                                 -- sha256 del token; el token nunca se guarda
  expires_at  timestamptz not null,
  created_at  timestamptz not null default now(),
  ip          text,
  user_agent  text
);
create index if not exists admin_sessions_expires_idx on admin_sessions (expires_at);

-- Ventanas de límite de intentos (login y formulario de contacto).
create table if not exists rate_limits (
  key           text primary key,
  window_start  timestamptz not null default now(),
  count         int  not null default 0,
  locked_until  timestamptz
);

-- ───────── Formulario de contacto ─────────
create table if not exists contact_messages (
  id                uuid primary key default gen_random_uuid(),
  created_at        timestamptz not null default now(),
  kind              text not null check (kind in ('contacto', 'evento')),
  nombre            text not null check (char_length(nombre) between 2 and 100),
  email             text not null check (char_length(email) <= 160),
  telefono          text check (char_length(telefono) <= 20),
  asunto            text check (char_length(asunto) <= 140),
  tipo_evento       text check (char_length(tipo_evento) <= 40),
  fecha_evento      date,
  lugar             text check (char_length(lugar) <= 140),
  mensaje           text not null check (char_length(mensaje) between 10 and 3000),
  consentimiento    boolean not null check (consentimiento),
  consentimiento_at timestamptz not null,
  atendido          boolean not null default false
);
create index if not exists contact_messages_created_idx on contact_messages (created_at desc);

-- Conservación (RGPD): borrar mensajes atendidos de más de 12 meses.
-- delete from contact_messages where atendido and created_at < now() - interval '12 months';
