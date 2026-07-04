import React from "react";
import { Phone, EnvelopeSimple, MapPin, WhatsappLogo, InstagramLogo, YoutubeLogo } from "@phosphor-icons/react";

export default function Contact() {
  return (
    <div className="container mx-auto py-16 grid lg:grid-cols-2 gap-10">
      <div>
        <div className="chip">Say hello</div>
        <h1 className="font-serif text-5xl sm:text-6xl mt-2 text-ink">Reach the farm.</h1>
        <p className="text-muted2 mt-4 max-w-lg">Questions, bulk orders, farm visits — we love hearing from you. WhatsApp us for the fastest reply.</p>

        <div className="mt-8 space-y-5">
          <div className="flex items-start gap-4"><MapPin size={26} weight="duotone" className="text-terracotta mt-1" />
            <div><div className="text-xs uppercase tracking-widest text-muted2">Farm address</div><p className="font-serif text-xl text-ink">505453, Medipally,<br/>Medipally Mandal, Jagityal District,<br/>Telangana</p></div>
          </div>
          <div className="flex items-center gap-4"><Phone size={26} weight="duotone" className="text-terracotta" />
            <div><div className="text-xs uppercase tracking-widest text-muted2">Phone</div><a href="tel:+918500812044" data-testid="contact-phone" className="font-serif text-xl text-ink hover:text-forest">+91 85008 12044</a></div>
          </div>
          <div className="flex items-center gap-4"><WhatsappLogo size={26} weight="duotone" className="text-terracotta" />
            <div><div className="text-xs uppercase tracking-widest text-muted2">WhatsApp</div><a href="https://wa.me/918500812044" data-testid="contact-whatsapp" target="_blank" rel="noreferrer" className="font-serif text-xl text-ink hover:text-forest">Chat with us</a></div>
          </div>
          <div className="flex items-center gap-4"><EnvelopeSimple size={26} weight="duotone" className="text-terracotta" />
            <div><div className="text-xs uppercase tracking-widest text-muted2">Email</div><a href="mailto:satthammafarms@gmail.com" data-testid="contact-email" className="font-serif text-xl text-ink hover:text-forest">satthammafarms@gmail.com</a></div>
          </div>
        </div>

        <div className="mt-8 flex gap-3">
          <a data-testid="contact-instagram" href="https://www.instagram.com/satthammamucchatlu?igsh=YnltdW8xcW8ycDBl" target="_blank" rel="noreferrer" className="rounded-full bg-forest text-cream p-3 hover:bg-forestDark transition-colors"><InstagramLogo size={22} weight="duotone" /></a>
          <a data-testid="contact-youtube" href="https://youtube.com/@sathammamucchatlu?si=7u19ztvSf8hBGz54" target="_blank" rel="noreferrer" className="rounded-full bg-terracotta text-cream p-3 hover:opacity-90 transition-opacity"><YoutubeLogo size={22} weight="duotone" /></a>
        </div>
      </div>
      <div className="card-earth overflow-hidden min-h-[420px]">
        <iframe
          title="Satthamma Farms map"
          className="w-full h-full min-h-[420px] border-0"
          src="https://www.google.com/maps?q=Medipally,+Jagityal,+Telangana&output=embed"
          loading="lazy"
        />
      </div>
    </div>
  );
}
