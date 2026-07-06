import React, { createContext, useContext, useEffect, useState, useCallback } from "react";
import axios from "axios";

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;
const SiteCtx = createContext(null);

const DEFAULTS = {
  whatsapp_number: "918500812044",
  contact_phone: "+91 85008 12044",
  contact_email: "satthammafarms@gmail.com",
  contact_address: "505453, Medipally, Medipally Mandal, Jagityal Dist, Telangana",
  instagram_url: "https://www.instagram.com/satthammamucchatlu",
  youtube_url: "https://youtube.com/@sathammamucchatlu",
  hero_badge: "Organic · Chemical-free · Since generations",
  hero_title_line1: "From our soil,",
  hero_title_line2: "to your table.",
  hero_tagline: "prathiokkari intaa, nanyamaina panta",
  hero_paragraph: "",
  story_title: "Farming the way it was meant to be.",
  story_text: "",
  checkout_whatsapp_note: "On clicking Order, you'll be redirected to WhatsApp to confirm your order with our team.",
};

export function SiteProvider({ children }) {
  const [site, setSite] = useState(DEFAULTS);

  const refresh = useCallback(async () => {
    try {
      const { data } = await axios.get(`${API}/site`);
      setSite({ ...DEFAULTS, ...data });
    } catch { /* keep defaults */ }
  }, []);

  useEffect(() => { refresh(); }, [refresh]);

  return <SiteCtx.Provider value={{ site, refresh }}>{children}</SiteCtx.Provider>;
}

export const useSite = () => useContext(SiteCtx) || { site: DEFAULTS, refresh: () => {} };
