import Link from "next/link";
import WaitlistButton from "@/components/ui/WaitlistButton";

const plans = [
  {
    id: "free",
    name: "Free",
    price: "$0",
    note: "Best for trying the workspace",
    features: [
      "100 credits per month",
      "DeepSeek V4 Flash access",
      "1 project",
      "Start using Layoutr immediately",
    ],
  },
  {
    id: "hobby",
    name: "Hobby",
    price: "$9",
    note: "Best for solo builders",
    featured: true,
    features: [
      "1,000 credits per month",
      "DeepSeek V4 Flash + Claude Sonnet 4.5",
      "Unlimited projects",
      "Join waitlist for paid access",
    ],
  },
  {
    id: "pro",
    name: "Pro",
    price: "$29",
    note: "For heavier agent-assisted work",
    features: [
      "5,000 credits per month",
      "All models including GPT-5.5",
      "Unlimited projects",
      "Join waitlist for paid access",
    ],
  },
  {
    id: "agency",
    name: "Agency",
    price: "$99",
    note: "For teams and high-volume usage",
    features: [
      "25,000 credits per month",
      "All models",
      "Priority support",
      "Join waitlist for paid access",
    ],
  },
];

export default function PricingPage() {
  return (
    <div className="mx-auto max-w-7xl space-y-8">
      <section className="glass-panel rounded-[30px] p-6 sm:p-8">
        <p className="section-label">Pricing</p>
        <div className="mt-4 max-w-3xl">
          <h1 className="headline-lg text-white">Start free now. Join the waitlist for paid plans.</h1>
          <p className="body-lg mt-4">
            Layoutr is open for free use today. Paid plans and richer credit top-ups are still rolling out, so you can try the product now and join the waitlist for expanded billing access.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Link href="/auth/signup" className="button-primary">
              Start free
            </Link>
            <Link href="/docs" className="button-secondary">
              Read docs
            </Link>
          </div>
        </div>
      </section>

      <section className="grid gap-4 xl:grid-cols-4">
        {plans.map((plan) => (
          <article
            key={plan.id}
            className={`relative rounded-[32px] p-6 transition-transform hover:-translate-y-1 ${
              plan.featured ? "glass-panel-strong" : "glass-panel"
            }`}
          >
            {plan.featured && (
              <div className="absolute right-5 top-5 rounded-full border border-brand-300/25 bg-brand-400/12 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.2em] text-brand-100">
                Recommended
              </div>
            )}

            <div className="pt-8">
              <p className="section-label">{plan.note}</p>
              <h2 className="mt-4 text-2xl font-semibold text-white">{plan.name}</h2>
              <div className="mt-4 flex items-end gap-2">
                <span className="text-4xl font-semibold text-white">{plan.price}</span>
                <span className="pb-1 text-sm text-slate-500">/ month</span>
              </div>
            </div>

            <ul className="mt-8 space-y-3 text-sm leading-6 text-slate-300">
              {plan.features.map((feature) => (
                <li key={feature} className="rounded-2xl border border-white/8 bg-white/[0.03] px-4 py-3">
                  {feature}
                </li>
              ))}
            </ul>

            <div className="mt-8">
              {plan.id === "free" ? (
                <Link href="/auth/signup" className="button-primary w-full justify-center">
                  Start free
                </Link>
              ) : (
                <div className="w-full">
                  <WaitlistButton />
                </div>
              )}
            </div>
          </article>
        ))}
      </section>

      <section className="grid gap-6 xl:grid-cols-2">
        <div className="glass-panel rounded-[30px] p-6">
          <p className="section-label">Model access</p>
          <div className="mt-5 overflow-hidden rounded-[26px] border border-white/8">
            <table className="w-full text-left text-sm text-slate-300">
              <thead className="bg-white/[0.04] text-xs uppercase tracking-[0.18em] text-slate-500">
                <tr>
                  <th className="px-4 py-4 font-medium">Model</th>
                  <th className="px-4 py-4 font-medium">Free</th>
                  <th className="px-4 py-4 font-medium">Hobby</th>
                  <th className="px-4 py-4 font-medium">Pro</th>
                  <th className="px-4 py-4 font-medium">Agency</th>
                </tr>
              </thead>
              <tbody>
                {[
                  ["DeepSeek V4 Flash", "Yes", "Yes", "Yes", "Yes"],
                  ["Claude Sonnet 4.5", "-", "Yes", "Yes", "Yes"],
                  ["GPT-5.5", "-", "-", "Yes", "Yes"],
                ].map((row) => (
                  <tr key={row[0]} className="border-t border-white/8">
                    {row.map((cell, index) => (
                      <td key={cell + index} className={`px-4 py-4 ${index === 0 ? "text-white" : ""}`}>
                        {cell}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="glass-panel rounded-[30px] p-6">
          <p className="section-label">Credit packs</p>
          <div className="mt-5 space-y-3">
            {[
              ["1,000 credits", "$2", "Entry pack"],
              ["5,000 credits", "$8", "Save $2"],
              ["20,000 credits", "$28", "Save $12"],
            ].map(([credits, price, note]) => (
              <div key={credits} className="flex items-center justify-between rounded-[24px] border border-white/8 bg-white/[0.03] px-4 py-4">
                <div>
                  <p className="text-sm font-medium text-white">{credits}</p>
                  <p className="mt-1 text-xs text-slate-500">{note}</p>
                </div>
                <p className="text-lg font-semibold text-white">{price}</p>
              </div>
            ))}
          </div>
          <p className="body-sm mt-5">
            Purchased credits roll over. Included monthly credits reset with the billing cycle.
          </p>
        </div>
      </section>
    </div>
  );
}
