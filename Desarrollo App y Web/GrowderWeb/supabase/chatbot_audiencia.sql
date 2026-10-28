-- Audiencia de los documentos del chatbot: 'cliente' | 'interno' | 'ambos'
-- Ejecutar una vez en Supabase → SQL Editor.
-- Los documentos que ya existen quedan como 'ambos' para no cambiar el comportamiento actual;
-- revísalos en Admin → Gestión de IA y marca como "Solo equipo" los que sean internos.

alter table public.chatbot_documentos
  add column if not exists audiencia text not null default 'ambos';

alter table public.chatbot_documentos
  drop constraint if exists chatbot_documentos_audiencia_check;

alter table public.chatbot_documentos
  add constraint chatbot_documentos_audiencia_check
  check (audiencia in ('cliente', 'interno', 'ambos'));
