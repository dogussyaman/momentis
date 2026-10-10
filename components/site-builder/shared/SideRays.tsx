'use client'

import { useEffect, useRef } from 'react'
import { Mesh, Program, Renderer, Triangle } from 'ogl'

type SideRaysOrigin = 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left'

interface SideRaysProps {
  speed?: number
  rayColor1?: string
  rayColor2?: string
  intensity?: number
  spread?: number
  origin?: SideRaysOrigin
  className?: string
}

type RayUniform = { value: number | number[] }

const VERTEX_SHADER = `
attribute vec2 position;
void main() {
  gl_Position = vec4(position, 0.0, 1.0);
}`

const FRAGMENT_SHADER = `
precision highp float;
uniform float iTime;
uniform vec2 iResolution;
uniform float iSpeed;
uniform vec3 iRayColor1;
uniform vec3 iRayColor2;
uniform float iIntensity;
uniform float iSpread;
uniform float iOriginX;
uniform float iOriginY;

void main() {
  vec2 uv = gl_FragCoord.xy / iResolution;
  vec2 source = vec2(iOriginX, iOriginY);
  vec2 ray = uv - source;
  float distanceFromSource = length(ray);
  vec2 direction = normalize(ray);
  vec2 centerDirection = normalize(vec2(iOriginX > 0.5 ? -1.0 : 1.0, iOriginY > 0.5 ? -0.82 : 0.82));
  float spread = max(iSpread, 0.08);
  float firstBeam = pow(max(dot(direction, normalize(vec2(centerDirection.x - spread * 0.38, centerDirection.y + spread * 0.22))), 0.0), 8.0 / spread);
  float secondBeam = pow(max(dot(direction, normalize(vec2(centerDirection.x + spread * 0.38, centerDirection.y - spread * 0.22))), 0.0), 8.0 / spread);
  float reach = 1.0 - smoothstep(0.12, 1.25, distanceFromSource);
  float shimmer = 0.68 + 0.32 * sin(iTime * iSpeed + uv.x * 7.0 + uv.y * 4.0);
  float glow = (firstBeam + secondBeam) * reach * shimmer * iIntensity;
  vec3 color = mix(iRayColor1, iRayColor2, clamp(secondBeam / max(firstBeam + secondBeam, 0.001), 0.0, 1.0));
  gl_FragColor = vec4(color, clamp(glow * 0.72, 0.0, 0.72));
}`

function colorToRgb(hex: string): number[] {
  const match = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex)
  if (!match) return [0.78, 0.59, 0.36]
  return [Number.parseInt(match[1], 16), Number.parseInt(match[2], 16), Number.parseInt(match[3], 16)].map((channel) => channel / 255)
}

const ORIGINS: Record<SideRaysOrigin, [number, number]> = {
  'top-right': [0.98, 0.98],
  'top-left': [0.02, 0.98],
  'bottom-right': [0.98, 0.02],
  'bottom-left': [0.02, 0.02],
}

export function SideRays({
  speed = 0.8,
  rayColor1 = '#D7B77A',
  rayColor2 = '#F3D9CB',
  intensity = 0.48,
  spread = 1.2,
  origin = 'top-right',
  className,
}: SideRaysProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const safeOrigin = origin in ORIGINS ? origin : 'top-right'

  useEffect(() => {
    const container = containerRef.current
    if (!container) return
    if (typeof IntersectionObserver === 'undefined' || typeof ResizeObserver === 'undefined') {
      console.error('SideRays tarayıcı desteği bulunmadığı için statik ışık efekti kullanılıyor.')
      return
    }

    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    let renderer: Renderer | null = null
    let frameId = 0
    let resizeObserver: ResizeObserver | null = null
    let canvas: HTMLCanvasElement | null = null

    const start = () => {
      if (renderer || !container.isConnected) return

      try {
        renderer = new Renderer({ alpha: true, dpr: Math.min(window.devicePixelRatio || 1, 2) })
      } catch (error) {
        console.error('SideRays WebGL başlatılamadı; statik ışık efekti gösteriliyor.', error)
        return
      }

      const gl = renderer.gl
      gl.clearColor(0, 0, 0, 0)
      canvas = gl.canvas
      canvas.style.position = 'absolute'
      canvas.style.inset = '0'
      canvas.style.width = '100%'
      canvas.style.height = '100%'
      canvas.style.pointerEvents = 'none'
      container.appendChild(canvas)

      const [originX, originY] = ORIGINS[safeOrigin]
      const uniforms: Record<string, RayUniform> = {
        iTime: { value: 0 },
        iResolution: { value: [1, 1] },
        iSpeed: { value: speed },
        iRayColor1: { value: colorToRgb(rayColor1) },
        iRayColor2: { value: colorToRgb(rayColor2) },
        iIntensity: { value: intensity },
        iSpread: { value: spread },
        iOriginX: { value: originX },
        iOriginY: { value: originY },
      }
      const mesh = new Mesh(gl, {
        geometry: new Triangle(gl),
        program: new Program(gl, {
          vertex: VERTEX_SHADER,
          fragment: FRAGMENT_SHADER,
          uniforms,
          transparent: true,
          depthTest: false,
          depthWrite: false,
        }),
      })

      const resize = () => {
        if (!renderer) return
        const width = container.clientWidth
        const height = container.clientHeight
        if (!width || !height) return
        renderer.dpr = Math.min(window.devicePixelRatio || 1, 2)
        renderer.setSize(width, height)
        uniforms.iResolution.value = [width * renderer.dpr, height * renderer.dpr]
      }
      const render = (time: number) => {
        if (!renderer) return
        uniforms.iTime.value = time / 1000
        renderer.render({ scene: mesh })
        if (!reducedMotion) frameId = window.requestAnimationFrame(render)
      }

      resizeObserver = new ResizeObserver(resize)
      resizeObserver.observe(container)
      resize()
      frameId = window.requestAnimationFrame(render)
    }

    const stop = () => {
      window.cancelAnimationFrame(frameId)
      resizeObserver?.disconnect()
      resizeObserver = null
      if (canvas?.parentNode === container) container.removeChild(canvas)
      renderer?.gl.getExtension('WEBGL_lose_context')?.loseContext()
      canvas = null
      renderer = null
    }

    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) start()
      else stop()
    }, { threshold: 0.05 })
    observer.observe(container)

    return () => {
      observer.disconnect()
      stop()
    }
  }, [speed, rayColor1, rayColor2, intensity, spread, safeOrigin])

  return (
    <div
      ref={containerRef}
      aria-hidden="true"
      className={className}
    >
      <div
        className="sb-side-rays-glow absolute inset-[-8%]"
        style={{
          transformOrigin: `${safeOrigin.includes('right') ? '100%' : '0%'} ${safeOrigin.includes('top') ? '0%' : '100%'}`,
          background: `
            radial-gradient(ellipse 58% 82% at ${safeOrigin.includes('right') ? '100%' : '0%'} ${safeOrigin.includes('top') ? '0%' : '100%'}, color-mix(in srgb, ${rayColor1} 28%, transparent), transparent 74%),
            conic-gradient(from ${safeOrigin === 'top-right' ? '145deg' : safeOrigin === 'top-left' ? '215deg' : safeOrigin === 'bottom-right' ? '35deg' : '325deg'} at ${safeOrigin.includes('right') ? '100%' : '0%'} ${safeOrigin.includes('top') ? '0%' : '100%'}, transparent 0deg, color-mix(in srgb, ${rayColor1} 30%, transparent) 8deg, transparent 15deg, color-mix(in srgb, ${rayColor2} 28%, transparent) 21deg, transparent 29deg, color-mix(in srgb, ${rayColor1} 20%, transparent) 36deg, transparent 46deg)
          `,
        }}
      />
    </div>
  )
}
