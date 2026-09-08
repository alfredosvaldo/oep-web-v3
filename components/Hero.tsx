'use client';

import { useEffect, useRef, useState } from 'react';

const BASE = process.env.NEXT_PUBLIC_BASE_PATH || '';

export default function Hero() {
  const video = useRef<HTMLVideoElement>(null);
  const section = useRef<HTMLElement>(null);
  const [motionAllowed, setMotionAllowed] = useState(false);
  const [paused, setPaused] = useState(false);
  const [playing, setPlaying] = useState(false);
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const preference = window.matchMedia('(prefers-reduced-motion: reduce)');
    const sync = () => setMotionAllowed(!preference.matches);
    sync();
    preference.addEventListener('change', sync);
    const observer = new IntersectionObserver(([entry]) => setVisible(entry.isIntersecting));
    if (section.current) observer.observe(section.current);
    return () => {
      preference.removeEventListener('change', sync);
      observer.disconnect();
    };
  }, []);

  useEffect(() => {
    const element = video.current;
    if (!element) return;
    element.playbackRate = 0.65;
    if (motionAllowed && !paused && visible) {
      element.play().catch(() => setPlaying(false));
    } else {
      element.pause();
    }
  }, [motionAllowed, paused, visible]);

  return (
    <section className="film-hero" ref={section} aria-labelledby="hero-title">
      <div className="film-hero-media" aria-hidden="true">
        <img src={`${BASE}/media/chile-hero-poster.jpg`} alt="" className="film-hero-poster" />
        {motionAllowed && (
          <video
            ref={video}
            className="film-hero-video"
            muted
            loop
            playsInline
            preload="metadata"
            poster={`${BASE}/media/chile-hero-poster.jpg`}
            onPlay={() => setPlaying(true)}
            onPause={() => setPlaying(false)}
            onError={() => setPlaying(false)}
          >
            <source src={`${BASE}/media/chile-hero.mp4`} type="video/mp4" />
          </video>
        )}
      </div>
      <div className="film-hero-inner">
        <div className="film-hero-copy">
          <h1 id="hero-title">
            <span>Tres décadas de permisos,</span>
            <span>tiempos,</span>
            <span>inversión y empleo.</span>
          </h1>
          <p>Explora los proyectos que dan forma al país.</p>
          <form className="quiet-search" action={`${BASE}/mapa/`}>
            <label className="sr-only" htmlFor="home-search">Buscar proyecto o empresa</label>
            <input id="home-search" type="search" name="q" placeholder="Busca un proyecto o empresa" />
            <input type="hidden" name="status" value="all" />
            <button aria-label="Buscar proyectos" type="submit">→</button>
          </form>
          <a className="quiet-map-link" href="#mapa">Explorar el mapa ↓</a>
        </div>
        {motionAllowed && (
          <button
            className="film-motion-control"
            onClick={() => {
              if (playing) setPaused(true);
              else {
                setPaused(false);
                video.current?.play().catch(() => setPlaying(false));
              }
            }}
            aria-label={playing ? 'Pausar video de fondo' : 'Reproducir video de fondo'}
            aria-pressed={paused}
          >
            <span aria-hidden="true">{playing ? 'Ⅱ' : '▷'}</span>
            {playing ? 'Pausar' : 'Reproducir'}
          </button>
        )}
      </div>
    </section>
  );
}
