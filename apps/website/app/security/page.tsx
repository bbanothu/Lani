import NewHeader from '@/components/figma-landing/NewHeader';
import NewFooter from '@/components/figma-landing/NewFooter';

const SECTIONS = [
  {
    h: 'Encryption',
    p: 'Everything between your device and our servers travels over HTTPS. Passwords are hashed, not stored in plain text, and we never see or store your AI provider API keys -- those stay on your own device.',
  },
  {
    h: 'Row-level access control',
    p: 'Our database enforces access rules at the row level: your products, lists, cart, and chat history are readable only by your own account, checked on every single request -- not just in the app’s UI.',
  },
  {
    h: 'Data minimization',
    p: 'We collect what the product needs to function (email, saved products, lists) and nothing more. No third-party analytics or ad trackers run on the app or website.',
  },
  {
    h: 'Deletion',
    p: 'Deleting your account from Profile > Delete account permanently removes your products, lists, cart, and chat history immediately -- not after a delay, and not just hidden.',
  },
  {
    h: 'Reporting a concern',
    p: 'Found a security issue? Email admin@qcsmallbusiness.com -- we take reports seriously and will respond directly.',
  },
];

export default function SecurityPage() {
  return (
    <div className="min-h-screen bg-white">
      <NewHeader />

      <main className="container mx-auto px-4 sm:px-8 lg:px-20 py-16 max-w-3xl">
        <h1 className="text-4xl font-bold text-ink mb-3">Data & Security</h1>
        <p className="text-lg text-[#78716C] mb-10">How we handle your data, in plain terms.</p>

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
