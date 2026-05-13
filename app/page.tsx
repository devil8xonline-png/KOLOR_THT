"use client";

import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabase";
import type { Product } from "@/lib/types";
import Link from "next/link";

function normalizeSearch(value: string) {
  return String(value || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d")
    .replace(/×/g, "x")
    .replace(/\*/g, "x")
    .replace(/\s*x\s*/g, "x")
    .replace(/[^a-z0-9x]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function firstImage(p: Product) {
  if (p.drive_image_url) return p.drive_image_url;
  if (p.image) return p.image;

  const gallery = String(p.gallery || "")
    .split("|")
    .map((x) => x.trim())
    .filter(Boolean);

  if (gallery.length) return gallery[0];

  return "https://picsum.photos/900/700";
}

function unique(values: Array<string | null>) {
  return Array.from(
    new Set(values.map((x) => String(x || "").trim()).filter(Boolean))
  );
}

export default function HomePage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  const [q, setQ] = useState("");
  const [surface, setSurface] = useState("");
  const [origin, setOrigin] = useState("");
  const [collection, setCollection] = useState("");

  useEffect(() => {
    async function loadProducts() {
      setLoading(true);

      const { data, error } = await supabase
        .from("products")
        .select("*")
        .order("name", { ascending: true });

      if (error) {
        console.error(error);
        setProducts([]);
      } else {
        setProducts((data || []) as Product[]);
      }

      setLoading(false);
    }

    loadProducts();
  }, []);

  const surfaces = useMemo(
    () => unique(products.map((p) => p.surface)),
    [products]
  );

  const origins = useMemo(
    () => unique(products.map((p) => p.origin)),
    [products]
  );

  const collections = useMemo(
    () => unique(products.map((p) => p.collection)),
    [products]
  );

  const filtered = useMemo(() => {
    const keywords = normalizeSearch(q)
      .split(" ")
      .map((x) => x.trim())
      .filter(Boolean);

    return products.filter((p) => {
      const haystack = normalizeSearch(
        [
          p.id,
          p.code,
          p.name,
          p.size,
          p.surface,
          p.origin,
          p.color,
          p.category,
          p.collection,
          p.description,
          p.price,
        ].join(" ")
      );

      const okKeyword = keywords.every((k) => haystack.includes(k));
      const okSurface =
        !surface || normalizeSearch(p.surface || "") === normalizeSearch(surface);
      const okOrigin =
        !origin || normalizeSearch(p.origin || "") === normalizeSearch(origin);
      const okCollection =
        !collection ||
        normalizeSearch(p.collection || "") === normalizeSearch(collection);

      return okKeyword && okSurface && okOrigin && okCollection;
    });
  }, [products, q, surface, origin, collection]);

  function clearFilters() {
    setQ("");
    setSurface("");
    setOrigin("");
    setCollection("");
  }

  return (
    <main className="min-h-screen bg-[#f4f2ef]">
      <header className="sticky top-0 z-50 bg-black text-white px-6 py-5 flex items-center justify-between gap-4 flex-wrap">
        <div className="font-extrabold tracking-[0.18em] text-xl">
          TILE CATALOG
        </div>

        <div className="text-sm opacity-80">
          {products.length} sản phẩm
        </div>
	<Link href="/admin" className="rounded-xl bg-white text-black px-4 py-2 font-bold">
  	Admin
	</Link>
      </header>
	
      <section className="p-4 md:p-8">
        <div className="grid grid-cols-1 md:grid-cols-[2fr_1fr_1fr_1fr_auto] gap-3 mb-6">
          <input
            className="rounded-xl border px-4 py-3"
            placeholder="Tìm: 600x600 indo matt..."
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />

          <select
            className="rounded-xl border px-4 py-3"
            value={surface}
            onChange={(e) => setSurface(e.target.value)}
          >
            <option value="">Tất cả bề mặt</option>
            {surfaces.map((x) => (
              <option key={x}>{x}</option>
            ))}
          </select>

          <select
            className="rounded-xl border px-4 py-3"
            value={origin}
            onChange={(e) => setOrigin(e.target.value)}
          >
            <option value="">Tất cả xuất xứ</option>
            {origins.map((x) => (
              <option key={x}>{x}</option>
            ))}
          </select>

          <select
            className="rounded-xl border px-4 py-3"
            value={collection}
            onChange={(e) => setCollection(e.target.value)}
          >
            <option value="">Tất cả collection</option>
            {collections.map((x) => (
              <option key={x}>{x}</option>
            ))}
          </select>

          <button
            onClick={clearFilters}
            className="rounded-xl bg-zinc-200 px-4 py-3 font-bold"
          >
            Clear
          </button>
        </div>

        {loading ? (
          <div className="text-center py-20 text-zinc-500">
            Đang tải sản phẩm...
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-20 text-zinc-500">
            Không tìm thấy sản phẩm
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filtered.map((p) => (
              <article
                key={p.id}
                className="rounded-3xl bg-white overflow-hidden shadow-sm"
              >
                <div className="aspect-[4/3] bg-zinc-100">
                  <img
                    src={firstImage(p)}
                    alt={p.name}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      e.currentTarget.src = "https://picsum.photos/900/700";
                    }}
                  />
                </div>

                <div className="p-5">
                  <div className="inline-block rounded-full bg-zinc-100 px-3 py-1 text-xs mb-3">
                    {p.collection || p.category || "Product"}
                  </div>

                  <h2 className="font-extrabold text-lg leading-tight mb-3">
                    {p.name}
                  </h2>

                  <div className="space-y-1 text-sm text-zinc-600">
                    <div>
                      <b>Code:</b> {p.code || "—"}
                    </div>
                    <div>
                      <b>Kích thước:</b> {p.size || "—"}
                    </div>
                    <div>
                      <b>Bề mặt:</b> {p.surface || "—"}
                    </div>
                    <div>
                      <b>Xuất xứ:</b> {p.origin || "—"}
                    </div>
                  </div>

                  <div className="text-[#b68b2c] font-extrabold text-xl mt-4">
                    {p.price || "Liên hệ"}
                  </div>

                  <div className="grid grid-cols-2 gap-2 mt-4">
                    <Link
                      href={`/products/${encodeURIComponent(p.id)}`}
                      className="rounded-xl bg-black text-white text-center py-3 font-bold"
                    >
                      Chi tiết
                    </Link>

                    <a
                      href={p.pdf || "#"}
                      target="_blank"
                      className="rounded-xl bg-[#c6a14a] text-white text-center py-3 font-bold"
                    >
                      PDF
                    </a>
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}