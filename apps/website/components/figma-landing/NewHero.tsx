'use client';

export default function NewHero() {
  return (
    <section className="relative bg-white overflow-hidden pt-12 pb-24">
      {/* Background blur effects */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {/* Top blurs */}
        <div className="absolute left-0 top-96 w-[798px] h-[302px] rounded-full bg-[#FEF3C7] blur-3xl opacity-50"></div>
        <div className="absolute left-[510px] top-80 w-[1006px] h-[257px] rounded-full bg-[#FED7AA] blur-3xl opacity-40"></div>
      </div>

      <div className="container mx-auto px-4 sm:px-8 lg:px-20 relative z-10">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
          {/* Left Content */}
          <div className="space-y-8">
            <h1 className="text-5xl lg:text-6xl font-extrabold text-[#0C0A09] leading-tight font-nunito">
              Meet Lani, Your Personal Shopping Retriever
            </h1>
            <p className="text-lg lg:text-xl text-[#78716C] leading-relaxed">
              She remembers everything you find, organizes your shopping, and soon— will earn for
              you by talking to brands on your behalf.
            </p>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-4">
              <a
                href="https://apps.apple.com/us/app/lani-shopping/id6755109857?mt=12"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center px-8 py-3 bg-[#F97316] text-white text-sm font-medium rounded-lg hover:bg-[#F26C0F] transition"
              >
                Download for Safari
              </a>
              <a
                href="https://chromewebstore.google.com/detail/lani/ekcgdpkgpgohmogglfceiibfgpcppefh"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center px-8 py-3 border border-[#E7E5E4] bg-white text-[#110E0C] text-sm font-medium rounded-lg hover:bg-gray-50 transition"
              >
                Download for Chrome
              </a>
            </div>
          </div>

          {/* Right side - Hero Image */}
          <div className="relative w-full h-[400px] lg:h-[500px]">
            <img
              src="/hero-main.png"
              alt="Lani Shopping Assistant - Desktop and mobile interface"
              className="w-full h-full object-contain"
            />
          </div>
        </div>
      </div>
    </section>
  );
}
