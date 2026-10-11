import type { ReactNode } from "react";

import { HeroCtas } from "./hero-ctas";
import { FadeIn, ScaleUnblur } from "@/components/portfolio-preview/ui/motion-primitives";
import { PortraitMorph } from "./portrait-morph";

const PORTRAIT_SRC = "/portfolio-preview/josh.webp";
const PORTRAIT_HOVER_SRC = "/portfolio-preview/josh_wave.webp";

export function Hero(): ReactNode {
  return (
    <section className="relative w-full">
      <div className="mx-auto w-full max-w-275 px-6 pt-28 pb-16 sm:px-10 sm:pt-48 sm:pb-32">
        <div className="grid grid-cols-1 items-center gap-8 md:grid-cols-2 md:gap-8">
          <FadeIn className="flex flex-col gap-4 text-center md:text-left items-center md:items-start">
            <p className="text-[18px] sm:text-[20px] leading-tight tracking-tight font-medium text-foreground">
              Hey
              <span aria-hidden="true" className="mx-0.5">
                👋
              </span>
              , I&rsquo;m Josh
            </p>

            <h1 className="text-[2.25rem] font-medium leading-[1.08] tracking-tight text-foreground sm:text-[2.75rem] md:text-[2.5rem] lg:text-[3.65rem]">
              <span className="block sm:whitespace-nowrap">
                Design engineer &
              </span>
              <span className="block sm:whitespace-nowrap">AI enthusiast</span>
            </h1>

            <p className="max-w-[34ch] text-[18px] sm:text-[22px] leading-[1.4] tracking-tight text-foreground/65 mx-auto md:mx-0">
              Independent engineer focused on interfaces that feel calm,
              considered, and quietly fast.
            </p>

            <HeroCtas />
          </FadeIn>

          <ScaleUnblur className="flex justify-center md:justify-end w-full max-w-[340px] sm:max-w-105 mx-auto md:mx-0">
            <div className="relative aspect-square w-full overflow-hidden rounded-4xl border border-foreground/8 bg-background p-1.5 shadow-sm">
              <div className="relative h-full w-full overflow-hidden rounded-[1.6rem]">
                <PortraitMorph
                  srcA={PORTRAIT_SRC}
                  srcB={PORTRAIT_HOVER_SRC}
                  alt="Josh portrait"
                />
              </div>
            </div>
          </ScaleUnblur>
        </div>
      </div>
    </section>
  );
}
