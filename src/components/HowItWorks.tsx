'use client';

import React, { useEffect, useRef, useState } from 'react';
import { Phone, ShieldCheck, Lock, Users, MapPin, Sliders } from 'lucide-react';

export default function HowItWorks() {
  const sectionRef = useRef<HTMLDivElement>(null);
  const [scrollProgress, setScrollProgress] = useState(0);
  const [sectionVisible, setSectionVisible] = useState(false);
  const [visibleSteps, setVisibleSteps] = useState<boolean[]>([false, false, false]);
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);
  const [tiltStyles, setTiltStyles] = useState<{ [key: number]: string }>({});

  useEffect(() => {
    // Detect reduced motion preference
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    setPrefersReducedMotion(mediaQuery.matches);
    const listener = (e: MediaQueryListEvent) => setPrefersReducedMotion(e.matches);
    mediaQuery.addEventListener('change', listener);

    if (mediaQuery.matches) {
      setSectionVisible(true);
      setVisibleSteps([true, true, true]);
    }

    return () => {
      mediaQuery.removeEventListener('change', listener);
    };
  }, []);

  // Section visibility observer
  useEffect(() => {
    if (prefersReducedMotion) return;

    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) {
        setSectionVisible(true);
      }
    }, {
      root: null,
      threshold: 0.05, // Trigger when at least 5% of the section is visible
    });

    if (sectionRef.current) {
      observer.observe(sectionRef.current);
    }

    return () => observer.disconnect();
  }, [prefersReducedMotion]);

  // Staggered reveal once section is visible
  useEffect(() => {
    if (!sectionVisible || prefersReducedMotion) return;

    const timers = [
      setTimeout(() => setVisibleSteps((prev) => [true, prev[1], prev[2]]), 100),
      setTimeout(() => setVisibleSteps((prev) => [prev[0], true, prev[2]]), 400),
      setTimeout(() => setVisibleSteps((prev) => [prev[0], prev[1], true]), 700),
    ];

    return () => timers.forEach(clearTimeout);
  }, [sectionVisible, prefersReducedMotion]);

  // Scroll listener for dynamic path drawing
  useEffect(() => {
    if (prefersReducedMotion) return;

    const handleScroll = () => {
      if (!sectionRef.current) return;
      const rect = sectionRef.current.getBoundingClientRect();
      const viewportHeight = window.innerHeight;

      // We want the drawing to start when the top of the section enters 80% of the screen
      // and be fully drawn when the bottom of the section reaches 20% of the screen.
      const startBound = viewportHeight * 0.8;
      const endBound = viewportHeight * 0.2;

      const totalHeight = rect.height;
      const progressDistance = totalHeight + (startBound - endBound);
      const currentScroll = startBound - rect.top;

      let progress = (currentScroll / progressDistance) * 100;
      progress = Math.min(Math.max(progress, 0), 100);

      setScrollProgress(progress);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll(); // initial call

    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, [prefersReducedMotion]);

  // Handle tilt effect
  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>, index: number) => {
    if (prefersReducedMotion) return;
    const card = e.currentTarget;
    const rect = card.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const normalizedX = (x / rect.width) - 0.5;
    const normalizedY = (y / rect.height) - 0.5;

    // Rotate up to 8 degrees
    const rotateX = -normalizedY * 8;
    const rotateY = normalizedX * 8;

    setTiltStyles((prev) => ({
      ...prev,
      [index]: `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale3d(1.01, 1.01, 1.01)`,
    }));
  };

  const handleMouseLeave = (index: number) => {
    setTiltStyles((prev) => ({
      ...prev,
      [index]: 'perspective(1000px) rotateX(0deg) rotateY(0deg) scale3d(1, 1, 1)',
    }));
  };

  const getTiltStyle = (index: number) => {
    if (prefersReducedMotion) return {};
    return {
      transform: tiltStyles[index] || 'perspective(1000px) rotateX(0deg) rotateY(0deg) scale3d(1, 1, 1)',
      transition: 'transform 0.15s ease-out',
    };
  };

  return (
    <section ref={sectionRef} className="bg-customBg-base py-20 lg:py-32 overflow-hidden relative">
      {/* Background accents */}
      <div className="absolute top-1/4 left-1/10 w-96 h-96 bg-brand-primary/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/10 w-96 h-96 bg-brand-secondary/10 rounded-full blur-3xl pointer-events-none" />

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 relative">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto space-y-4 mb-20 md:mb-28">
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-gray-900 leading-tight">
            How <span className="text-brand-primary">FlatNFlatmates</span> Makes Search Simple
          </h2>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Three clear steps to finding a rental property and the perfect flatmates in Pune.
          </p>
        </div>

        {/* Timeline Content */}
        <div className="relative max-w-4xl mx-auto">
          {/* Desktop Center Timeline Line */}
          <div className="absolute left-1/2 top-10 bottom-10 w-0.5 -translate-x-1/2 hidden md:block bg-gray-200/80">
            <div
              className="absolute top-0 left-0 w-full bg-gradient-to-b from-brand-primary via-brand-primaryHover to-brand-secondary rounded-full transition-all duration-150 ease-out origin-top"
              style={{ height: `${prefersReducedMotion ? 100 : scrollProgress}%` }}
            />
          </div>

          {/* Mobile Left Timeline Line */}
          <div className="absolute left-5 top-8 bottom-8 w-0.5 md:hidden bg-gray-200/80">
            <div
              className="absolute top-0 left-0 w-full bg-gradient-to-b from-brand-primary via-brand-primaryHover to-brand-secondary rounded-full transition-all duration-150 ease-out origin-top"
              style={{ height: `${prefersReducedMotion ? 100 : scrollProgress}%` }}
            />
          </div>

          <div className="space-y-20 md:space-y-24">
            {/* Step 1 */}
            <div
              data-step-index="0"
              className="relative grid grid-cols-1 md:grid-cols-12 gap-8 md:gap-0 items-start"
            >
              {/* Desktop Center Badge */}
              <div className="absolute left-1/2 -translate-x-1/2 top-[70px] hidden md:flex z-20">
                <div className="relative flex items-center justify-center">
                  <div
                    className="absolute h-16 w-16 rounded-full bg-brand-primary/10 animate-ping"
                    style={{ animationDuration: '3s' }}
                  />
                  <div className="h-12 w-12 rounded-full bg-gradient-to-tr from-brand-primary to-brand-secondary p-0.5 shadow-md">
                    <div className="h-full w-full rounded-full bg-white flex items-center justify-center">
                      <span className="text-brand-primary font-bold text-lg">1</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Text Column (Cols 7-12 with pl-12) */}
              <div
                className={`md:col-span-6 md:col-start-7 md:pl-12 transition-all duration-1000 transform ${visibleSteps[0] ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
                  }`}
              >
                <div className="flex items-center md:block mb-4">
                  {/* Mobile Badge */}
                  <div className="md:hidden flex-shrink-0 mr-3">
                    <div className="h-9 w-9 rounded-full bg-gradient-to-tr from-brand-primary to-brand-secondary p-0.5 shadow-sm">
                      <div className="h-full w-full rounded-full bg-white flex items-center justify-center">
                        <span className="text-brand-primary font-bold text-sm">1</span>
                      </div>
                    </div>
                  </div>
                  <h3 className="text-xl md:text-2xl font-bold text-gray-900">Set the filters that matter</h3>
                </div>
                <p className="text-base text-gray-600 leading-relaxed pl-12 md:pl-0">
                  Add your office, college, or favorite Pune spot — we'll find homes nearby, in your budget, exactly the way you like them.
                </p>
              </div>

              {/* Illustration Column (Cols 1-6 with pr-12) */}
              <div
                className={`md:col-span-6 md:col-start-1 md:pr-12 transition-all duration-1000 delay-200 transform ${visibleSteps[0]
                  ? 'opacity-100 translate-x-0 translate-y-0 scale-100'
                  : 'opacity-0 -translate-x-8 md:-translate-x-12 translate-y-4 md:translate-y-0 scale-95'
                  } relative`}
              >
                {/* Blob backdrop */}
                <div className="absolute -inset-4 rounded-3xl bg-brand-primary/5 blur-xl group-hover:bg-brand-primary/10 transition-colors duration-500 pointer-events-none hidden md:block" />

                {/* Card Container Wrapper (with overflow-visible and tilt) */}
                <div className="relative ml-12 md:ml-0" style={getTiltStyle(0)}>
                  {/* Floating decorative elements */}
                  <div className="absolute -top-6 -left-6 h-12 w-12 rounded-xl bg-white shadow-lg border border-gray-100/80 items-center justify-center text-brand-primary animate-float hidden lg:flex z-10">
                    <MapPin className="h-5 w-5" />
                  </div>
                  <div className="absolute -bottom-6 -right-6 h-11 w-11 rounded-xl bg-white shadow-lg border border-gray-100/80 items-center justify-center text-brand-secondary animate-float-delayed hidden lg:flex z-10">
                    <Sliders className="h-4.5 w-4.5" />
                  </div>

                  {/* Card Content (with overflow-hidden) */}
                  <div
                    onMouseMove={(e) => handleMouseMove(e, 0)}
                    onMouseLeave={() => handleMouseLeave(0)}
                    className="relative group overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-md transition-shadow duration-300 hover:shadow-xl w-full"
                  >
                    <div className="absolute inset-0 bg-gradient-to-tr from-brand-primary/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />
                    <img
                      src="/images/landing/filter.png"
                      alt="Select Commute & Specs illustration"
                      className="w-full h-auto object-cover transform transition-transform duration-700 group-hover:scale-103"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Step 2 */}
            <div
              data-step-index="1"
              className="relative grid grid-cols-1 md:grid-cols-12 gap-8 md:gap-0 items-start"
            >
              {/* Desktop Center Badge */}
              <div className="absolute left-1/2 -translate-x-1/2 top-[70px] hidden md:flex z-20">
                <div className="relative flex items-center justify-center">
                  <div
                    className="absolute h-16 w-16 rounded-full bg-brand-primary/10 animate-ping"
                    style={{ animationDuration: '3s', animationDelay: '0.5s' }}
                  />
                  <div className="h-12 w-12 rounded-full bg-gradient-to-tr from-brand-primary to-brand-secondary p-0.5 shadow-md">
                    <div className="h-full w-full rounded-full bg-white flex items-center justify-center">
                      <span className="text-brand-primary font-bold text-lg">2</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Text Column (Cols 1-6 with pr-12) */}
              <div
                className={`md:col-span-6 md:col-start-1 md:pr-12 transition-all duration-1000 transform ${visibleSteps[1] ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
                  }`}
              >
                <div className="flex items-center md:block mb-4">
                  {/* Mobile Badge */}
                  <div className="md:hidden flex-shrink-0 mr-3">
                    <div className="h-9 w-9 rounded-full bg-gradient-to-tr from-brand-primary to-brand-secondary p-0.5 shadow-sm">
                      <div className="h-full w-full rounded-full bg-white flex items-center justify-center">
                        <span className="text-brand-primary font-bold text-sm">2</span>
                      </div>
                    </div>
                  </div>
                  <h3 className="text-xl md:text-2xl font-bold text-gray-900">Browse homes & the people in them</h3>
                </div>
                <p className="text-base text-gray-600 leading-relaxed pl-12 md:pl-0">
                  See real listings and roommate profiles side by side — with photos, rent, and who you'll actually be sharing space with.
                </p>
              </div>

              {/* Illustration Column (Cols 7-12 with pl-12) */}
              <div
                className={`md:col-span-6 md:col-start-7 md:pl-12 transition-all duration-1000 delay-200 transform ${visibleSteps[1]
                  ? 'opacity-100 translate-x-0 translate-y-0 scale-100'
                  : 'opacity-0 translate-x-8 md:translate-x-12 translate-y-4 md:translate-y-0 scale-95'
                  } relative`}
              >
                {/* Blob backdrop */}
                <div className="absolute -inset-4 rounded-3xl bg-brand-primary/5 blur-xl group-hover:bg-brand-primary/10 transition-colors duration-500 pointer-events-none hidden md:block" />

                {/* Card Container Wrapper (with overflow-visible and tilt) */}
                <div className="relative ml-12 md:ml-0" style={getTiltStyle(1)}>
                  {/* Floating decorative elements */}
                  <div className="absolute -top-6 -right-6 h-12 w-12 rounded-xl bg-white shadow-lg border border-gray-100/80 items-center justify-center text-brand-primary animate-float hidden lg:flex z-10">
                    <Users className="h-5 w-5" />
                  </div>
                  <div className="absolute -bottom-6 -left-6 h-11 w-11 rounded-xl bg-white shadow-lg border border-gray-100/80 items-center justify-center text-brand-primary animate-float-delayed hidden lg:flex z-10">
                    <ShieldCheck className="h-4.5 w-4.5" />
                  </div>

                  {/* Card Content (with overflow-hidden) */}
                  <div
                    onMouseMove={(e) => handleMouseMove(e, 1)}
                    onMouseLeave={() => handleMouseLeave(1)}
                    className="relative group overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-md transition-shadow duration-300 hover:shadow-xl w-full"
                  >
                    <div className="absolute inset-0 bg-gradient-to-tl from-brand-primary/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />
                    <img
                      src="/images/landing/interactive_map_match_cards_view2.png"
                      alt="Browse Match Cards illustration"
                      className="w-full h-auto object-cover transform transition-transform duration-700 group-hover:scale-103"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Step 3 */}
            <div
              data-step-index="2"
              className="relative grid grid-cols-1 md:grid-cols-12 gap-8 md:gap-0 items-start"
            >
              {/* Desktop Center Badge */}
              <div className="absolute left-1/2 -translate-x-1/2 top-[70px] hidden md:flex z-20">
                <div className="relative flex items-center justify-center">
                  <div
                    className="absolute h-16 w-16 rounded-full bg-brand-primary/10 animate-ping"
                    style={{ animationDuration: '3s', animationDelay: '1s' }}
                  />
                  <div className="h-12 w-12 rounded-full bg-gradient-to-tr from-brand-primary to-brand-secondary p-0.5 shadow-md">
                    <div className="h-full w-full rounded-full bg-white flex items-center justify-center">
                      <span className="text-brand-primary font-bold text-lg">3</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Text Column (Cols 7-12 with pl-12) */}
              <div
                className={`md:col-span-6 md:col-start-7 md:pl-12 transition-all duration-1000 transform ${visibleSteps[2] ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
                  }`}
              >
                <div className="flex items-center md:block mb-4">
                  {/* Mobile Badge */}
                  <div className="md:hidden flex-shrink-0 mr-3">
                    <div className="h-9 w-9 rounded-full bg-gradient-to-tr from-brand-primary to-brand-secondary p-0.5 shadow-sm">
                      <div className="h-full w-full rounded-full bg-white flex items-center justify-center">
                        <span className="text-brand-primary font-bold text-sm">3</span>
                      </div>
                    </div>
                  </div>
                  <h3 className="text-xl md:text-2xl font-bold text-gray-900">Direct Connect</h3>
                </div>
                <p className="text-base text-gray-600 leading-relaxed pl-12 md:pl-0">
                  Reach out to verified flat owners and roommates directly via call or WhatsApp
                </p>
              </div>

              {/* Custom SVG Illustration Column (Cols 1-6 with pr-12) */}
              <div
                className={`md:col-span-6 md:col-start-1 md:pr-12 transition-all duration-1000 delay-200 transform ${visibleSteps[2]
                  ? 'opacity-100 translate-x-0 translate-y-0 scale-100'
                  : 'opacity-0 -translate-x-8 md:-translate-x-12 translate-y-4 md:translate-y-0 scale-95'
                  } relative`}
              >
                {/* Blob backdrop */}
                <div className="absolute -inset-4 rounded-3xl bg-brand-secondary/5 blur-xl group-hover:bg-brand-secondary/10 transition-colors duration-500 pointer-events-none hidden md:block" />

                {/* Card Container Wrapper (with overflow-visible and tilt) */}
                <div className="relative ml-12 md:ml-0" style={getTiltStyle(2)}>
                  {/* Floating decorative elements */}
                  <div className="absolute -top-6 -left-6 h-12 w-12 rounded-xl bg-white shadow-lg border border-gray-100/80 items-center justify-center text-brand-secondary animate-float hidden lg:flex z-10">
                    <ShieldCheck className="h-5 w-5" />
                  </div>
                  <div className="absolute -bottom-6 -right-6 h-11 w-11 rounded-xl bg-white shadow-lg border border-gray-100/80 items-center justify-center text-brand-primary animate-float-delayed hidden lg:flex z-10">
                    <Phone className="h-4.5 w-4.5" />
                  </div>

                  {/* Card Content (with overflow-hidden) */}
                  <div
                    onMouseMove={(e) => handleMouseMove(e, 2)}
                    onMouseLeave={() => handleMouseLeave(2)}
                    className="relative group overflow-hidden rounded-2xl border border-gray-100 bg-white p-6 md:p-8 shadow-md transition-shadow duration-300 hover:shadow-xl w-full aspect-[4/3] flex flex-col justify-between"
                  >
                    <span dangerouslySetInnerHTML={{
                      __html: `
                      <style>
                        @keyframes flowDash {
                          to {
                            stroke-dashoffset: -20;
                          }
                        }
                        @keyframes pulseGlow {
                          0%, 100% {
                            transform: scale(1);
                            opacity: 0.25;
                          }
                        }
                        @keyframes float {
                          0%, 100% {
                            transform: translateY(0px) rotate(0deg);
                          }
                        }
                        @keyframes floatDelayed {
                          0%, 100% {
                            transform: translateY(0px) rotate(0deg);
                          }
                        }
                        .animate-flow-dash {
                          stroke-dasharray: 6, 4;
                          animation: flowDash 1.5s linear infinite;
                        }
                        .animate-pulse-glow {
                          animation: pulseGlow 3s ease-in-out infinite;
                        }
                        .animate-float {
                          animation: float 4s ease-in-out infinite;
                        }
                        .animate-float-delayed {
                          animation: floatDelayed 4.5s ease-in-out infinite;
                        }
                      </style>
                      `}} />

                    {/* Tech backdrop */}
                    <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-brand-primary/10 via-brand-secondary/5 to-transparent opacity-70 pointer-events-none animate-pulse-glow" style={{ animationDuration: '6s' }} />
                    <div className="absolute inset-0 bg-[linear-gradient(to_right,#00000003_1px,transparent_1px),linear-gradient(to_bottom,#00000003_1px,transparent_1px)] bg-[size:16px_16px] pointer-events-none" />

                    <div className="relative z-10 w-full h-full flex flex-col justify-between">
                      {/* Header info */}
                      <div className="flex items-center justify-between border-b border-gray-100 pb-3">
                        <div className="flex items-center space-x-2">
                          <span className="h-2 w-2 rounded-full bg-brand-primary animate-pulse" />
                          <span className="text-[10px] font-bold tracking-wider text-brand-primary uppercase">Verified Direct Connect</span>
                        </div>
                        <span className="text-[9px] font-semibold text-brand-primary bg-brand-primary/10 px-2 py-0.5 rounded-full border border-brand-primary/20">
                          Call • WhatsApp
                        </span>
                      </div>

                      {/* Calling UI */}
                      <div className="flex items-center justify-between my-auto relative px-2">
                        {/* Caller */}
                        <div className="flex flex-col items-center space-y-1.5 z-10">
                          <div className="relative">
                            <div className="absolute -inset-1 rounded-full bg-brand-primary/15 blur animate-pulse" />
                            <div className="h-11 w-11 rounded-full bg-brand-primary border border-white flex items-center justify-center shadow-md">
                              <Users className="h-5 w-5 text-white" />
                            </div>
                          </div>
                          <span className="text-[11px] font-semibold text-text-primary">You</span>
                        </div>

                        {/* Connection node */}
                        <div className="flex flex-col items-center space-y-1.5 z-10">
                          <div className="relative">
                            {/* Glowing pulse rings */}
                            <div className="absolute -inset-2 rounded-full bg-brand-primary/10 blur animate-pulse-glow" />
                            <div className="h-14 w-14 rounded-full bg-gradient-to-br from-brand-primary to-brand-tertiary border border-white flex items-center justify-center shadow-lg relative">
                              <ShieldCheck className="h-6 w-6 text-white" />
                            </div>
                          </div>
                        </div>

                        {/* Receiver */}
                        <div className="flex flex-col items-center space-y-1.5 z-10">
                          <div className="relative">
                            <div className="absolute -inset-1 rounded-full bg-brand-primary/15 blur animate-pulse" />
                            <div className="h-11 w-11 rounded-full bg-brand-primary border border-white flex items-center justify-center shadow-md">
                              <Users className="h-5 w-5 text-white" />
                            </div>
                          </div>
                          <span className="text-[11px] font-semibold text-text-primary">Pune Owner</span>
                        </div>

                        {/* SVG Line with moving dash */}
                        <svg className="absolute inset-0 w-full h-full pointer-events-none" viewBox="0 0 280 100" fill="none" preserveAspectRatio="none">
                          <path
                            d="M50,45 C100,20 180,20 230,45"
                            stroke="url(#proxy-line-grad)"
                            strokeWidth="2"
                            className="animate-flow-dash"
                          />
                          <defs>
                            <linearGradient id="proxy-line-grad" x1="0%" y1="0%" x2="100%" y2="0%">
                              <stop offset="0%" stopColor="#097969" />
                              <stop offset="50%" stopColor="#5097A4" />
                              <stop offset="100%" stopColor="#097969" />
                            </linearGradient>
                          </defs>
                        </svg>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
