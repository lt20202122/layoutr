-- Add plan column to user_profiles
alter table user_profiles add column plan text not null default 'free';
