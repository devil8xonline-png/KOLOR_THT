import { supabase } from "@/lib/supabase";
import type { Product } from "@/lib/types";
import { firstProductImage, productGalleryImages } from "@/lib/images";
import Link from "next/link";
import { notFound } from "next/navigation";
import ProductActions from "./ProductActions";

export default async function ProductDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const { data, error } = await supabase
    .from("products")
    .select("*")
    .eq("id", decodeURIComponent(id))
    .single();

  if (error || !data) {
    notFound();
  }

  const p = data as Product;
  const gallery = productGalleryImages(p);

  return (
    <main className="min-h-screen bg-[#f4f2ef]">
      <header className="sticky top-0 z-50 bg-black text-white px-6 py-5 flex justify-between items-center">
        <div className="font-extrabold tracking-[0.18em] text-xl">
          TILE CATALOG
        </div>

        <Link href="/" className="rounded-xl bg-white text-black px-4 py-2 font-bold">
          Catalogue
        </Link>
      </header>

      <section className="p-4 md:p-8">
        <div className="max-w-3xl mx-auto bg-white rounded-3xl shadow-xl overflow-hidden">
          <div className="p-5 md:p-8">
            <h1 className="text-2xl md:text-4xl font-extrabold leading-tight mb-6">
              {p.name}
            </h1>

            <div className="rounded-3xl bg-zinc-100 aspect-[1/.78] flex items-center justify-center overflow-hidden mb-4">
              <img
                src={firstProductImage(p)}
                alt={p.name}
                className="w-full h-full object-contain"
              />
            </div>

            {gallery.length > 1 && (
              <div className="flex gap-3 flex-wrap mb-6">
                {gallery.map((img) => (
                  <div
                    key={img}
                    className="w-16 h-16 rounded-xl overflow-hidden bg-zinc-100 border"
                  >
                    <img
                      src={img}
                      alt=""
                      className="w-full h-full object-cover"
                    />
                  </div>
                ))}
              </div>
            )}

            <div className="grid grid-cols-[130px_1fr] md:grid-cols-[160px_1fr] gap-3 text-base md:text-lg mb-6">
              <div className="font-bold">Code:</div>
              <div>{p.code || "—"}</div>

              <div className="font-bold">Kích thước:</div>
              <div>{p.size || "—"}</div>

              <div className="font-bold">Bề mặt:</div>
              <div>{p.surface || "—"}</div>

              <div className="font-bold">Xuất xứ:</div>
              <div>{p.origin || "—"}</div>

              <div className="font-bold">Màu sắc:</div>
              <div>{p.color || "—"}</div>

              <div className="font-bold">Collection:</div>
              <div>{p.collection || p.category || "—"}</div>

              <div className="font-bold">Giá:</div>
              <div className="text-[#b68b2c] font-extrabold">
                {p.price || "Liên hệ"}
              </div>
            </div>

            {p.description && (
              <p className="text-zinc-600 leading-7 mb-6">{p.description}</p>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <a
                href={p.pdf || "#"}
                target="_blank"
                className="rounded-xl bg-[#c6a14a] text-white text-center py-4 font-extrabold"
              >
                ⬇ Tải PDF
              </a>

              <Link
                href="/"
                className="rounded-xl bg-black text-white text-center py-4 font-extrabold"
              >
                Xem sản phẩm khác
              </Link>
            </div>
            <ProductActions product={p} />
          </div>
        </div>
      </section>
    </main>
  );
}
