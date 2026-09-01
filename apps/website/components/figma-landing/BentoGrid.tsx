'use client';

export default function BentoGrid() {
  const features = [
    {
      title: 'Saving Products',
      image: '/bento-saving-products.png',
    },
    {
      title: 'Lists Curation',
      image: '/bento-lists.png',
    },
    {
      title: 'Price Tracking',
      image: '/bento-price-tracking.png',
    },
    {
      title: 'Universal Shopping Cart',
      image: '/bento-cart.png',
    },
    {
      title: 'Style Center',
      image: '/bento-style-center.png',
    },
    {
      title: 'Chat',
      image: '/bento-chat.png',
    },
  ];

  return (
    <section id="features" className="bg-white py-24 relative">
      {/* Background blur effects */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute left-[585px] top-[400px] w-[1282px] h-[1115px] rounded-full bg-[#FB923C] blur-3xl opacity-20"></div>
        <div className="absolute -left-[569px] top-[800px] w-[1617px] h-[954px] rounded-full bg-[#FCD34D] blur-3xl opacity-20"></div>
      </div>

      <div className="container mx-auto px-4 sm:px-8 lg:px-20 relative z-10">
        {/* Section Title */}
        <div className="text-center mb-16">
          <h2 className="text-4xl lg:text-5xl font-extrabold text-[#0C0A09] font-nunito mb-4">
            Tricks Lani Does
          </h2>
        </div>

        {/* Bento Grid - Top Row (3 cards) */}
        <div className="grid md:grid-cols-3 gap-3">
          <div className="md:col-span-1 bg-[#FAFAF9] rounded-[14px] overflow-hidden hover:shadow-lg transition-shadow">
            <div className="p-4">
              <div className="aspect-[610/372] overflow-hidden rounded-lg">
                <img
                  src="/bento-saving-products.png"
                  alt="Saving Products"
                  className="w-full h-full object-cover"
                />
              </div>
            </div>
            <div className="px-6 pb-6">
              <h3 className="text-lg font-semibold text-[#0C0A09] text-center">Saving Products</h3>
            </div>
          </div>

          <div className="md:col-span-1 bg-[#FAFAF9] rounded-[14px] overflow-hidden hover:shadow-lg transition-shadow">
            <div className="p-4">
              <div className="aspect-[610/372] overflow-hidden rounded-lg">
                <img
                  src="/bento-lists.png"
                  alt="Lists Curation"
                  className="w-full h-full object-cover"
                />
              </div>
            </div>
            <div className="px-6 pb-6">
              <h3 className="text-lg font-semibold text-[#0C0A09] text-center">Lists Curation</h3>
            </div>
          </div>

          <div className="md:col-span-1 bg-[#FAFAF9] rounded-[14px] overflow-hidden hover:shadow-lg transition-shadow">
            <div className="p-4">
              <div className="aspect-[610/372] overflow-hidden rounded-lg">
                <img
                  src="/bento-price-tracking.png"
                  alt="Price Tracking"
                  className="w-full h-full object-cover"
                />
              </div>
            </div>
            <div className="px-6 pb-6">
              <h3 className="text-lg font-semibold text-[#0C0A09] text-center">Price Tracking</h3>
            </div>
          </div>
        </div>

        {/* Bottom Row - 3 cards */}
        <div className="grid md:grid-cols-3 gap-3 mt-3">
          <div className="bg-[#FAFAF9] rounded-[14px] overflow-hidden hover:shadow-lg transition-shadow">
            <div className="p-4">
              <div className="aspect-[403/244] overflow-hidden rounded-lg">
                <img
                  src="/bento-cart.png"
                  alt="Universal Shopping Cart"
                  className="w-full h-full object-cover"
                />
              </div>
            </div>
            <div className="px-6 pb-6">
              <h3 className="text-lg font-semibold text-[#0C0A09] text-center">
                Universal Shopping Cart
              </h3>
            </div>
          </div>

          <div className="bg-[#FAFAF9] rounded-[14px] overflow-hidden hover:shadow-lg transition-shadow">
            <div className="p-4">
              <div className="aspect-[403/244] overflow-hidden rounded-lg">
                <img
                  src="/bento-style-center.png"
                  alt="Style Center"
                  className="w-full h-full object-cover"
                />
              </div>
            </div>
            <div className="px-6 pb-6">
              <h3 className="text-lg font-semibold text-[#0C0A09] text-center">Style Center</h3>
            </div>
          </div>

          <div className="bg-[#FAFAF9] rounded-[14px] overflow-hidden hover:shadow-lg transition-shadow">
            <div className="p-4">
              <div className="aspect-[403/244] overflow-hidden rounded-lg">
                <img src="/bento-chat.png" alt="Chat" className="w-full h-full object-cover" />
              </div>
            </div>
            <div className="px-6 pb-6">
              <h3 className="text-lg font-semibold text-[#0C0A09] text-center">Chat</h3>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
