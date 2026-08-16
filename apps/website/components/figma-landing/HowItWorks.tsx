'use client';

export default function HowItWorks() {
  const steps = [
    {
      number: 1,
      title: 'Download Lani',
      description: "Connect to your browser. That's it.",
    },
    {
      number: 2,
      title: 'Browse Naturally',
      description: 'Shop like you always do. Lani captures everything automatically.',
    },
    {
      number: 3,
      title: 'Everything Organized',
      description: 'View your universal cart, create lists, build your Style Center.',
    },
    {
      number: 4,
      title: 'Ask Lani Anything',
      description: '"What was that blue coat I saw last week?" And there it is, instantly.',
    },
  ];

  return (
    <section id="how-it-works" className="bg-white py-24 relative">
      <div className="container mx-auto px-4 sm:px-8 lg:px-20 relative z-10">
        {/* Section Title */}
        <div className="text-center mb-16">
          <h2 className="text-4xl lg:text-5xl font-extrabold text-[#0C0A09] font-nunito mb-4">
            How It Works
          </h2>
        </div>

        {/* Steps Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3 relative">
          {/* Connecting line - passes through center of circles (24px from top for 48px circle), only visible on larger screens */}
          <div className="hidden lg:block absolute top-[24px] left-[6%] right-[6%] h-0.5 bg-[#FB923C] z-0"></div>

          {steps.map((step, index) => (
            <div
              key={step.number}
              className="relative z-10 bg-white border-2 border-[#FB923C] rounded-[14px] pt-10 pb-6 px-6 hover:shadow-lg transition-shadow"
            >
              {/* Number Circle - positioned at top, line passes through center */}
              <div className="absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-20">
                <div className="w-12 h-12 rounded-full bg-[#F97316] flex items-center justify-center">
                  <span className="text-white font-bold text-xl font-nunito">{step.number}</span>
                </div>
              </div>

              {/* Content */}
              <div className="space-y-3 mt-4">
                <h3 className="text-lg font-semibold text-[#0C0A09] text-left">{step.title}</h3>
                <p className="text-sm text-[#78716C] text-left leading-relaxed">
                  {step.description}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
