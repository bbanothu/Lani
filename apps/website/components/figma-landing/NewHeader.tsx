'use client';

import { useState, useEffect } from 'react';
import { getProducts, subscribeToProducts } from '@/lib/products';

export default function NewHeader({ onShopWithLani }: { onShopWithLani?: () => void }) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [productCount, setProductCount] = useState<number>(0);
  const [displayCount, setDisplayCount] = useState<number>(0);

  useEffect(() => {
    const update = () => getProducts().then((p) => setProductCount(p.length));
    update();
    return subscribeToProducts(update);
  }, []);

  // Animate count changes with smooth transition
  useEffect(() => {
    if (productCount === 0) {
      setDisplayCount(0);
      return;
    }

    // If this is the first load, animate from 0
    if (displayCount === 0) {
      const duration = 2000; // 2 seconds
      const steps = 60;
      const increment = productCount / steps;
      let currentStep = 0;

      const timer = setInterval(() => {
        currentStep++;
        if (currentStep >= steps) {
          setDisplayCount(productCount);
          clearInterval(timer);
        } else {
          setDisplayCount(Math.floor(increment * currentStep));
        }
      }, duration / steps);

      return () => clearInterval(timer);
    } else {
      // For updates, animate the difference
      const diff = productCount - displayCount;
      if (diff !== 0) {
        const duration = 1000; // 1 second for updates
        const steps = 20;
        const increment = diff / steps;
        let currentStep = 0;

        const timer = setInterval(() => {
          currentStep++;
          if (currentStep >= steps) {
            setDisplayCount(productCount);
            clearInterval(timer);
          } else {
            setDisplayCount(Math.floor(displayCount + increment * currentStep));
          }
        }, duration / steps);

        return () => clearInterval(timer);
      }
    }
  }, [productCount]);

  const scrollToSection = (sectionId: string) => {
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({
        behavior: 'smooth',
        block: 'start',
      });
    }
    setIsMobileMenuOpen(false);
  };

  return (
    <header className="bg-white border-b border-gray-100">
      <div className="container mx-auto px-4 sm:px-8 lg:px-20 py-5">
        <div className="flex justify-between items-center">
          {/* Same mark as the extension sidepanel */}
          <div className="flex items-center gap-3">
            <img src="/icon.png" alt="Lani" className="h-12 w-12 rounded-md object-contain" />
            <span className="text-2xl font-bold tracking-tight text-ink">Lani</span>
          </div>

          {/* Stats Badge and Navigation - Side by Side */}
          <div className="hidden md:flex items-center gap-6 lg:gap-8">
            {/* Products Saved Badge - Animated live counter */}
            {displayCount > 0 && (
              <div className="flex items-center gap-3 px-2 py-1 rounded-lg border border-[#F97316] bg-gradient-to-br from-white to-[#FFF7ED] transition-all duration-300">
                <div className="relative flex items-center">
                  <span className="flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#F97316] opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-[#FF6900]"></span>
                  </span>
                </div>asd
                <span className="text-xl font-semibold text-[#0C0A09] tabular-nums">
                  {displayCount.toLocaleString('en-US')}
                </span>
                <span className="text-base text-[#0C0A09]">Products Saved</span>
                {/* Live indicator */}
              </div>
            )}

            {/* Navigation Links */}
            <button
              onClick={() => scrollToSection('features')}
              className="text-sm text-[#4A5565] hover:text-[#F97316] transition -tracking-[0.15px]"
            >
              Features
            </button>
            <button
              onClick={() => scrollToSection('how-it-works')}
              className="text-sm text-[#4A5565] hover:text-[#F97316] transition -tracking-[0.15px]"
            >
              How it works
            </button>
            <button
              type="button"
              onClick={onShopWithLani}
              className="px-9 py-2 bg-[#FF6900] text-white text-base rounded-lg hover:bg-[#F97316] transition"
            >
              Shop with Lani
            </button>
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="md:hidden p-2 rounded-lg hover:bg-gray-100 transition-colors"
          >
            <svg
              className="w-6 h-6 text-[#4A5565]"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              {isMobileMenuOpen ? (
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M6 18L18 6M6 6l12 12"
                />
              ) : (
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M4 6h16M4 12h16M4 18h16"
                />
              )}
            </svg>
          </button>
        </div>

        {/* Mobile Menu */}
        {isMobileMenuOpen && (
          <div className="md:hidden mt-4 p-4 bg-white rounded-lg shadow-lg border border-gray-200">
            {/* Mobile Product Counter */}
            {displayCount > 0 && (
              <div className="mb-4 flex items-center justify-center gap-2 px-4 py-3 rounded-lg border border-[#F97316] bg-gradient-to-br from-white to-[#FFF7ED]">
                <span className="text-lg font-semibold text-[#0C0A09] tabular-nums">
                  {displayCount.toLocaleString('en-US')}
                </span>
                <span className="text-sm text-[#0C0A09]">Products Saved</span>
                <div className="relative flex items-center">
                  <span className="flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#F97316] opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-[#FF6900]"></span>
                  </span>
                </div>
              </div>
            )}

            <nav className="flex flex-col gap-4">
              <button
                onClick={() => scrollToSection('features')}
                className="text-left text-base text-[#4A5565] hover:text-[#F97316] transition py-2"
              >
                Features
              </button>
              <button
                onClick={() => scrollToSection('how-it-works')}
                className="text-left text-base text-[#4A5565] hover:text-[#F97316] transition py-2"
              >
                How it works
              </button>
              <button
                type="button"
                onClick={() => {
                  setIsMobileMenuOpen(false);
                  onShopWithLani?.();
                }}
                className="w-full px-6 py-3 bg-[#FF6900] text-white rounded-lg hover:bg-[#F97316] transition inline-block text-center"
              >
                Shop with Lani
              </button>
            </nav>
          </div>
        )}
      </div>
    </header>
  );
}
