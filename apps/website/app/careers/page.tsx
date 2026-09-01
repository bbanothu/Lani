import NewHeader from '@/components/figma-landing/NewHeader';
import NewFooter from '@/components/figma-landing/NewFooter';

const VALUES = [
  {
    h: 'Small team, real ownership',
    p: 'We ship fast and everyone here owns entire features end to end, not a slice of one.',
  },
  {
    h: 'Built for users, not metrics',
    p: 'No dark patterns, no engagement-maximizing feeds. If a feature does not save someone time or money, we do not ship it.',
  },
  {
    h: 'Remote-first',
    p: 'Work from wherever -- we care about what ships, not when you were online.',
  },
];

export default function CareersPage() {
  return (
    <div className="min-h-screen bg-white">
      <NewHeader />

      <main className="container mx-auto px-4 sm:px-8 lg:px-20 py-16 max-w-3xl">
        <h1 className="text-4xl font-bold text-ink mb-3">Careers</h1>
        <p className="text-lg text-[#78716C] mb-10">
          No open roles right now, but we are small and growing -- worth checking back.
        </p>

        <a
          href="mailto:admin@qcsmallbusiness.com?subject=Interested%20in%20Lani"
          className="inline-block px-6 py-3 bg-brand text-white rounded-lg hover:bg-brand-dark transition mb-12"
        >
          Introduce yourself
        </a>

        <div className="space-y-8">
          {VALUES.map((v) => (
            <div key={v.h} className="border-t border-[#E7E5E4] pt-6">
              <h2 className="text-lg font-semibold text-ink mb-2">{v.h}</h2>
              <p className="text-[#78716C]">{v.p}</p>
            </div>
          ))}
        </div>
      </main>

      <NewFooter />
    </div>
  );
}
