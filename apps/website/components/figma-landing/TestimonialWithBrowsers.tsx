'use client';

export default function TestimonialWithBrowsers() {
  return (
    <section className="bg-gradient-to-b from-[#FFF8F3] to-[#FFF5ED] py-24 relative">
      <div className="container mx-auto px-4 sm:px-8 lg:px-20">
        <div className="max-w-3xl mx-auto text-center space-y-6">
          {/* Testimonial Quote */}
          <blockquote className="text-2xl lg:text-3xl font-medium text-[#0C0A09] leading-relaxed">
            &ldquo;Everything&apos;s all in one place instead of scattered across my browser, my
            Notes app, and my camera roll. That&apos;s the whole point, right?&rdquo;
          </blockquote>

          {/* Author */}
          <div className="flex items-center justify-center gap-3">
            <div className="w-14 h-14 rounded-full bg-[#F5F5F4] flex items-center justify-center flex-shrink-0">
              <svg
                className="w-8 h-8 text-[#78716C]"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                />
              </svg>
            </div>
            <div className="flex flex-col items-start">
              <div className="text-lg font-medium text-[#0C0A09]">Jen</div>
              <div className="text-sm text-[#78716C]">Lani Shopper</div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
