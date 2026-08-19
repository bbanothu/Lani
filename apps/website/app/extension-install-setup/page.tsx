import NewHeader from '@/components/figma-landing/NewHeader';
import NewFooter from '@/components/figma-landing/NewFooter';

const STORE_URL = 'https://chromewebstore.google.com/detail/lani/ekcgdpkgpgohmogglfceiibfgpcppefh';

const STEPS = [
  {
    h: '1. Install from the Chrome Web Store',
    p: 'Click the button below and hit "Add to Chrome." Lani adds a small icon to your toolbar -- nothing else changes in your browser.',
  },
  {
    h: '2. Sign in',
    p: 'Click the Lani icon and sign in with the same account you use on the app or website. Everything you save syncs across all three automatically.',
  },
  {
    h: '3. Shop like normal',
    p: "Browse any store you'd shop at anyway. When you land on a product page, Lani quietly checks whether it's worth saving and asks before adding anything -- it never saves without your say-so.",
  },
  {
    h: '4. Check your list',
    p: "Open the app or website to see everything you've saved, organize it into lists, add it to your cart, or ask the AI assistant for recommendations.",
  },
];

export default function ExtensionSetupPage() {
  return (
    <div className="min-h-screen bg-white">
      <NewHeader />

      <main className="container mx-auto px-4 sm:px-8 lg:px-20 py-16 max-w-3xl">
        <h1 className="text-4xl font-bold text-ink mb-3">Install the Lani extension</h1>
        <p className="text-lg text-[#78716C] mb-10">
          Four steps, about a minute. No account creation required to install.
        </p>

        <a
          href={STORE_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-block px-6 py-3 bg-brand text-white rounded-lg hover:bg-brand-dark transition mb-12"
        >
          Add to Chrome -- it&apos;s free
        </a>

        <div className="space-y-8">
          {STEPS.map((s) => (
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
