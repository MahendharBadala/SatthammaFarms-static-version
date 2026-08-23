import React from "react";
import { InstagramLogo, YoutubeLogo, Phone, EnvelopeSimple, MapPin, WhatsappLogo } from "@phosphor-icons/react";
import { Logo } from "./Logo";
import { useSite } from "../context/SiteContext";

export default function Footer() {
  const { site } = useSite();
  const waNumber = (site.whatsapp_number || "918500812044").replace(/[^0-9]/g, "");

  return (
    <footer className="mt-24 border-t border-edge bg-cream2/50">
      <div className="container mx-auto py-14 grid md:grid-cols-4 gap-10">
        <div>
          <Logo />
          <p className="mt-4 text-sm text-muted2 leading-relaxed max-w-xs">
            Nurturing soil, growing trust. Chemical-free harvest from the fields of Medipally, Telangana.
          </p>
          <p className="mt-3 font-serif italic text-forest">&quot;{site.hero_tagline}&quot;</p>
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
            <li className="flex items-start gap-2"><MapPin size={18} className="text-forest mt-0.5" /> <span>{site.contact_address}</span></li>
            <li className="flex items-center gap-2"><Phone size={18} className="text-forest" /> <a href={`tel:${site.contact_phone.replace(/\s/g, "")}`} className="hover:text-forest">{site.contact_phone}</a></li>
            <li className="flex items-center gap-2"><WhatsappLogo size={18} className="text-forest" /> <a href={`https://wa.me/${waNumber}`} target="_blank" rel="noreferrer" className="hover:text-forest">WhatsApp</a></li>
            <li className="flex items-center gap-2"><EnvelopeSimple size={18} className="text-forest" /> <a href={`mailto:${site.contact_email}`} className="hover:text-forest">{site.contact_email}</a></li>
          </ul>
        </div>
        <div>
          <h4 className="text-sm font-bold tracking-[0.2em] uppercase text-terracotta mb-4">Follow the journey</h4>
          <p className="text-sm text-muted2 mb-4">See our daily fields, harvests &amp; recipes.</p>
          <div className="flex gap-3">
            <a data-testid="footer-instagram" target="_blank" rel="noreferrer" href={site.instagram_url} className="rounded-full bg-forest text-cream p-3 hover:bg-forestDark transition-colors"><InstagramLogo size={20} weight="duotone" /></a>
            <a data-testid="footer-youtube" target="_blank" rel="noreferrer" href={site.youtube_url} className="rounded-full bg-terracotta text-cream p-3 hover:opacity-90 transition-opacity"><YoutubeLogo size={20} weight="duotone" /></a>
          </div>
        </div>
      </div>
      <div className="border-t border-edge">
        <div className="container mx-auto py-5 text-xs text-muted2 flex flex-col md:flex-row items-center justify-between gap-2">
          <p>© {new Date().getFullYear()} Satthamma Farms. All harvests reserved.</p>
          <p>Hand-crafted with soil, sun &amp; sincerity.</p>
        </div>
      </div>
    </footer>
  );
}
