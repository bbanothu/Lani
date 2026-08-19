import NewHeader from '@/components/figma-landing/NewHeader';
import NewFooter from '@/components/figma-landing/NewFooter';

const FACTS = [
  { h: 'Founded', p: '2026' },
  {
    h: 'What it is',
    p: 'A browser extension, app, and AI assistant for tracking products you find while shopping online.',
  },
  {
    h: 'Platforms',
    p: 'Chrome extension, iOS app, and web app -- one account, synced everywhere.',
  },
  {
    h: 'Pricing',
    p: 'Free. Bring your own AI provider (Claude, OpenRouter, or a self-hosted model) for the chat assistant.',
  },
];

export default function PressPage() {
  return (
    <div className="min-h-screen bg-white">
      <NewHeader />

      <main className="container mx-auto px-4 sm:px-8 lg:px-20 py-16 max-w-3xl">
        <h1 className="text-4xl font-bold text-ink mb-3">Press Kit</h1>
        <p className="text-lg text-[#78716C] mb-10">
          Writing about Lani? Here is the quick version, plus how to reach us.
        </p>

        <a
          href="mailto:admin@qcsmallbusiness.com?subject=Press%20inquiry"
          className="inline-block px-6 py-3 bg-brand text-white rounded-lg hover:bg-brand-dark transition mb-12"
        >
          Media inquiries
        </a>

        <div className="space-y-8">
          {FACTS.map((f) => (
            <div key={f.h} className="border-t border-[#E7E5E4] pt-6">
              <h2 className="text-lg font-semibold text-ink mb-2">{f.h}</h2>
              <p className="text-[#78716C]">{f.p}</p>
            </div>
          ))}
        </div>
      </main>

      <NewFooter />
    </div>
  );
}
