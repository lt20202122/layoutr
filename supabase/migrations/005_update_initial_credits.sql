-- Update default credits to 100
alter table user_profiles
alter column credits set default 100;

-- Update the trigger function to insert 100 credits
create or replace function create_user_profile()
returns trigger as $$
begin
  insert into user_profiles (id, credits)
  values (new.id, 100);
  return new;
end;
$$ language plpgsql security definer;

-- Update existing users who have 2000 credits to 100
-- This is based on the requirement that EVERY user should receive 100 credits,
-- and the assumption that 2000 was a mistake/rumor for new accounts.
update user_profiles
set credits = 100
where credits = 2000;
