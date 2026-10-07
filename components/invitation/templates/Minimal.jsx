import React from 'react'
import { motion } from 'framer-motion'
import { Reveal, useParallax, VenueBlock, Rsvp } from './shared'
import { formatEventDate } from '@/lib/projects'

export default function Minimal({ project }) {
  const x = useParallax(0, -400, 1400)
  const d = { fontFamily: "'Bricolage Grotesque', sans-serif" }
  const b = { fontFamily: "Inter, sans-serif" }
  const c = {
    input: "w-full bg-transparent border-b-2 border-white/30 py-4 text-xl outline-none focus:border-white transition-colors placeholder:text-white/40",
    on: "flex-1 py-4 bg-white text-black font-semibold",
    off: "flex-1 py-4 border-2 border-white/30 hover:border-white transition",
    btn: "w-full py-5 bg-[#EDE8DF] text-black font-semibold text-lg hover:bg-white transition-colors",
    ok: "text-4xl font-semibold leading-tight",
  }
  
  const formattedDate = formatEventDate(project.date, project.time)
  const namesStr = `${project.host_a || 'A'} & ${project.host_b || 'B'}`
  
  const timeline = project.program?.length > 0 ? project.program : [
    { time: "16:00", title: "Tören", desc: "" }
  ]
  
  return (
    <div className="bg-[#EDE8DF] text-black" style={b}>
      <section className="min-h-[calc(100vh-56px)] flex flex-col justify-between px-6 md:px-12 py-10 overflow-hidden">
        <Reveal>
          <p className="text-sm font-medium">Davetlisiniz — {formattedDate}</p>
        </Reveal>
        <h1 style={d} className="font-extrabold leading-[0.82] tracking-[-0.05em] text-[24vw] md:text-[19vw]">
          <motion.span initial={{ y: "100%" }} animate={{ y: 0 }} transition={{ duration: 1, ease: [0.22, 1, 0.36, 1] }} className="block">
            {(project.host_a || 'İsim').toLowerCase()}
          </motion.span>
          <motion.span
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            transition={{ duration: 1, delay: 0.12, ease: [0.22, 1, 0.36, 1] }}
            className="block md:ml-[18vw]"
          >
            +{(project.host_b || 'İsim').toLowerCase()}
          </motion.span>
        </h1>
        <div className="flex justify-between items-end text-sm font-medium">
          <span>{project.venue || 'Mekan'}</span>
          <span>{project.city || 'Şehir'}</span>
        </div>
      </section>

      <div className="bg-black text-[#EDE8DF] py-6 overflow-hidden whitespace-nowrap">
        <motion.div style={{ x, ...d }} className="text-5xl font-semibold tracking-tight">
          {Array(6).fill(`${formattedDate}  ✦  ${namesStr}  ✦  `).join("")}
        </motion.div>
      </div>

      {project.story && (
        <section className="px-6 md:px-12 py-28 grid md:grid-cols-12 gap-8">
          <Reveal className="md:col-span-3 text-sm font-medium"><p>Hikâyemiz</p></Reveal>
          <Reveal className="md:col-span-9">
            <p style={d} className="text-3xl md:text-5xl font-semibold leading-[1.15] tracking-tight">
              {project.story}
            </p>
          </Reveal>
        </section>
      )}

      {timeline.length > 0 && (
        <section className="px-6 md:px-12 pb-28">
          <Reveal><h2 style={d} className="text-6xl md:text-8xl font-extrabold tracking-tighter mb-12">Akış</h2></Reveal>
          {timeline.map((it) => (
            <Reveal key={it.time} y={16}>
              <div className="group grid grid-cols-12 items-baseline gap-4 border-t border-black py-6 px-2 transition-colors duration-300 hover:bg-black hover:text-[#EDE8DF]">
                <span style={d} className="col-span-3 md:col-span-2 text-2xl md:text-4xl font-semibold">{it.time}</span>
                <span style={d} className="col-span-9 md:col-span-5 text-2xl md:text-4xl font-semibold tracking-tight">{it.title}</span>
                <span className="col-span-12 md:col-span-5 text-sm opacity-70">{it.desc}</span>
              </div>
            </Reveal>
          ))}
          <div className="border-t border-black" />
        </section>
      )}

      <section className="bg-black text-white px-6 md:px-12 py-28 grid md:grid-cols-2 gap-16">
        <Reveal>
          <h2 style={d} className="text-5xl md:text-7xl font-extrabold tracking-tighter mb-8">Mekân</h2>
          <VenueBlock
            project={project}
            text="text-white/60"
            btn="px-6 py-3 border-2 border-white/30 font-medium hover:bg-white hover:text-black transition-colors"
          />
        </Reveal>
        <Reveal delay={0.15}>
          <h2 style={d} className="text-5xl md:text-7xl font-extrabold tracking-tighter mb-8">Geliyor musun?</h2>
          <Rsvp c={c} project={project} />
        </Reveal>
      </section>
    </div>
  )
}
