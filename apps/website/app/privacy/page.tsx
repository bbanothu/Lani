import NewHeader from '@/components/figma-landing/NewHeader';
import NewFooter from '@/components/figma-landing/NewFooter';

const SECTIONS = [
  {
    h: 'Account information',
    p: "When you sign up, we store your email, password (hashed, via Supabase Auth), and display name. That's it for account data -- we don't ask for a phone number, address, or payment info.",
  },
  {
    h: 'Products, lists, cart, and chat history',
    p: 'Products you save (via the browser extension or manually), the lists and cart you organize them into, and your chat history with the AI assistant are stored so they sync across the app, website, and extension. This data is private to your account -- other users can only see it if you explicitly share a list.',
  },
  {
    h: 'The browser extension',
    p: "The Lani extension reads the page you're currently viewing to detect whether it's a product page (title, price, image, and URL) and asks your chosen AI model to confirm before saving anything. It does not read pages when paused, and it does not run on tabs unrelated to shopping unless it needs to check whether they're a product page.",
  },
  {
    h: 'AI chat',
    p: "You choose and connect your own AI provider -- Anthropic Claude, OpenRouter, or a self-hosted Ollama instance -- in Profile settings. Your API key is stored only on your own device (browser local storage or app storage) and is never sent to our servers. Messages you send in chat go directly from your device to the provider you picked, subject to that provider's own privacy policy.",
  },
  {
    h: 'Price tracking',
    p: "If you tap Track on a product, we store its URL and price so we can check it once a day and let you know if the price changed. Tracked URLs are deduplicated across users -- we don't attach your identity to the tracking record itself, only to the fact that one of your saved products links to it.",
  },
  {
    h: "What we don't do",
    p: "We don't sell your data, run ads, or use third-party analytics or tracking scripts on the app or website.",
  },
  {
    h: 'Deleting your data',
    p: 'You can permanently delete your account and all associated data at any time from Profile > Delete account. This is immediate and irreversible -- it removes your products, lists, cart, and chat history along with your login.',
  },
  {
    h: 'Questions',
    p: "Email admin@qcsmallbusiness.com and we'll get back to you.",
  },
];

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-white">
      <NewHeader />

      <main className="container mx-auto px-4 sm:px-8 lg:px-20 py-16 max-w-3xl">
        <h1 className="text-4xl font-bold text-ink mb-3">Privacy Policy</h1>
        <p className="text-lg text-[#78716C] mb-10">
          What Lani collects, why, and how to delete it. Last updated August 2026.
        </p>

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
