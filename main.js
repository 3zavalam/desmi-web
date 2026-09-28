// Datos de contacto. WhatsApp con lada de país, sin espacios ni signos.
// Si se deja vacío, los botones de WhatsApp no se muestran.
const WHATSAPP = "13462743997";
const WHATSAPP_VISIBLE = "+1 346 274 3997";
const EMAIL = "ece.corporativo@prodigy.net.mx";

// Menú móvil
const menuBtn = document.querySelector(".menu-btn");
const mobileNav = document.getElementById("mobile-nav");

function setMenu(open) {
  mobileNav.hidden = !open;
  menuBtn.setAttribute("aria-expanded", String(open));
  menuBtn.textContent = open ? "Cerrar" : "Menú";
}

menuBtn.addEventListener("click", () => setMenu(mobileNav.hidden));
mobileNav.querySelectorAll("a").forEach((a) => a.addEventListener("click", () => setMenu(false)));

// Resalta la sección visible en la navegación
const links = document.querySelectorAll(".nav-link");
const sections = ["sargazo", "sistema", "servicios", "costa", "preguntas", "contacto"]
  .map((id) => document.getElementById(id))
  .filter(Boolean);

const observer = new IntersectionObserver(
  (entries) => {
    const visible = entries
      .filter((e) => e.isIntersecting)
      .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
    if (!visible) return;
    links.forEach((link) =>
      link.classList.toggle("active", link.getAttribute("href") === `#${visible.target.id}`),
    );
  },
  { rootMargin: "-40% 0px -45% 0px", threshold: [0.15, 0.4] },
);

sections.forEach((s) => observer.observe(s));

// Diagramas: cambio de modo (malla / muro, desvío / bolsa)
document.querySelectorAll("[data-toggle]").forEach((box) => {
  const buttons = box.querySelectorAll("[data-set]");
  buttons.forEach((btn) =>
    btn.addEventListener("click", () => {
      box.dataset.mode = btn.dataset.set;
      buttons.forEach((b) => b.setAttribute("aria-pressed", String(b === btn)));
    }),
  );
});

// Sistema: pestañas de vistas (flechas izquierda/derecha para moverse)
const viewTabs = [...document.querySelectorAll('.view-tabs [role="tab"]')];
function showView(tab) {
  viewTabs.forEach((t) => {
    const on = t === tab;
    t.setAttribute("aria-selected", String(on));
    t.tabIndex = on ? 0 : -1;
    document.getElementById(t.getAttribute("aria-controls")).hidden = !on;
  });
}
viewTabs.forEach((tab, i) => {
  tab.addEventListener("click", () => showView(tab));
  tab.addEventListener("keydown", (e) => {
    const step = { ArrowRight: 1, ArrowLeft: -1 }[e.key];
    if (!step) return;
    const next = viewTabs[(i + step + viewTabs.length) % viewTabs.length];
    showView(next);
    next.focus();
  });
});

// Corte: seleccionar pieza desde el diagrama o desde los botones
const tabs = document.querySelectorAll(".parts [data-part]");
const parts = document.querySelectorAll(".part[data-part]");
const details = document.querySelectorAll("[data-detail]");

function selectPart(name) {
  tabs.forEach((t) => t.setAttribute("aria-selected", String(t.dataset.part === name)));
  parts.forEach((g) => g.classList.toggle("on", g.dataset.part === name));
  details.forEach((d) => (d.hidden = d.dataset.detail !== name));
}

tabs.forEach((t) => t.addEventListener("click", () => selectPart(t.dataset.part)));
parts.forEach((g) => g.addEventListener("click", () => selectPart(g.dataset.part)));
selectPart("float");

// Intro: el video del sargazo a pantalla completa. Al terminar (o con "Entrar") se
// desvanece y queda la página. Si el video no puede reproducirse, se salta.
const intro = document.getElementById("intro");
const introVideo = intro?.querySelector("video");
const introBar = intro?.querySelector(".intro-bar span");
const INTRO_SPEED = 1.5;
let introTimer;
let introStarted = false;

function closeIntro() {
  if (!document.documentElement.classList.contains("has-intro")) return;
  clearTimeout(introTimer);
  intro.classList.add("out");
  try {
    sessionStorage.setItem("intro-vista", "1");
  } catch (e) {}
  setTimeout(() => {
    document.documentElement.classList.remove("has-intro");
    intro.classList.remove("out");
    introVideo.pause();
  }, 700);
}

function playIntro() {
  document.documentElement.classList.add("has-intro");
  introStarted = false;
  introVideo.currentTime = 0;
  introVideo.playbackRate = INTRO_SPEED;
  // Si en 6 s no empezó (autoplay bloqueado, sin códec, red muy lenta), se entra a la página
  introTimer = setTimeout(() => introStarted || closeIntro(), 6000);
  introVideo.play().catch(closeIntro);
}

if (intro && introVideo) {
  introVideo.addEventListener("ended", closeIntro);
  introVideo.addEventListener("playing", () => (introStarted = true));
  introVideo.addEventListener("ratechange", () => {
    if (introVideo.playbackRate !== INTRO_SPEED) introVideo.playbackRate = INTRO_SPEED;
  });
  introVideo.addEventListener("timeupdate", () => {
    if (introVideo.duration) introBar.style.width = `${(introVideo.currentTime / introVideo.duration) * 100}%`;
  });
  introVideo.querySelector("source:last-of-type")?.addEventListener("error", closeIntro);
  intro.querySelector(".intro-skip").addEventListener("click", closeIntro);
  document.addEventListener("keydown", (e) => e.key === "Escape" && closeIntro());
  document.querySelector("[data-replay]")?.addEventListener("click", playIntro);

  if (document.documentElement.classList.contains("has-intro")) playIntro();
  else introVideo.preload = "none";
}

// WhatsApp: enlaces y botón flotante
const waUrl = (text = "") =>
  `https://wa.me/${WHATSAPP}${text ? `?text=${encodeURIComponent(text)}` : ""}`;

document.querySelectorAll("[data-wa]").forEach((el) => {
  if (WHATSAPP) {
    el.href = waUrl("Hola, me interesa la barrera contra sargazo.");
    el.target = "_blank";
    el.rel = "noopener";
    el.hidden = false;
    if (el.classList.contains("wa-link")) el.textContent = WHATSAPP_VISIBLE;
  } else if (el.classList.contains("wa-link")) {
    el.textContent = "PENDIENTE";
    el.classList.add("todo");
    el.removeAttribute("href");
  }
});

// Formulario: arma el mensaje y lo abre en el correo o en WhatsApp. No guarda datos.
const form = document.getElementById("contact-form");
if (form) {
  const waBtn = form.querySelector('[data-via="wa"]');
  if (WHATSAPP) waBtn.hidden = false;
  const error = form.querySelector(".form-error");

  form.addEventListener("submit", (event) => {
    event.preventDefault();
    const data = new FormData(form);
    const ok =
      ["nombre", "ubicacion", "telefono"].every((k) => String(data.get(k) || "").trim()) &&
      data.get("aviso");
    error.hidden = Boolean(ok);
    if (!ok) return;

    const lines = [
      ["Nombre", "nombre"],
      ["Hotel o empresa", "empresa"],
      ["Ubicación", "ubicacion"],
      ["Metros de costa", "metros"],
      ["Teléfono", "telefono"],
      ["Correo", "correo"],
      ["Mensaje", "mensaje"],
    ]
      .map(([label, key]) => [label, String(data.get(key) || "").trim()])
      .filter(([, value]) => value)
      .map(([label, value]) => `${label}: ${value}`);
    const text = `Solicitud de cotización, barrera contra sargazo\n\n${lines.join("\n")}`;

    if (event.submitter?.dataset.via === "wa" && WHATSAPP) {
      window.open(waUrl(text), "_blank", "noopener");
    } else {
      const subject = `Cotización barrera sargazo · ${data.get("ubicacion")}`;
      window.location.href = `mailto:${EMAIL}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(text)}`;
    }
  });
}
