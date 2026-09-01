'use client';

export default function FinalCTA({ onShopWithLani }: { onShopWithLani?: () => void }) {
  return (
    <section className="bg-white pt-0 pb-24">
      <div className="container mx-auto px-4 sm:px-8 lg:px-20">
        <div className="bg-[#F97316] rounded-[14px] py-24 px-8 relative overflow-hidden">
          {/* Lani Logo - No background */}
          <div className="absolute top-8 left-1/2 transform -translate-x-1/2">
            <img src="/lani-icon.png" alt="Lani" className="w-16 h-16 object-contain" />
          </div>

          {/* Content */}
          <div className="relative z-10 text-center max-w-2xl mx-auto space-y-6 mt-8">
            <h2 className="text-4xl lg:text-5xl font-extrabold text-[#FAFAF9] font-nunito leading-tight">
              Your loyal shopping companion is here.
            </h2>
            <p className="text-base lg:text-lg text-[#FAFAF9] leading-relaxed">
              Download Lani and finally experience shopping without the chaos.
            </p>

            {/* CTA Button */}
            <div className="pt-4">
              <button
                type="button"
                onClick={onShopWithLani}
                className="inline-flex items-center px-8 py-3 bg-[#FAFAF9] text-[#F97316] text-sm font-medium rounded-lg hover:bg-white transition shadow-lg"
              >
                Get started
                <svg className="w-4 h-4 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 5l7 7-7 7"
                  />
                </svg>
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
