'use client';

import { useState } from 'react';
import Image from 'next/image';
import NewHeader from '@/components/figma-landing/NewHeader';
import NewHero from '@/components/figma-landing/NewHero';
import FeaturesGrid from '@/components/figma-landing/FeaturesGrid';
import VideoSection from '@/components/figma-landing/VideoSection';
import CrossPlatformSection from '@/components/figma-landing/CrossPlatformSection';
import TestimonialsSection from '@/components/figma-landing/TestimonialsSection';
import TestimonialWithBrowsers from '@/components/figma-landing/TestimonialWithBrowsers';
import BentoGrid from '@/components/figma-landing/BentoGrid';
import HowItWorks from '@/components/figma-landing/HowItWorks';
import ProblemSolutionSection from '@/components/figma-landing/ProblemSolutionSection';
import TestimonialsCarousel from '@/components/figma-landing/TestimonialsCarousel';
import FinalCTA from '@/components/figma-landing/FinalCTA';
import NewFooter from '@/components/figma-landing/NewFooter';

const FEATURES = [
  {
    title: 'Fetches every product',
    description: 'Auto-saves every product, even screenshots',
    icon: (
      <svg
        width="24"
        height="24"
        viewBox="0 0 24 24"
        fill="none"
        stroke="#f97316"
        strokeWidth="1.75"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4Z" />
        <path d="M3 6h18" />
        <path d="M16 10a4 4 0 0 1-8 0" />
      </svg>
    ),
  },
  {
    title: 'Does helpful tricks',
    description: 'Price tracking, alternatives, styling advice',
    icon: (
      <svg
        width="24"
        height="24"
        viewBox="0 0 24 24"
        fill="none"
        stroke="#f97316"
        strokeWidth="1.75"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M12 3v4M12 17v4M3 12h4M17 12h4M6 6l2.5 2.5M15.5 15.5 18 18M18 6l-2.5 2.5M8.5 15.5 6 18" />
      </svg>
    ),
  },
  {
    title: 'Loyal to your taste',
    description: 'Learns what you love and personalizes for you',
    icon: (
      <svg
        width="24"
        height="24"
        viewBox="0 0 24 24"
        fill="none"
        stroke="#f97316"
        strokeWidth="1.75"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.6l-1-1a5.5 5.5 0 0 0-7.8 7.8l1 1L12 21l7.8-7.6 1-1a5.5 5.5 0 0 0 0-7.8Z" />
      </svg>
    ),
  },
];

function StartBrowsing() {
  return (
    <div className="animate-fade-in flex min-h-screen items-center justify-center bg-cream px-6 py-12">
      <div className="w-full max-w-[960px]">
        <div className="mb-8 flex justify-center">
          <div className="relative h-32 w-32">
            <Image
              src="/lani-logo.png"
              alt="Lani Logo"
              width={128}
              height={128}
              className="object-contain"
            />
          </div>
        </div>

        <div className="mb-12 text-center">
          <h1 className="mb-3 text-4xl font-bold text-[#0a0a0a]">Meet Lani</h1>
          <h2 className="mb-2 text-xl font-semibold text-[#f97316]">
            Your Personal Shopping Retriever
          </h2>
          <p className="text-base font-medium text-[#64748b]">
            Loyal to your taste, never forgets.
          </p>
        </div>

        <div className="mb-12 grid grid-cols-1 gap-6 md:grid-cols-3">
          {FEATURES.map((feature) => (
            <div key={feature.title} className="rounded-xl bg-white p-6 shadow-sm">
              <div className="flex items-start gap-4">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-[#fff7ed]">
                  {feature.icon}
                </div>
                <div className="flex-1">
                  <h3 className="mb-2 text-base font-medium text-[#0a0a0a]">{feature.title}</h3>
                  <p className="text-base leading-relaxed text-[#737373]">{feature.description}</p>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="flex justify-center">
          <a
            href="/dashboard"
            className="inline-flex items-center gap-2 rounded-lg bg-[#f97316] px-8 py-4 text-base font-medium text-white shadow-sm transition-colors duration-200 hover:bg-[#ea580c]"
          >
            Start Browsing
            <svg
              width="16"
              height="16"
              viewBox="0 0 16 16"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              className="ml-1"
            >
              <path
                d="M3.33337 8H12.6667M12.6667 8L8.00004 3.33333M12.6667 8L8.00004 12.6667"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </a>
        </div>
      </div>
    </div>
  );
}

export default function HomePage() {
  const [view, setView] = useState<'landing' | 'start'>('landing');

  if (view === 'start') return <StartBrowsing />;

  const showStart = () => setView('start');

  return (
    <div className="animate-fade-in min-h-screen bg-white">
      <NewHeader onShopWithLani={showStart} />
      <NewHero />
      <FeaturesGrid />
      <VideoSection />
      <CrossPlatformSection />
      <TestimonialsSection />
      <TestimonialWithBrowsers />
      <BentoGrid />
      <HowItWorks />
      <ProblemSolutionSection />
      <TestimonialsCarousel />
      <FinalCTA onShopWithLani={showStart} />
      <NewFooter />
    </div>
  );
}
