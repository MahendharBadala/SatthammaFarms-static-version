import React from "react";
import { InstagramLogo, YoutubeLogo, Phone, EnvelopeSimple, MapPin, WhatsappLogo } from "@phosphor-icons/react";
import { Logo } from "./Logo";

export default function Footer() {
  return (
    <footer className="mt-24 border-t border-edge bg-cream2/50">
      <div className="container mx-auto py-14 grid md:grid-cols-4 gap-10">
        <div>
          <Logo />
          <p className="mt-4 text-sm text-muted2 leading-relaxed max-w-xs">
            Nurturing soil, growing trust. Chemical-free harvest from the fields of Medipally, Telangana.
          </p>
          <p className="mt-3 font-serif italic text-forest">"prathiokkari intaa, nanyamaina panta"</p>
        </div>
        <div>
          <h4 className="text-sm font-bold tracking-[0.2em] uppercase text-terracotta mb-4">Visit</h4>
          <ul className="space-y-2 text-sm text-muted2">
            <li><a href="/" className="hover:text-forest">Home</a></li>
            <li><a href="/products" className="hover:text-forest">Our Products</a></li>
            <li><a href="/about" className="hover:text-forest">Our Story</a></li>
            <li><a href="/contact" className="hover:text-forest">Contact</a></li>
          </ul>
        </div>
        <div>
          <h4 className="text-sm font-bold tracking-[0.2em] uppercase text-terracotta mb-4">Reach us</h4>
          <ul className="space-y-3 text-sm text-muted2">
            <li className="flex items-start gap-2"><MapPin size={18} className="text-forest mt-0.5" /> 505453, Medipally,<br/>Medipally Mandal, Jagityal Dist,<br/>Telangana</li>
            <li className="flex items-center gap-2"><Phone size={18} className="text-forest" /> <a href="tel:8500812044" className="hover:text-forest">+91 85008 12044</a></li>
            <li className="flex items-center gap-2"><WhatsappLogo size={18} className="text-forest" /> <a href="https://wa.me/918500812044" target="_blank" rel="noreferrer" className="hover:text-forest">WhatsApp</a></li>
            <li className="flex items-center gap-2"><EnvelopeSimple size={18} className="text-forest" /> <a href="mailto:satthammafarms@gmail.com" className="hover:text-forest">satthammafarms@gmail.com</a></li>
          </ul>
        </div>
        <div>
          <h4 className="text-sm font-bold tracking-[0.2em] uppercase text-terracotta mb-4">Follow the journey</h4>
          <p className="text-sm text-muted2 mb-4">See our daily fields, harvests & recipes.</p>
          <div className="flex gap-3">
            <a data-testid="footer-instagram" target="_blank" rel="noreferrer" href="https://www.instagram.com/satthammamucchatlu?igsh=YnltdW8xcW8ycDBl" className="rounded-full bg-forest text-cream p-3 hover:bg-forestDark transition-colors"><InstagramLogo size={20} weight="duotone" /></a>
            <a data-testid="footer-youtube" target="_blank" rel="noreferrer" href="https://youtube.com/@sathammamucchatlu?si=7u19ztvSf8hBGz54" className="rounded-full bg-terracotta text-cream p-3 hover:opacity-90 transition-opacity"><YoutubeLogo size={20} weight="duotone" /></a>
          </div>
        </div>
      </div>
      <div className="border-t border-edge">
        <div className="container mx-auto py-5 text-xs text-muted2 flex flex-col md:flex-row items-center justify-between gap-2">
          <p>© {new Date().getFullYear()} Satthamma Farms. All harvests reserved.</p>
          <p>Hand-crafted with soil, sun & sincerity.</p>
        </div>
      </div>
    </footer>
  );
}
