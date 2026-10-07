import React from 'react'
import { motion } from 'framer-motion'
import { Reveal, useParallax, VenueBlock, Rsvp } from './shared'
import { formatEventDate } from '@/lib/projects'

const Leaf = ({ className = "", style }) => (
  <svg viewBox="0 0 100 160" className={className} style={style} fill="currentColor">
    <path d="M50 0C90 40 100 100 50 160 0 100 10 40 50 0Z" opacity=".9" />
    <path d="M50 20V150" stroke="#F2EEE3" strokeWidth="2" opacity=".5" />
  </svg>
)

export default function Botanic({ project }) {
  const y1 = useParallax(0, -120)
  const y2 = useParallax(0, 80)
  const d = { fontFamily: "Fraunces, serif" }
  const b = { fontFamily: "'Nunito Sans', sans-serif" }
  const c = {
    input: "w-full rounded-full bg-[#F2EEE3] px-6 py-4 outline-none focus:ring-2 ring-[#7F9272] transition",
    on: "flex-1 rounded-full py-4 bg-[#7F9272] text-white",
    off: "flex-1 rounded-full py-4 bg-[#F2EEE3] hover:bg-[#E4DFCF] transition",
    btn: "w-full rounded-full py-4 bg-[#B7794F] text-white hover:bg-[#9E6540] transition-colors",
    ok: "text-2xl leading-relaxed text-[#3F4A3A]",
  }
  const icons = ["💍", "🥂", "🍽️", "🎶", "✨"]
  
  const timeline = project.program?.length > 0 ? project.program : [
    { time: "16:00", title: "Nikâh", desc: "" }
  ]

  return (
    <div className="bg-[#F2EEE3] text-[#3F4A3A] overflow-hidden" style={b}>
      <section className="relative min-h-[calc(100vh-56px)] flex items-center justify-center px-6 py-16">
        <motion.div style={{ y: y1 }} className="absolute left-[-30px] top-10 text-[#7F9272]">
          <Leaf className="w-28 rotate-[25deg]" />
          <Leaf className="w-20 -mt-10 ml-16 rotate-[60deg] text-[#A3B394]" />
        </motion.div>
        <motion.div style={{ y: y2 }} className="absolute right-[-20px] bottom-10 text-[#B7794F]/80">
          <Leaf className="w-24 -rotate-[30deg]" />
          <Leaf className="w-16 -mt-8 -ml-8 -rotate-[70deg] text-[#7F9272]" />
        </motion.div>
        <motion.div
          initial={{ opacity: 0, scale: 0.94 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 1.2, ease: [0.22, 1, 0.36, 1] }}
          className="relative w-full max-w-md rounded-t-[999px] rounded-b-[2.5rem] bg-gradient-to-b from-[#A3B394] to-[#7F9272] text-[#F2EEE3] text-center px-8 pt-40 pb-16"
        >
          <p className="text-sm mb-4 opacity-90">Hoş geldiniz</p>
          <h1 style={d} className="text-6xl md:text-7xl font-light italic leading-tight">
            {project.host_a || 'İsim'}
            <span className="block text-3xl not-italic my-2">ve</span>
            {project.host_b || 'İsim'}
          </h1>
          <p className="mt-8 text-lg">{formatEventDate(project.date, project.time)}</p>
          <p className="text-sm opacity-80">{project.city || 'Şehir'}</p>
        </motion.div>
      </section>

      {project.story && (
        <section className="max-w-2xl mx-auto px-6 py-24 text-center">
          <Reveal>
            <h2 style={d} className="text-4xl md:text-5xl italic font-light mb-8">Hikâyemiz</h2>
            <p className="text-lg leading-[1.9] text-[#566250]">{project.story}</p>
          </Reveal>
        </section>
      )}

      {timeline.length > 0 && (
        <section className="max-w-3xl mx-auto px-6 py-20">
          <Reveal><h2 style={d} className="text-4xl md:text-5xl italic font-light text-center mb-14">Gün boyunca</h2></Reveal>
          <div className="space-y-5">
            {timeline.map((it, i) => (
              <Reveal key={it.time} delay={i * 0.05} y={20}>
                <motion.div
                  whileHover={{ x: 6 }}
                  className="flex items-center gap-5 bg-[#E8E4D3] rounded-[2rem] p-5 pr-8"
                >
                  <span className="shrink-0 w-14 h-14 rounded-full bg-[#7F9272] flex items-center justify-center text-2xl">
                    {icons[i % icons.length]}
                  </span>
                  <div className="flex-1">
                    <h3 style={d} className="text-xl">{it.title}</h3>
                    <p className="text-sm text-[#566250]">{it.desc}</p>
                  </div>
                  <span style={d} className="text-xl text-[#B7794F]">{it.time}</span>
                </motion.div>
              </Reveal>
            ))}
          </div>
        </section>
      )}

      <section className="max-w-5xl mx-auto px-6 py-24 grid md:grid-cols-2 gap-8">
        <Reveal className="rounded-[2.5rem] bg-[#E8E4D3] p-10">
          <h2 style={d} className="text-4xl italic font-light mb-6">Mekân</h2>
          <VenueBlock
            project={project}
            text="text-[#566250]"
            btn="rounded-full px-6 py-3 bg-[#7F9272] text-white hover:bg-[#6B7D5F] transition-colors text-sm"
          />
        </Reveal>
        <Reveal delay={0.12} className="rounded-[2.5rem] bg-white/60 p-10">
          <h2 style={d} className="text-4xl italic font-light mb-6">LCV</h2>
          <Rsvp c={c} project={project} />
        </Reveal>
      </section>
    </div>
  )
}
