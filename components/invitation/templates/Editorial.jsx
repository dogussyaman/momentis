import React from 'react'
import { motion } from 'framer-motion'
import { Reveal, useParallax, VenueBlock, Rsvp } from './shared'
import { formatEventDate } from '@/lib/projects'

export default function Editorial({ project }) {
  const y = useParallax(0, -80)
  const d = { fontFamily: "'Playfair Display', serif" }
  const b = { fontFamily: "'DM Sans', sans-serif" }
  const c = {
    input: "w-full bg-transparent border border-[#1A1A1A] px-4 py-3 outline-none focus:bg-white transition",
    on: "flex-1 py-3 bg-[#1A1A1A] text-[#F1EEE8]",
    off: "flex-1 py-3 border border-[#1A1A1A] hover:bg-[#1A1A1A]/10 transition",
    btn: "w-full py-4 bg-[#7A2233] text-[#F1EEE8] hover:bg-[#1A1A1A] transition-colors",
    ok: "text-3xl italic",
  }
  
  const timeline = project.program?.length > 0 ? project.program : []
  const formattedDate = formatEventDate(project.date, project.time)

  return (
    <div className="bg-[#F1EEE8] text-[#1A1A1A]" style={b}>
      <header className="max-w-6xl mx-auto px-6 pt-8">
        <div className="flex justify-between text-xs border-b border-[#1A1A1A] pb-2">
          <span>Momentis Sayısı</span>
          <span>{project.date?.slice(0, 4) || 'Yaz'}</span>
          <span>{project.city || 'Şehir'}</span>
        </div>
        <div className="border-b border-[#1A1A1A] h-1 mt-[3px]" />
      </header>

      <section className="max-w-6xl mx-auto px-6 pt-10 pb-24 grid grid-cols-12 gap-x-6 relative">
        <motion.h1
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, ease: [0.22, 1, 0.36, 1] }}
          style={d}
          className="col-span-12 text-[26vw] md:text-[15rem] leading-[0.8] italic font-normal"
        >
          {project.host_a || 'A'}
        </motion.h1>
        <motion.div style={{ y }} className="col-span-5 md:col-span-4 md:col-start-2 mt-[-2rem] relative z-10">
          <div className="aspect-[3/4] bg-gradient-to-br from-[#D8CFC2] via-[#B9A99A] to-[#7A2233] rounded-t-[999px]" />
          <p className="text-xs mt-2">Fig. 1 — {project.venue || 'Mekân'}</p>
        </motion.div>
        <div className="col-span-7 md:col-span-6 md:col-start-7 flex flex-col justify-end text-right">
          <p style={d} className="text-2xl italic mb-2">ile</p>
          <h1 style={d} className="text-[22vw] md:text-[11rem] leading-[0.85] text-[#7A2233]">{project.host_b || 'B'}</h1>
          <div className="border-t border-[#1A1A1A] mt-6 pt-3 text-sm">
            {formattedDate} — {project.venue || 'Mekân'}
          </div>
        </div>
      </section>

      {project.story && (
        <section className="border-y border-[#1A1A1A]">
          <div className="max-w-6xl mx-auto px-6 py-20 grid md:grid-cols-12 gap-10">
            <Reveal className="md:col-span-4">
              <p style={d} className="text-4xl italic leading-tight">“Özel günümüze davetlisiniz.”</p>
            </Reveal>
            <Reveal delay={0.1} className="md:col-span-7 md:col-start-6">
              <h2 style={d} className="text-3xl mb-5">Hikâyemiz</h2>
              <p className="leading-[1.85] text-[#3A3A3A] first-letter:float-left first-letter:text-7xl first-letter:leading-[0.8] first-letter:pr-3 first-letter:pt-1 first-letter:text-[#7A2233]" style={{ fontFamily: "'Playfair Display', serif" }}>
                {project.story}
              </p>
            </Reveal>
          </div>
        </section>
      )}

      {timeline.length > 0 && (
        <section className="max-w-6xl mx-auto px-6 py-24">
          <Reveal><h2 style={d} className="text-5xl italic mb-12">İçindekiler: Gün</h2></Reveal>
          {timeline.map((it) => (
            <Reveal key={it.time} y={14}>
              <div className="grid grid-cols-12 gap-4 border-t border-[#1A1A1A] py-5 items-baseline">
                <span style={d} className="col-span-3 md:col-span-2 text-2xl italic text-[#7A2233]">{it.time}</span>
                <span style={d} className="col-span-9 md:col-span-4 text-2xl">{it.title}</span>
                <span className="col-span-12 md:col-span-6 text-sm text-[#555]">{it.desc}</span>
              </div>
            </Reveal>
          ))}
          <div className="border-t border-[#1A1A1A]" />
        </section>
      )}

      <section className="max-w-6xl mx-auto px-6 pb-28 grid md:grid-cols-12 gap-10">
        <Reveal className="md:col-span-5">
          <h2 style={d} className="text-5xl italic mb-6">Mekân</h2>
          <VenueBlock
            project={project}
            text="text-[#555]"
            btn="px-5 py-3 border border-[#1A1A1A] text-sm hover:bg-[#1A1A1A] hover:text-[#F1EEE8] transition-colors"
          />
        </Reveal>
        <Reveal delay={0.12} className="md:col-span-6 md:col-start-7 md:border-l border-[#1A1A1A] md:pl-10">
          <h2 style={d} className="text-5xl italic mb-6">LCV</h2>
          <Rsvp c={c} project={project} />
        </Reveal>
      </section>
    </div>
  )
}
