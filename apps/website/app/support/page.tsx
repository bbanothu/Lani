import NewHeader from '@/components/figma-landing/NewHeader';
import NewFooter from '@/components/figma-landing/NewFooter';

const FAQS = [
  {
    q: 'How does Lani save products?',
    a: 'Install the Lani browser extension and it picks up products as you shop — they show up in the app automatically, ready to add to a cart or a list.',
  },
  {
    q: 'How do I delete my account?',
    a: "Email us at admin@qcsmallbusiness.com from your account's address and we'll delete your account and data.",
  },
  {
    q: 'Is my data shared with anyone?',
    a: 'No. Your saved products and lists are private to your account unless you explicitly share a list.',
  },
];

export default function SupportPage() {
  return (
    <div className="min-h-screen bg-white">
      <NewHeader />

      <main className="container mx-auto px-4 sm:px-8 lg:px-20 py-16 max-w-3xl">
        <h1 className="text-4xl font-bold text-ink mb-3">Support</h1>
        <p className="text-lg text-[#78716C] mb-10">
          Questions, bugs, or feedback — we read every message.
        </p>

        <a
          href="mailto:admin@qcsmallbusiness.com"
          className="inline-block px-6 py-3 bg-brand text-white rounded-lg hover:bg-brand-dark transition mb-12"
        >
          Email admin@qcsmallbusiness.com
        </a>

        <div className="space-y-8">
          {FAQS.map((faq) => (
            <div key={faq.q} className="border-t border-[#E7E5E4] pt-6">
              <h2 className="text-lg font-semibold text-ink mb-2">{faq.q}</h2>
              <p className="text-[#78716C]">{faq.a}</p>
            </div>
          ))}
        </div>
      </main>

      <NewFooter />
    </div>
  );
}
