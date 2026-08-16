import Image from 'next/image';

const FEATURES = [
  {
    title: 'Fetches every product',
    description: 'Auto-saves every product, even screenshots',
    icon: (
      <svg
        width="24"
        height="24"
        viewBox="0 0 24 24"
        fill="none"
        stroke="#f97316"
        strokeWidth="1.75"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4Z" />
        <path d="M3 6h18" />
        <path d="M16 10a4 4 0 0 1-8 0" />
      </svg>
    ),
  },
  {
    title: 'Does helpful tricks',
    description: 'Price tracking, alternatives, styling advice',
    icon: (
      <svg
        width="24"
        height="24"
        viewBox="0 0 24 24"
        fill="none"
        stroke="#f97316"
        strokeWidth="1.75"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M12 3v4M12 17v4M3 12h4M17 12h4M6 6l2.5 2.5M15.5 15.5 18 18M18 6l-2.5 2.5M8.5 15.5 6 18" />
      </svg>
    ),
  },
  {
    title: 'Loyal to your taste',
    description: 'Learns what you love and personalizes for you',
    icon: (
      <svg
        width="24"
        height="24"
        viewBox="0 0 24 24"
        fill="none"
        stroke="#f97316"
        strokeWidth="1.75"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.6l-1-1a5.5 5.5 0 0 0-7.8 7.8l1 1L12 21l7.8-7.6 1-1a5.5 5.5 0 0 0 0-7.8Z" />
      </svg>
    ),
  },
];

export default function HomeOnboardingPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-cream px-6 py-12">
      <div className="max-w-[960px] w-full">
        <div className="flex justify-center mb-8">
          <div className="relative w-32 h-32">
            <Image
              src="/lani-logo.png"
              alt="Lani Logo"
              width={128}
              height={128}
              className="object-contain"
            />
          </div>
        </div>

        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-[#0a0a0a] mb-3">Meet Lani</h1>
          <h2 className="text-xl font-semibold text-[#f97316] mb-2">
            Your Personal Shopping Retriever
          </h2>
          <p className="text-base text-[#64748b] font-medium">
            Loyal to your taste, never forgets.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          {FEATURES.map((feature) => (
            <div key={feature.title} className="bg-white rounded-xl p-6 shadow-sm">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 bg-[#fff7ed] rounded-full flex items-center justify-center flex-shrink-0">
                  {feature.icon}
                </div>
                <div className="flex-1">
                  <h3 className="text-base font-medium text-[#0a0a0a] mb-2">{feature.title}</h3>
                  <p className="text-base text-[#737373] leading-relaxed">{feature.description}</p>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="flex justify-center">
          <a
            href="/dashboard"
            className="inline-flex items-center gap-2 px-8 py-4 bg-[#f97316] text-white text-base font-medium rounded-lg hover:bg-[#ea580c] transition-colors duration-200 shadow-sm"
          >
            Start Browsing
            <svg
              width="16"
              height="16"
              viewBox="0 0 16 16"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              className="ml-1"
            >
              <path
                d="M3.33337 8H12.6667M12.6667 8L8.00004 3.33333M12.6667 8L8.00004 12.6667"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </a>
        </div>
      </div>
    </div>
  );
}
