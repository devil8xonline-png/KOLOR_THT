"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import type { Product } from "@/lib/types";

type Props = {
  product: Product;
};

export default function ProductActions({ product }: Props) {
  const [customerName, setCustomerName] = useState("");
  const [phone, setPhone] = useState("");
  const [note, setNote] = useState("");
  const [sending, setSending] = useState(false);

  const productLink =
    typeof window !== "undefined"
      ? `${window.location.origin}/products/${encodeURIComponent(product.id)}`
      : "";

  useEffect(() => {
    async function trackView() {
      await supabase.from("product_views").insert({
        product_id: product.id,
        product_name: product.name,
        code: product.code,
        source: "PRODUCT_DETAIL",
      });
    }

    trackView();
  }, [product.id, product.name, product.code]);

  function buildZaloMessage() {
    return [
      "Em quan tâm sản phẩm:",
      `Tên: ${product.name || ""}`,
      `Code: ${product.code || ""}`,
      `Kích thước: ${product.size || ""}`,
      `Bề mặt: ${product.surface || ""}`,
      `Xuất xứ: ${product.origin || ""}`,
      `Link: ${productLink}`,
    ].join("\n");
  }

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(productLink);
      alert("Đã copy link sản phẩm.");
    } catch {
      alert(productLink);
    }
  }

  async function openZalo() {
    const message = buildZaloMessage();

    try {
      await navigator.clipboard.writeText(message);
    } catch {}

    const zaloPhone = process.env.NEXT_PUBLIC_ZALO_PHONE || "";

    if (!zaloPhone) {
      alert("Chưa cài số Zalo. Nội dung sản phẩm đã được copy.");
      return;
    }

    alert("Đã copy nội dung sản phẩm. Khi Zalo mở, bạn dán nội dung vào khung chat nhé.");

    window.open(`https://zalo.me/${zaloPhone}`, "_blank");
  }

  async function submitLead() {
    if (!customerName.trim() && !phone.trim()) {
      alert("Bạn vui lòng nhập tên hoặc số điện thoại.");
      return;
    }

    setSending(true);

    const { error } = await supabase.from("leads").insert({
      product_id: product.id,
      product_name: product.name,
      code: product.code,
      customer_name: customerName.trim(),
      phone: phone.trim(),
      note: note.trim(),
      source: "PRODUCT_DETAIL",
      status: "NEW",
    });

    setSending(false);

    if (error) {
      alert("Lỗi gửi thông tin: " + error.message);
      return;
    }

    alert("Đã gửi thông tin. Cảm ơn bạn!");

    setCustomerName("");
    setPhone("");
    setNote("");
  }

  return (
    <div className="mt-6 grid gap-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <button
          onClick={copyLink}
          className="rounded-xl bg-zinc-200 text-black py-4 font-extrabold"
        >
          Copy link sản phẩm
        </button>

        <button
          onClick={openZalo}
          className="rounded-xl bg-[#c6a14a] text-white py-4 font-extrabold"
        >
          Zalo tư vấn
        </button>
      </div>

      <div className="rounded-3xl bg-zinc-100 p-5 grid gap-3">
        <h3 className="text-xl font-extrabold">Để lại thông tin tư vấn</h3>

        <input
          className="rounded-xl border px-4 py-3"
          placeholder="Tên khách hàng"
          value={customerName}
          onChange={(e) => setCustomerName(e.target.value)}
        />

        <input
          className="rounded-xl border px-4 py-3"
          placeholder="Số điện thoại"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
        />

        <input
          className="rounded-xl border px-4 py-3"
          placeholder="Nhu cầu / ghi chú"
          value={note}
          onChange={(e) => setNote(e.target.value)}
        />

        <button
          onClick={submitLead}
          disabled={sending}
          className="rounded-xl bg-black text-white py-4 font-extrabold disabled:opacity-50"
        >
          {sending ? "Đang gửi..." : "Gửi thông tin"}
        </button>
      </div>
    </div>
  );
}