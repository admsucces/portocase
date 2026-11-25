import React, { useState } from 'react';
import {
  X, Monitor, Tablet, Smartphone, ExternalLink, Copy, Check,
  ShoppingCart, MessageCircle, ShieldCheck, RefreshCw
} from 'lucide-react';
import { formatRupiah, buildWaLink } from '../api/gasClient';

export default function LiveDemoModal({ product, brand, onClose, onOrder, onNotify }) {
  const [viewport, setViewport] = useState('desktop'); // 'desktop' | 'tablet' | 'mobile'
  const [copied, setCopied] = useState(false);
  const [iframeLoading, setIframeLoading] = useState(true);
  const [iframeKey, setIframeKey] = useState(0);

  if (!product) return null;

  const viewportWidth = {
    desktop: 'w-full',
    tablet: 'w-full max-w-[768px]',
    mobile: 'w-full max-w-[375px]'
  }[viewport];

  const handleCopyDemo = () => {
    if (!product.info_akun_demo) return;
    navigator.clipboard.writeText(product.info_akun_demo);
    setCopied(true);
    onNotify('Info akun demo disalin ke clipboard!', 'success');
    setTimeout(() => setCopied(false), 2500);
  };

  const waUrl = buildWaLink(
    brand?.nomor_wa,
    `Halo ${brand?.nama_brand || 'Admin'}, saya baru saja mencoba Live Demo *${product.nama_produk}* dan ingin berkonsultasi.`
  );

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-slate-950/95 backdrop-blur-md text-white">
      {/* Top Studio Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-3 bg-slate-900 border-b border-slate-800">
        <div className="flex items-center gap-3 min-w-0">
          <button
            onClick={onClose}
            className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 transition"
            title="Tutup Live Demo"
          >
            <X className="w-5 h-5" />
          </button>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1 px-2 py-0.5 text-[11px] font-semibold rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                LIVE DEMO
              </span>
              <span className="text-xs text-slate-400 hidden sm:inline">{product.kategori}</span>
            </div>
            <h3 className="font-bold text-sm sm:text-base truncate">{product.nama_produk}</h3>
          </div>
        </div>

        {/* Viewport Switcher (Desktop / Tablet / Mobile) */}
        <div className="hidden md:flex items-center gap-1 bg-slate-800/90 p-1 rounded-xl border border-slate-700">
          <button
            onClick={() => setViewport('desktop')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition ${
              viewport === 'desktop' ? 'bg-blue-600 text-white shadow' : 'text-slate-300 hover:text-white'
            }`}
          >
            <Monitor className="w-3.5 h-3.5" /> Desktop
          </button>
          <button
            onClick={() => setViewport('tablet')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition ${
              viewport === 'tablet' ? 'bg-blue-600 text-white shadow' : 'text-slate-300 hover:text-white'
            }`}
          >
            <Tablet className="w-3.5 h-3.5" /> Tablet
          </button>
          <button
            onClick={() => setViewport('mobile')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition ${
              viewport === 'mobile' ? 'bg-blue-600 text-white shadow' : 'text-slate-300 hover:text-white'
            }`}
          >
            <Smartphone className="w-3.5 h-3.5" /> Mobile
          </button>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2">
          {product.url_live_demo && (
            <>
              <button
                onClick={() => {
                  setIframeLoading(true);
                  setIframeKey((k) => k + 1);
                }}
                className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition hidden sm:inline-flex"
                title="Muat Ulang Demo"
              >
                <RefreshCw className="w-4 h-4" />
              </button>
              <a
                href={product.url_live_demo}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-medium text-slate-200 transition"
              >
                <ExternalLink className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Tab Baru</span>
              </a>
            </>
          )}
          <button
            onClick={() => {
              onClose();
              onOrder(product);
            }}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs sm:text-sm font-semibold shadow-lg shadow-emerald-600/20 transition"
          >
            <ShoppingCart className="w-4 h-4" />
            <span>Beli ({formatRupiah(product.harga_promo)})</span>
          </button>
        </div>
      </div>

      {/* Sub-bar Info Akun Demo */}
      {product.info_akun_demo && (
        <div className="bg-slate-900/80 border-b border-slate-800 px-4 py-2 flex flex-wrap items-center justify-between gap-2 text-xs">
          <div className="flex items-center gap-2 text-amber-300">
            <ShieldCheck className="w-4 h-4 shrink-0" />
            <span className="font-medium">Akun Uji Coba:</span>
            <code className="px-2 py-0.5 rounded bg-slate-800 text-slate-100 font-mono">
              {product.info_akun_demo}
            </code>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={handleCopyDemo}
              className="inline-flex items-center gap-1 text-blue-400 hover:text-blue-300 font-medium"
            >
              {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
              {copied ? 'Tersalin' : 'Salin Akun'}
            </button>
            <a
              href={waUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-emerald-400 hover:text-emerald-300 font-medium"
            >
              <MessageCircle className="w-3.5 h-3.5" /> Tanya Admin
            </a>
          </div>
        </div>
      )}

      {/* Main Preview Area */}
      <div className="flex-1 overflow-auto p-2 sm:p-4 flex justify-center items-stretch bg-[radial-gradient(#1e293b_1px,transparent_1px)] [background-size:16px_16px]">
        <div
          className={`${viewportWidth} transition-all duration-300 bg-white rounded-xl overflow-hidden shadow-2xl border border-slate-700 flex flex-col relative`}
        >
          {product.tipe_demo === 'EXTERNAL_LINK' ? (
            <div className="flex-1 flex flex-col items-center justify-center p-8 text-center bg-slate-900 text-white">
              <div className="w-16 h-16 rounded-2xl bg-blue-600/20 border border-blue-500/30 flex items-center justify-center mb-4">
                <ExternalLink className="w-8 h-8 text-blue-400" />
              </div>
              <h4 className="text-xl font-bold mb-2">Aplikasi Demo Dibuka di Jendela Eksternal</h4>
              <p className="text-sm text-slate-400 max-w-md mb-6">
                Untuk pengalaman layar penuh dan keamanan sesi login yang optimal, silakan buka demo aplikasi ini pada tab baru.
              </p>
              <a
                href={product.url_live_demo}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-blue-600 hover:bg-blue-500 font-semibold transition"
              >
                Buka Aplikasi Live Demo <ExternalLink className="w-4 h-4" />
              </a>
            </div>
          ) : (
            <>
              {iframeLoading && (
                <div className="absolute inset-0 bg-slate-900 flex flex-col items-center justify-center gap-3 z-10">
                  <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
                  <p className="text-sm text-slate-300">Memuat lingkungan Live Demo...</p>
                </div>
              )}
              <iframe
                key={iframeKey}
                src={product.url_live_demo}
                title={`Live Demo ${product.nama_produk}`}
                className="w-full h-full flex-1 border-0 bg-white"
                onLoad={() => setIframeLoading(false)}
                sandbox="allow-scripts allow-same-origin allow-forms allow-popups"
              />
            </>
          )}
        </div>
      </div>
    </div>
  );
}
