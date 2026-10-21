import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { LandingHeader } from '../components/landing/LandingHeader';
import { HeroSection } from '../components/landing/HeroSection';
import { FloatingFeatureCards } from '../components/landing/FloatingFeatureCards';
import { CompleteSolutionsGrid } from '../components/landing/CompleteSolutionsGrid';
import { AutomationSection } from '../components/landing/AutomationSection';
import { TestimonialsSection } from '../components/landing/TestimonialsSection';
import { PlansSection } from '../components/landing/PlansSection';
import { FinalCtaBanner } from '../components/landing/FinalCtaBanner';
import { LandingFooter } from '../components/landing/LandingFooter';
import { DemoModal } from '../components/landing/DemoModal';
import { CardZoomModal, ZoomCardData } from '../components/landing/CardZoomModal';

import { 
  trackPageView, 
  trackTrialStartClick, 
  trackDemoRequestClick, 
  trackEvent 
} from '../services/analyticsService';

export default function Landing() {
  const navigate = useNavigate();
  const [isDemoModalOpen, setIsDemoModalOpen] = useState(false);
  const [preselectedPlan, setPreselectedPlan] = useState<string | undefined>(undefined);
  const [zoomedCard, setZoomedCard] = useState<ZoomCardData | null>(null);

  useEffect(() => {
    document.title = 'BellaPDV Pro — Sistema ERP & PDV Inteligente para Barbearias e Negócios de Beleza';
    trackPageView('BellaPDV Pro — Landing Page', '/landing');
  }, []);

  const handleOpenDemoModal = (planName?: string) => {
    trackDemoRequestClick({
      source: 'landing_main_cta',
      plan: planName || 'Geral'
    });
    setPreselectedPlan(planName);
    setIsDemoModalOpen(true);
  };

  const handleOpenHowItWorks = () => {
    trackEvent('how_it_works_view', { source: 'landing_hero' });
    const recursosEl = document.getElementById('recursos');
    if (recursosEl) {
      recursosEl.scrollIntoView({ behavior: 'smooth' });
    } else {
      handleOpenDemoModal();
    }
  };

  const handleSelectPlan = (planName: string) => {
    // Conversion: Start Trial / Select Plan
    trackTrialStartClick({
      source: 'landing_plans_section',
      plan: planName,
      promoText: planName.toLowerCase().includes('básico') 
        ? 'De R$ 89,90 por R$ 29,90 nos primeiros 3 meses' 
        : undefined,
      buttonLabel: 'Começar com 15 Dias Grátis'
    });

    // Allows user to either register directly with pre-selected plan or request custom setup
    navigate(`/login?signup=true&plan=${encodeURIComponent(planName)}`);
  };

  return (
    <div className="bg-[#030817] text-white min-h-screen font-sans selection:bg-[#00D9FF]/30 selection:text-white overflow-x-hidden relative">
      
      {/* Background Cyber Ambient Radial Gradients */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1200px] h-[700px] bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-[#087CFF]/12 via-[#030817] to-transparent opacity-80" />
        <div className="absolute bottom-0 right-0 w-[800px] h-[800px] bg-[radial-gradient(ellipse_at_bottom_right,_var(--tw-gradient-stops))] from-[#8545FF]/10 via-[#030817] to-transparent" />
      </div>

      {/* Main Content Layout */}
      <div className="relative z-10">
        
        {/* Navigation Header */}
        <LandingHeader onRequestDemo={() => handleOpenDemoModal()} />

        {/* Hero Section */}
        <HeroSection 
          onRequestDemo={() => handleOpenDemoModal()} 
          onOpenHowItWorks={handleOpenHowItWorks} 
        />

        {/* Floating Feature Cards (PDV, Agenda, CRM, Marketing IA) */}
        <FloatingFeatureCards onCardClick={(card) => setZoomedCard(card)} />

        {/* Complete Solutions 10-Card Grid */}
        <CompleteSolutionsGrid />

        {/* Automation & Growth (Phone Mockup + Android App) */}
        <AutomationSection />

        {/* Testimonials (Authentic & compliant with anti-slop rules) */}
        <TestimonialsSection />

        {/* Commercial Plans & Pricing */}
        <PlansSection onSelectPlan={handleSelectPlan} />

        {/* Final Conversion CTA Banner */}
        <FinalCtaBanner onRequestDemo={() => handleOpenDemoModal()} />

        {/* Premium Footer with ATR Studio Badge */}
        <LandingFooter />

      </div>

      {/* Interactive Modals */}
      <DemoModal 
        isOpen={isDemoModalOpen} 
        onClose={() => setIsDemoModalOpen(false)} 
        preselectedPlan={preselectedPlan}
      />

      <CardZoomModal 
        card={zoomedCard} 
        onClose={() => setZoomedCard(null)} 
      />

    </div>
  );
}
