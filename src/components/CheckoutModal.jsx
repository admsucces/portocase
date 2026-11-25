import React, { useState } from 'react';
import {
  X, CheckCircle2, Tag, Copy, Check, UploadCloud,
  CreditCard, MessageCircle, ArrowRight, FileCheck, Loader2, Shield
} from 'lucide-react';
import { gasRequest, formatRupiah, buildWaLink } from '../api/gasClient';

export default function CheckoutModal({ product, brand, metodeList, theme, onClose, onNotify }) {
  const [step, setStep] = useState(1); // 1: Form & Kupon, 2: Transfer & Upload Bukti, 3: Selesai
  const [nama, setNama] = useState('');
  const [wa, setWa] = useState('');
  const [email, setEmail] = useState('');
  const [idMetode, setIdMetode] = useState(metodeList?.[0]?.id_metode || '');
  const [kodeKupon, setKodeKupon] = useState('');
  const [kuponInfo, setKuponInfo] = useState(null);
  const [loadingKupon, setLoadingKupon] = useState(false);

  const [submitting, setSubmitting] = useState(false);
  const [orderResult, setOrderResult] = useState(null);
  const [copiedKey, setCopiedKey] = useState('');

  // Upload bukti state
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewImg, setPreviewImg] = useState('');
  const [uploading, setUploading] = useState(false);

  if (!product) return null;

  const hargaAwal = Number(product.harga_promo || 0);
  const diskon = kuponInfo ? Number(kuponInfo.nominal_diskon || 0) : 0;
  const estimasiSubtotal = Math.max(0, hargaAwal - diskon);

  const handleApplyCoupon = async () => {
    if (!kodeKupon.trim()) return;
    setLoadingKupon(true);
    try {
      const res = await gasRequest('validate_coupon', {
        kode_kupon: kodeKupon.trim(),
        harga: hargaAwal
      });
      if (res.ok) {
        setKuponInfo(res.data);
        onNotify(res.pesan || 'Kupon berhasil diterapkan!', 'success');
      } else {
        setKuponInfo(null);
        onNotify(res.pesan || 'Kupon tidak valid.', 'error');
      }
    } catch (err) {
      onNotify(err.message, 'error');
    } finally {
      setLoadingKupon(false);
    }
  };

  const handleCreateOrder = async (e) => {
    e.preventDefault();
    if (!nama.trim() || !wa.trim()) {
      onNotify('Nama dan nomor WhatsApp wajib diisi.', 'error');
      return;
    }
    if (!idMetode) {
      onNotify('Pilih metode pembayaran terlebih dahulu.', 'error');
      return;
    }

    setSubmitting(true);
    try {
      const res = await gasRequest('create_order', {
        nama_pembeli: nama.trim(),
        nomor_wa: wa.trim(),
        email_pembeli: email.trim(),
        id_produk: product.id_produk,
        id_metode_bayar: idMetode,
        kode_kupon: kuponInfo ? kuponInfo.kode_kupon : ''
      });
      if (res.ok) {
        setOrderResult(res.data);
        setStep(2);
        onNotify('Tagihan dibuat! Silakan lakukan transfer & unggah bukti.', 'success');
      } else {
        onNotify(res.pesan || 'Gagal membuat pesanan.', 'error');
      }
    } catch (err) {
      onNotify(err.message, 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 3.5 * 1024 * 1024) {
      onNotify('Ukuran file maksimal 3.5 MB.', 'error');
      return;
    }
    setSelectedFile(file);
    if (file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = () => setPreviewImg(reader.result);
      reader.readAsDataURL(file);
    } else {
      setPreviewImg('');
    }
  };

  const handleUploadProof = async () => {
    if (!selectedFile || !orderResult) {
      onNotify('Pilih file gambar/PDF bukti transfer terlebih dahulu.', 'error');
      return;
    }
    setUploading(true);
    try {
      const base64Data = await new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result);
        reader.onerror = reject;
        reader.readAsDataURL(selectedFile);
      });

      const res = await gasRequest('upload_proof', {
        id_order: orderResult.id_order,
        base64_data: base64Data,
        file_name: selectedFile.name,
        mime_type: selectedFile.type
      });

      if (res.ok) {
        setStep(3);
        onNotify('Bukti transfer berhasil dikirim!', 'success');
      } else {
        onNotify(res.pesan || 'Gagal mengunggah bukti.', 'error');
      }
    } catch (err) {
      onNotify(err.message, 'error');
    } finally {
      setUploading(false);
    }
  };

  const copyText = (key, text) => {
    navigator.clipboard.writeText(String(text));
    setCopiedKey(key);
    onNotify('Disalin ke clipboard!', 'success');
    setTimeout(() => setCopiedKey(''), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/75 backdrop-blur-sm overflow-y-auto">
      <div
        className={`w-full max-w-xl rounded-2xl border overflow-hidden shadow-2xl my-auto ${
          theme.isDark ? 'bg-slate-900 border-slate-800 text-slate-100' : 'bg-white border-slate-200 text-slate-900'
        }`}
      >
        {/* Header */}
        <div className={`px-5 py-4 border-b flex items-center justify-between ${theme.isDark ? 'border-slate-800' : 'border-slate-100'}`}>
          <div>
            <span className={`text-xs font-semibold uppercase tracking-wider ${theme.accentText}`}>
              Checkout Pembelian Produk
            </span>
            <h3 className="font-bold text-base sm:text-lg line-clamp-1">{product.nama_produk}</h3>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-slate-500/10 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Stepper Indicator */}
        <div className={`px-5 py-3 text-xs font-medium flex items-center justify-between border-b ${theme.isDark ? 'bg-slate-950/50 border-slate-800' : 'bg-slate-50 border-slate-100'}`}>
          <div className={`flex items-center gap-1.5 ${step >= 1 ? theme.accentText + ' font-bold' : theme.subText}`}>
            <span className="w-5 h-5 rounded-full border flex items-center justify-center text-[11px]">1</span>
            <span>Data & Metode</span>
          </div>
          <div className="h-px flex-1 mx-2 bg-slate-300/40" />
          <div className={`flex items-center gap-1.5 ${step >= 2 ? theme.accentText + ' font-bold' : theme.subText}`}>
            <span className="w-5 h-5 rounded-full border flex items-center justify-center text-[11px]">2</span>
            <span>Transfer & Bukti</span>
          </div>
          <div className="h-px flex-1 mx-2 bg-slate-300/40" />
          <div className={`flex items-center gap-1.5 ${step >= 3 ? 'text-emerald-500 font-bold' : theme.subText}`}>
            <span className="w-5 h-5 rounded-full border flex items-center justify-center text-[11px]">3</span>
            <span>Selesai</span>
          </div>
        </div>

        <div className="p-5 max-h-[80vh] overflow-y-auto">
          {/* STEP 1 */}
          {step === 1 && (
            <form onSubmit={handleCreateOrder} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold mb-1">Nama Lengkap *</label>
                  <input
                    type="text"
                    required
                    value={nama}
                    onChange={(e) => setNama(e.target.value)}
                    placeholder="Contoh: Budi Santoso"
                    className={`w-full px-3.5 py-2.5 rounded-xl border text-sm outline-none focus:ring-2 ${theme.inputBg}`}
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold mb-1">Nomor WhatsApp *</label>
                  <input
                    type="tel"
                    required
                    value={wa}
                    onChange={(e) => setWa(e.target.value)}
                    placeholder="081234567890"
                    className={`w-full px-3.5 py-2.5 rounded-xl border text-sm outline-none focus:ring-2 ${theme.inputBg}`}
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold mb-1">Email (Opsional)</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="nama@email.com"
                  className={`w-full px-3.5 py-2.5 rounded-xl border text-sm outline-none focus:ring-2 ${theme.inputBg}`}
                />
              </div>

              {/* Metode Pembayaran */}
              <div>
                <label className="block text-xs font-semibold mb-1.5">Pilih Metode Transfer *</label>
                {metodeList && metodeList.length > 0 ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    {metodeList.map((m) => {
                      const active = idMetode === m.id_metode;
                      return (
                        <button
                          type="button"
                          key={m.id_metode}
                          onClick={() => setIdMetode(m.id_metode)}
                          className={`p-3 rounded-xl border text-left transition flex items-start gap-2.5 ${
                            active
                              ? 'border-blue-600 ring-2 ring-blue-600/20 bg-blue-600/5'
                              : theme.isDark
                              ? 'border-slate-800 hover:border-slate-700'
                              : 'border-slate-200 hover:border-slate-300'
                          }`}
                        >
                          <CreditCard className={`w-4 h-4 mt-0.5 shrink-0 ${active ? 'text-blue-500' : theme.subText}`} />
                          <div className="min-w-0">
                            <div className="text-xs font-bold truncate">{m.nama_provider}</div>
                            <div className={`text-[11px] truncate ${theme.subText}`}>{m.atas_nama}</div>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                ) : (
                  <p className="text-xs text-amber-500">Belum ada metode pembayaran aktif. Silakan hubungi admin via WA.</p>
                )}
              </div>

              {/* Kode Kupon */}
              <div>
                <label className="block text-xs font-semibold mb-1">Punya Kode Kupon Promo?</label>
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <Tag className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      type="text"
                      value={kodeKupon}
                      onChange={(e) => setKodeKupon(e.target.value.toUpperCase())}
                      placeholder="Masukkan kode kupon"
                      className={`w-full pl-9 pr-3 py-2 rounded-xl border text-sm uppercase outline-none focus:ring-2 ${theme.inputBg}`}
                    />
                  </div>
                  <button
                    type="button"
                    onClick={handleApplyCoupon}
                    disabled={loadingKupon || !kodeKupon.trim()}
                    className="px-4 py-2 rounded-xl border border-slate-300/60 text-xs font-semibold hover:bg-slate-500/10 disabled:opacity-50 transition"
                  >
                    {loadingKupon ? 'Cek...' : 'Terapkan'}
                  </button>
                </div>
                {kuponInfo && (
                  <p className="text-xs text-emerald-500 mt-1 font-medium">
                    Kupon {kuponInfo.kode_kupon} aktif: Hemat {formatRupiah(kuponInfo.nominal_diskon)}
                  </p>
                )}
              </div>

              {/* Ringkasan Harga */}
              <div className={`p-4 rounded-xl border space-y-1.5 text-sm ${theme.isDark ? 'bg-slate-950/60 border-slate-800' : 'bg-slate-50 border-slate-200'}`}>
                <div className="flex justify-between">
                  <span className={theme.subText}>Harga Produk</span>
                  <span className="font-medium">{formatRupiah(hargaAwal)}</span>
                </div>
                {diskon > 0 && (
                  <div className="flex justify-between text-emerald-500">
                    <span>Diskon Kupon</span>
                    <span>- {formatRupiah(diskon)}</span>
                  </div>
                )}
                <div className="flex justify-between text-xs">
                  <span className={theme.subText}>Kode Unik Verifikasi</span>
                  <span className={theme.subText}>Otomatis di langkah berikutnya</span>
                </div>
                <div className="pt-2 border-t border-slate-300/30 flex justify-between font-bold text-base">
                  <span>Estimasi Total</span>
                  <span className={theme.accentText}>{formatRupiah(estimasiSubtotal)}</span>
                </div>
              </div>

              <button
                type="submit"
                disabled={submitting || !metodeList?.length}
                className={`w-full py-3 rounded-xl font-semibold text-sm flex items-center justify-center gap-2 shadow-lg transition disabled:opacity-50 ${theme.primaryBtn}`}
              >
                {submitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" /> Memproses Tagihan...
                  </>
                ) : (
                  <>
                    Lanjut ke Pembayaran <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>
          )}

          {/* STEP 2: Instruksi Transfer & Upload Bukti */}
          {step === 2 && orderResult && (
            <div className="space-y-4">
              <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/30 text-center">
                <div className="text-xs font-semibold uppercase tracking-wide text-amber-500 mb-1">
                  ID Pesanan: {orderResult.id_order} (Simpan ID Ini)
                </div>
                <div className="text-xs text-slate-400 mb-1">Transfer Tepat Hingga 3 Digit Terakhir:</div>
                <div className="flex items-center justify-center gap-2">
                  <span className="text-2xl sm:text-3xl font-extrabold tracking-tight text-amber-500">
                    {formatRupiah(orderResult.total_bayar)}
                  </span>
                  <button
                    type="button"
                    onClick={() => copyText('nominal', orderResult.total_bayar)}
                    className="p-1.5 rounded-lg bg-amber-500/20 text-amber-500 hover:bg-amber-500/30"
                    title="Salin Nominal"
                  >
                    {copiedKey === 'nominal' ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Detail Rekening */}
              <div className={`p-4 rounded-xl border space-y-2 ${theme.isDark ? 'bg-slate-950/60 border-slate-800' : 'bg-slate-50 border-slate-200'}`}>
                <div className="text-xs font-semibold uppercase text-slate-400">Rekening Tujuan Transfer</div>
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-bold text-sm">{orderResult.metode.nama_provider}</div>
                    <div className="font-mono text-base font-bold">{orderResult.metode.nomor_rekening}</div>
                    <div className={`text-xs ${theme.subText}`}>a.n. {orderResult.metode.atas_nama}</div>
                  </div>
                  <button
                    type="button"
                    onClick={() => copyText('rek', orderResult.metode.nomor_rekening)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold border flex items-center gap-1.5 ${theme.primarySoft}`}
                  >
                    {copiedKey === 'rek' ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                    Salin Rek
                  </button>
                </div>
                {orderResult.metode.url_qris && (
                  <div className="pt-2 text-center">
                    <img
                      src={orderResult.metode.url_qris}
                      alt="QRIS Pembayaran"
                      className="w-44 h-44 object-contain mx-auto rounded-lg border bg-white p-2"
                    />
                  </div>
                )}
              </div>

              {/* Upload Bukti Transfer */}
              <div>
                <label className="block text-xs font-bold mb-1.5">
                  Unggah Bukti Transfer (Screenshot / Struk / PDF) *
                </label>
                <label
                  className={`flex flex-col items-center justify-center p-5 border-2 border-dashed rounded-xl cursor-pointer transition ${
                    theme.isDark
                      ? 'border-slate-700 hover:border-blue-500 bg-slate-950/40'
                      : 'border-slate-300 hover:border-blue-600 bg-slate-50/70'
                  }`}
                >
                  <input
                    type="file"
                    accept="image/*,application/pdf"
                    onChange={handleFileChange}
                    className="hidden"
                  />
                  {previewImg ? (
                    <img src={previewImg} alt="Preview Bukti" className="max-h-40 rounded-lg mb-2 object-contain" />
                  ) : (
                    <UploadCloud className="w-8 h-8 text-blue-500 mb-2" />
                  )}
                  <span className="text-xs font-semibold text-center">
                    {selectedFile ? selectedFile.name : 'Klik untuk pilih gambar bukti transfer (Maks 3.5 MB)'}
                  </span>
                </label>
              </div>

              <div className="flex flex-col sm:flex-row gap-2.5">
                <button
                  type="button"
                  onClick={handleUploadProof}
                  disabled={uploading || !selectedFile}
                  className={`flex-1 py-3 rounded-xl font-semibold text-sm flex items-center justify-center gap-2 shadow-lg disabled:opacity-50 transition ${theme.primaryBtn}`}
                >
                  {uploading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" /> Mengunggah Bukti...
                    </>
                  ) : (
                    <>
                      <FileCheck className="w-4 h-4" /> Kirim Bukti Pembayaran
                    </>
                  )}
                </button>
                <a
                  href={buildWaLink(
                    brand?.nomor_wa,
                    `Halo Admin, saya sudah order *${orderResult.nama_produk}* (ID: *${orderResult.id_order}*) sebesar *${formatRupiah(orderResult.total_bayar)}*. Mohon dibantu verifikasi.`
                  )}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-4 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold flex items-center justify-center gap-1.5 transition"
                >
                  <MessageCircle className="w-4 h-4" /> Chat WA
                </a>
              </div>
            </div>
          )}

          {/* STEP 3: Konfirmasi Selesai */}
          {step === 3 && orderResult && (
            <div className="text-center py-4 space-y-4">
              <div className="w-16 h-16 rounded-full bg-emerald-500/15 text-emerald-500 flex items-center justify-center mx-auto">
                <CheckCircle2 className="w-10 h-10" />
              </div>
              <div>
                <h4 className="text-xl font-bold mb-1">Bukti Transfer Diterima!</h4>
                <p className={`text-sm ${theme.mutedText}`}>
                  Pesanan <strong>{orderResult.id_order}</strong> sedang diverifikasi oleh admin. Setelah berstatus <strong>LUNAS</strong>, link akses aplikasi akan otomatis terbuka di menu <strong>Cek Order</strong>.
                </p>
              </div>
              <div className={`p-3.5 rounded-xl border text-xs flex items-center justify-center gap-2 ${theme.primarySoft}`}>
                <Shield className="w-4 h-4 shrink-0" />
                <span>Catat ID Order Anda: <strong>{orderResult.id_order}</strong></span>
              </div>
              <div className="flex flex-col sm:flex-row gap-2.5 pt-2">
                <a
                  href={buildWaLink(
                    brand?.nomor_wa,
                    `Halo Admin, saya sudah upload bukti transfer untuk ID Order *${orderResult.id_order}* (${orderResult.nama_produk}). Mohon dicek ya.`
                  )}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1 py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-sm flex items-center justify-center gap-2 transition"
                >
                  <MessageCircle className="w-4 h-4" /> Percepat Verifikasi via WA
                </a>
                <button
                  type="button"
                  onClick={onClose}
                  className="py-2.5 px-5 rounded-xl border border-slate-300/60 text-sm font-semibold hover:bg-slate-500/10 transition"
                >
                  Tutup
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
