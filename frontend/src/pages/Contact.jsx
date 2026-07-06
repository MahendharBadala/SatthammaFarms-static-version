import React from "react";
import { Phone, EnvelopeSimple, MapPin, WhatsappLogo, InstagramLogo, YoutubeLogo } from "@phosphor-icons/react";
import { useSite } from "../context/SiteContext";

export default function Contact() {
  const { site } = useSite();
  const waNumber = (site.whatsapp_number || "918500812044").replace(/[^0-9]/g, "");
  const mapQ = encodeURIComponent(site.contact_address || "Medipally, Jagityal, Telangana");

  return (
    <div className="container mx-auto py-16 grid lg:grid-cols-2 gap-10">
      <div>
        <div className="chip">Say hello</div>
        <h1 className="font-serif text-5xl sm:text-6xl mt-2 text-ink">Reach the farm.</h1>
        <p className="text-muted2 mt-4 max-w-lg">Questions, bulk orders, farm visits — we love hearing from you. WhatsApp us for the fastest reply.</p>

        <div className="mt-8 space-y-5">
          <div className="flex items-start gap-4"><MapPin size={26} weight="duotone" className="text-terracotta mt-1" />
            <div>
              <div className="text-xs uppercase tracking-widest text-muted2">Farm address</div>
              <p className="font-serif text-xl text-ink whitespace-pre-line">{site.contact_address}</p>
            </div>
          </div>
          <div className="flex items-center gap-4"><Phone size={26} weight="duotone" className="text-terracotta" />
            <div>
              <div className="text-xs uppercase tracking-widest text-muted2">Phone</div>
              <a href={`tel:${site.contact_phone.replace(/\s/g, "")}`} data-testid="contact-phone" className="font-serif text-xl text-ink hover:text-forest">{site.contact_phone}</a>
            </div>
          </div>
          <div className="flex items-center gap-4"><WhatsappLogo size={26} weight="duotone" className="text-terracotta" />
            <div>
              <div className="text-xs uppercase tracking-widest text-muted2">WhatsApp</div>
              <a href={`https://wa.me/${waNumber}`} data-testid="contact-whatsapp" target="_blank" rel="noreferrer" className="font-serif text-xl text-ink hover:text-forest">Chat with us</a>
            </div>
          </div>
          <div className="flex items-center gap-4"><EnvelopeSimple size={26} weight="duotone" className="text-terracotta" />
            <div>
              <div className="text-xs uppercase tracking-widest text-muted2">Email</div>
              <a href={`mailto:${site.contact_email}`} data-testid="contact-email" className="font-serif text-xl text-ink hover:text-forest">{site.contact_email}</a>
            </div>
          </div>
        </div>

        <div className="mt-8 flex gap-3">
          <a data-testid="contact-instagram" href={site.instagram_url} target="_blank" rel="noreferrer" className="rounded-full bg-forest text-cream p-3 hover:bg-forestDark transition-colors"><InstagramLogo size={22} weight="duotone" /></a>
          <a data-testid="contact-youtube" href={site.youtube_url} target="_blank" rel="noreferrer" className="rounded-full bg-terracotta text-cream p-3 hover:opacity-90 transition-opacity"><YoutubeLogo size={22} weight="duotone" /></a>
        </div>
      </div>
      <div className="card-earth overflow-hidden min-h-[420px]">
        <iframe
          title="Satthamma Farms map"
          className="w-full h-full min-h-[420px] border-0"
          src={`https://www.google.com/maps?q=${mapQ}&output=embed`}
          loading="lazy"
        />
      </div>
    </div>
  );
}
