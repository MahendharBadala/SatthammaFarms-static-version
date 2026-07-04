import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import axios from "axios";
import Hero3D from "../components/Hero3D";
import ProductCard from "../components/ProductCard";
import { motion } from "framer-motion";
import { Leaf, HandHeart, SunHorizon, Truck, ArrowRight } from "@phosphor-icons/react";

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

export default function Home() {
  const [featured, setFeatured] = useState([]);
  useEffect(() => {
    axios.get(`${API}/products`).then(r => setFeatured(r.data.filter(p => p.featured).slice(0, 6)));
  }, []);

  return (
    <>
      {/* HERO */}
      <section className="relative overflow-hidden">
        <div className="hero-blob bg-terracotta -top-32 -left-24 w-[360px] h-[360px]"></div>
        <div className="hero-blob bg-gold -bottom-24 right-0 w-[420px] h-[420px]"></div>
        <div className="container mx-auto grid lg:grid-cols-2 gap-10 py-16 lg:py-24 items-center">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7 }}>
            <div className="chip mb-5" data-testid="hero-badge">Organic · Chemical-free · Since generations</div>
            <h1 className="font-serif font-medium leading-[0.95] text-5xl sm:text-6xl lg:text-7xl text-ink">
              From our soil,
              <br /><span className="text-forest">to your table.</span>
            </h1>
            <p className="mt-6 font-serif italic text-2xl text-terracotta">"prathiokkari intaa, nanyamaina panta"</p>
            <p className="mt-3 max-w-lg text-base text-muted2 leading-relaxed">
              Satthamma Farms grows grains, pulses, spices and pickles the way our grandparents did — with sunlight, patience and zero harmful chemicals. Every pack you receive is a small piece of Medipally in your kitchen.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link to="/products" data-testid="hero-cta-shop" className="btn-primary inline-flex items-center gap-2">Shop the harvest <ArrowRight size={18} weight="bold" /></Link>
              <Link to="/about" data-testid="hero-cta-story" className="btn-outline">Read our story</Link>
            </div>
            <div className="mt-10 grid grid-cols-3 max-w-md gap-4">
              {[["12+", "Crops"], ["100%", "Organic"], ["0", "Chemicals"]].map(([n, l]) => (
                <div key={l} className="border-l-2 border-terracotta pl-3">
                  <div className="font-serif text-3xl text-forest">{n}</div>
                  <div className="text-[11px] uppercase tracking-[0.2em] text-muted2">{l}</div>
                </div>
              ))}
            </div>
          </motion.div>
          <div className="relative h-[440px] lg:h-[560px]" data-testid="hero-3d-canvas">
            <Hero3D />
            <div className="absolute bottom-6 left-6 card-earth p-4 max-w-[220px] backdrop-blur">
              <div className="chip mb-2">Live from farm</div>
              <p className="font-serif text-lg leading-tight text-ink">Today's harvest: fresh turmeric roots being sun-dried.</p>
            </div>
          </div>
        </div>
      </section>

      {/* VALUE PROPS */}
      <section className="container mx-auto py-14 grid md:grid-cols-4 gap-4">
        {[
          { icon: Leaf, title: "Chemical-free", text: "No pesticides, no artificial fertilizers — just soil, sun and time." },
          { icon: HandHeart, title: "Hand harvested", text: "Every grain, seed and pickle is packed by our own family." },
          { icon: SunHorizon, title: "Small batches", text: "We grow only what we can nurture. Freshness before scale." },
          { icon: Truck, title: "Farm-direct", text: "Ships directly from Medipally, Telangana to your doorstep." },
        ].map((v) => (
          <motion.div key={v.title} initial={{ opacity: 0, y: 12 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: 0.08 }} className="card-earth p-6">
            <v.icon size={30} weight="duotone" className="text-terracotta" />
            <h3 className="font-serif text-xl mt-3 text-ink">{v.title}</h3>
            <p className="text-sm text-muted2 mt-2 leading-relaxed">{v.text}</p>
          </motion.div>
        ))}
      </section>

      {/* CATEGORIES */}
      <section className="container mx-auto py-10">
        <div className="flex items-end justify-between mb-8">
          <div>
            <div className="chip">The harvest basket</div>
            <h2 className="font-serif text-4xl sm:text-5xl mt-2 text-ink">What we grow</h2>
          </div>
          <Link to="/products" className="text-sm text-forest hover:underline hidden sm:inline">Browse all →</Link>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { k: "grains", label: "Grains", img: "https://images.unsplash.com/photo-1586201375761-83865001e31c?auto=format&fit=crop&w=800&q=80" },
            { k: "pickles", label: "Pickles", img: "https://images.unsplash.com/photo-1613271596363-4fb96ef16eac?auto=format&fit=crop&w=800&q=80" },
            { k: "spices", label: "Masalas", img: "https://images.unsplash.com/photo-1596040033229-a9821ebd058d?auto=format&fit=crop&w=800&q=80" },
            { k: "pulses", label: "Pulses", img: "https://images.unsplash.com/photo-1515543237350-b3eea1ec8082?auto=format&fit=crop&w=800&q=80" },
          ].map(c => (
            <Link key={c.k} data-testid={`category-tile-${c.k}`} to={`/products?category=${c.k}`} className="group relative aspect-[4/5] overflow-hidden rounded-2xl">
              <img src={c.img} alt={c.label} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
              <div className="absolute inset-0 bg-gradient-to-t from-forest/90 via-forest/30 to-transparent"></div>
              <div className="absolute bottom-4 left-4 right-4">
                <div className="text-[10px] uppercase tracking-[0.2em] text-gold">Explore</div>
                <h3 className="font-serif text-2xl text-cream">{c.label}</h3>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* FEATURED */}
      {featured.length > 0 && (
        <section className="container mx-auto py-14">
          <div className="flex items-end justify-between mb-8">
            <div>
              <div className="chip">Farmer's picks</div>
              <h2 className="font-serif text-4xl sm:text-5xl mt-2 text-ink">This season's best</h2>
            </div>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {featured.map(p => <ProductCard key={p.id} product={p} />)}
          </div>
        </section>
      )}

      {/* STORY STRIP */}
      <section className="container mx-auto py-16">
        <div className="card-earth overflow-hidden grid md:grid-cols-2">
          <div className="relative min-h-[320px]">
            <img src="https://images.unsplash.com/photo-1762884110133-926e4195d3b9?crop=entropy&cs=srgb&fm=jpg&w=1200&q=85" alt="Farmer" className="absolute inset-0 w-full h-full object-cover" />
          </div>
          <div className="p-8 md:p-12 flex flex-col justify-center">
            <div className="chip">Our promise</div>
            <h2 className="font-serif text-4xl mt-3 text-ink">Farming the way it was meant to be.</h2>
            <p className="mt-4 text-muted2 leading-relaxed">
              At Satthamma Farms, we practice mostly organic farming — no harmful chemicals, no artificial fertilizers, no shortcuts to force the earth. We believe patient soil grows honest food. Follow our day-to-day life on Instagram and YouTube — every harvest, every rain, every meal.
            </p>
            <div className="mt-6 flex gap-3 flex-wrap">
              <a data-testid="story-cta-instagram" target="_blank" rel="noreferrer" href="https://www.instagram.com/satthammamucchatlu?igsh=YnltdW8xcW8ycDBl" className="btn-outline">Watch on Instagram</a>
              <a data-testid="story-cta-youtube" target="_blank" rel="noreferrer" href="https://youtube.com/@sathammamucchatlu?si=7u19ztvSf8hBGz54" className="btn-primary">YouTube channel</a>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
