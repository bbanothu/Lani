import NewHeader from '@/components/figma-landing/NewHeader';
import NewFooter from '@/components/figma-landing/NewFooter';

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-white">
      <NewHeader />

      <main className="container mx-auto px-4 sm:px-8 lg:px-20 py-16 max-w-3xl">
        <h1 className="text-4xl font-bold text-ink mb-3">About Lani</h1>
        <p className="text-lg text-[#78716C] mb-10">Your personal shopping retriever.</p>

        <div className="space-y-8">
          <div className="border-t border-[#E7E5E4] pt-6">
            <h2 className="text-lg font-semibold text-ink mb-2">What we’re building</h2>
            <p className="text-[#78716C]">
              Shopping online today means a browser full of open tabs, screenshots you never look at
              again, and a memory of “that one thing I saw last week” that you can never quite find.
              Lani is a browser extension, app, and AI assistant that catches products as you shop
              and keeps them organized — one list, synced everywhere — so nothing gets lost between
              “I saw this” and “I bought this.”
            </p>
          </div>

          <div id="mission" className="border-t border-[#E7E5E4] pt-6 scroll-mt-24">
            <h2 className="text-lg font-semibold text-ink mb-2">Our mission</h2>
            <p className="text-[#78716C]">
              Give people back the time and attention shopping quietly eats up. We’re not building
              another marketplace or another feed to scroll — Lani doesn’t sell your attention,
              doesn’t run ads, and doesn’t sell your data. It works for you, not for a retailer’s
              conversion rate.
            </p>
          </div>

          <div className="border-t border-[#E7E5E4] pt-6">
            <h2 className="text-lg font-semibold text-ink mb-2">Where we are today</h2>
            <p className="text-[#78716C]">
              Lani is early — built by a small team, shaped directly by the people using it. If that
              sounds like you, the Founding Shoppers Program is the fastest way to have a say in
              what we build next.
            </p>
          </div>
        </div>
      </main>

      <NewFooter />
    </div>
  );
}
