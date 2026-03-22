"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

export default function Home() {
  const heroRef = useRef<HTMLElement>(null);
  const sectionRef = useRef<HTMLElement>(null);
  const router = useRouter();

  useEffect(() => {
    const prefersReducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;

    if (prefersReducedMotion) {
      const h1 = document.querySelector("h1");
      const searchBar = document.querySelector(".hero-search-bar");
      if (h1) h1.style.opacity = "1";
      document
        .querySelectorAll(".hero-word")
        .forEach((w) => ((w as HTMLElement).style.transform = "translateY(0)"));
      if (searchBar) {
        (searchBar as HTMLElement).style.opacity = "1";
        (searchBar as HTMLElement).style.transform = "translateY(0) scale(1)";
      }
      return;
    }

    // Hero headline reveal
    gsap.to("h1", { opacity: 1, duration: 0.2 });
    gsap.to(".hero-word", {
      y: "0%",
      duration: 1.4,
      ease: "power4.out",
      stagger: 0.06,
      delay: 0.2,
    });

    // Hero image parallax
    gsap.to(".hero-bg-img", {
      yPercent: 15,
      ease: "none",
      scrollTrigger: {
        trigger: "header",
        start: "top top",
        end: "bottom top",
        scrub: true,
      },
    });

    // Search bar intro
    gsap.to(".hero-search-bar", {
      y: 0,
      opacity: 1,
      scale: 1,
      duration: 1.2,
      delay: 0.8,
      ease: "power3.out",
    });

    // Section reveal observer
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("reveal-active");
          }
        });
      },
      { threshold: 0.1 }
    );
    document
      .querySelectorAll(".reveal-item")
      .forEach((el) => observer.observe(el));

    return () => observer.disconnect();
  }, []);

  const handleEnter = () => {
    router.push("/chat");
  };

  return (
    <div className="selection:bg-stone-900 selection:text-white" style={{ fontFamily: "'Inter', sans-serif" }}>
      {/* ===== HERO SECTION ===== */}
      <header
        ref={heroRef}
        className="relative w-full h-screen min-h-[700px] flex flex-col justify-end pb-24 md:pb-32 px-6 md:px-12 overflow-hidden"
      >
        {/* Background */}
        <div className="absolute inset-0 z-0">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="https://hoirqrkdgbmvpwutwuwj.supabase.co/storage/v1/object/public/assets/assets/46011e44-1f9d-4c5e-b716-300b8ce1381e_3840w.jpg"
            alt="Luxury Interior"
            className="w-full h-full object-cover hero-bg-img"
          />
          <div className="absolute inset-0 bg-black/10" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
        </div>

        {/* Content */}
        <div className="relative z-10 w-full max-w-[1400px] mx-auto fade-in-up">
          <div className="max-w-4xl">
            <span className="block text-[10px] uppercase tracking-widest text-white/60 mb-6">
              Solar Energy & Photovoltaic Solutions
            </span>

            <h1
              className="text-4xl md:text-6xl lg:text-7xl text-white tracking-tight leading-[1.1] mb-6 opacity-0"
              style={{ fontFamily: "var(--font-dm-sans), 'DM Sans', sans-serif" }}
            >
              <span className="block overflow-hidden">
                <span className="inline-block overflow-hidden align-top">
                  <span className="inline-block hero-word translate-y-full">
                    Powering
                  </span>
                </span>{" "}
                <span className="inline-block overflow-hidden align-top">
                  <span className="inline-block hero-word translate-y-full">
                    the
                  </span>
                </span>{" "}
                <span className="inline-block overflow-hidden align-top">
                  <span className="inline-block hero-word translate-y-full">
                    Future
                  </span>
                </span>
              </span>
              <span className="block overflow-hidden">
                <span className="inline-block overflow-hidden align-top">
                  <span className="inline-block hero-word translate-y-full">
                    with
                  </span>
                </span>{" "}
                <span className="inline-block overflow-hidden align-top">
                  <span className="inline-block hero-word translate-y-full">
                    Solar
                  </span>
                </span>{" "}
                <span className="inline-block overflow-hidden align-top">
                  <span className="inline-block hero-word translate-y-full">
                    Energy.
                  </span>
                </span>
              </span>
            </h1>

            <p className="text-white/90 text-sm md:text-base font-light mb-12 max-w-lg">
              Advanced photovoltaic systems engineered for maximum efficiency and sustainability.
            </p>

            {/* Minimal Search Bar */}
            <div className="mt-16 bg-white/10 backdrop-blur-md border border-white/20 rounded-[2px] px-8 py-6 flex flex-col md:flex-row items-center gap-6 max-w-5xl hero-search-bar opacity-0 translate-y-10 scale-95 origin-center">
              <div className="w-full md:flex-1 group cursor-pointer">
                <span className="block text-white/50 text-[10px] uppercase tracking-widest mb-2 group-hover:text-white transition-colors duration-300">
                  Panel Type
                </span>
                <div className="flex items-center justify-between border-b border-white/20 pb-2 group-hover:border-white transition-colors duration-300">
                  <span className="text-white text-sm font-light">
                    Monocrystalline
                  </span>
                  <svg className="w-4 h-4 text-white/70 group-hover:text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 9l-7 7-7-7" /></svg>
                </div>
              </div>

              <div className="w-full md:flex-1 group cursor-pointer">
                <span className="block text-white/50 text-[10px] uppercase tracking-widest mb-2 group-hover:text-white transition-colors duration-300">
                  Capacity
                </span>
                <div className="flex items-center justify-between border-b border-white/20 pb-2 group-hover:border-white transition-colors duration-300">
                  <span className="text-white text-sm font-light">
                    10 kW System
                  </span>
                  <svg className="w-4 h-4 text-white/70 group-hover:text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 9l-7 7-7-7" /></svg>
                </div>
              </div>

              <div className="w-full md:flex-1 group cursor-pointer">
                <span className="block text-white/50 text-[10px] uppercase tracking-widest mb-2 group-hover:text-white transition-colors duration-300">
                  Installation
                </span>
                <div className="flex items-center justify-between border-b border-white/20 pb-2 group-hover:border-white transition-colors duration-300">
                  <span className="text-white text-sm font-light">
                    Rooftop / Ground
                  </span>
                  <svg className="w-4 h-4 text-white/70 group-hover:text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 9l-7 7-7-7" /></svg>
                </div>
              </div>

              <div className="w-full md:flex-1 group cursor-pointer">
                <span className="block text-white/50 text-[10px] uppercase tracking-widest mb-2 group-hover:text-white transition-colors duration-300">
                  Region
                </span>
                <div className="flex items-center justify-between border-b border-white/20 pb-2 group-hover:border-white transition-colors duration-300">
                  <span className="text-white text-sm font-light">
                    Worldwide
                  </span>
                  <svg className="w-4 h-4 text-white/70 group-hover:text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 9l-7 7-7-7" /></svg>
                </div>
              </div>

              <div className="w-full md:w-auto mt-4 md:mt-0">
                <button className="w-full text-[10px] uppercase tracking-widest bg-white text-stone-900 px-6 py-3 rounded-[2px] font-medium hover:bg-stone-900 hover:text-white transition-all duration-400">
                  Get Your Solar Quote
                </button>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* ===== ETHERIA SECTION ===== */}
      <section
        ref={sectionRef}
        className="md:px-12 md:py-32 text-stone-800 bg-[#EAE8E2] w-full pt-20 pr-6 pb-20 pl-6 relative overflow-hidden"
        style={{ fontFamily: "'Inter', sans-serif" }}
      >
        {/* Section Tag */}
        <div className="mb-12 border-b border-stone-300/50 pb-6 md:mb-24 reveal-item">
          <div className="flex items-center justify-between text-xs font-medium uppercase tracking-widest text-stone-500">
            <span style={{ letterSpacing: "-0.025em" }}>
              {"//"} Because true power comes from the sun.
            </span>
            <button className="rounded-full border border-stone-400/30 p-2 hover:bg-stone-200 transition-colors">
              <svg className="w-[1.125rem] h-[1.125rem]" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 19l-7-7 7-7" /></svg>
            </button>
          </div>
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 gap-y-16 lg:grid-cols-12 lg:gap-x-12">
          {/* Left Column: Image */}
          <div className="flex flex-col gap-4 lg:col-span-4 lg:mt-24 reveal-item anim-delay-100">
            <div className="group relative aspect-[4/5] overflow-hidden rounded-sm bg-stone-300">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="https://hoirqrkdgbmvpwutwuwj.supabase.co/storage/v1/object/public/assets/assets/0c8f3560-bcc7-441d-9d12-6eb2fbb9aeea_800w.webp"
                alt="Architecture"
                className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
              />
            </div>
            <div className="flex justify-between text-xs font-medium uppercase tracking-widest text-stone-500">
              <span style={{ letterSpacing: "-0.025em" }}>
                [01] Solar Innovation Hub
              </span>
              <span style={{ letterSpacing: "-0.025em" }}>&#169;2025</span>
            </div>
          </div>

          {/* Right Column Area */}
          <div className="flex flex-col gap-20 lg:col-span-8">
            <p
              className="leading-tight md:text-5xl lg:text-[3.5rem] lg:leading-[1.15] text-3xl font-light text-stone-900 reveal-item anim-delay-200"
              style={{
                fontFamily: "var(--font-dm-sans), 'DM Sans', sans-serif",
                letterSpacing: "-0.05em",
              }}
            >
              At <span className="font-light">NOVERA</span>, we see solar energy as the ultimate power source of the future. Every element of our photovoltaic technology is engineered for maximum impact.
            </p>

            {/* Sub Grid */}
            <div className="grid grid-cols-1 gap-12 md:grid-cols-2">
              <div className="flex flex-col gap-4 reveal-item anim-delay-300">
                <div className="group relative aspect-[4/5] overflow-hidden rounded-sm bg-stone-300">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src="https://hoirqrkdgbmvpwutwuwj.supabase.co/storage/v1/object/public/assets/assets/1f6c82f7-e18c-4dc9-82dc-96bb615bfa30_800w.webp"
                    alt="Neural Lab"
                    className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
                  />
                </div>
                <div className="flex justify-between text-xs font-medium uppercase tracking-widest text-stone-500">
                  <span style={{ letterSpacing: "-0.025em" }}>
                    [02] Photovoltaic Lab
                  </span>
                  <span style={{ letterSpacing: "-0.025em" }}>&#169;2025</span>
                </div>
              </div>

              <div className="flex flex-col justify-between py-4">
                <div className="space-y-8 reveal-item anim-delay-400">
                  <p
                    className="leading-relaxed text-lg text-stone-600"
                    style={{ letterSpacing: "-0.025em" }}
                  >
                    We work with visionaries who embrace the transformative power
                    of solar energy, those who value sustainability over short-term gain.
                  </p>
                  <div className="flex gap-1 text-stone-400">
                    <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" /></svg>
                    <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" /></svg>
                    <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" /></svg>
                  </div>
                </div>

                {/* Stats */}
                <div className="mt-12 flex items-end justify-between border-t border-stone-300/50 pt-12 reveal-item anim-delay-500">
                  <div className="flex gap-12">
                    <div>
                      <span
                        className="text-5xl text-stone-900 font-light"
                        style={{
                          fontFamily:
                            "var(--font-dm-sans), 'DM Sans', sans-serif",
                          letterSpacing: "-0.05em",
                        }}
                      >
                        96%
                      </span>
                      <p
                        className="mt-2 text-xs uppercase text-stone-500"
                        style={{ letterSpacing: "-0.025em" }}
                      >
                        Efficiency
                      </p>
                    </div>
                    <div>
                      <span
                        className="text-5xl text-stone-900 font-light"
                        style={{
                          fontFamily:
                            "var(--font-dm-sans), 'DM Sans', sans-serif",
                          letterSpacing: "-0.05em",
                        }}
                      >
                        99%
                      </span>
                      <p
                        className="mt-2 text-xs uppercase text-stone-500"
                        style={{ letterSpacing: "-0.025em" }}
                      >
                        Success
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={handleEnter}
                    className="rounded-full border border-stone-400/30 p-3 hover:bg-stone-200 transition-colors"
                  >
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5l7 7-7 7" /></svg>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Enter CTA Section */}
        <div className="mt-24 pt-16 border-t border-stone-300/50 reveal-item anim-delay-200">
          <div className="flex flex-col items-center justify-center text-center gap-8">
            <p
              className="text-xs uppercase tracking-widest text-stone-400"
              style={{ letterSpacing: "-0.025em" }}
            >
              Chat with NOVERA AI — Founded by Louati Mahdi
            </p>
            <button
              onClick={handleEnter}
              className="group relative text-[10px] uppercase tracking-widest bg-stone-900 text-white px-12 py-4 rounded-[2px] font-medium hover:bg-stone-800 transition-all duration-500 overflow-hidden"
            >
              <span className="relative z-10 flex items-center gap-3">
                Enter
                <svg className="w-4 h-4 transform group-hover:translate-x-1 transition-transform duration-300" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5l7 7-7 7" /></svg>
              </span>
              <span className="absolute inset-0 bg-white/10 transform -translate-x-full group-hover:translate-x-0 transition-transform duration-500 ease-out" />
            </button>
          </div>
        </div>

        {/* Trusted Partners Marquee */}
        <div className="reveal-item anim-delay-200 border-stone-300/50 border-t mt-24 pt-12">
          <p
            className="uppercase text-xs text-stone-400 mb-8"
            style={{ letterSpacing: "-0.025em" }}
          >
            Trusted by energy leaders worldwide
          </p>
          <div
            className="group relative flex w-full overflow-hidden"
            style={{
              maskImage:
                "linear-gradient(to right, transparent, black 20%, black 80%, transparent)",
              WebkitMaskImage:
                "linear-gradient(to right, transparent, black 20%, black 80%, transparent)",
            }}
          >
            <div className="flex shrink-0 animate-scroll items-center gap-12 pr-12 opacity-60 grayscale transition-all duration-500 group-hover:opacity-100 group-hover:grayscale-0">
              <span className="text-2xl font-light text-stone-600 whitespace-nowrap">Google</span>
              <span className="text-2xl font-light text-stone-600 whitespace-nowrap">OpenAI</span>
              <span className="text-2xl font-light text-stone-600 whitespace-nowrap">Microsoft</span>
              <span className="text-2xl font-light text-stone-600 whitespace-nowrap">Stripe</span>
              <span className="text-2xl font-light text-stone-600 whitespace-nowrap">Anthropic</span>
              <span className="text-2xl font-light text-stone-600 whitespace-nowrap">Linear</span>
            </div>
            <div
              className="flex shrink-0 animate-scroll items-center gap-12 pr-12 opacity-60 grayscale transition-all duration-500 group-hover:opacity-100 group-hover:grayscale-0"
              aria-hidden="true"
            >
              <span className="text-2xl font-light text-stone-600 whitespace-nowrap">Google</span>
              <span className="text-2xl font-light text-stone-600 whitespace-nowrap">OpenAI</span>
              <span className="text-2xl font-light text-stone-600 whitespace-nowrap">Microsoft</span>
              <span className="text-2xl font-light text-stone-600 whitespace-nowrap">Stripe</span>
              <span className="text-2xl font-light text-stone-600 whitespace-nowrap">Anthropic</span>
              <span className="text-2xl font-light text-stone-600 whitespace-nowrap">Linear</span>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
