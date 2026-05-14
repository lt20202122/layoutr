-- Add label and composition to wireframe_blocks
alter table wireframe_blocks 
  add column if not exists label text,
  add column if not exists composition jsonb;

-- Backfill label from type for existing blocks
update wireframe_blocks set label = type where label is null;
