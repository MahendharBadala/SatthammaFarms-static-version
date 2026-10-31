import { useQueryClient } from "@tanstack/react-query";
import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import axios from "axios";
import Hero3D from "../components/Hero3D";
import ProductCard from "../components/ProductCard";
import { BannerSlider, PromoCards } from "../components/HomeBanners";
import { useSite } from "../context/SiteContext";
import { resolveMediaUrl } from "../components/MediaUploader";
import { motion } from "framer-motion";
import { Leaf, HandHeart, SunHorizon, Truck, ArrowRight } from "@phosphor-icons/react";

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

export default function Home() {
  const queryClient = useQueryClient();
  const { site } = useSite();
  const [featured, setFeatured] = useState([]);
  useEffect(() => {
  async function preloadProducts() {
    const { data } = await axios.get(`${API}/products`);

    // Save ALL products in React Query cache
    queryClient.setQueryData(["products"], data);

    // Featured products for homepage
    setFeatured(
      data.filter((p) => p.featured).slice(0, 6)
    );
  }

  preloadProducts();
}, [queryClient]);

  return (
    <>
      {/* TOP BANNER SLIDER */}
      <BannerSlider />

      {/* HERO */}
      <section className="relative overflow-hidden">
        <div className="hero-blob bg-terracotta -top-32 -left-24 w-[360px] h-[360px]"></div>
        <div className="hero-blob bg-gold -bottom-24 right-0 w-[420px] h-[420px]"></div>
        <div className="container mx-auto grid lg:grid-cols-2 gap-10 py-16 lg:py-24 items-center">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7 }}>
            <div className="chip mb-5" data-testid="hero-badge">{site.hero_badge}</div>
            <h1 className="font-serif font-medium leading-[0.95] text-5xl sm:text-6xl lg:text-7xl text-ink">
              {site.hero_title_line1}
              <br /><span className="text-forest">{site.hero_title_line2}</span>
            </h1>
            <p className="mt-6 font-serif italic text-2xl text-terracotta">&quot;{site.hero_tagline}&quot;</p>
            <p className="mt-3 max-w-lg text-base text-muted2 leading-relaxed">
              {site.hero_paragraph}
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
          <div className="relative" data-testid="hero-3d-canvas">
            {site.live_media_url ? (
              <div className="relative rounded-3xl overflow-hidden border border-edge bg-cream2">
                {/* No fixed height and no object-fit cropping here on purpose —
                    the box takes on whatever aspect ratio the admin's uploaded
                    photo or video naturally has, instead of forcing every
                    upload into one fixed frame. */}
                {site.live_media_kind === "video" ? (
                  <video
                    key={site.live_media_url}
                    src={resolveMediaUrl(site.live_media_url)}
                    className="w-full h-auto max-h-[560px] block"
                    autoPlay
                    muted
                    loop
                    playsInline
                    controls
                    data-testid="live-farm-video"
                  />
                ) : (
                  <img
                    key={site.live_media_url}
                    src={resolveMediaUrl(site.live_media_url)}
                    alt="Live from the farm"
                    className="w-full h-auto max-h-[560px] object-contain block"
                    data-testid="live-farm-image"
                  />
                )}
              </div>
            ) : (
              <div className="h-[440px] lg:h-[560px]">
                <Hero3D />
              </div>
            )}
            {site.live_caption && (
              <div className="absolute bottom-6 left-6 card-earth p-4 max-w-[220px] backdrop-blur">
                <div className="chip mb-2">Live from farm</div>
                <p className="font-serif text-lg leading-tight text-ink" data-testid="live-farm-caption">{site.live_caption}</p>
              </div>
            )}
          </div>
        </div>
      </section>


          {/* GROW & WIN REWARDS SECTION */}
      <section className="container mx-auto px-4 py-10">
        <motion.div
          initial={{ opacity: 0, y: 35 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
          className="relative overflow-hidden rounded-[2rem] bg-gradient-to-br from-[#092f20] via-[#145c37] to-[#092f20] p-7 md:p-12 shadow-[0_18px_40px_rgba(10,50,30,0.25)]"
        >
          {/* Decorative background */}
          <div className="absolute -right-16 -top-20 h-64 w-64 rounded-full bg-[#d6a94b]/10 blur-3xl" />
          <div className="absolute -bottom-20 -left-16 h-64 w-64 rounded-full bg-green-300/10 blur-3xl" />

          <div className="relative z-10 grid items-center gap-8 md:grid-cols-2">

            {/* Text and CTA */}
            <div className="text-center md:text-left">

              <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-[#e6c77a]/30 bg-white/10 px-4 py-2 text-xs font-bold uppercase tracking-[0.2em] text-[#f4d78c]">
                <Leaf size={16} weight="fill" />
                A little happiness from our farm
              </div>

              <h2 className="font-serif text-4xl font-bold leading-tight text-white sm:text-5xl">
                Grow Your Luck.
                <br />
                <span className="text-[#f3cf72]">
                  Harvest Rewards!
                </span>
              </h2>

              <p className="mx-auto mt-5 max-w-md text-sm leading-7 text-green-100/80 md:mx-0 md:text-base">
                Every harvest brings happiness. Try our exciting
                farm-inspired games and discover special rewards
                for your next Satthamma Farms order.
              </p>

              <Link
                to="/rewards"
                className="group relative mt-8 inline-flex items-center justify-center gap-3 overflow-hidden rounded-full border border-[#ffe6a0] bg-gradient-to-b from-[#ffe9a5] via-[#e9bc58] to-[#c88b2d] px-7 py-4 font-extrabold text-[#49300d] shadow-[0_7px_0_#86571d,0_12px_25px_rgba(0,0,0,0.3)] transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_10px_0_#86571d,0_17px_30px_rgba(0,0,0,0.35)] active:translate-y-1 active:shadow-[0_3px_0_#86571d]"
              >
                <Leaf
                  size={22}
                  weight="fill"
                  className="transition-transform duration-500 group-hover:rotate-[-25deg]"
                />
                <span>GROW YOUR LUCK – PLAY & WIN</span>
                <ArrowRight
                  size={19}
                  weight="bold"
                  className="transition-transform duration-300 group-hover:translate-x-1"
                />
              </Link>

              <p className="mt-5 text-xs text-green-100/60">
                Discover Lucky Spin & Scratch and Win rewards.
              </p>
            </div>

            {/* 3D-inspired plant illustration */}
            <motion.div
              animate={{ y: [0, -10, 0] }}
              transition={{
                duration: 4,
                repeat: Infinity,
                ease: "easeInOut",
              }}
              className="relative mx-auto flex h-64 w-full max-w-sm items-center justify-center"
            >
              <div className="absolute bottom-5 h-20 w-64 rounded-full bg-black/25 blur-2xl" />

              <div className="absolute bottom-8 h-28 w-28 rounded-full border-4 border-[#d9ad52]/50 bg-gradient-to-b from-[#9c6935] via-[#75451f] to-[#3b281b] shadow-[inset_0_8px_15px_rgba(255,255,255,0.15),0_15px_25px_rgba(0,0,0,0.3)]" />

              <div className="absolute bottom-28 h-28 w-2 rounded-full bg-gradient-to-r from-[#477d38] to-[#9bd46d]" />

              <motion.div
                animate={{ rotate: [0, 8, 0, -8, 0] }}
                transition={{
                  duration: 5,
                  repeat: Infinity,
                  ease: "easeInOut",
                }}
                className="absolute bottom-36"
              >
                <Leaf
                  size={85}
                  weight="fill"
                  className="rotate-[-35deg] text-[#a6df79] drop-shadow-[0_8px_8px_rgba(0,0,0,0.3)]"
                />
              </motion.div>

              <Leaf
                size={65}
                weight="fill"
                className="absolute bottom-28 left-[24%] rotate-[35deg] text-[#62b85c] drop-shadow-lg"
              />

              <Leaf
                size={65}
                weight="fill"
                className="absolute bottom-28 right-[24%] -rotate-[35deg] text-[#80cc68] drop-shadow-lg"
              />

              <div className="absolute right-8 top-8 rounded-full border border-[#f5d17a]/40 bg-[#e7bd5b]/20 p-3 text-3xl shadow-lg backdrop-blur-sm">
                🪙
              </div>

              <div className="absolute left-8 top-14 rounded-full border border-white/20 bg-white/10 p-3 text-2xl backdrop-blur-sm">
                ✨
              </div>

              <div className="absolute bottom-3 right-14 rounded-full bg-[#f4d27c] px-4 py-2 text-xs font-extrabold text-[#49300d] shadow-lg">
                WIN REWARDS!
              </div>
            </motion.div>

          </div>
        </motion.div>
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

      {/* PROMO CARDS */}
      <PromoCards />

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
            <h2 className="font-serif text-4xl mt-3 text-ink">{site.story_title}</h2>
            <p className="mt-4 text-muted2 leading-relaxed">
              {site.story_text}
            </p>
            <div className="mt-6 flex gap-3 flex-wrap">
              <a data-testid="story-cta-instagram" target="_blank" rel="noreferrer" href={site.instagram_url} className="btn-outline">Watch on Instagram</a>
              <a data-testid="story-cta-youtube" target="_blank" rel="noreferrer" href={site.youtube_url} className="btn-primary">YouTube channel</a>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
