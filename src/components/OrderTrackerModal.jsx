import React, { useState } from 'react';
import {
  X, Search, CheckCircle2, Clock, XCircle, ExternalLink,
  Download, Loader2, ShieldCheck
} from 'lucide-react';
import { gasRequest, formatRupiah } from '../api/gasClient';

export default function OrderTrackerModal({ theme, onClose, onNotify }) {
  const [idOrder, setIdOrder] = useState('');
  const [nomorWa, setNomorWa] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);

  const handleCheck = async (e) => {
    e.preventDefault();
    if (!idOrder.trim() || nomorWa.trim().length < 4) {
      onNotify('Isi ID Order dan minimal 4 digit akhir WhatsApp.', 'error');
      return;
    }
    setLoading(true);
    setResult(null);
    try {
      const res = await gasRequest('check_order', {
        id_order: idOrder.trim().toUpperCase(),
        nomor_wa: nomorWa.trim()
      });
      if (res.ok) {
        setResult(res.data);
      } else {
        onNotify(res.pesan || 'Pesanan tidak ditemukan.', 'error');
      }
    } catch (err) {
      onNotify(err.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  const statusBadge = (status) => {
    const s = String(status || '').toUpperCase();
    if (s === 'LUNAS') {
      return (
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-500/15 text-emerald-500 border border-emerald-500/30">
          <CheckCircle2 className="w-3.5 h-3.5" /> LUNAS & AKTIF
        </span>
      );
    }
    if (s === 'DITOLAK') {
      return (
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-rose-500/15 text-rose-500 border border-rose-500/30">
          <XCircle className="w-3.5 h-3.5" /> DITOLAK
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-500/15 text-amber-500 border border-amber-500/30">
        <Clock className="w-3.5 h-3.5" /> {s.replace('_', ' ')}
      </span>
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/75 backdrop-blur-sm">
      <div
        className={`w-full max-w-lg rounded-2xl border shadow-2xl overflow-hidden ${
          theme.isDark ? 'bg-slate-900 border-slate-800 text-slate-100' : 'bg-white border-slate-200 text-slate-900'
        }`}
      >
        <div className={`px-5 py-4 border-b flex items-center justify-between ${theme.isDark ? 'border-slate-800' : 'border-slate-100'}`}>
          <div className="flex items-center gap-2">
            <ShieldCheck className={`w-5 h-5 ${theme.accentText}`} />
            <h3 className="font-bold text-base">Cek Status Order & Akses Produk</h3>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-slate-500/10">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-5 space-y-4">
          <form onSubmit={handleCheck} className="space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold mb-1">ID Order *</label>
                <input
                  type="text"
                  required
                  value={idOrder}
                  onChange={(e) => setIdOrder(e.target.value.toUpperCase())}
                  placeholder="ORD-20260001"
                  className={`w-full px-3.5 py-2.5 rounded-xl border text-sm uppercase outline-none focus:ring-2 ${theme.inputBg}`}
                />
              </div>
              <div>
                <label className="block text-xs font-semibold mb-1">No. WA / 4 Digit Akhir *</label>
                <input
                  type="tel"
                  required
                  value={nomorWa}
                  onChange={(e) => setNomorWa(e.target.value)}
                  placeholder="Contoh: 7890"
                  className={`w-full px-3.5 py-2.5 rounded-xl border text-sm outline-none focus:ring-2 ${theme.inputBg}`}
                />
              </div>
            </div>
            <button
              type="submit"
              disabled={loading}
              className={`w-full py-2.5 rounded-xl font-semibold text-sm flex items-center justify-center gap-2 transition ${theme.primaryBtn}`}
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
              Lacak Pesanan Saya
            </button>
          </form>

          {result && (
            <div className={`p-4 rounded-xl border space-y-3 ${theme.isDark ? 'bg-slate-950/70 border-slate-800' : 'bg-slate-50 border-slate-200'}`}>
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <div className="text-xs text-slate-400">{result.id_order} • {result.tanggal_order}</div>
                  <div className="font-bold text-base">{result.nama_produk}</div>
                </div>
                {statusBadge(result.status_pembayaran)}
              </div>

              <div className="text-xs space-y-1 pt-2 border-t border-slate-300/20">
                <div className="flex justify-between">
                  <span className={theme.subText}>Pembeli:</span>
                  <span className="font-medium">{result.nama_pembeli}</span>
                </div>
                <div className="flex justify-between">
                  <span className={theme.subText}>Total Tagihan:</span>
                  <span className="font-bold">{formatRupiah(result.total_bayar)}</span>
                </div>
                {result.catatan_admin && (
                  <div className="p-2 rounded-lg bg-amber-500/10 text-amber-500 mt-2">
                    <strong>Catatan Admin:</strong> {result.catatan_admin}
                  </div>
                )}
              </div>

              {/* Digital Delivery Vault — Hanya muncul jika LUNAS */}
              {result.status_pembayaran === 'LUNAS' && result.akses_produk && (
                <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 space-y-2.5">
                  <div className="text-xs font-bold uppercase tracking-wider text-emerald-500 flex items-center gap-1.5">
                    <Download className="w-4 h-4" /> Paket Akses Produk Anda Siap!
                  </div>
                  {result.akses_produk.catatan_instalasi && (
                    <pre className="text-xs whitespace-pre-wrap font-sans opacity-90 leading-relaxed">
                      {result.akses_produk.catatan_instalasi}
                    </pre>
                  )}
                  {result.akses_produk.url_akses_produk && (
                    <a
                      href={result.akses_produk.url_akses_produk}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition shadow"
                    >
                      Buka Link Download / Akses Aplikasi <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
