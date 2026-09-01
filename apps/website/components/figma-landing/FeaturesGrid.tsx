'use client';

export default function FeaturesGrid() {
  const features = [
    {
      title: 'Never Lose Anything Again',
      image: '/feature-never-lose.png',
    },
    {
      title: 'Everything You Browse, Organized',
      image: '/feature-organized.png',
    },
    {
      title: 'Personalized Recommendations',
      image: '/feature-recommendations.png',
    },
  ];

  return (
    <section className="bg-white py-24">
      {/* Background blur effects */}
      <div className="absolute left-0 w-full h-[1963px] overflow-hidden pointer-events-none">
        <div className="absolute left-[585px] top-[200px] w-[1282px] h-[1115px] rounded-full bg-[#FB923C] blur-3xl opacity-30"></div>
        <div className="absolute -left-[569px] top-[600px] w-[1617px] h-[954px] rounded-full bg-[#FCD34D] blur-3xl opacity-30"></div>
      </div>

      <div className="container mx-auto px-4 sm:px-8 lg:px-20 relative z-10">
        {/* Section Title */}
        <div className="text-center mb-16">
          <h2 className="text-4xl lg:text-5xl font-extrabold text-[#0C0A09] font-nunito mb-4">
            What Lani Does
          </h2>
        </div>

        {/* Features Grid */}
        <div className="grid md:grid-cols-3 gap-6">
          {features.map((feature, index) => (
            <div
              key={index}
              className="bg-[#FAFAF9] rounded-[14px] overflow-hidden hover:shadow-lg transition-shadow"
            >
              {/* Feature Image */}
              <div className="p-4">
                <div className="aspect-[4/3] overflow-hidden rounded-lg">
                  <img
                    src={feature.image}
                    alt={feature.title}
                    className="w-full h-full object-cover"
                  />
                </div>
              </div>

              {/* Feature Title */}
              <div className="px-6 pb-6">
                <h3 className="text-xl font-semibold text-[#0C0A09]">{feature.title}</h3>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
