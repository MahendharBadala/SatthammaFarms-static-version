import React, { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import axios from "axios";
import ProductCard from "../components/ProductCard";
import { MagnifyingGlass } from "@phosphor-icons/react";

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

export default function Products() {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [q, setQ] = useState("");
  const [params, setParams] = useSearchParams();
  const category = params.get("category") || "all";

  useEffect(() => { axios.get(`${API}/categories`).then(r => setCategories(r.data)); }, []);
  useEffect(() => { axios.get(`${API}/products`).then(r => setProducts(r.data)); }, []);

  const filtered = useMemo(() => {
    return products.filter(p => {
      if (category !== "all" && p.category !== category) return false;
      if (q && !p.name.toLowerCase().includes(q.toLowerCase())) return false;
      return true;
    });
  }, [products, category, q]);

  const setCategory = (k) => {
    if (k === "all") params.delete("category"); else params.set("category", k);
    setParams(params);
  };

  return (
    <div className="container mx-auto px-4 pt-6 pb-20 md:py-12">
      <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-6 mb-6 md:mb-10">
        <div>
          <div className="chip">Our full harvest</div>
          <h1 className="font-serif text-4xl md:text-5xl lg:text-6xl mt-2 text-ink">Products</h1>
          <p className="text-muted2 mt-2 max-w-lg">Freshly harvested, hand-cleaned, and packed with care. Choose your favourites.</p>
        </div>
        <div className="relative w-full md-w-md">
          <MagnifyingGlass size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-muted2" />
          <input
            data-testid="product-search-input"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search corn,mirchi powder, dal..."
            className="w-full pl-11 pr-4 py-3 rounded-full border border-edge bg-white focus:outline-none focus:border-forest text-sm"
          />
        </div>
      </div>

      <div className="flex gap-2 overflow-x-auto no-scrollbar pb-2 mb-5 snap-x">
        {[{ key: "all", label: "All" }, ...categories].map(c => (
          <button
            key={c.key}
            data-testid={`category-filter-${c.key}`}
            onClick={() => setCategory(c.key)}
            className={`whitespace-nowrap px-4 py-2 text-sm rounded-full border text-sm transition-colors ${category === c.key ? "bg-forest text-cream border-forest" : "bg-white text-ink border-edge hover:border-forest"}`}
          >
            {c.label}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <div data-testid="empty-products" className="text-center py-20 text-muted2">No products found. Try another search.</div>
      ) : (
        <div
          className="
            grid
            grid-cols-2
            sm:grid-cols-2
            md:grid-cols-3
            lg:grid-cols-4
            gap-3
            md:gap-5
         "
           data-testid="products-grid"
>
          {filtered.map(p => <ProductCard key={p.id} product={p} />)}
        </div>
      )}
    </div>
  );
}
