import NewHeader from '@/components/figma-landing/NewHeader';
import NewFooter from '@/components/figma-landing/NewFooter';

const PERKS = [
  {
    h: 'Founding badge',
    p: 'A permanent "Founding Shopper" mark on your profile -- the first cohort of people who shaped what Lani became.',
  },
  {
    h: 'Direct line to the team',
    p: 'Your feedback goes straight into the roadmap, not a support queue. We ship features founding shoppers ask for first.',
  },
  {
    h: 'Early access',
    p: "New features -- like price tracking and AI actions -- land in your hands before anyone else, while we're still tuning them.",
  },
];

export default function CampaignPage() {
  return (
    <div className="min-h-screen bg-white">
      <NewHeader />

      <main className="container mx-auto px-4 sm:px-8 lg:px-20 py-16 max-w-3xl">
        <h1 className="text-4xl font-bold text-ink mb-3">Founding Shoppers Program</h1>
        <p className="text-lg text-[#78716C] mb-10">
          Lani is early. The people who use it now are the ones who&apos;ll shape what it becomes --
          this is for them.
        </p>

        <a
          href="/login"
          className="inline-block px-6 py-3 bg-brand text-white rounded-lg hover:bg-brand-dark transition mb-12"
        >
          Join as a founding shopper
        </a>

        <div className="space-y-8">
          {PERKS.map((perk) => (
            <div key={perk.h} className="border-t border-[#E7E5E4] pt-6">
              <h2 className="text-lg font-semibold text-ink mb-2">{perk.h}</h2>
              <p className="text-[#78716C]">{perk.p}</p>
            </div>
          ))}
        </div>
      </main>

      <NewFooter />
    </div>
  );
}
