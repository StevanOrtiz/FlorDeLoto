// Buscador emergente de la cabecera: sugerencias en vivo desde /api/search, navegación con teclado
// y enlace a /buscar. Sin JavaScript, el botón de la lupa lleva directamente a /buscar.
interface Suggestion { name: string; url: string; category: string; price: string; thumb: string | null; alt: string }

const root = document.querySelector<HTMLElement>('[data-search]');
if (root) {
  const input = root.querySelector<HTMLInputElement>('[data-search-input]')!;
  const list = root.querySelector<HTMLUListElement>('[data-search-list]')!;
  const status = root.querySelector<HTMLElement>('[data-search-status]')!;
  const all = root.querySelector<HTMLAnchorElement>('[data-search-all]')!;
  const hint = root.querySelector<HTMLElement>('[data-search-hint]')!;
  const empty = root.querySelector<HTMLElement>('[data-search-empty]')!;
  const emptyLink = root.querySelector<HTMLAnchorElement>('[data-search-all-empty]')!;
  const form = root.querySelector<HTMLFormElement>('form')!;
  const openers = document.querySelectorAll<HTMLElement>('[data-search-open]');

  let lastFocus: HTMLElement | null = null;
  let timer: number | undefined;
  let controller: AbortController | undefined;
  let active = -1;

  const options = () => Array.from(list.querySelectorAll<HTMLAnchorElement>('a'));
  const setActive = (i: number) => {
    const opts = options();
    active = opts.length ? (i + opts.length) % opts.length : -1;
    opts.forEach((o, n) => o.setAttribute('aria-selected', String(n === active)));
    if (active >= 0) {
      input.setAttribute('aria-activedescendant', opts[active].id);
      opts[active].scrollIntoView({ block: 'nearest' });
    } else input.removeAttribute('aria-activedescendant');
  };

  const reset = () => {
    list.replaceChildren();
    list.hidden = true;
    all.hidden = true;
    empty.hidden = true;
    hint.hidden = false;
    input.setAttribute('aria-expanded', 'false');
    setActive(-1);
  };

  const render = (q: string, results: Suggestion[]) => {
    list.replaceChildren();
    const href = `/buscar?q=${encodeURIComponent(q)}`;
    all.href = href;
    emptyLink.href = href;
    hint.hidden = true;
    empty.hidden = results.length > 0;
    all.hidden = results.length === 0;
    list.hidden = results.length === 0;
    input.setAttribute('aria-expanded', String(results.length > 0));
    results.forEach((r, i) => {
      const li = document.createElement('li');
      li.setAttribute('role', 'presentation');
      const a = document.createElement('a');
      a.href = r.url;
      a.id = `search-opt-${i}`;
      a.setAttribute('role', 'option');
      a.setAttribute('aria-selected', 'false');
      if (r.thumb) {
        const img = document.createElement('img');
        img.className = 'search__thumb';
        img.src = r.thumb; img.alt = ''; img.width = 56; img.height = 70; img.loading = 'lazy';
        a.append(img);
      }
      const meta = document.createElement('span');
      meta.className = 'search__meta';
      const name = document.createElement('span'); name.className = 'search__name'; name.textContent = r.name;
      const sub = document.createElement('span'); sub.className = 'search__sub'; sub.textContent = r.category;
      meta.append(name, sub);
      const price = document.createElement('span'); price.className = 'search__price'; price.textContent = r.price;
      a.append(meta, price);
      li.append(a);
      list.append(li);
    });
    status.textContent = results.length ? `${results.length} sugerencias. Usa las flechas para moverte.` : 'Sin resultados.';
    setActive(-1);
  };

  const run = async () => {
    const q = input.value.replace(/\s+/g, ' ').trim();
    if (q.length < 2) { controller?.abort(); reset(); status.textContent = ''; return; }
    controller?.abort();
    controller = new AbortController();
    try {
      const res = await fetch(`/api/search?q=${encodeURIComponent(q)}`, { signal: controller.signal, headers: { Accept: 'application/json' } });
      if (!res.ok) throw new Error(String(res.status));
      const data = (await res.json()) as { results: Suggestion[] };
      render(q, data.results);
    } catch (e) {
      if ((e as Error).name === 'AbortError') return;
      reset();
      status.textContent = 'No se pudo buscar ahora. Pulsa Intro para ver la búsqueda completa.';
    }
  };

  const open = (e?: Event) => {
    e?.preventDefault();
    lastFocus = document.activeElement as HTMLElement | null;
    root.hidden = false;
    document.documentElement.style.overflow = 'hidden';
    window.dispatchEvent(new CustomEvent('lenis:stop'));
    input.focus();
    input.select();
  };
  const close = () => {
    if (root.hidden) return;
    root.hidden = true;
    controller?.abort();
    document.documentElement.style.overflow = '';
    window.dispatchEvent(new CustomEvent('lenis:start'));
    lastFocus?.focus();
  };

  openers.forEach((o) => o.addEventListener('click', open));
  root.querySelectorAll('[data-search-close]').forEach((el) => el.addEventListener('click', close));
  // Los enlaces de sugerencias llevan a otra página: no hace falta cerrar, pero se libera el scroll por si hay caché de página.
  root.addEventListener('click', (e) => { if ((e.target as HTMLElement).closest('a')) close(); });

  input.addEventListener('input', () => { window.clearTimeout(timer); timer = window.setTimeout(run, 160); });

  // Con una sugerencia resaltada, Intro la abre; si no, envía el formulario a /buscar.
  form.addEventListener('submit', (e) => {
    const opt = options()[active];
    if (opt) { e.preventDefault(); location.href = opt.href; return; }
    if (input.value.trim().length < 2) e.preventDefault();
  });

  root.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') { e.preventDefault(); close(); return; }
    if (e.key === 'ArrowDown') { e.preventDefault(); setActive(active + 1); }
    else if (e.key === 'ArrowUp') { e.preventDefault(); setActive(active - 1); }
    else if (e.key === 'Tab') {
      // Foco atrapado dentro del cuadro de búsqueda.
      const f = Array.from(root.querySelectorAll<HTMLElement>('input, button, a[href]')).filter((el) => !el.closest('[hidden]'));
      if (!f.length) return;
      const first = f[0], last = f[f.length - 1];
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    }
  });

  // Atajo: «/» abre el buscador cuando no se está escribiendo en otro campo.
  document.addEventListener('keydown', (e) => {
    const t = e.target as HTMLElement;
    if (e.key === '/' && !e.ctrlKey && !e.metaKey && !e.altKey && !/^(INPUT|TEXTAREA|SELECT)$/.test(t.tagName) && !t.isContentEditable && root.hidden) open(e);
  });
}
