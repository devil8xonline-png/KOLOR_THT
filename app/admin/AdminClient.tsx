"use client";

import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabase";
import type { Product } from "@/lib/types";
import Link from "next/link";

type ProductForm = {
  id: string;
  code: string;
  name: string;
  image: string;
  size: string;
  surface: string;
  origin: string;
  color: string;
  price: string;
  pdf: string;
  description: string;
  category: string;
  gallery: string;
  video: string;
  collection: string;
  drive_image_url: string;
};

const emptyForm: ProductForm = {
  id: "",
  code: "",
  name: "",
  image: "",
  size: "",
  surface: "",
  origin: "",
  color: "",
  price: "",
  pdf: "",
  description: "",
  category: "",
  gallery: "",
  video: "",
  collection: "",
  drive_image_url: "",
};

function makeId() {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return "SP-" + crypto.randomUUID().slice(0, 8).toUpperCase();
  }

  return "SP-" + Math.random().toString(16).slice(2, 10).toUpperCase();
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

function safeFileName(name: string) {
  return String(name || "product")
    .trim()
    .replace(/[\\/:*?"<>|]/g, "")
    .replace(/\s+/g, "_")
    .slice(0, 120);
}

export default function AdminClient() {
  const [sessionEmail, setSessionEmail] = useState<string>("");
  const [isAdmin, setIsAdmin] = useState(false);
  const [authLoading, setAuthLoading] = useState(true);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [products, setProducts] = useState<Product[]>([]);
  const [loadingProducts, setLoadingProducts] = useState(false);

  const [leadCount, setLeadCount] = useState(0);
  const [viewCount, setViewCount] = useState(0);

  const [form, setForm] = useState<ProductForm>(emptyForm);
  const [editingId, setEditingId] = useState("");
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);

  const [q, setQ] = useState("");

  useEffect(() => {
    checkSession();
  }, []);

  async function checkSession() {
    setAuthLoading(true);

    const { data } = await supabase.auth.getSession();
    const session = data.session;

    if (!session) {
      setSessionEmail("");
      setIsAdmin(false);
      setAuthLoading(false);
      return;
    }

    setSessionEmail(session.user.email || "");

    const { data: adminRow } = await supabase
      .from("admins")
      .select("user_id")
      .eq("user_id", session.user.id)
      .maybeSingle();

    const ok = !!adminRow;
    setIsAdmin(ok);
    setAuthLoading(false);

    if (ok) {
      loadProducts();
    }
  }

  async function login(e: React.FormEvent) {
    e.preventDefault();

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      alert("Đăng nhập lỗi: " + error.message);
      return;
    }

    await checkSession();
  }

  async function logout() {
    await supabase.auth.signOut();
    setIsAdmin(false);
    setSessionEmail("");
    setProducts([]);
  }

  async function loadProducts() {
  setLoadingProducts(true);

  const { data, error } = await supabase
    .from("products")
    .select("*")
    .order("name", { ascending: true });

  if (error) {
    alert("Lỗi tải sản phẩm: " + error.message);
    setProducts([]);
  } else {
    setProducts((data || []) as Product[]);
  }

  const { count: leads } = await supabase
    .from("leads")
    .select("*", { count: "exact", head: true });

  const { count: views } = await supabase
    .from("product_views")
    .select("*", { count: "exact", head: true });

  setLeadCount(leads || 0);
  setViewCount(views || 0);

  setLoadingProducts(false);
}

  const filteredProducts = useMemo(() => {
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
          p.collection,
          p.category,
          p.price,
        ].join(" ")
      );

      return keywords.every((k) => haystack.includes(k));
    });
  }, [products, q]);

  function updateForm(key: keyof ProductForm, value: string) {
    setForm((prev) => ({
      ...prev,
      [key]: value,
    }));
  }

  function resetForm() {
    setForm(emptyForm);
    setEditingId("");
  }

  function editProduct(p: Product) {
    setEditingId(p.id);

    setForm({
      id: p.id || "",
      code: p.code || "",
      name: p.name || "",
      image: p.image || "",
      size: p.size || "",
      surface: p.surface || "",
      origin: p.origin || "",
      color: p.color || "",
      price: p.price || "",
      pdf: p.pdf || "",
      description: p.description || "",
      category: p.category || "",
      gallery: p.gallery || "",
      video: p.video || "",
      collection: p.collection || "",
      drive_image_url: p.drive_image_url || "",
    });

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  }

  async function uploadImage(file: File) {
    if (!file) return;

    if (!form.name.trim()) {
      alert("Bạn nhập tên sản phẩm trước rồi upload ảnh.");
      return;
    }

    setUploading(true);

    const ext = file.name.split(".").pop() || "jpg";
    const filePath = `${safeFileName(form.name)}_${Date.now()}.${ext}`;

    const { error } = await supabase.storage
      .from("product-images")
      .upload(filePath, file, {
        cacheControl: "3600",
        upsert: false,
      });

    if (error) {
      alert("Upload ảnh lỗi: " + error.message);
      setUploading(false);
      return;
    }

    const { data } = supabase.storage
      .from("product-images")
      .getPublicUrl(filePath);

    updateForm("drive_image_url", data.publicUrl);
    updateForm("image", data.publicUrl);

    setUploading(false);
  }

  async function saveProduct(e: React.FormEvent) {
    e.preventDefault();

    if (!form.name.trim()) {
      alert("Tên sản phẩm là bắt buộc.");
      return;
    }

    setSaving(true);

    const id = editingId || form.id || makeId();

    const payload = {
      id,
      code: form.code || null,
      name: form.name.trim(),
      image: form.image || null,
      size: form.size || null,
      surface: form.surface || null,
      origin: form.origin || null,
      color: form.color || null,
      price: form.price || null,
      pdf: form.pdf || null,
      description: form.description || null,
      category: form.category || null,
      gallery: form.gallery || null,
      video: form.video || null,
      collection: form.collection || null,
      drive_image_url: form.drive_image_url || null,
      updated_at: new Date().toISOString(),
    };

    const { error } = editingId
      ? await supabase.from("products").update(payload).eq("id", editingId)
      : await supabase.from("products").insert(payload);

    setSaving(false);

    if (error) {
      alert("Lỗi lưu sản phẩm: " + error.message);
      return;
    }

    alert(editingId ? "Đã cập nhật sản phẩm." : "Đã thêm sản phẩm.");
    resetForm();
    loadProducts();
  }

  async function deleteProduct(id: string, name: string) {
    const ok = confirm(
      `Bạn chắc chắn muốn xóa sản phẩm này?\n\n${name}\n\nThao tác này không hoàn tác.`
    );

    if (!ok) return;

    const { error } = await supabase.from("products").delete().eq("id", id);

    if (error) {
      alert("Lỗi xóa sản phẩm: " + error.message);
      return;
    }

    alert("Đã xóa sản phẩm.");
    loadProducts();
  }

  function copyProductLink(id: string) {
    const url = `${window.location.origin}/products/${encodeURIComponent(id)}`;

    navigator.clipboard
      .writeText(url)
      .then(() => alert("Đã copy link sản phẩm."))
      .catch(() => alert(url));
  }

  if (authLoading) {
    return (
      <main className="min-h-screen bg-[#f4f2ef] flex items-center justify-center">
        <div className="text-zinc-500">Đang kiểm tra đăng nhập...</div>
      </main>
    );
  }

  if (!isAdmin) {
    return (
      <main className="min-h-screen bg-[#f4f2ef]">
        <header className="bg-black text-white px-6 py-5 flex justify-between items-center">
          <div className="font-extrabold tracking-[0.18em] text-xl">
            TILE ADMIN
          </div>

          <Link href="/" className="rounded-xl bg-white text-black px-4 py-2 font-bold">
            Catalogue
          </Link>
        </header>

        <section className="p-5">
          <form
            onSubmit={login}
            className="max-w-md mx-auto bg-white rounded-3xl shadow-xl p-7 mt-10"
          >
            <h1 className="text-2xl font-extrabold mb-6">
              Đăng nhập Admin
            </h1>

            <div className="grid gap-4">
              <input
                className="rounded-xl border px-4 py-3"
                placeholder="Email admin"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />

              <input
                className="rounded-xl border px-4 py-3"
                type="password"
                placeholder="Mật khẩu"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />

              <button className="rounded-xl bg-black text-white py-3 font-bold">
                Đăng nhập
              </button>
            </div>

            {sessionEmail && !isAdmin && (
              <div className="mt-4 text-sm text-red-600">
                Tài khoản {sessionEmail} chưa được cấp quyền admin.
              </div>
            )}
          </form>
        </section>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#f4f2ef]">
      <header className="sticky top-0 z-50 bg-black text-white px-6 py-5 flex justify-between items-center gap-4 flex-wrap">
        <div>
          <div className="font-extrabold tracking-[0.18em] text-xl">
            TILE ADMIN
          </div>
          <div className="text-xs opacity-70 mt-1">{sessionEmail}</div>
        </div>

        <div className="flex gap-2 flex-wrap">
          <Link
            href="/"
            className="rounded-xl bg-white text-black px-4 py-2 font-bold"
          >
            Catalogue
          </Link>

          <button
            onClick={loadProducts}
            className="rounded-xl bg-zinc-800 text-white px-4 py-2 font-bold"
          >
            Reload
          </button>

          <button
            onClick={logout}
            className="rounded-xl bg-[#c6a14a] text-white px-4 py-2 font-bold"
          >
            Đăng xuất
          </button>
        </div>
      </header>

      <section className="p-4 md:p-8">
	<div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
 	 <div className="bg-white rounded-3xl p-5 shadow-sm">
    	<div className="text-3xl font-extrabold">{products.length}</div>
    	<div className="text-zinc-500">Tổng sản phẩm</div>
	  </div>

  <div className="bg-white rounded-3xl p-5 shadow-sm">
    <div className="text-3xl font-extrabold">{leadCount}</div>
    <div className="text-zinc-500">Khách để lại thông tin</div>
  </div>

  <div className="bg-white rounded-3xl p-5 shadow-sm">
    <div className="text-3xl font-extrabold">{viewCount}</div>
    <div className="text-zinc-500">Lượt xem sản phẩm</div>
  </div>
</div>
        <div className="grid grid-cols-1 lg:grid-cols-[420px_1fr] gap-6">
          <form
            onSubmit={saveProduct}
            className="bg-white rounded-3xl shadow-sm p-5 md:p-6 h-fit"
          >
            <h2 className="text-2xl font-extrabold mb-5">
              {editingId ? "Sửa sản phẩm" : "Thêm sản phẩm"}
            </h2>

            <div className="grid gap-3">
              <input
                className="rounded-xl border px-4 py-3"
                placeholder="Code"
                value={form.code}
                onChange={(e) => updateForm("code", e.target.value)}
              />

              <input
                className="rounded-xl border px-4 py-3"
                placeholder="Tên sản phẩm *"
                value={form.name}
                onChange={(e) => updateForm("name", e.target.value)}
              />

              <input
                className="rounded-xl border px-4 py-3"
                placeholder="Kích thước"
                value={form.size}
                onChange={(e) => updateForm("size", e.target.value)}
              />

              <div className="grid grid-cols-2 gap-3">
                <input
                  className="rounded-xl border px-4 py-3"
                  placeholder="Bề mặt"
                  value={form.surface}
                  onChange={(e) => updateForm("surface", e.target.value)}
                />

                <input
                  className="rounded-xl border px-4 py-3"
                  placeholder="Xuất xứ"
                  value={form.origin}
                  onChange={(e) => updateForm("origin", e.target.value)}
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <input
                  className="rounded-xl border px-4 py-3"
                  placeholder="Màu sắc"
                  value={form.color}
                  onChange={(e) => updateForm("color", e.target.value)}
                />

                <input
                  className="rounded-xl border px-4 py-3"
                  placeholder="Giá"
                  value={form.price}
                  onChange={(e) => updateForm("price", e.target.value)}
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <input
                  className="rounded-xl border px-4 py-3"
                  placeholder="Category"
                  value={form.category}
                  onChange={(e) => updateForm("category", e.target.value)}
                />

                <input
                  className="rounded-xl border px-4 py-3"
                  placeholder="Collection"
                  value={form.collection}
                  onChange={(e) => updateForm("collection", e.target.value)}
                />
              </div>

              <input
                className="rounded-xl border px-4 py-3"
                placeholder="Link ảnh chính"
                value={form.image}
                onChange={(e) => updateForm("image", e.target.value)}
              />

              <label className="rounded-xl border border-dashed p-4 text-center cursor-pointer bg-zinc-50">
                {uploading ? "Đang upload ảnh..." : "Upload ảnh sản phẩm"}
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) uploadImage(file);
                  }}
                />
              </label>

              {(form.drive_image_url || form.image) && (
                <div className="rounded-2xl bg-zinc-100 aspect-[4/3] overflow-hidden">
                  <img
                    src={form.drive_image_url || form.image}
                    alt=""
                    className="w-full h-full object-contain"
                  />
                </div>
              )}

              <input
                className="rounded-xl border px-4 py-3"
                placeholder="Gallery: link1|link2|link3"
                value={form.gallery}
                onChange={(e) => updateForm("gallery", e.target.value)}
              />

              <input
                className="rounded-xl border px-4 py-3"
                placeholder="Video embed link"
                value={form.video}
                onChange={(e) => updateForm("video", e.target.value)}
              />

              <input
                className="rounded-xl border px-4 py-3"
                placeholder="PDF link"
                value={form.pdf}
                onChange={(e) => updateForm("pdf", e.target.value)}
              />

              <textarea
                className="rounded-xl border px-4 py-3 min-h-24"
                placeholder="Mô tả"
                value={form.description}
                onChange={(e) => updateForm("description", e.target.value)}
              />

              <div className="grid grid-cols-2 gap-3">
                <button
                  disabled={saving}
                  className="rounded-xl bg-black text-white py-3 font-bold disabled:opacity-50"
                >
                  {saving ? "Đang lưu..." : editingId ? "Cập nhật" : "Thêm mới"}
                </button>

                <button
                  type="button"
                  onClick={resetForm}
                  className="rounded-xl bg-zinc-200 py-3 font-bold"
                >
                  Làm mới
                </button>
              </div>
            </div>
          </form>

          <div className="bg-white rounded-3xl shadow-sm p-5 md:p-6">
            <div className="flex items-center justify-between gap-3 flex-wrap mb-5">
              <h2 className="text-2xl font-extrabold">
                Danh sách sản phẩm
              </h2>

              <div className="text-sm text-zinc-500">
                {filteredProducts.length} / {products.length}
              </div>
            </div>

            <input
              className="rounded-xl border px-4 py-3 w-full mb-5"
              placeholder="Tìm: 600x600 indo..."
              value={q}
              onChange={(e) => setQ(e.target.value)}
            />

            {loadingProducts ? (
              <div className="text-center py-20 text-zinc-500">
                Đang tải sản phẩm...
              </div>
            ) : filteredProducts.length === 0 ? (
              <div className="text-center py-20 text-zinc-500">
                Không có sản phẩm
              </div>
            ) : (
              <div className="grid gap-3">
                {filteredProducts.map((p) => (
                  <div
                    key={p.id}
                    className="grid grid-cols-[80px_1fr] md:grid-cols-[90px_1fr_auto] gap-4 items-center rounded-2xl border p-3"
                  >
                    <div className="w-20 h-16 md:w-24 md:h-20 rounded-xl bg-zinc-100 overflow-hidden">
                      <img
                        src={firstImage(p)}
                        alt=""
                        className="w-full h-full object-cover"
                      />
                    </div>

                    <div>
                      <div className="font-extrabold">{p.name}</div>
                      <div className="text-sm text-zinc-500">
                        {p.code || "—"} · {p.size || "—"} · {p.origin || "—"}
                      </div>
                      <div className="text-[#b68b2c] font-bold mt-1">
                        {p.price || "Liên hệ"}
                      </div>
                    </div>

                    <div className="col-span-2 md:col-span-1 flex gap-2 flex-wrap justify-start md:justify-end">
                      <button
                        onClick={() => editProduct(p)}
                        className="rounded-xl bg-black text-white px-4 py-2 font-bold"
                      >
                        Sửa
                      </button>

                      <Link
                        href={`/products/${encodeURIComponent(p.id)}`}
                        target="_blank"
                        className="rounded-xl bg-zinc-200 text-black px-4 py-2 font-bold"
                      >
                        Xem
                      </Link>

                      <button
                        onClick={() => copyProductLink(p.id)}
                        className="rounded-xl bg-[#c6a14a] text-white px-4 py-2 font-bold"
                      >
                        Copy
                      </button>

                      <button
                        onClick={() => deleteProduct(p.id, p.name)}
                        className="rounded-xl bg-red-700 text-white px-4 py-2 font-bold"
                      >
                        Xóa
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </section>
    </main>
  );
}