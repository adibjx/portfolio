"use strict";

/* ============================================================
   EDIT HERE — ads
   Slots on the page are always 01–10. Add an entry and the
   matching files; everything else stays a placeholder.

   Video (9:16), both files required:
     { id: "01", src: "assets/videos/01.mp4", poster: "assets/videos/01.jpg", alt: "Short description of the ad" }

   Static (framed 4:5, image is cropped to fill):
     { id: "01", src: "assets/stills/01.jpg", alt: "Short description of the ad" }

   Optional: captions: "assets/videos/01.vtt", lang: "en"
   Paths must live under assets/. Raise SLOT_COUNT to add slots.
   TODO(Adib): replace each alt with a real description of that ad.
   ============================================================ */

const SLOT_COUNT = 10;

const VIDEO_ADS = [
  // { id: "01", src: "assets/videos/01.mp4", poster: "assets/videos/01.jpg", alt: "TODO: describe this video ad" },
];

const STATIC_ADS = [
  // { id: "01", src: "assets/stills/01.jpg", alt: "TODO: describe this static ad" },
];

const reducedMotion = matchMedia("(prefers-reduced-motion: reduce)").matches;
const saveData = !!(navigator.connection && navigator.connection.saveData);
const autoplay = !reducedMotion && !saveData;

const ICONS = {
  play: '<path fill="currentColor" d="M8.2 5.4v13.2L19 12 8.2 5.4z"/>',
  muted: '<path stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" d="M4.5 10h3L11 6.6v10.8L7.5 14h-3v-4zM16 10l4 4M20 10l-4 4"/>',
  sound: '<path stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" d="M4.5 10h3L11 6.6v10.8L7.5 14h-3v-4zM15.2 9.2a3.6 3.6 0 0 1 0 5.6M17.6 7a6.2 6.2 0 0 1 0 10"/>',
  zoom: '<circle cx="10.5" cy="10.5" r="5.2" stroke="currentColor" stroke-width="1.8"/><path stroke="currentColor" stroke-width="1.8" stroke-linecap="round" d="m14.6 14.6 4 4M10.5 8.2v4.6M8.2 10.5h4.6"/>'
};

function slotId(n) {
  return String(n).padStart(2, "0");
}

function normId(id) {
  const n = Number(id);
  if (!Number.isInteger(n) || n < 1 || n > SLOT_COUNT) return null;
  return slotId(n);
}

function isSafeSrc(src) {
  return typeof src === "string" && /^assets\/[\w./-]+$/.test(src) && !src.includes("..");
}

function cleanAlt(alt, fallback) {
  if (typeof alt !== "string") return fallback;
  const trimmed = alt.trim();
  if (!trimmed || trimmed.startsWith("TODO")) return fallback;
  return trimmed;
}

function byId(list, kind) {
  const map = new Map();
  if (!Array.isArray(list)) return map;
  list.forEach((item) => {
    if (!item || typeof item !== "object") return;
    const id = normId(item.id);
    if (!id || !isSafeSrc(item.src)) return;
    if (kind === "video" && !isSafeSrc(item.poster)) return;
    map.set(id, item);
  });
  return map;
}

function svg(markup) {
  const wrap = document.createElement("div");
  wrap.innerHTML = `<svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true" fill="none">${markup}</svg>`;
  return wrap.firstElementChild;
}

function fractionVisible(el) {
  const rect = el.getBoundingClientRect();
  if (rect.height <= 0) return 0;
  const height = window.innerHeight || document.documentElement.clientHeight;
  const visible = Math.min(rect.bottom, height) - Math.max(rect.top, 0);
  return Math.max(0, visible) / rect.height;
}

function updateSoundButton(card) {
  const button = card.querySelector(".sound");
  const video = card.querySelector("video");
  if (!button || !video) return;
  const id = card.dataset.id;
  button.replaceChildren(svg(video.paused ? ICONS.play : video.muted ? ICONS.muted : ICONS.sound));
  if (video.paused) {
    button.setAttribute("aria-label", `Play video ad ${id}`);
    button.setAttribute("aria-pressed", "false");
  } else if (video.muted) {
    button.setAttribute("aria-label", `Unmute video ad ${id}`);
    button.setAttribute("aria-pressed", "false");
  } else {
    button.setAttribute("aria-label", `Mute video ad ${id}`);
    button.setAttribute("aria-pressed", "true");
  }
  card.classList.toggle("is-sound", !video.paused && !video.muted);
}

function muteOthers(current) {
  document.querySelectorAll(".vcard video").forEach((video) => {
    if (video === current) return;
    video.muted = true;
    const card = video.closest(".vcard");
    if (card) updateSoundButton(card);
  });
}

function ensureSource(video, src) {
  if (!video.getAttribute("src")) {
    video.preload = "none";
    video.setAttribute("preload", "none");
    video.src = src;
  }
}

function playMuted(card) {
  if (!autoplay || !card.classList.contains("is-ready") || card.classList.contains("is-broken")) return;
  const video = card.querySelector("video");
  if (!video || !card.dataset.src) return;
  card.dataset.wantPlay = "1";
  ensureSource(video, card.dataset.src);
  if (!video.paused) return;
  video.muted = true;
  const pending = video.play();
  if (pending && typeof pending.then === "function") {
    pending.then(() => {
      if (card.dataset.wantPlay !== "1") {
        video.pause();
        video.muted = true;
      }
    }).catch(() => {});
  }
}

function pauseOffscreen(card) {
  card.dataset.wantPlay = "0";
  const video = card.querySelector("video");
  if (!video) return;
  video.pause();
  video.muted = true;
  updateSoundButton(card);
}

function activate(card) {
  if (!card.classList.contains("is-ready") || card.classList.contains("is-broken")) return;
  const video = card.querySelector("video");
  if (!video || !card.dataset.src) return;
  ensureSource(video, card.dataset.src);
  if (video.paused) {
    card.dataset.wantPlay = "1";
    video.muted = true;
    const pending = video.play();
    if (pending && typeof pending.catch === "function") pending.catch(() => {});
    return;
  }
  if (video.muted) {
    muteOthers(video);
    video.muted = false;
    const pending = video.play();
    if (pending && typeof pending.catch === "function") pending.catch(() => {});
  } else {
    video.muted = true;
  }
  updateSoundButton(card);
}

function ensureVideo(card) {
  if (card.querySelector("video")) return;
  const frame = card.querySelector(".frame");
  const video = document.createElement("video");
  video.muted = true;
  video.defaultMuted = true;
  video.playsInline = true;
  video.setAttribute("playsinline", "");
  video.setAttribute("webkit-playsinline", "");
  video.setAttribute("muted", "");
  video.preload = "none";
  video.setAttribute("preload", "none");
  video.loop = true;
  video.poster = card.dataset.poster;
  video.tabIndex = -1;
  video.setAttribute("aria-hidden", "true");
  video.disablePictureInPicture = true;
  if (isSafeSrc(card.dataset.captions)) {
    const track = document.createElement("track");
    track.kind = "captions";
    track.src = card.dataset.captions;
    track.srclang = card.dataset.lang || "en";
    track.label = "Captions";
    video.append(track);
  }
  video.addEventListener("play", () => updateSoundButton(card));
  video.addEventListener("pause", () => updateSoundButton(card));
  video.addEventListener("volumechange", () => updateSoundButton(card));
  video.addEventListener("playing", () => card.classList.add("has-played"));
  video.addEventListener("error", () => {
    if (!video.getAttribute("src")) return;
    card.classList.add("is-broken");
    card.dataset.wantPlay = "0";
    video.pause();
    video.removeAttribute("src");
  });

  const button = document.createElement("button");
  button.type = "button";
  button.className = "sound";
  button.addEventListener("click", (event) => {
    event.stopPropagation();
    activate(card);
  });

  frame.append(video, button);
  frame.addEventListener("click", () => activate(card));
  updateSoundButton(card);
}

function mountVideo(card) {
  if (card.dataset.mounted === "1") return;
  card.dataset.mounted = "1";
  const poster = document.createElement("img");
  poster.className = "poster";
  poster.alt = "";
  poster.decoding = "async";
  if ("fetchPriority" in poster) poster.fetchPriority = "low";
  card.querySelector(".frame").append(poster);
  poster.addEventListener("load", () => {
    card.classList.add("is-ready");
    card.setAttribute("aria-label", card.dataset.alt);
    ensureVideo(card);
    if (fractionVisible(card) >= 0.6) playMuted(card);
  }, { once: true });
  poster.addEventListener("error", () => {
    card.dataset.mounted = "0";
    poster.removeAttribute("src");
  }, { once: true });
  poster.src = card.dataset.poster;
}

function renderVideoSlot(id, ad) {
  const article = document.createElement("article");
  article.className = "vcard";
  article.dataset.id = id;
  article.setAttribute("aria-roledescription", "slide");
  article.setAttribute("aria-setsize", String(SLOT_COUNT));
  article.setAttribute("aria-posinset", String(Number(id)));

  const frame = document.createElement("div");
  frame.className = "frame";
  const placeholder = document.createElement("div");
  placeholder.className = "ph";
  const num = document.createElement("span");
  num.className = "ph-num";
  num.textContent = id;
  const label = document.createElement("span");
  label.className = "ph-label";
  label.textContent = "Placeholder";
  placeholder.append(num, label);
  frame.append(placeholder);

  if (ad) {
    article.dataset.src = ad.src;
    article.dataset.poster = ad.poster;
    article.dataset.alt = cleanAlt(ad.alt, `Video ad ${id}`);
    if (isSafeSrc(ad.captions)) article.dataset.captions = ad.captions;
    if (typeof ad.lang === "string" && /^[a-zA-Z-]{2,12}$/.test(ad.lang)) article.dataset.lang = ad.lang;
  }

  article.append(frame);
  return article;
}

function renderStillSlot(id, ad) {
  const button = document.createElement("button");
  button.type = "button";
  button.className = "scard";
  button.dataset.id = id;
  button.setAttribute("aria-roledescription", "slide");
  button.tabIndex = -1;
  button.setAttribute("aria-disabled", "true");

  const placeholder = document.createElement("div");
  placeholder.className = "ph";
  const num = document.createElement("span");
  num.className = "ph-num";
  num.textContent = id;
  const label = document.createElement("span");
  label.className = "ph-label";
  label.textContent = "Placeholder";
  placeholder.append(num, label);

  button.append(placeholder);

  if (ad) {
    button.dataset.src = ad.src;
    button.dataset.alt = cleanAlt(ad.alt, `Static ad ${id}`);
  }
  return button;
}

function mountStill(card) {
  if (card.dataset.mounted === "1" || !card.dataset.src) return;
  card.dataset.mounted = "1";
  const img = document.createElement("img");
  img.alt = "";
  img.decoding = "async";
  img.draggable = false;
  if ("fetchPriority" in img) img.fetchPriority = "low";
  card.append(img);
  img.addEventListener("load", () => {
    card.classList.add("is-ready");
    card.tabIndex = 0;
    card.setAttribute("aria-disabled", "false");
    const name = card.dataset.alt || `Static ad ${card.dataset.id}`;
    card.setAttribute("aria-label", `View larger: ${name}`);
    const chip = document.createElement("span");
    chip.className = "chip";
    chip.setAttribute("aria-hidden", "true");
    chip.append(svg(ICONS.zoom));
    card.append(chip);
  }, { once: true });
  img.addEventListener("error", () => {
    card.dataset.mounted = "0";
    img.removeAttribute("src");
  }, { once: true });
  img.src = card.dataset.src;
}

function scrollBehavior() {
  return reducedMotion ? "auto" : "smooth";
}

function scrollByCard(rail, dir) {
  const items = [...rail.children];
  const railLeft = rail.getBoundingClientRect().left;
  let target = null;
  if (dir > 0) {
    target = items.find((el) => el.getBoundingClientRect().left > railLeft + 8);
  } else {
    for (let i = items.length - 1; i >= 0; i -= 1) {
      if (items[i].getBoundingClientRect().left < railLeft - 8) {
        target = items[i];
        break;
      }
    }
  }
  if (!target) return;
  const delta = target.getBoundingClientRect().left - railLeft;
  rail.scrollBy({ left: delta, behavior: scrollBehavior() });
}

function updateArrows(rail) {
  const max = rail.scrollWidth - rail.clientWidth;
  document.querySelectorAll(`.arrow[data-carousel="${rail.id}"]`).forEach((button) => {
    const dir = Number(button.dataset.dir);
    button.disabled = dir < 0 ? rail.scrollLeft <= 2 : rail.scrollLeft >= max - 2;
  });
}

let arrowFrame = 0;
function refreshArrows() {
  cancelAnimationFrame(arrowFrame);
  arrowFrame = requestAnimationFrame(() => {
    document.querySelectorAll(".rail").forEach(updateArrows);
  });
}

let lastFocus = null;

function openLightbox(src, alt) {
  const dialog = document.getElementById("lightbox");
  const img = document.getElementById("lightbox-img");
  lastFocus = document.activeElement;
  img.alt = alt || "Static ad";
  img.src = src;
  dialog.setAttribute("aria-label", alt || "Enlarged static ad");
  dialog.hidden = false;
  document.getElementById("page").inert = true;
  document.documentElement.classList.add("no-scroll");
  dialog.querySelector(".lightbox-close").focus();
}

function closeLightbox() {
  const dialog = document.getElementById("lightbox");
  if (dialog.hidden) return;
  dialog.hidden = true;
  const img = document.getElementById("lightbox-img");
  img.removeAttribute("src");
  img.alt = "";
  document.getElementById("page").inert = false;
  document.documentElement.classList.remove("no-scroll");
  if (lastFocus && typeof lastFocus.focus === "function") lastFocus.focus();
}

function init() {
  const videos = byId(VIDEO_ADS, "video");
  const stills = byId(STATIC_ADS, "still");
  const videoRail = document.getElementById("video-rail");
  const stillRail = document.getElementById("stills-rail");

  const videoNodes = [];
  const stillNodes = [];
  for (let n = 1; n <= SLOT_COUNT; n += 1) {
    const id = slotId(n);
    videoNodes.push(renderVideoSlot(id, videos.get(id)));
    stillNodes.push(renderStillSlot(id, stills.get(id)));
  }
  videoRail.replaceChildren(...videoNodes);
  stillRail.replaceChildren(...stillNodes);

  const mountObserver = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      mountObserver.unobserve(entry.target);
      if (entry.target.classList.contains("vcard")) mountVideo(entry.target);
      else mountStill(entry.target);
    });
  }, { rootMargin: "400px 0px" });

  const playObserver = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.intersectionRatio >= 0.6) playMuted(entry.target);
      else if (entry.intersectionRatio <= 0.2) pauseOffscreen(entry.target);
    });
  }, { threshold: [0, 0.2, 0.6, 0.85] });

  videoRail.querySelectorAll(".vcard").forEach((card) => {
    if (!card.dataset.src) return;
    mountObserver.observe(card);
    playObserver.observe(card);
  });
  stillRail.querySelectorAll(".scard").forEach((card) => {
    if (card.dataset.src) mountObserver.observe(card);
    card.addEventListener("click", () => {
      if (card.getAttribute("aria-disabled") === "true" || !card.classList.contains("is-ready")) return;
      openLightbox(card.dataset.src, card.dataset.alt);
    });
  });

  document.querySelectorAll(".arrow").forEach((button) => {
    button.addEventListener("click", () => {
      const rail = document.getElementById(button.dataset.carousel);
      if (!rail || button.disabled) return;
      scrollByCard(rail, Number(button.dataset.dir));
    });
  });

  document.querySelectorAll(".rail").forEach((rail) => {
    rail.addEventListener("scroll", refreshArrows, { passive: true });
    rail.addEventListener("keydown", (event) => {
      if (event.key === "ArrowRight") {
        event.preventDefault();
        scrollByCard(rail, 1);
      } else if (event.key === "ArrowLeft") {
        event.preventDefault();
        scrollByCard(rail, -1);
      } else if (event.key === "Home") {
        event.preventDefault();
        rail.scrollTo({ left: 0, behavior: scrollBehavior() });
      } else if (event.key === "End") {
        event.preventDefault();
        rail.scrollTo({ left: rail.scrollWidth, behavior: scrollBehavior() });
      }
    });
  });

  const dialog = document.getElementById("lightbox");
  dialog.addEventListener("click", (event) => {
    const target = event.target;
    if (target === dialog || (target instanceof Element && target.closest("[data-close]"))) closeLightbox();
  });
  document.addEventListener("keydown", (event) => {
    if (dialog.hidden) return;
    if (event.key === "Escape") {
      event.preventDefault();
      closeLightbox();
    } else if (event.key === "Tab") {
      dialog.querySelector(".lightbox-close").focus();
      event.preventDefault();
    }
  });

  const header = document.querySelector(".site-header");
  const onScroll = () => header.classList.toggle("is-scrolled", window.scrollY > 8);
  onScroll();
  window.addEventListener("scroll", onScroll, { passive: true });
  window.addEventListener("resize", refreshArrows);
  window.addEventListener("load", refreshArrows);
  if (typeof ResizeObserver === "function") {
    const observer = new ResizeObserver(refreshArrows);
    document.querySelectorAll(".rail").forEach((rail) => observer.observe(rail));
  }

  document.addEventListener("visibilitychange", () => {
    if (document.hidden) {
      document.querySelectorAll(".vcard").forEach(pauseOffscreen);
      return;
    }
    document.querySelectorAll(".vcard.is-ready").forEach((card) => {
      if (fractionVisible(card) >= 0.6) playMuted(card);
    });
  });

  refreshArrows();
  // First paint stays overflow:clip. Scrolling turns on after that paint.
  requestAnimationFrame(() => {
    document.querySelectorAll(".rail").forEach((rail) => {
      rail.style.overflowX = "auto";
    });
    refreshArrows();
  });
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", init);
} else {
  init();
}
