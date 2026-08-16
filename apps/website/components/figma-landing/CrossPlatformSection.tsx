'use client';

export default function CrossPlatformSection() {
  return (
    <section className="bg-gradient-to-b from-white to-[#FFF8F3] py-24">
      <div className="container mx-auto px-4 sm:px-8 lg:px-20">
        {/* Section Title */}
        <div className="text-center max-w-3xl mx-auto">
          <h2 className="text-5xl lg:text-6xl font-extrabold text-[#0C0A09] font-nunito mb-8 leading-tight">
            Remembers Your Shopping Across Web & Mobile
          </h2>

          {/* Browser Icons */}
          <div className="flex items-center justify-center gap-12 mt-8">
            {/* Safari Icon */}
            <a
              href="https://apps.apple.com/us/app/lani-shopping/id6755109857?mt=12"
              target="_blank"
              rel="noopener noreferrer"
              className="w-20 h-20 flex items-center justify-center cursor-pointer hover:scale-110 transition-transform duration-200"
            >
              <img
                src="/safari-icon.png"
                alt="Download Lani for Safari"
                className="w-20 h-20 object-contain"
              />
            </a>

            {/* Chrome Icon */}
            <a
              href="https://chromewebstore.google.com/detail/lani/ekcgdpkgpgohmogglfceiibfgpcppefh"
              target="_blank"
              rel="noopener noreferrer"
              className="w-20 h-20 flex items-center justify-center cursor-pointer hover:scale-110 transition-transform duration-200"
            >
              <img
                src="/chrome-icon.png"
                alt="Download Lani for Chrome"
                className="w-20 h-20 object-contain"
              />
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}
