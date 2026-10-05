// Comportamiento del panel de administración: acceso, formulario de producto, fotos y confirmaciones.
// Todo el texto que viene del servidor se inserta con textContent/atributos, nunca como HTML.

const csrf = document.querySelector<HTMLMetaElement>('meta[name="csrf-token"]')?.content ?? '';
const FLASH_KEY = 'fdl-flash';

// ───────── Utilidades ─────────
const toastEl = document.querySelector<HTMLElement>('[data-toast]');
let toastTimer: number | undefined;
function toast(message: string, isError = false) {
  if (!toastEl) return;
  toastEl.textContent = message;
  toastEl.classList.toggle('is-err', isError);
  toastEl.classList.add('is-on');
  window.clearTimeout(toastTimer);
  toastTimer = window.setTimeout(() => toastEl.classList.remove('is-on'), isError ? 6000 : 3500);
}

function flash(message: string) {
  try { sessionStorage.setItem(FLASH_KEY, message); } catch { /* sin almacenamiento: se omite el aviso */ }
}
try {
  const pending = sessionStorage.getItem(FLASH_KEY);
  if (pending) { sessionStorage.removeItem(FLASH_KEY); toast(pending); }
} catch { /* ignorar */ }

interface ApiResult { ok: boolean; status: number; data: any }

async function api(url: string, method: string, body?: unknown): Promise<ApiResult> {
  const headers: Record<string, string> = { 'x-csrf-token': csrf };
  let payload: BodyInit | undefined;
  if (body instanceof FormData) payload = body;
  else if (body !== undefined) { headers['Content-Type'] = 'application/json'; payload = JSON.stringify(body); }
  try {
    const res = await fetch(url, { method, headers, body: payload, credentials: 'same-origin' });
    const data = await res.json().catch(() => ({}));
    // Sesión caducada: al login. (En la propia pantalla de acceso un 401 solo significa «contraseña incorrecta».)
    if (res.status === 401 && !window.location.pathname.endsWith('/admin/login')) window.location.href = '/admin/login';
    return { ok: res.ok && data.ok !== false, status: res.status, data };
  } catch {
    return { ok: false, status: 0, data: { error: 'No hay conexión. Inténtalo de nuevo.' } };
  }
}

const dialog = document.querySelector<HTMLDialogElement>('[data-confirm]');
function confirmDialog(title: string, text: string, okLabel = 'Eliminar'): Promise<boolean> {
  if (!dialog) return Promise.resolve(false);
  dialog.querySelector('[data-confirm-title]')!.textContent = title;
  dialog.querySelector('[data-confirm-text]')!.textContent = text;
  dialog.querySelector('[data-confirm-ok]')!.textContent = okLabel;
  return new Promise((resolve) => {
    dialog.addEventListener('close', () => resolve(dialog.returnValue === 'ok'), { once: true });
    dialog.returnValue = 'cancel';
    dialog.showModal();
  });
}

// ───────── Cerrar sesión ─────────
document.querySelector('[data-logout]')?.addEventListener('click', async () => {
  await api('/api/admin/logout', 'POST');
  window.location.href = '/admin/login';
});

// ───────── Acceso ─────────
const loginForm = document.querySelector<HTMLFormElement>('[data-login-form]');
if (loginForm) {
  const msg = loginForm.querySelector<HTMLElement>('[data-form-message]')!;
  const submit = loginForm.querySelector<HTMLButtonElement>('[data-submit]')!;
  loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    msg.textContent = '';
    const fd = new FormData(loginForm);
    const email = String(fd.get('email') ?? '').trim();
    const password = String(fd.get('password') ?? '');
    if (!email || !password) { msg.textContent = 'Escribe tu correo y tu contraseña.'; return; }
    submit.disabled = true;
    submit.textContent = 'Entrando…';
    const res = await api('/api/admin/login', 'POST', { email, password });
    if (res.ok) { window.location.href = '/admin'; return; }
    msg.textContent = res.data.error ?? 'No se pudo iniciar sesión.';
    submit.disabled = false;
    submit.textContent = 'Entrar';
    loginForm.querySelector<HTMLInputElement>('[name=password]')!.value = '';
  });
}

// ───────── Fotos: reducir antes de subir ─────────
// Vercel limita el cuerpo de una petición a ~4,5 MB, así que se reducen las fotos grandes en el navegador.
async function shrink(file: File): Promise<File> {
  try {
    const bitmap = await createImageBitmap(file, { imageOrientation: 'from-image' });
    const scale = Math.min(1, 1600 / Math.max(bitmap.width, bitmap.height));
    if (scale === 1 && file.size < 1_500_000 && file.type === 'image/webp') return file;
    const canvas = document.createElement('canvas');
    canvas.width = Math.round(bitmap.width * scale);
    canvas.height = Math.round(bitmap.height * scale);
    canvas.getContext('2d')!.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
    const blob: Blob | null = await new Promise((r) => canvas.toBlob(r, 'image/webp', 0.85));
    if (blob && blob.size < file.size) return new File([blob], file.name.replace(/\.\w+$/, '') + '.webp', { type: 'image/webp' });
  } catch { /* si el navegador no puede, se sube la original */ }
  return file;
}

// ───────── Formulario de producto ─────────
const form = document.querySelector<HTMLFormElement>('[data-product-form]');
if (form) initProductForm(form);

function initProductForm(form: HTMLFormElement) {
  let productId = form.dataset.id ?? '';
  const editing = productId !== '';
  const msg = form.querySelector<HTMLElement>('[data-form-message]')!;
  const submit = form.querySelector<HTMLButtonElement>('[data-submit]')!;
  const photos = form.querySelector<HTMLUListElement>('[data-photos]');
  const pendingList = form.querySelector<HTMLUListElement>('[data-pending]')!;
  const fileInput = form.querySelector<HTMLInputElement>('[data-file-input]')!;
  const dropzone = form.querySelector<HTMLElement>('[data-dropzone]')!;
  const nameInput = form.querySelector<HTMLInputElement>('[name=name]')!;
  const slugInput = form.querySelector<HTMLInputElement>('[data-slug-field]')!;
  const pending: File[] = [];

  // Slug automático mientras no se haya escrito a mano
  const slugify = (s: string) =>
    s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 80);
  nameInput.addEventListener('input', () => { if (slugInput.dataset.auto === 'true') slugInput.value = slugify(nameInput.value); });
  slugInput.addEventListener('input', () => { slugInput.dataset.auto = 'false'; });

  const field = (name: string) => form.elements.namedItem(name) as HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement;
  const showErrors = (errors: Record<string, string> = {}) => {
    form.querySelectorAll<HTMLElement>('[data-error]').forEach((el) => {
      const key = el.dataset.error!;
      el.textContent = errors[key] ?? '';
      field(key)?.setAttribute('aria-invalid', errors[key] ? 'true' : 'false');
    });
  };

  const collect = () => ({
    name: field('name').value,
    slug: field('slug').value,
    category_id: field('category_id').value,
    subcategory: field('subcategory').value,
    price: field('price').value,
    description: field('description').value,
    composition: field('composition').value,
    care: field('care').value,
    dimensions: field('dimensions').value,
    watering: field('watering').value,
    occasions: field('occasions').value.split(',').map((s) => s.trim()).filter(Boolean),
    published: (field('published') as HTMLInputElement).checked,
    featured: (field('featured') as HTMLInputElement).checked,
  });

  // ── Guardar ──
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    msg.textContent = '';
    showErrors();
    submit.disabled = true;
    const label = submit.textContent;
    submit.textContent = 'Guardando…';

    const res = editing
      ? await api(`/api/admin/products/${productId}`, 'PUT', collect())
      : await api('/api/admin/products', 'POST', collect());

    if (!res.ok) {
      showErrors(res.data.errors);
      msg.textContent = res.data.error ?? (res.data.errors ? 'Revisa los campos marcados.' : 'No se pudo guardar.');
      const first = Object.keys(res.data.errors ?? {})[0];
      if (first) field(first)?.focus();
      submit.disabled = false;
      submit.textContent = label;
      return;
    }

    if (!editing) {
      productId = res.data.id;
      let failed = 0;
      for (const [i, file] of pending.entries()) {
        submit.textContent = `Subiendo foto ${i + 1} de ${pending.length}…`;
        const up = await uploadImage(file);
        if (!up.ok) failed++;
      }
      flash(failed ? `Producto creado, pero ${failed} foto(s) no se pudieron subir.` : 'Producto creado.');
      window.location.href = `/admin/productos/${productId}`;
      return;
    }

    toast('Cambios guardados.');
    submit.disabled = false;
    submit.textContent = label;
  });

  // ── Subir fotos ──
  async function uploadImage(file: File) {
    const small = await shrink(file);
    const body = new FormData();
    body.append('file', small, small.name);
    return api(`/api/admin/products/${productId}/images`, 'POST', body);
  }

  async function addFiles(list: FileList | File[]) {
    const files = Array.from(list).filter((f) => /^image\/(jpeg|png|webp)$/.test(f.type));
    if (files.length < Array.from(list).length) toast('Solo se admiten fotos JPEG, PNG o WebP.', true);
    if (!editing) {
      for (const f of files) {
        pending.push(f);
        const li = document.createElement('li');
        li.className = 'photo';
        const img = document.createElement('img');
        img.src = URL.createObjectURL(f);
        img.alt = '';
        const name = document.createElement('span');
        name.className = 'grow';
        name.textContent = f.name;
        const rm = document.createElement('button');
        rm.type = 'button';
        rm.className = 'iconbtn';
        rm.textContent = '✕';
        rm.setAttribute('aria-label', `Quitar ${f.name}`);
        rm.addEventListener('click', () => { pending.splice(pending.indexOf(f), 1); URL.revokeObjectURL(img.src); li.remove(); pendingList.hidden = pending.length === 0; });
        const tools = document.createElement('div');
        tools.className = 'photo__tools';
        tools.append(name, rm);
        li.append(img, tools);
        pendingList.append(li);
      }
      pendingList.hidden = pending.length === 0;
      return;
    }
    for (const [i, f] of files.entries()) {
      toast(`Subiendo foto ${i + 1} de ${files.length}…`);
      const res = await uploadImage(f);
      if (!res.ok) { toast(res.data.error ?? 'No se pudo subir la foto.', true); continue; }
      photos?.append(photoItem(res.data.image));
      refreshPhotos();
    }
    toast('Fotos añadidas.');
  }

  fileInput.addEventListener('change', async () => { if (fileInput.files) await addFiles(fileInput.files); fileInput.value = ''; });
  ['dragenter', 'dragover'].forEach((ev) => dropzone.addEventListener(ev, (e) => { e.preventDefault(); dropzone.classList.add('is-over'); }));
  ['dragleave', 'drop'].forEach((ev) => dropzone.addEventListener(ev, (e) => { e.preventDefault(); dropzone.classList.remove('is-over'); }));
  dropzone.addEventListener('drop', (e) => { const dt = (e as DragEvent).dataTransfer; if (dt?.files) void addFiles(dt.files); });

  // ── Fotos ya guardadas ──
  function photoItem(img: { id: string; alt: string; thumb: string }) {
    const li = document.createElement('li');
    li.className = 'photo';
    li.dataset.imageId = img.id;
    const pic = document.createElement('img');
    pic.src = img.thumb; pic.alt = img.alt; pic.width = 220; pic.height = 275;
    const alt = document.createElement('input');
    alt.type = 'text'; alt.value = img.alt; alt.maxLength = 200; alt.placeholder = 'Descripción de la foto';
    alt.setAttribute('aria-label', 'Texto alternativo de la foto');
    alt.dataset.alt = '';
    const tools = document.createElement('div');
    tools.className = 'photo__tools';
    const label = document.createElement('span');
    label.className = 'grow';
    const mk = (text: string, attr: string, aria: string) => {
      const b = document.createElement('button');
      b.type = 'button'; b.className = 'iconbtn'; b.textContent = text; b.setAttribute('aria-label', aria);
      b.setAttribute(attr, attr === 'data-move' ? aria === 'Mover antes' ? 'up' : 'down' : '');
      return b;
    };
    tools.append(label, mk('←', 'data-move', 'Mover antes'), mk('→', 'data-move', 'Mover después'), mk('✕', 'data-delete-image', 'Eliminar foto'));
    li.append(pic, alt, tools);
    return li;
  }

  function refreshPhotos() {
    if (!photos) return;
    const items = Array.from(photos.querySelectorAll<HTMLLIElement>('.photo'));
    items.forEach((li, i) => {
      const label = li.querySelector<HTMLElement>('.grow')!;
      label.replaceChildren();
      if (i === 0) { const b = document.createElement('span'); b.className = 'photo__badge'; b.textContent = 'Portada'; label.append(b); }
      else label.textContent = `Foto ${i + 1}`;
      li.querySelector<HTMLButtonElement>('[data-move=up]')!.disabled = i === 0;
      li.querySelector<HTMLButtonElement>('[data-move=down]')!.disabled = i === items.length - 1;
    });
  }

  photos?.addEventListener('click', async (e) => {
    const target = e.target as HTMLElement;
    const li = target.closest<HTMLLIElement>('.photo');
    const id = li?.dataset.imageId;
    if (!li || !id) return;

    const moveBtn = target.closest<HTMLButtonElement>('[data-move]');
    if (moveBtn) {
      const dir = moveBtn.dataset.move as 'up' | 'down';
      const res = await api(`/api/admin/images/${id}`, 'PATCH', { move: dir });
      if (!res.ok) return toast(res.data.error ?? 'No se pudo mover la foto.', true);
      if (dir === 'up') li.previousElementSibling?.before(li); else li.nextElementSibling?.after(li);
      refreshPhotos();
      return;
    }
    if (target.closest('[data-delete-image]')) {
      if (!(await confirmDialog('¿Eliminar esta foto?', 'Se quitará del producto y de la web.'))) return;
      const res = await api(`/api/admin/images/${id}`, 'DELETE');
      if (!res.ok) return toast(res.data.error ?? 'No se pudo eliminar la foto.', true);
      li.remove();
      refreshPhotos();
      toast('Foto eliminada.');
    }
  });

  photos?.addEventListener('change', async (e) => {
    const input = e.target as HTMLInputElement;
    const id = input.closest<HTMLLIElement>('.photo')?.dataset.imageId;
    if (!id || input.dataset.alt === undefined) return;
    const res = await api(`/api/admin/images/${id}`, 'PATCH', { alt: input.value });
    toast(res.ok ? 'Texto de la foto guardado.' : (res.data.error ?? 'No se pudo guardar el texto.'), !res.ok);
  });

  // ── Eliminar producto ──
  form.querySelector<HTMLButtonElement>('[data-delete-product]')?.addEventListener('click', async (e) => {
    const name = (e.currentTarget as HTMLElement).dataset.name ?? 'este producto';
    const ok = await confirmDialog(`¿Eliminar «${name}»?`, 'Se borrarán el producto y todas sus fotos. No se puede deshacer.');
    if (!ok) return;
    const res = await api(`/api/admin/products/${productId}`, 'DELETE');
    if (!res.ok) return toast(res.data.error ?? 'No se pudo eliminar el producto.', true);
    flash('Producto eliminado.');
    window.location.href = '/admin';
  });
}
