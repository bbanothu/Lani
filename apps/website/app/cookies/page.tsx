import NewHeader from '@/components/figma-landing/NewHeader';
import NewFooter from '@/components/figma-landing/NewFooter';

const SECTIONS = [
  {
    h: 'What we use cookies for',
    p: 'Only to keep you signed in. Our login uses a session cookie/token so you do not have to re-enter your password every visit. That is it -- no tracking or advertising cookies.',
  },
  {
    h: 'Third-party cookies',
    p: 'We do not run ad networks, analytics scripts, or third-party trackers on the app or website, so there is nothing else setting cookies on your visit.',
  },
  {
    h: 'Local storage',
    p: 'Your AI provider settings (which model you have chosen and your API key, if any) are saved in your browser’s local storage on your own device, not in a cookie, and never leave your device except when talking directly to the AI provider you picked.',
  },
  {
    h: 'Clearing cookies',
    p: 'Clearing your browser’s cookies for lani.brainrotslop.com will sign you out. You can sign back in any time.',
  },
];

export default function CookiesPage() {
  return (
    <div className="min-h-screen bg-white">
      <NewHeader />

      <main className="container mx-auto px-4 sm:px-8 lg:px-20 py-16 max-w-3xl">
        <h1 className="text-4xl font-bold text-ink mb-3">Cookie Policy</h1>
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
