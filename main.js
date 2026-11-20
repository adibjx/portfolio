"use strict";

/* ============================================================
   EDIT HERE — video ads
   Files live in /videos/ and are deployed with the site, not
   committed (see .gitignore). Append the next number to add one:

     { src: "/videos/11.mp4", poster: "/videos/11.jpg" },
   ============================================================ */

const VIDEO_ADS = [
  { src: "/videos/01.mp4", poster: "/videos/01.jpg" },
  { src: "/videos/02.mp4", poster: "/videos/02.jpg" },
  { src: "/videos/03.mp4", poster: "/videos/03.jpg" },
  { src: "/videos/04.mp4", poster: "/videos/04.jpg" },
  { src: "/videos/05.mp4", poster: "/videos/05.jpg" },
  { src: "/videos/06.mp4", poster: "/videos/06.jpg" },
  { src: "/videos/07.mp4", poster: "/videos/07.jpg" },
  { src: "/videos/08.mp4", poster: "/videos/08.jpg" },
  { src: "/videos/09.mp4", poster: "/videos/09.jpg" },
  { src: "/videos/10.mp4", poster: "/videos/10.jpg" },
];

const reducedMotion = matchMedia("(prefers-reduced-motion: reduce)").matches;

function isVideoPath(src) {
  return typeof src === "string" && /^\/videos\/[\w.-]+$/.test(src) && !src.includes("..");
}

function renderVideo(ad, index) {
  const card = document.createElement("article");
  card.className = "vcard";
  card.setAttribute("aria-roledescription", "slide");

  const video = document.createElement("video");
  video.controls = true;
  video.playsInline = true;
  video.preload = "none";
  video.setAttribute("playsinline", "");
  video.setAttribute("preload", "none");
  video.poster = ad.poster;
  video.src = ad.src;
  const n = String(index + 1).padStart(2, "0");
  video.setAttribute("aria-label", `Video ad ${n}`);

  video.addEventListener("play", () => {
    document.querySelectorAll("#video-rail video").forEach((other) => {
      if (other !== video) other.pause();
    });
  });

  card.append(video);
  return card;
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

function init() {
  const rail = document.getElementById("video-rail");
  const cards = VIDEO_ADS.filter((ad) => ad && isVideoPath(ad.src) && isVideoPath(ad.poster)).map(renderVideo);
  rail.replaceChildren(...cards);

  document.querySelectorAll(".arrow").forEach((button) => {
    button.addEventListener("click", () => {
      const target = document.getElementById(button.dataset.carousel);
      if (!target || button.disabled) return;
      scrollByCard(target, Number(button.dataset.dir));
    });
  });

  rail.addEventListener("scroll", refreshArrows, { passive: true });
  rail.addEventListener("keydown", (event) => {
    if (event.target !== rail) return;
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

  const header = document.querySelector(".site-header");
  const onScroll = () => header.classList.toggle("is-scrolled", window.scrollY > 8);
  onScroll();
  window.addEventListener("scroll", onScroll, { passive: true });
  window.addEventListener("resize", refreshArrows);
  if (typeof ResizeObserver === "function") {
    const observer = new ResizeObserver(refreshArrows);
    observer.observe(rail);
  }

  refreshArrows();
  requestAnimationFrame(() => {
    rail.style.overflowX = "auto";
    refreshArrows();
  });
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", init);
} else {
  init();
}
