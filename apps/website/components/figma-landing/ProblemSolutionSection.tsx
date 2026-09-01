'use client';

export default function ProblemSolutionSection() {
  return (
    <section className="bg-white py-24 relative">
      {/* Background blur effects */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute left-[548px] top-[300px] w-[916px] h-[993px] rounded-full bg-[#FB923C] blur-3xl opacity-25"></div>
        <div className="absolute -left-[276px] top-[600px] w-[1155px] h-[849px] rounded-full bg-[#FCD34D] blur-3xl opacity-25"></div>
      </div>

      <div className="container mx-auto px-4 sm:px-8 lg:px-20 relative z-10">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
          {/* Left Content */}
          <div className="space-y-8">
            <h2 className="text-4xl lg:text-5xl font-extrabold text-[#0C0A09] font-nunito leading-tight">
              Shopping Shouldn&apos;t Feel Chaotic
            </h2>
            <p className="text-lg text-[#78716C] leading-relaxed">
              You have 47 tabs open. Screenshots flooding your camera roll. Links texted to
              yourself. And somehow you still can&apos;t find that perfect thing you saw last week.
            </p>

            {/* Founder Quote */}
            <div className="border border-[#E7E5E4] rounded-lg p-6 space-y-4">
              <p className="text-base text-[#0C0A09] leading-relaxed">
                &ldquo;Online shopping gave us infinite choice—but zero tools to manage it.&rdquo;
              </p>
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full overflow-hidden flex-shrink-0">
                  <img src="/sid-avatar.png" alt="Sid B." className="w-full h-full object-cover" />
                </div>
                <div className="text-base font-medium text-[#0C0A09]">
                  Sid B. - CEO & Founder Lani
                </div>
              </div>
            </div>

            {/* Solution Statement */}
            <h3 className="text-3xl lg:text-4xl font-extrabold text-[#EA580C] font-nunito">
              Lani Changes That
            </h3>
          </div>

          {/* Right side - Image */}
          <div className="relative w-full h-[400px] lg:h-[500px]">
            <div className="absolute inset-0 flex items-center justify-center">
              <img
                src="/lani-dog-large.png"
                alt="Lani organizing your shopping"
                className="w-full h-full object-contain"
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
