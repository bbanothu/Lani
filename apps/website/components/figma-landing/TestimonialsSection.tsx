'use client';

export default function TestimonialsSection() {
  return (
    <section className="bg-white py-24">
      <div className="container mx-auto px-4 sm:px-8 lg:px-20">
        <div className="max-w-3xl mx-auto text-center space-y-8">
          {/* Testimonial Quote */}
          <blockquote className="text-2xl lg:text-3xl font-medium text-[#0C0A09] leading-snug">
            &ldquo;Wait... this is kind of awesome. I&apos;m looking at all the products I&apos;ve
            been browsing and they&apos;re just here. I didn&apos;t have to do anything.&rdquo;
          </blockquote>

          {/* Author */}
          <div className="text-center">
            <div className="text-lg font-semibold text-[#F97316]">— Vishali</div>
          </div>
        </div>
      </div>
    </section>
  );
}
