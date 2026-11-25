import React from 'react';
import {
  X, Play, ShoppingCart, CheckCircle2, Layers, MessageCircle, Eye
} from 'lucide-react';
import { formatRupiah, buildWaLink } from '../api/gasClient';

export default function ProductDetailModal({ product, brand, theme, onClose, onDemo, onOrder }) {
  if (!product) return null;

  const fiturList = String(product.fitur_unggulan || '')
    .split(/|\|/)
    .map((s) => s.trim())
    .filter(Boolean);

  const techList = String(product.teknologi || '')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/75 backdrop-blur-sm overflow-y-auto">
      <div
        className={`w-full max-w-3xl rounded-2xl border shadow-2xl overflow-hidden my-auto ${
          theme.isDark ? 'bg-slate-900 border-slate-800 text-slate-100' : 'bg-white border-slate-200 text-slate-900'
        }`}
      >
        {/* Top Image Banner */}
        <div className="relative h-52 sm:h-64 bg-slate-800">
          <img
            src={product.url_thumbnail || 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&w=1000&q=80'}
            alt={product.nama_produk}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/40 to-transparent" />
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 rounded-full bg-slate-950/70 text-white hover:bg-slate-900 transition"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="absolute bottom-4 left-5 right-5 text-white">
            <div className="flex flex-wrap items-center gap-2 mb-1.5">
              <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-600">
                {product.kategori}
              </span>
              {product.badge_label && (
                <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-500 text-slate-950">
                  {product.badge_label}
                </span>
              )}
              <span className="inline-flex items-center gap-1 text-xs text-slate-300 ml-auto">
                <Eye className="w-3.5 h-3.5" /> {product.jumlah_dilihat || 0} dilihat
              </span>
            </div>
            <h2 className="text-xl sm:text-2xl font-extrabold">{product.nama_produk}</h2>
          </div>
        </div>

        {/* Content */}
        <div className="p-5 sm:p-6 max-h-[65vh] overflow-y-auto space-y-5">
          {/* Price & CTA Bar */}
          <div className={`p-4 rounded-xl border flex flex-wrap items-center justify-between gap-4 ${theme.isDark ? 'bg-slate-950/60 border-slate-800' : 'bg-slate-50 border-slate-200'}`}>
            <div>
              {Number(product.harga_normal) > Number(product.harga_promo) && (
                <div className="text-xs line-through text-slate-400">
                  {formatRupiah(product.harga_normal)}
                </div>
              )}
              <div className="flex items-baseline gap-2">
                <span className={`text-2xl font-extrabold ${theme.accentText}`}>
                  {formatRupiah(product.harga_promo)}
                </span>
                <span className={`text-xs ${theme.subText}`}>/ {product.satuan_harga || 'Sekali Bayar'}</span>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              {product.tipe_demo !== 'NONE' && product.url_live_demo && (
                <button
                  onClick={() => {
                    onClose();
                    onDemo(product);
                  }}
                  className="px-4 py-2.5 rounded-xl border border-blue-500/40 bg-blue-500/10 text-blue-500 hover:bg-blue-500/20 font-semibold text-xs sm:text-sm flex items-center gap-1.5 transition"
                >
                  <Play className="w-4 h-4 fill-current" /> Live Demo
                </button>
              )}
              <button
                onClick={() => {
                  onClose();
                  onOrder(product);
                }}
                className={`px-5 py-2.5 rounded-xl font-semibold text-xs sm:text-sm flex items-center gap-1.5 shadow-lg transition ${theme.primaryBtn}`}
              >
                <ShoppingCart className="w-4 h-4" /> Beli Sekarang
              </button>
            </div>
          </div>

          <div>
            <h4 className="text-sm font-bold uppercase tracking-wider mb-2 opacity-80">Deskripsi Aplikasi</h4>
            <p className={`text-sm leading-relaxed whitespace-pre-line ${theme.mutedText}`}>
              {product.deskripsi_lengkap || product.deskripsi_singkat}
            </p>
          </div>

          {fiturList.length > 0 && (
            <div>
              <h4 className="text-sm font-bold uppercase tracking-wider mb-2.5 opacity-80">Fitur Unggulan</h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {fiturList.map((f, idx) => (
                  <div
                    key={idx}
                    className={`p-3 rounded-xl border flex items-start gap-2.5 text-xs sm:text-sm ${
                      theme.isDark ? 'bg-slate-950/40 border-slate-800' : 'bg-slate-50/80 border-slate-200/80'
                    }`}
                  >
                    <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                    <span>{f}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {techList.length > 0 && (
            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider mb-2 opacity-70 flex items-center gap-1.5">
                <Layers className="w-3.5 h-3.5" /> Teknologi & Stack
              </h4>
              <div className="flex flex-wrap gap-2">
                {techList.map((t, i) => (
                  <span key={i} className={`px-3 py-1 rounded-lg text-xs font-medium border ${theme.primarySoft}`}>
                    {t}
                  </span>
                ))}
              </div>
            </div>
          )}

          <div className="pt-2 border-t border-slate-300/20 flex items-center justify-between text-xs">
            <span className={theme.subText}>Butuh penyesuaian fitur sesuai alur bisnis Anda?</span>
            <a
              href={buildWaLink(brand?.nomor_wa, `Halo Admin, saya ingin tanya mengenai custom fitur untuk aplikasi *${product.nama_produk}*.`)}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-emerald-500 font-bold hover:underline"
            >
              <MessageCircle className="w-4 h-4" /> Konsultasi WhatsApp
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
