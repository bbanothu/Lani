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
                href="https://chromewebstore.google.com/detail/lani/fhnebgjcghgkbjddbhgbdefmiinpenoj"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center px-8 py-3 border border-[#E7E5E4] bg-white text-[#110E0C] text-sm font-medium rounded-lg hover:bg-gray-50 transition"
              >
                Download for Chrome
              </a>
              <a
                href="https://apps.apple.com/us/app/trylani/id6802356030"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center gap-2 px-8 py-3 bg-black text-white text-sm font-medium rounded-lg hover:bg-gray-800 transition"
              >
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                  aria-hidden="true"
                >
                  <path d="M16.365 1.43c0 1.14-.463 2.101-1.388 2.883-.925.782-1.986 1.196-3.032 1.096-.14-1.1.394-2.24 1.32-3.03.926-.79 2.036-1.25 3.1-1.35v.4Zm3.09 6.62c-.09.056-2.16 1.26-2.14 3.76.026 2.99 2.63 3.99 2.66 4-.02.07-.42 1.44-1.38 2.85-.83 1.23-1.7 2.45-3.06 2.48-1.33.02-1.76-.79-3.28-.79-1.52 0-2 .77-3.26.81-1.31.05-2.31-1.33-3.15-2.55-1.71-2.5-3.02-7.06-1.26-10.13.87-1.53 2.43-2.5 4.12-2.52 1.29-.03 2.5.87 3.28.87.78 0 2.25-1.07 3.79-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.26-2.15 3.71-.02.02 0 0 0 0h.19Z" />
                </svg>
                Download iOS App
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
