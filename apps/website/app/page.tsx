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

export default function HomePage() {
  return (
    <div className="min-h-screen bg-white">
      <NewHeader />
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
      <FinalCTA />
      <NewFooter />
    </div>
  );
}
