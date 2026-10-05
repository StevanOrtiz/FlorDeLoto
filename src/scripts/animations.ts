import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import Lenis from 'lenis';

/*
 * Animaciones declarativas por atributos:
 *   data-reveal="up|left|right|scale|fade|clip"   aparece al entrar en pantalla
 *   data-delay="0.2"                               retardo opcional
 *   data-stagger                                    los hijos aparecen en cascada
 *   data-split                                      el texto aparece palabra a palabra
 *   data-parallax="0.15"                            desplazamiento ligado al scroll
 *   data-zoom                                       la imagen se acerca/aleja con el scroll
 *   data-count="4.7"                                contador numérico
 *   data-marquee                                    desplazamiento horizontal ligado al scroll
 *   data-hscroll                                    sección con scroll horizontal fijada (escritorio)
 *   data-progress                                   barra de progreso de lectura
 * Con prefers-reduced-motion no se ejecuta nada y todo el contenido queda visible.
 */

const root = document.documentElement;
const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

if (!reduce) {
  gsap.registerPlugin(ScrollTrigger);
  root.classList.add('anim-ready');

  // ——— Scroll suave ———
  const lenis = new Lenis({ lerp: 0.1, wheelMultiplier: 1, smoothWheel: true });
  lenis.on('scroll', ScrollTrigger.update);
  gsap.ticker.add((t) => lenis.raf(t * 1000));
  gsap.ticker.lagSmoothing(0);
  window.addEventListener('lenis:stop', () => lenis.stop());
  window.addEventListener('lenis:start', () => lenis.start());

  // Enlaces internos con ancla: scroll suave
  document.querySelectorAll<HTMLAnchorElement>('a[href^="#"]').forEach((a) => {
    a.addEventListener('click', (e) => {
      const id = a.getAttribute('href')!;
      const target = id.length > 1 ? document.querySelector<HTMLElement>(id) : null;
      if (!target) return;
      e.preventDefault();
      lenis.scrollTo(target, { offset: -80 });
      target.setAttribute('tabindex', '-1');
      target.focus({ preventScroll: true });
    });
  });

  // ——— Texto dividido en palabras ———
  document.querySelectorAll<HTMLElement>('[data-split]').forEach((el) => {
    splitWords(el);
    const words = el.querySelectorAll('.word > span');
    gsap.to(words, {
      y: 0,
      duration: 1.1,
      ease: 'power4.out',
      stagger: 0.06,
      delay: Number(el.dataset.delay ?? 0),
      scrollTrigger: { trigger: el, start: 'top 88%', once: true },
    });
  });

  // ——— Revelados ———
  document.querySelectorAll<HTMLElement>('[data-reveal]').forEach((el) => {
    const type = el.dataset.reveal;
    const vars: gsap.TweenVars =
      type === 'clip'
        ? { clipPath: 'inset(0% 0 0 0)', duration: 1.4, ease: 'power4.inOut' }
        : { opacity: 1, x: 0, y: 0, scale: 1, duration: 1.2, ease: 'power3.out' };
    gsap.to(el, {
      ...vars,
      delay: Number(el.dataset.delay ?? 0),
      scrollTrigger: { trigger: el, start: 'top 90%', once: true },
    });
  });

  document.querySelectorAll<HTMLElement>('[data-stagger]').forEach((el) => {
    gsap.to(el.children, {
      opacity: 1,
      y: 0,
      duration: 1,
      ease: 'power3.out',
      stagger: Number(el.dataset.stagger || 0.1),
      scrollTrigger: { trigger: el, start: 'top 88%', once: true },
    });
  });

  // ——— Parallax y zoom ———
  document.querySelectorAll<HTMLElement>('[data-parallax]').forEach((el) => {
    const speed = Number(el.dataset.parallax || 0.15);
    gsap.fromTo(
      el,
      { yPercent: -speed * 50 },
      {
        yPercent: speed * 50,
        ease: 'none',
        scrollTrigger: { trigger: el.parentElement ?? el, start: 'top bottom', end: 'bottom top', scrub: true },
      },
    );
  });

  document.querySelectorAll<HTMLElement>('[data-zoom]').forEach((el) => {
    gsap.fromTo(
      el,
      { scale: 1.25 },
      { scale: 1, ease: 'none', scrollTrigger: { trigger: el.parentElement ?? el, start: 'top bottom', end: 'bottom top', scrub: true } },
    );
  });

  // ——— Contadores ———
  document.querySelectorAll<HTMLElement>('[data-count]').forEach((el) => {
    const end = Number(el.dataset.count);
    const decimals = (el.dataset.count!.split('.')[1] ?? '').length;
    const obj = { v: 0 };
    const fmt = new Intl.NumberFormat('es-ES', { minimumFractionDigits: decimals, maximumFractionDigits: decimals });
    gsap.to(obj, {
      v: end,
      duration: 2,
      ease: 'power2.out',
      scrollTrigger: { trigger: el, start: 'top 90%', once: true },
      onUpdate: () => (el.textContent = fmt.format(obj.v)),
    });
  });

  // ——— Marquee ligado al scroll ———
  document.querySelectorAll<HTMLElement>('[data-marquee]').forEach((el) => {
    gsap.fromTo(
      el,
      { xPercent: 0 },
      { xPercent: -30, ease: 'none', scrollTrigger: { trigger: el, start: 'top bottom', end: 'bottom top', scrub: 1 } },
    );
  });

  // ——— Scroll horizontal fijado (solo pantallas anchas) ———
  const mm = gsap.matchMedia();
  mm.add('(min-width: 900px)', () => {
    document.querySelectorAll<HTMLElement>('[data-hscroll]').forEach((section) => {
      const track = section.querySelector<HTMLElement>('[data-hscroll-track]');
      if (!track) return;
      const distance = () => track.scrollWidth - section.clientWidth;
      gsap.to(track, {
        x: () => -distance(),
        ease: 'none',
        scrollTrigger: {
          trigger: section,
          start: 'top top',
          end: () => `+=${distance()}`,
          pin: true,
          scrub: 1,
          invalidateOnRefresh: true,
        },
      });
    });
  });

  // ——— Barra de progreso ———
  const bar = document.querySelector<HTMLElement>('[data-progress]');
  if (bar) {
    gsap.to(bar, { scaleX: 1, ease: 'none', scrollTrigger: { start: 0, end: 'max', scrub: 0.3 } });
  }

  // Recalcular cuando cargan las imágenes (cambian las alturas)
  window.addEventListener('load', () => ScrollTrigger.refresh());
  document.querySelectorAll('img[loading="lazy"]').forEach((img) =>
    img.addEventListener('load', () => ScrollTrigger.refresh(), { once: true }),
  );
}

function splitWords(el: HTMLElement) {
  const walk = (node: Node) => {
    Array.from(node.childNodes).forEach((child) => {
      if (child.nodeType === Node.TEXT_NODE) {
        const parts = (child.textContent ?? '').split(/(\s+)/);
        const frag = document.createDocumentFragment();
        parts.forEach((part) => {
          if (!part) return;
          if (/^\s+$/.test(part)) {
            frag.appendChild(document.createTextNode(' '));
          } else {
            const w = document.createElement('span');
            w.className = 'word';
            const inner = document.createElement('span');
            inner.textContent = part;
            w.appendChild(inner);
            frag.appendChild(w);
          }
        });
        child.replaceWith(frag);
      } else if (child.nodeType === Node.ELEMENT_NODE && !(child as Element).classList.contains('word')) {
        walk(child);
      }
    });
  };
  // Texto completo para lectores de pantalla; la versión dividida queda oculta para ellos.
  const sr = document.createElement('span');
  sr.className = 'sr-only';
  sr.textContent = el.textContent?.replace(/\s+/g, ' ').trim() ?? '';
  const visual = document.createElement('span');
  visual.setAttribute('aria-hidden', 'true');
  while (el.firstChild) visual.appendChild(el.firstChild);
  walk(visual);
  el.append(sr, visual);
  el.classList.add('is-split');
}
