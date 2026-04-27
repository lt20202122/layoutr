import WaitlistButton from "@/components/ui/WaitlistButton";
import { createClient, createServiceClient } from "@/lib/supabase/server";

export default async function PricingPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const svc = createServiceClient();
  const { data: profile } = await svc
    .from("user_profiles")
    .select("plan")
    .eq("id", user?.id)
    .single();

  const currentPlan = profile?.plan ?? "free";

  return (
    <div className="max-w-4xl mx-auto space-y-12">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Pricing & Plans</h1>
        <p className="text-gray-400 mt-2 text-lg">
          Simple, credit-based pricing. Pay only for what you use.
        </p>
      </div>

      <section className="space-y-6">
        <h2 className="text-xl font-semibold">Plans</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Free Plan */}
          <div className="p-5 bg-gray-900 border border-gray-800 rounded-2xl flex flex-col relative overflow-hidden">
            {currentPlan === "free" && (
              <div className="absolute top-0 right-0 bg-brand-500/10 text-brand-400 text-[10px] font-bold px-3 py-1 rounded-bl-lg uppercase tracking-wider">
                Current Plan
              </div>
            )}
            <h3 className="font-semibold text-white">Free</h3>
            <div className="mt-2 mb-4">
              <span className="text-2xl font-bold">$0</span>
              <span className="text-gray-500 text-sm">/mo</span>
            </div>
            <ul className="text-sm text-gray-400 space-y-2.5 mb-6 flex-1">
              <li className="flex gap-2"><span className="text-gray-600">✓</span> 100 credits/month included</li>
              <li className="flex gap-2"><span className="text-gray-600">✓</span> DeepSeek V4 Flash only</li>
              <li className="flex gap-2"><span className="text-gray-600">✓</span> Max additional credit purchase: 500 cr/mo ($1)</li>
              <li className="flex gap-2"><span className="text-gray-600">✓</span> 1 project</li>
            </ul>
            {currentPlan === "free" ? (
              <button disabled className="w-full py-2 bg-gray-800 text-gray-400 text-sm font-medium rounded-lg cursor-not-allowed">
                Current
              </button>
            ) : (
              <WaitlistButton />
            )}
          </div>

          {/* Hobby Plan */}
          <div className="p-5 bg-gray-900 border border-brand-500/30 rounded-2xl flex flex-col relative overflow-hidden shadow-[0_0_15px_rgba(59,130,246,0.05)]">
            {currentPlan === "hobby" && (
              <div className="absolute top-0 right-0 bg-brand-500/10 text-brand-400 text-[10px] font-bold px-3 py-1 rounded-bl-lg uppercase tracking-wider">
                Current Plan
              </div>
            )}
            <h3 className="font-semibold text-brand-300">Hobby</h3>
            <div className="mt-2 mb-4">
              <span className="text-2xl font-bold">$9</span>
              <span className="text-gray-500 text-sm">/mo</span>
            </div>
            <ul className="text-sm text-gray-400 space-y-2.5 mb-6 flex-1">
              <li className="flex gap-2"><span className="text-brand-500">✓</span> 1,000 credits/month included</li>
              <li className="flex gap-2"><span className="text-brand-500">✓</span> DeepSeek V4 Flash + Claude Sonnet 4.5</li>
              <li className="flex gap-2"><span className="text-brand-500">✓</span> Max additional credit purchase: 5,000 cr/mo ($10)</li>
              <li className="flex gap-2"><span className="text-brand-500">✓</span> Unlimited projects</li>
            </ul>
            {currentPlan === "hobby" ? (
              <button disabled className="w-full py-2 bg-gray-800 text-gray-400 text-sm font-medium rounded-lg cursor-not-allowed">
                Current
              </button>
            ) : (
              <WaitlistButton />
            )}
          </div>

          {/* Pro Plan */}
          <div className="p-5 bg-gray-900 border border-gray-800 rounded-2xl flex flex-col relative overflow-hidden">
            {currentPlan === "pro" && (
              <div className="absolute top-0 right-0 bg-brand-500/10 text-brand-400 text-[10px] font-bold px-3 py-1 rounded-bl-lg uppercase tracking-wider">
                Current Plan
              </div>
            )}
            <h3 className="font-semibold text-white">Pro</h3>
            <div className="mt-2 mb-4">
              <span className="text-2xl font-bold">$29</span>
              <span className="text-gray-500 text-sm">/mo</span>
            </div>
            <ul className="text-sm text-gray-400 space-y-2.5 mb-6 flex-1">
              <li className="flex gap-2"><span className="text-gray-600">✓</span> 5,000 credits/month included</li>
              <li className="flex gap-2"><span className="text-gray-600">✓</span> All models (DeepSeek, Claude Sonnet, GPT-5.5)</li>
              <li className="flex gap-2"><span className="text-gray-600">✓</span> Max additional credit purchase: 50,000 cr/mo ($100)</li>
              <li className="flex gap-2"><span className="text-gray-600">✓</span> Unlimited projects</li>
              <li className="flex gap-2"><span className="text-gray-600">✓</span> Priority support</li>
            </ul>
            {currentPlan === "pro" ? (
              <button disabled className="w-full py-2 bg-gray-800 text-gray-400 text-sm font-medium rounded-lg cursor-not-allowed">
                Current
              </button>
            ) : (
              <WaitlistButton />
            )}
          </div>

          {/* Agency Plan */}
          <div className="p-5 bg-gray-900 border border-gray-800 rounded-2xl flex flex-col relative overflow-hidden">
            {currentPlan === "agency" && (
              <div className="absolute top-0 right-0 bg-brand-500/10 text-brand-400 text-[10px] font-bold px-3 py-1 rounded-bl-lg uppercase tracking-wider">
                Current Plan
              </div>
            )}
            <h3 className="font-semibold text-white">Agency</h3>
            <div className="mt-2 mb-4">
              <span className="text-2xl font-bold">$99</span>
              <span className="text-gray-500 text-sm">/mo</span>
            </div>
            <ul className="text-sm text-gray-400 space-y-2.5 mb-6 flex-1">
              <li className="flex gap-2"><span className="text-gray-600">✓</span> 25,000 credits/month included</li>
              <li className="flex gap-2"><span className="text-gray-600">✓</span> All models</li>
              <li className="flex gap-2"><span className="text-gray-600">✓</span> Max additional credit purchase: 500,000 cr/mo ($1,000)</li>
              <li className="flex gap-2"><span className="text-gray-600">✓</span> Unlimited projects</li>
              <li className="flex gap-2"><span className="text-gray-600">✓</span> Priority support</li>
              <li className="flex gap-2"><span className="text-gray-600">✓</span> Early access to new features</li>
            </ul>
            {currentPlan === "agency" ? (
              <button disabled className="w-full py-2 bg-gray-800 text-gray-400 text-sm font-medium rounded-lg cursor-not-allowed">
                Current
              </button>
            ) : (
              <WaitlistButton />
            )}
          </div>
        </div>
      </section>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <section className="space-y-4">
          <h2 className="text-xl font-semibold">Model Access by Plan</h2>
          <div className="overflow-hidden border border-gray-800 rounded-xl">
            <table className="w-full text-sm text-left text-gray-400">
              <thead className="text-xs text-gray-300 uppercase bg-gray-900 border-b border-gray-800">
                <tr>
                  <th className="px-4 py-3 font-semibold">Model</th>
                  <th className="px-4 py-3 font-semibold">Free</th>
                  <th className="px-4 py-3 font-semibold">Hobby</th>
                  <th className="px-4 py-3 font-semibold">Pro</th>
                  <th className="px-4 py-3 font-semibold">Agency</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-800 bg-gray-900/30">
                <tr>
                  <td className="px-4 py-3 font-medium text-white">DeepSeek V4 Flash</td>
                  <td className="px-4 py-3 text-green-400">✓</td>
                  <td className="px-4 py-3 text-green-400">✓</td>
                  <td className="px-4 py-3 text-green-400">✓</td>
                  <td className="px-4 py-3 text-green-400">✓</td>
                </tr>
                <tr>
                  <td className="px-4 py-3 font-medium text-white">Claude Sonnet 4.5</td>
                  <td className="px-4 py-3 text-gray-600">—</td>
                  <td className="px-4 py-3 text-green-400">✓</td>
                  <td className="px-4 py-3 text-green-400">✓</td>
                  <td className="px-4 py-3 text-green-400">✓</td>
                </tr>
                <tr>
                  <td className="px-4 py-3 font-medium text-white">GPT-5.5</td>
                  <td className="px-4 py-3 text-gray-600">—</td>
                  <td className="px-4 py-3 text-gray-600">—</td>
                  <td className="px-4 py-3 text-green-400">✓</td>
                  <td className="px-4 py-3 text-green-400">✓</td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>

        <section className="space-y-4">
          <h2 className="text-xl font-semibold">Credit Packs (Add-on)</h2>
          <div className="overflow-hidden border border-gray-800 rounded-xl">
            <table className="w-full text-sm text-left text-gray-400">
              <thead className="text-xs text-gray-300 uppercase bg-gray-900 border-b border-gray-800">
                <tr>
                  <th className="px-4 py-3 font-semibold">Pack</th>
                  <th className="px-4 py-3 font-semibold">Price</th>
                  <th className="px-4 py-3 font-semibold">Savings</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-800 bg-gray-900/30">
                <tr>
                  <td className="px-4 py-3 font-medium text-white">1,000 credits</td>
                  <td className="px-4 py-3">$2</td>
                  <td className="px-4 py-3 text-gray-500">—</td>
                </tr>
                <tr>
                  <td className="px-4 py-3 font-medium text-white">5,000 credits</td>
                  <td className="px-4 py-3">$8</td>
                  <td className="px-4 py-3 text-green-400">Save $2</td>
                </tr>
                <tr>
                  <td className="px-4 py-3 font-medium text-white">20,000 credits</td>
                  <td className="px-4 py-3">$28</td>
                  <td className="px-4 py-3 text-green-400">Save $12</td>
                </tr>
              </tbody>
            </table>
          </div>
          <p className="text-xs text-gray-500 pt-2">
            Credit packs can only be purchased up to the monthly cap for your plan. Unused purchased credits roll over; monthly included credits reset each billing cycle.
          </p>
        </section>
      </div>

      <section className="space-y-4 pt-4">
        <h2 className="text-xl font-semibold">Credit System</h2>
        <div className="p-5 bg-gray-900 border border-gray-800 rounded-2xl flex flex-col sm:flex-row gap-8 items-start">
          <div className="flex-1 space-y-4">
            <p className="text-sm text-gray-400">
              Credits are consumed per AI generation call, based on actual token usage (input + output) with a 2× markup over raw API cost.
            </p>
            <div className="flex gap-6">
              <div>
                <span className="block text-xs text-gray-500 uppercase tracking-wider mb-1">1 Credit</span>
                <span className="font-semibold text-white">$0.0001</span>
              </div>
              <div>
                <span className="block text-xs text-gray-500 uppercase tracking-wider mb-1">1,000 Credits</span>
                <span className="font-semibold text-white">$2.00</span>
              </div>
            </div>
          </div>
          <div className="flex-1 w-full">
            <h4 className="text-sm font-semibold mb-3">Estimated Cost per Generation</h4>
            <div className="space-y-2">
              <div className="flex justify-between text-xs p-2 bg-gray-800/50 rounded-lg">
                <span className="text-white">DeepSeek V4 Flash</span>
                <span className="text-gray-400">~50-100 credits</span>
              </div>
              <div className="flex justify-between text-xs p-2 bg-gray-800/50 rounded-lg">
                <span className="text-white">Claude Sonnet 4.5</span>
                <span className="text-gray-400">~500-1,000 credits</span>
              </div>
              <div className="flex justify-between text-xs p-2 bg-gray-800/50 rounded-lg">
                <span className="text-white">GPT-5.5</span>
                <span className="text-gray-400">~2,500-5,000 credits</span>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
