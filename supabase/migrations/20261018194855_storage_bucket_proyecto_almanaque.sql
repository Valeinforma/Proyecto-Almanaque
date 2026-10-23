-- ============================================================
-- Bucket público para las fotos del catálogo de TechFix Manager
-- ------------------------------------------------------------
-- El bucket StorageFix fue creado desde el dashboard de Supabase
-- por el usuario y esta migración lo deja documentado/idempotente
-- (si se vuelve a ejecutar, solo asegura que siga público).
--
-- Carpeta: imagenes/ (se crea sola con la primera subida:
--   imagenes/repuestos/<guid>.jpg · imagenes/servicios/<guid>.jpg)
--
-- Lectura: endpoint público de Storage (sin RLS que aplicar).
-- Escritura: solo desde el backend con la service key
-- (bypassea RLS); el navegador nunca toca Storage directamente.
-- ============================================================

insert into storage.buckets (id, name, public)
values ('StorageFix', 'StorageFix', true)
on conflict (id) do update set public = excluded.public;
