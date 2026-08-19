import NewHeader from '@/components/figma-landing/NewHeader';
import NewFooter from '@/components/figma-landing/NewFooter';

const SECTIONS = [
  {
    h: 'Using Lani',
    p: 'Lani is free to use. You need an account (email and password) to save products, use lists and cart, and chat with the AI assistant. You are responsible for keeping your login secure and for what happens under your account.',
  },
  {
    h: 'The browser extension',
    p: 'The extension reads the page you are currently viewing to detect product pages and suggest saving them. It does not act on your behalf beyond that -- it never adds anything to your cart, lists, or account without your say-so.',
  },
  {
    h: 'AI chat',
    p: 'You connect your own AI provider (Claude, OpenRouter, or a self-hosted Ollama instance) using your own API key. That provider processes your chat messages under its own terms -- we just pass your messages through and are not responsible for what a third-party model says or does.',
  },
  {
    h: 'Price tracking',
    p: 'Prices we show are pulled from a daily automated check of the product page and may be out of date, inaccurate, or unavailable if a retailer changes their page. Always confirm the price on the retailer’s site before buying.',
  },
  {
    h: 'Account deletion',
    p: 'You can permanently delete your account and all associated data at any time from Profile > Delete account. This action is immediate and cannot be undone.',
  },
  {
    h: 'Changes to these terms',
    p: 'We may update these terms as Lani changes. We will post the updated version here -- continuing to use Lani after a change means you accept the new terms.',
  },
  {
    h: 'Contact',
    p: 'Questions about these terms: admin@qcsmallbusiness.com.',
  },
];

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-white">
      <NewHeader />

      <main className="container mx-auto px-4 sm:px-8 lg:px-20 py-16 max-w-3xl">
        <h1 className="text-4xl font-bold text-ink mb-3">Terms & Conditions</h1>
        <p className="text-lg text-[#78716C] mb-10">Last updated August 2026.</p>

        <div className="space-y-8">
          {SECTIONS.map((s) => (
            <div key={s.h} className="border-t border-[#E7E5E4] pt-6">
              <h2 className="text-lg font-semibold text-ink mb-2">{s.h}</h2>
              <p className="text-[#78716C]">{s.p}</p>
            </div>
          ))}
        </div>
      </main>

      <NewFooter />
    </div>
  );
}
