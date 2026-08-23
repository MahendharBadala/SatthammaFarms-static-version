import React, { useEffect, useState } from "react";
import axios from "axios";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { CaretLeft, CaretRight, ArrowRight } from "@phosphor-icons/react";
import { resolveMediaUrl } from "./MediaUploader";

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

export function BannerSlider() {
  const [slides, setSlides] = useState([]);
  const [i, setI] = useState(0);

  useEffect(() => {
    axios.get(`${API}/banners`, { params: { kind: "slider" } })
      .then(r => setSlides(r.data || []))
      .catch(() => setSlides([]));
  }, []);

  useEffect(() => {
    if (slides.length < 2) return;
    const t = setInterval(() => setI(v => (v + 1) % slides.length), 6000);
    return () => clearInterval(t);
  }, [slides.length]);

  if (slides.length === 0) return null;
  const s = slides[i];
  const prev = () => setI(v => (v - 1 + slides.length) % slides.length);
  const next = () => setI(v => (v + 1) % slides.length);

  return (
    <section className="container mx-auto pt-6" data-testid="home-banner-slider">
      <div className="relative overflow-hidden rounded-3xl border border-edge bg-forest text-cream h-[320px] md:h-[380px]">
        <AnimatePresence mode="wait">
          <motion.div
            key={s.id}
            initial={{ opacity: 0, x: 40 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -40 }}
            transition={{ duration: 0.5 }}
            className="absolute inset-0"
          >
            {s.image_url && (
              <img src={resolveMediaUrl(s.image_url)} alt={s.title} className="absolute inset-0 w-full h-full object-cover opacity-45" />
            )}
            <div className="absolute inset-0 bg-gradient-to-r from-forest/85 via-forest/60 to-transparent" />
            <div className="relative p-8 md:p-12 max-w-2xl h-full flex flex-col justify-center">
              <div className="chip !bg-gold/25 !text-gold border-gold/40 w-fit">Featured</div>
              <h2 className="font-serif text-3xl md:text-5xl mt-3 leading-tight text-cream line-clamp-2">{s.title}</h2>
              {s.subtitle && <p className="mt-3 text-cream/80 text-base md:text-lg max-w-lg line-clamp-2">{s.subtitle}</p>}
              {s.cta_link && (
                <Link to={s.cta_link} data-testid={`banner-slide-cta-${s.id}`} className="btn-primary mt-6 inline-flex items-center gap-2 w-fit">
                  {s.cta_label || "Shop now"} <ArrowRight size={16} weight="bold" />
                </Link>
              )}
            </div>
          </motion.div>
        </AnimatePresence>
        {slides.length > 1 && (
          <>
            <button data-testid="banner-slide-prev" onClick={prev} aria-label="Previous slide"
              className="absolute left-3 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-white/20 backdrop-blur hover:bg-white/30 text-cream flex items-center justify-center">
              <CaretLeft size={18} weight="bold" />
            </button>
            <button data-testid="banner-slide-next" onClick={next} aria-label="Next slide"
              className="absolute right-3 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-white/20 backdrop-blur hover:bg-white/30 text-cream flex items-center justify-center">
              <CaretRight size={18} weight="bold" />
            </button>
            <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5">
              {slides.map((_, idx) => (
                <button key={idx} onClick={() => setI(idx)} aria-label={`Go to slide ${idx + 1}`}
                  className={`h-1.5 rounded-full transition-all ${idx === i ? "w-6 bg-gold" : "w-1.5 bg-cream/40"}`} />
              ))}
            </div>
          </>
        )}
      </div>
    </section>
  );
}

export function PromoCards() {
  const [cards, setCards] = useState([]);
  useEffect(() => {
    axios.get(`${API}/banners`, { params: { kind: "promo" } })
      .then(r => setCards(r.data || []))
      .catch(() => setCards([]));
  }, []);

  if (cards.length === 0) return null;

  return (
    <section className="container mx-auto py-10" data-testid="home-promo-cards">
      <div className="chip">Fresh offers</div>
      <h2 className="font-serif text-4xl mt-2 text-ink mb-6">This week from the farm</h2>
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
        {cards.map(c => (
          <Link key={c.id} to={c.cta_link || "/products"} data-testid={`promo-card-${c.id}`}
            className="group relative overflow-hidden rounded-2xl border border-edge bg-cream min-h-[220px]">
            {c.image_url ? (
              <img src={resolveMediaUrl(c.image_url)} alt={c.title}
                className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" />
            ) : (
              <div className="absolute inset-0 bg-gradient-to-br from-terracotta/40 to-gold/40" />
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-ink/85 via-ink/40 to-transparent" />
            <div className="relative p-6 h-full flex flex-col justify-end">
              <div className="text-[10px] uppercase tracking-[0.2em] text-gold">{c.cta_label || "Learn more"}</div>
              <h3 className="font-serif text-2xl text-cream mt-1">{c.title}</h3>
              {c.subtitle && <p className="text-cream/80 text-sm mt-1 max-w-xs">{c.subtitle}</p>}
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}
