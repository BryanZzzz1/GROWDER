-- Ejecutar completo en Supabase > SQL Editor

-- =========================================================
-- 1) FAVORITOS (individual por usuario)
-- =========================================================
create table if not exists public.favoritos (
  id          bigint generated always as identity primary key,
  user_id     uuid not null references auth.users(id) on delete cascade,
  idproducto  int  not null,
  created_at  timestamptz not null default now(),
  unique (user_id, idproducto)
);

alter table public.favoritos enable row level security;

drop policy if exists "favoritos_select_propios" on public.favoritos;
drop policy if exists "favoritos_insert_propios" on public.favoritos;
drop policy if exists "favoritos_delete_propios" on public.favoritos;

create policy "favoritos_select_propios" on public.favoritos
  for select using (auth.uid() = user_id);
create policy "favoritos_insert_propios" on public.favoritos
  for insert with check (auth.uid() = user_id);
create policy "favoritos_delete_propios" on public.favoritos
  for delete using (auth.uid() = user_id);

-- =========================================================
-- 2) NOTIFICACIONES (cambio de estado de pedidos)
-- =========================================================
create table if not exists public.notificaciones (
  id             bigint generated always as identity primary key,
  user_id        uuid not null references auth.users(id) on delete cascade,
  codigo_pedido  text,
  titulo         text not null,
  mensaje        text not null,
  leida          boolean not null default false,
  created_at     timestamptz not null default now()
);

create index if not exists notificaciones_user_idx on public.notificaciones (user_id, created_at desc);

alter table public.notificaciones enable row level security;

drop policy if exists "notif_select_propias" on public.notificaciones;
drop policy if exists "notif_update_propias" on public.notificaciones;
drop policy if exists "notif_delete_propias" on public.notificaciones;

create policy "notif_select_propias" on public.notificaciones
  for select using (auth.uid() = user_id);
create policy "notif_update_propias" on public.notificaciones
  for update using (auth.uid() = user_id);
create policy "notif_delete_propias" on public.notificaciones
  for delete using (auth.uid() = user_id);
-- (los INSERT los hace solo el trigger, que corre como SECURITY DEFINER)

-- Trigger: cuando cambia pedidos.estado se crea la notificación al dueño del pedido
create or replace function public.notificar_cambio_estado_pedido()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_msg text;
begin
  if new.estado is distinct from old.estado and new.usuario_id is not null then
    v_msg := case lower(coalesce(new.estado, ''))
      when 'pagado'      then 'Recibimos tu pago, estamos preparando tu pedido.'
      when 'pendiente'   then 'Tu pedido está pendiente de confirmación.'
      when 'en despacho' then 'Tu pedido va en camino.'
      when 'en camino'   then 'Tu pedido va en camino.'
      when 'recibido'    then 'Tu pedido fue entregado. ¡Que lo disfrutes!'
      when 'entregado'   then 'Tu pedido fue entregado. ¡Que lo disfrutes!'
      when 'cancelado'   then 'Tu pedido fue cancelado.'
      else 'El estado de tu pedido cambió a: ' || new.estado
    end;

    insert into public.notificaciones (user_id, codigo_pedido, titulo, mensaje)
    values (new.usuario_id, new.codigo_pedido, 'Pedido ' || coalesce(new.codigo_pedido, '#' || new.id) || ' — ' || new.estado, v_msg);
  end if;
  return new;
end;
$$;

drop trigger if exists trg_notificar_estado_pedido on public.pedidos;
create trigger trg_notificar_estado_pedido
  after update of estado on public.pedidos
  for each row execute function public.notificar_cambio_estado_pedido();

-- Realtime para que la app reciba la notificación al instante
alter publication supabase_realtime add table public.notificaciones;
