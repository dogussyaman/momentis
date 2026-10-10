"use client";

import type { ReactNode } from "react";

import { ContactCard } from "@/components/portfolio-preview/contact/contact-card";
import { Hero } from "@/components/portfolio-preview/hero/hero";
import { Nav } from "@/components/portfolio-preview/layout/nav";
import { PageBackdrop } from "@/components/portfolio-preview/layout/page-backdrop";
import { Providers } from "@/components/portfolio-preview/layout/providers";
import { SkipToContent } from "@/components/portfolio-preview/layout/skip-to-content";
import { Projects } from "@/components/portfolio-preview/projects/projects";

export function PortfolioHomepage(): ReactNode {
  return (
    <Providers>
      <div className="portfolio-preview">
        <div className="site-frame site-frame--top" aria-hidden="true" />
        <div className="site-frame site-frame--left" aria-hidden="true" />
        <div className="site-frame site-frame--right" aria-hidden="true" />
        <svg
          className="site-corner site-corner--top-left"
          width="50"
          height="50"
          viewBox="0 0 50 50"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          aria-hidden="true"
        >
          <path
            d="M5.50871e-06 0C-0.00788227 37.3001 8.99616 50.0116 50 50H5.50871e-06V0Z"
            fill="currentColor"
          />
        </svg>
        <svg
          className="site-corner site-corner--top-right"
          width="50"
          height="50"
          viewBox="0 0 50 50"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          aria-hidden="true"
        >
          <path
            d="M5.50871e-06 0C-0.00788227 37.3001 8.99616 50.0116 50 50H5.50871e-06V0Z"
            fill="currentColor"
          />
        </svg>
        <SkipToContent />
        <PageBackdrop />
        <Nav />
        <main
          id="main-content"
          className="flex flex-1 flex-col gap-20 sm:gap-28"
        >
          <Hero />
          <Projects withHeadline viewMoreVisible />
          <ContactCard />
          <div className="h-12 sm:h-16" />
        </main>
      </div>
    </Providers>
  );
}
