/**
 * Add credits to a user's account
 * Usage: npx tsx scripts/add-credits.ts <user-email> <credit-amount>
 */

import { config } from "dotenv";
import { resolve } from "path";
import { createClient } from "@supabase/supabase-js";

// Load .env.local from apps/web
config({ path: resolve(__dirname, "../apps/web/.env.local") });

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error("Missing environment variables:");
  console.error("  - NEXT_PUBLIC_SUPABASE_URL");
  console.error("  - SUPABASE_SERVICE_ROLE_KEY");
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

async function addCredits(userEmail: string, amount: number) {
  console.log(`Looking up user: ${userEmail}...`);

  // Find user by email in auth.users (service role required)
  const { data: usersData, error: usersError } = await supabase.auth.admin.listUsers();

  if (usersError) {
    console.error("Failed to list users:", usersError.message);
    process.exit(1);
  }

  const user = usersData.users.find(u => u.email === userEmail);

  if (!user) {
    console.error(`User not found: ${userEmail}`);
    process.exit(1);
  }

  console.log(`Found user: ${user.id}`);

  // Get user profile
  const { data: profile, error: profileError } = await supabase
    .from("user_profiles")
    .select("id, credits")
    .eq("id", user.id)
    .single();

  if (profileError || !profile) {
    console.error(`No profile found for user. Creating one...`);
    const { data: newProfile, error: insertError } = await supabase
      .from("user_profiles")
      .insert({ id: user.id, credits: 100 })
      .select()
      .single();

    if (insertError || !newProfile) {
      console.error("Failed to create profile:", insertError?.message);
      process.exit(1);
    }
    profile = newProfile;
  }

  console.log(`Current credits: ${profile.credits}`);

  const newBalance = profile.credits + amount;

  const { error: updateError } = await supabase
    .from("user_profiles")
    .update({ credits: newBalance })
    .eq("id", profile.id);

  if (updateError) {
    console.error("Failed to update credits:", updateError.message);
    process.exit(1);
  }

  console.log(`✅ Added ${amount.toLocaleString()} credits to ${userEmail}`);
  console.log(`   Previous balance: ${profile.credits.toLocaleString()}`);
  console.log(`   New balance: ${newBalance.toLocaleString()}`);
}

// Parse command line args
const args = process.argv.slice(2);
const email = args[0];
const credits = parseInt(args[1], 10);

if (!email || isNaN(credits)) {
  console.error("Usage: npx tsx scripts/add-credits.ts <user-email> <credit-amount>");
  console.error("Example: npx tsx scripts/add-credits.ts lasse@example.com 1000");
  process.exit(1);
}

addCredits(email, credits).catch((err) => {
  console.error("Unexpected error:", err);
  process.exit(1);
});
