import React from 'react'
import { motion } from 'framer-motion'
import { Reveal, useParallax, VenueBlock, Rsvp } from './shared'
import { formatEventDate } from '@/lib/projects'

export default function Classic({ project }) {
  const y = useParallax(0, 90)
  const serif = { fontFamily: "'Cormorant Garamond', serif" }
  const sans = { fontFamily: "Montserrat, sans-serif" }
  const c = {
    input: "w-full bg-transparent border-b border-[#CBBBA9] py-3 text-sm outline-none focus:border-[#2B2622] transition-colors",
    on: "flex-1 py-3 text-sm border border-[#2B2622] bg-[#2B2622] text-[#FAF7F2] transition",
    off: "flex-1 py-3 text-sm border border-[#CBBBA9] hover:border-[#2B2622] transition",
    btn: "w-full py-4 bg-[#2B2622] text-[#FAF7F2] text-sm tracking-[0.2em] hover:bg-[#A38B7A] transition-colors",
    ok: "text-2xl italic leading-relaxed",
  }
  
  const timeline = project.program?.length > 0 ? project.program : [
    { time: "16:00", title: "Nikâh Töreni", desc: "Bahçe terasında." },
    { time: "19:00", title: "Akşam Yemeği", desc: "Mevsimin lezzetleriyle." },
  ]
  
  return (
    <div className="bg-[#FAF7F2] text-[#2B2622]" style={sans}>
      <section className="relative min-h-[calc(100vh-56px)] flex flex-col items-center justify-center text-center px-6 overflow-hidden">
        <motion.div style={{ y }} className="absolute top-0 left-1/2 w-px h-40 bg-[#A38B7A]/70" />
        <Reveal>
          <p className="text-xs tracking-[0.45em] text-[#A38B7A] mb-10">Evleniyoruz</p>
        </Reveal>
        <Reveal delay={0.15}>
          <h1 style={serif} className="text-7xl md:text-[9rem] font-light leading-[0.9] italic">
            {project.host_a || 'İsim'}
            <span className="block text-4xl md:text-6xl not-italic text-[#A38B7A] my-4">&amp;</span>
            {project.host_b || 'İsim'}
          </h1>
        </Reveal>
        <Reveal delay={0.35}>
          <p style={serif} className="mt-12 text-2xl md:text-3xl">
            {formatEventDate(project.date, project.time)}
          </p>
        </Reveal>
        <motion.div
          initial={{ height: 0 }}
          animate={{ height: 90 }}
          transition={{ delay: 0.9, duration: 1.2, ease: [0.22, 1, 0.36, 1] }}
          className="w-px bg-[#A38B7A]/70 mt-12"
        />
      </section>

      {project.story && (
        <section className="max-w-xl mx-auto px-6 py-28 text-center">
          <Reveal>
            <h2 style={serif} className="text-5xl italic font-light mb-10">Hikâyemiz</h2>
            <p style={serif} className="text-xl md:text-2xl leading-[1.9] text-[#4A423B]">
              {project.story}
            </p>
          </Reveal>
        </section>
      )}

      {timeline.length > 0 && (
        <section className="max-w-4xl mx-auto px-6 py-24">
          <Reveal>
            <h2 style={serif} className="text-5xl italic font-light text-center mb-20">Günün Akışı</h2>
          </Reveal>
          <ol className="relative before:absolute before:left-[17px] md:before:left-1/2 before:top-0 before:w-px before:h-full before:bg-[#D9CDBF] space-y-14">
            {timeline.map((it, i) => {
              const odd = i % 2
              return (
                <li
                  key={it.time}
                  className={`relative pl-12 md:pl-0 md:w-1/2 ${
                    odd ? "md:ml-auto md:pl-14" : "md:pr-14 md:text-right"
                  }`}
                >
                  <span
                    className={`absolute top-3 left-[13px] w-[9px] h-[9px] rounded-full bg-[#A38B7A] ${
                      odd ? "md:left-[-5px]" : "md:left-auto md:right-[-5px]"
                    }`}
                  />
                  <Reveal y={20}>
                    <p style={serif} className="text-3xl text-[#A38B7A]">{it.time}</p>
                    <h3 style={serif} className="text-2xl mt-1">{it.title}</h3>
                    <p className="text-sm text-[#7A6E64] mt-2 font-light">{it.desc}</p>
                  </Reveal>
                </li>
              )
            })}
          </ol>
        </section>
      )}

      <section className="max-w-5xl mx-auto px-6 py-28 grid md:grid-cols-2 gap-16 md:gap-24">
        <Reveal>
          <h2 style={serif} className="text-5xl italic font-light mb-8">Mekân</h2>
          <VenueBlock
            project={project}
            text="text-[#7A6E64] font-light"
            btn="px-6 py-3 border border-[#2B2622] text-xs tracking-[0.2em] hover:bg-[#2B2622] hover:text-[#FAF7F2] transition-colors"
          />
        </Reveal>
        <Reveal delay={0.15}>
          <h2 style={serif} className="text-5xl italic font-light mb-8">LCV</h2>
          <Rsvp c={c} project={project} />
        </Reveal>
      </section>
    </div>
  )
}
