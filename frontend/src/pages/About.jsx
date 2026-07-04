import React from "react";
import { InstagramLogo, YoutubeLogo } from "@phosphor-icons/react";

export default function About() {
  return (
    <div className="container mx-auto py-16">
      <div className="max-w-3xl">
        <div className="chip">Our story</div>
        <h1 className="font-serif text-5xl sm:text-6xl mt-3 text-ink">Farming with patience,<br/>harvesting with pride.</h1>
        <p className="text-muted2 mt-6 leading-relaxed text-lg">
          Satthamma Farms is a small family farm in Medipally, Telangana. For generations, we have believed that good food starts with honest soil. We practice mostly organic farming — no harmful chemicals, no artificial fertilizers, no shortcuts that force the land to give more than it can.
        </p>
        <p className="text-muted2 mt-4 leading-relaxed text-lg">
          From <em className="font-serif text-forest">corn, maize and paddy</em> to <em className="font-serif text-forest">sesame, pulses, cotton, gadka</em> and hand-pounded <em className="font-serif text-forest">masalas & pickles</em>, every product you buy from us is grown, cleaned and packed by our own hands.
        </p>
      </div>

      <div className="grid md:grid-cols-3 gap-4 mt-12">
        {[
          { t: "Every day, on video", d: "Watch our fields, weather and traditions on Instagram & YouTube." },
          { t: "Slow, small, sincere", d: "We grow only what we can nurture — freshness before scale." },
          { t: "Direct from farmer", d: "No middlemen. What you pay is what a farmer earns." },
        ].map(b => (
          <div key={b.t} className="card-earth p-6">
            <h3 className="font-serif text-2xl text-forest">{b.t}</h3>
            <p className="text-muted2 mt-2 text-sm leading-relaxed">{b.d}</p>
          </div>
        ))}
      </div>

      <div className="card-earth mt-12 p-8 md:p-12 grid md:grid-cols-[1fr,auto] gap-6 items-center">
        <div>
          <h2 className="font-serif text-3xl text-ink">See our fields live</h2>
          <p className="text-muted2 mt-2">Follow our daily journey — harvests, meals, rains and everything in between.</p>
        </div>
        <div className="flex gap-3">
          <a data-testid="about-instagram" href="https://www.instagram.com/satthammamucchatlu?igsh=YnltdW8xcW8ycDBl" target="_blank" rel="noreferrer" className="btn-primary inline-flex items-center gap-2"><InstagramLogo size={18} weight="duotone" /> Instagram</a>
          <a data-testid="about-youtube" href="https://youtube.com/@sathammamucchatlu?si=7u19ztvSf8hBGz54" target="_blank" rel="noreferrer" className="btn-outline inline-flex items-center gap-2"><YoutubeLogo size={18} weight="duotone" /> YouTube</a>
        </div>
      </div>
    </div>
  );
}
