'use client';

export default function VideoSection() {
  return (
    <section className="bg-white py-24">
      <div className="container mx-auto px-4 sm:px-8 lg:px-20">
        {/* Section Title */}
        <div className="text-center mb-12">
          <h2 className="text-4xl lg:text-5xl font-extrabold text-[#0C0A09] font-nunito mb-4">
            Ask Lani Anything
          </h2>
          <p className="text-base text-[#64748B] max-w-2xl mx-auto">
            Your personal shopping companion who knows you inside out
          </p>
        </div>

        {/* Video with Dog Positioned at Bottom Left */}
        <div className="max-w-4xl mx-auto">
          <div className="relative flex justify-center">
            {/* Video Container */}
            <div className="relative z-10">
              <div className="rounded-3xl overflow-hidden shadow-2xl bg-black max-w-sm md:max-w-md">
                <video
                  src="/lani-chat-video.mov"
                  className="w-full h-auto"
                  controls
                  autoPlay
                  muted
                  loop
                  playsInline
                >
                  Your browser does not support the video tag.
                </video>
              </div>
            </div>

            {/* Lani Dog - Positioned at Bottom Left */}
            <div className="hidden lg:block absolute left-0 bottom-0 z-0">
              <img
                src="/lani-dog-small.png"
                alt="Lani mascot with shopping bag"
                className="w-64 h-auto object-contain"
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
