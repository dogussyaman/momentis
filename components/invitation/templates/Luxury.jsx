import React from 'react'
import { motion } from 'framer-motion'
import { Reveal, useParallax, VenueBlock, Rsvp } from './shared'
import { formatEventDate } from '@/lib/projects'

export default function Luxury({ project }) {
  const y = useParallax(0, 60)
  const d = { fontFamily: "Italiana, serif" }
  const b = { fontFamily: "Manrope, sans-serif" }
  const gold = "bg-gradient-to-r from-[#A8843E] via-[#F1DDA0] to-[#A8843E] bg-clip-text text-transparent"
  const c = {
    input: "w-full bg-white/5 border border-[#C9A45C]/40 px-5 py-4 outline-none focus:border-[#F1DDA0] transition placeholder:text-white/40",
    on: "flex-1 py-4 bg-[#C9A45C] text-[#070B18] font-medium",
    off: "flex-1 py-4 border border-[#C9A45C]/40 hover:border-[#F1DDA0] transition",
    btn: "w-full py-4 bg-gradient-to-r from-[#A8843E] via-[#E6CF92] to-[#A8843E] text-[#070B18] font-medium hover:brightness-110 transition",
    ok: "text-3xl text-[#F1DDA0]",
  }
  
  const timeline = project.program?.length > 0 ? project.program : []
  const initialLetters = (project.host_a?.[0] || 'A') + '&' + (project.host_b?.[0] || 'B')
  const formattedDate = formatEventDate(project.date, project.time)

  return (
    <div className="bg-[#070B18] text-[#E9E4D6]" style={b}>
      <section className="relative min-h-[calc(100vh-56px)] flex items-center justify-center px-6 py-16 overflow-hidden">
        <motion.div
          animate={{ opacity: [0.35, 0.6, 0.35] }}
          transition={{ duration: 6, repeat: Infinity }}
          className="absolute inset-0 bg-[radial-gradient(circle_at_50%_40%,#1B2A55_0%,transparent_60%)]"
        />
        <motion.div
          initial={{ opacity: 0, scale: 0.97 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 1.4, ease: [0.22, 1, 0.36, 1] }}
          className="relative w-full max-w-2xl border border-[#C9A45C]/50 p-3"
        >
          <div className="border border-[#C9A45C]/25 text-center px-6 py-20 md:py-28">
            <motion.div style={{ y }} className="mx-auto mb-10 w-20 h-20 rounded-full border border-[#C9A45C] flex items-center justify-center">
              <span style={d} className={`text-3xl ${gold}`}>{initialLetters}</span>
            </motion.div>
            <p className="text-sm text-[#C9A45C] mb-6">Özel davet</p>
            <h1 style={d} className={`text-6xl md:text-8xl leading-[1.05] ${gold}`}>
              {project.host_a || 'İsim'}
              <span className="block text-3xl my-3 text-[#C9A45C]">&amp;</span>
              {project.host_b || 'İsim'}
            </h1>
            <div className="mx-auto my-10 h-px w-40 bg-gradient-to-r from-transparent via-[#C9A45C] to-transparent" />
            <p style={d} className="text-2xl">{formattedDate}</p>
            <p className="text-sm text-white/60 mt-2">{project.city || 'Şehir'} · {project.venue || 'Mekân'}</p>
          </div>
        </motion.div>
      </section>

      {project.story && (
        <section className="max-w-2xl mx-auto px-6 py-28 text-center">
          <Reveal>
            <h2 style={d} className={`text-5xl mb-10 ${gold}`}>Karşılama</h2>
            <p className="text-lg leading-[2] text-white/70 font-light">{project.story}</p>
          </Reveal>
        </section>
      )}

      {timeline.length > 0 && (
        <section className="max-w-3xl mx-auto px-6 py-20">
          <Reveal><h2 style={d} className={`text-5xl text-center mb-16 ${gold}`}>Program</h2></Reveal>
          <ol className="relative before:absolute before:left-[7px] before:top-2 before:bottom-2 before:w-px before:bg-gradient-to-b before:from-transparent before:via-[#C9A45C] before:to-transparent space-y-12">
            {timeline.map((it) => (
              <li key={it.time} className="relative pl-14">
                <span className="absolute left-0 top-2 w-[15px] h-[15px] rotate-45 border border-[#C9A45C] bg-[#070B18]" />
                <Reveal y={18}>
                  <div className="flex items-baseline gap-5 flex-wrap">
                    <span style={d} className="text-3xl text-[#F1DDA0]">{it.time}</span>
                    <h3 style={d} className="text-2xl">{it.title}</h3>
                  </div>
                  <p className="text-sm text-white/50 mt-1 font-light">{it.desc}</p>
                </Reveal>
              </li>
            ))}
          </ol>
        </section>
      )}

      <section className="max-w-5xl mx-auto px-6 py-28 grid md:grid-cols-2 gap-px bg-[#C9A45C]/30">
        <Reveal className="bg-[#070B18] p-10 md:p-14">
          <h2 style={d} className={`text-4xl mb-6 ${gold}`}>Mekân</h2>
          <VenueBlock
            project={project}
            text="text-white/60"
            btn="px-6 py-3 border border-[#C9A45C]/60 text-sm hover:bg-[#C9A45C] hover:text-[#070B18] transition-colors"
          />
        </Reveal>
        <Reveal delay={0.12} className="bg-[#070B18] p-10 md:p-14">
          <h2 style={d} className={`text-4xl mb-6 ${gold}`}>LCV</h2>
          <Rsvp c={c} project={project} />
        </Reveal>
      </section>
    </div>
  )
}
