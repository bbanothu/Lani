'use client';

import { useState, useEffect } from 'react';

export default function TestimonialsCarousel() {
  const [activeIndex, setActiveIndex] = useState(0);

  const testimonials = [
    {
      quote:
        "Wait... this is kind of awesome. I'm looking at all the products I've been browsing and they're just here. I didn't have to do anything.",
      author: 'Vishali',
    },
    {
      quote:
        "Lani helps you not forget things too, which is huge. I'll see something I love and then completely lose it two days later.",
      author: 'Dayna',
    },
    {
      quote:
        "It reminds me of a Pinterest page but for shopping. I can actually see everything I'm considering instead of just hoping I remember.",
      author: 'Lauren',
    },
    {
      quote:
        'This is the perfect tool for someone who has everything. Like, I can save gift ideas throughout the year and actually remember them when I need to.',
      author: 'Anna',
    },
    {
      quote:
        'There was a $100 difference on the TV I was looking at. A hundred dollars! I almost bought it from the wrong place.',
      author: 'Jen',
    },
    {
      quote:
        "I was surprised by the range of things it tracked. Concert tickets, a Pilates reformer, hotel rooms... I didn't expect it to work for everything.",
      author: 'Chloe',
    },
  ];

  // Calculate total pages (2 testimonials per page)
  const itemsPerPage = 2;
  const totalPages = Math.ceil(testimonials.length / itemsPerPage);

  // Auto-scroll every 5 seconds (move to next pair)
  useEffect(() => {
    const interval = setInterval(() => {
      setActiveIndex((prev) => (prev >= totalPages - 1 ? 0 : prev + 1));
    }, 5000);

    return () => clearInterval(interval);
  }, [totalPages]);

  const goToPrevious = () => {
    setActiveIndex((prev) => (prev === 0 ? totalPages - 1 : prev - 1));
  };

  const goToNext = () => {
    setActiveIndex((prev) => (prev >= totalPages - 1 ? 0 : prev + 1));
  };

  // Get current pair of testimonials to display
  const startIndex = activeIndex * itemsPerPage;
  const currentTestimonials = testimonials.slice(startIndex, startIndex + itemsPerPage);

  return (
    <section className="bg-white py-24">
      <div className="container mx-auto px-4 sm:px-8 lg:px-20">
        {/* Section Title */}
        <div className="text-center mb-16">
          <h2 className="text-4xl lg:text-5xl font-extrabold text-[#0C0A09] font-nunito">
            What Our Users Say
          </h2>
        </div>

        {/* Testimonial Carousel */}
        <div className="max-w-4xl mx-auto relative">
          <div className="flex items-center gap-8">
            {/* Previous Button */}
            <button
              onClick={goToPrevious}
              className="hidden md:flex flex-shrink-0 w-10 h-10 rounded-full border border-[#E7E5E4] bg-white hover:bg-gray-50 transition items-center justify-center"
              aria-label="Previous testimonial"
            >
              <svg
                className="w-5 h-5 text-gray-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 19l-7-7 7-7"
                />
              </svg>
            </button>

            {/* Testimonial Content - Show 2 at a time with vertical divider */}
            <div className="flex-1 min-h-[240px] flex items-center justify-center">
              <div className="relative w-full">
                <div className="transition-all duration-500">
                  <div className="grid md:grid-cols-2 gap-8 md:divide-x divide-[#E7E5E4]">
                    {currentTestimonials.map((testimonial, index) => (
                      <div
                        key={startIndex + index}
                        className="space-y-4 px-4 md:px-8 first:pl-0 last:pr-0"
                      >
                        {/* Quote */}
                        <p className="text-lg font-medium text-[#0C0A09] leading-relaxed">
                          &ldquo;{testimonial.quote}&rdquo;
                        </p>

                        {/* Author */}
                        <div className="text-base text-[#0C0A09] font-medium">
                          {testimonial.author}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Next Button */}
            <button
              onClick={goToNext}
              className="hidden md:flex flex-shrink-0 w-10 h-10 rounded-full border border-[#E7E5E4] bg-white hover:bg-gray-50 transition items-center justify-center"
              aria-label="Next testimonial"
            >
              <svg
                className="w-5 h-5 text-gray-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 5l7 7-7 7"
                />
              </svg>
            </button>
          </div>

          {/* Mobile Navigation Buttons */}
          <div className="flex md:hidden justify-center gap-4 mt-8">
            <button
              onClick={goToPrevious}
              className="w-10 h-10 rounded-full border border-[#E7E5E4] bg-white hover:bg-gray-50 transition flex items-center justify-center"
              aria-label="Previous testimonial"
            >
              <svg
                className="w-5 h-5 text-gray-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 19l-7-7 7-7"
                />
              </svg>
            </button>
            <button
              onClick={goToNext}
              className="w-10 h-10 rounded-full border border-[#E7E5E4] bg-white hover:bg-gray-50 transition flex items-center justify-center"
              aria-label="Next testimonial"
            >
              <svg
                className="w-5 h-5 text-gray-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 5l7 7-7 7"
                />
              </svg>
            </button>
          </div>

          {/* Pagination Dots - One dot per page (pair) */}
          <div className="flex justify-center gap-2 mt-8">
            {Array.from({ length: totalPages }).map((_, index) => (
              <button
                key={index}
                onClick={() => setActiveIndex(index)}
                className={`transition-all duration-300 rounded-full ${
                  index === activeIndex
                    ? 'w-8 h-2 bg-[#F97316]'
                    : 'w-2 h-2 bg-[#E7E5E4] hover:bg-[#F97316]/50'
                }`}
                aria-label={`Go to page ${index + 1}`}
              />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
