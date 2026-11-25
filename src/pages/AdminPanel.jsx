import React, { useState, useEffect } from 'react';
import {
  LayoutDashboard, Package, CreditCard, Users, MessageSquareQuote,
  HelpCircle, Settings, LogOut, Plus, Pencil, Trash2, CheckCircle2,
  XCircle, ExternalLink, Search, Loader2, Tag, Wallet, ArrowLeft, Eye
} from 'lucide-react';
import { gasRequest, formatRupiah, buildWaLink, bumpWriteEpoch } from '../api/gasClient';
import { THEMES } from '../themes';

export default function AdminPanel({ onBackToLanding, onLogout, onNotify, onBrandUpdated }) {
  const [tab, setTab] = useState('dashboard');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [data, setData] = useState({
    brand: {},
    produk: [],
    orders: [],
    leads: [],
    metode: [],
    kupon: [],
    testimoni: [],
    faq: []
  });

  // Filter states
  const [searchProduk, setSearchProduk] = useState('');
  const [filterOrderStatus, setFilterOrderStatus] = useState('ALL');

  // Modals / Forms state
  const [editingProduk, setEditingProduk] = useState(null);
  const [previewProofUrl, setPreviewProofUrl] = useState('');
  const [confirmDelete, setConfirmDelete] = useState(null); // { type, id, label }

  const [editingMetode, setEditingMetode] = useState(null);
  const [editingKupon, setEditingKupon] = useState(null);
  const [editingTesti, setEditingTesti] = useState(null);
  const [editingFaq, setEditingFaq] = useState(null);

  const [brandForm, setBrandForm] = useState({});
  const [newPassword, setNewPassword] = useState('');

  const fetchAdminData = async () => {
    setLoading(true);
    try {
      const res = await gasRequest('admin_boot', {}, {
        deduplicate: true,
        onSessionExpired: onLogout
      });
      if (res.ok && res.data) {
        setData(res.data);
        setBrandForm(res.data.brand || {});
      } else if (!res.sesiHabis) {
        onNotify(res.pesan || 'Gagal memuat data admin.', 'error');
      }
    } catch (err) {
      onNotify(err.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAdminData();
  }, []);

  // --- HANDLERS CRUD LOKAL + SERVER ---
  const handleSaveBrand = async (e) => {
    e.preventDefault();
    setSaving(true);
    bumpWriteEpoch();
    try {
      const res = await gasRequest('save_brand', brandForm, { onSessionExpired: onLogout });
      if (res.ok) {
        setData((prev) => ({ ...prev, brand: res.data }));
        if (onBrandUpdated) onBrandUpdated(res.data);
        onNotify('Pengaturan brand & tema berhasil disimpan!', 'success');
      } else {
        onNotify(res.pesan, 'error');
      }
    } catch (err) {
      onNotify(err.message, 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleSaveProduk = async (e) => {
    e.preventDefault();
    setSaving(true);
    bumpWriteEpoch();
    try {
      const res = await gasRequest('save_produk', editingProduk, { onSessionExpired: onLogout });
      if (res.ok) {
        const saved = res.data;
        setData((prev) => {
          const exists = prev.produk.some((p) => p.id_produk === saved.id_produk);
          const nextList = exists
            ? prev.produk.map((p) => (p.id_produk === saved.id_produk ? saved : p))
            : [...prev.produk, saved];
          return { ...prev, produk: nextList };
        });
        setEditingProduk(null);
        onNotify(res.pesan, 'success');
      } else {
        onNotify(res.pesan, 'error');
      }
    } catch (err) {
      onNotify(err.message, 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleVerifyOrder = async (order, statusBaru) => {
    const catatan = statusBaru === 'DITOLAK'
      ? 'Bukti transfer tidak sesuai / belum masuk. Silakan hubungi admin.'
      : 'Pembayaran terverifikasi lunas. Akses produk telah dibuka.';
    setSaving(true);
    bumpWriteEpoch();
    try {
      const res = await gasRequest('verify_order', {
        id_order: order.id_order,
        status_pembayaran: statusBaru,
        catatan_admin: catatan
      }, { onSessionExpired: onLogout });
      if (res.ok) {
        setData((prev) => ({
          ...prev,
          orders: prev.orders.map((o) =>
            o.id_order === order.id_order
              ? { ...o, status_pembayaran: statusBaru, catatan_admin: catatan, verified_at: res.data.verified_at }
              : o
          )
        }));
        onNotify(`Order ${order.id_order} diubah menjadi ${statusBaru}`, 'success');
      } else {
        onNotify(res.pesan, 'error');
      }
    } catch (err) {
      onNotify(err.message, 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleUpdateLead = async (lead, statusBaru) => {
    bumpWriteEpoch();
    try {
      const res = await gasRequest('update_lead', {
        id_lead: lead.id_lead,
        status_follow_up: statusBaru,
        catatan_admin: lead.catatan_admin || ''
      }, { onSessionExpired: onLogout });
      if (res.ok) {
        setData((prev) => ({
          ...prev,
          leads: prev.leads.map((l) => (l.id_lead === lead.id_lead ? { ...l, status_follow_up: statusBaru } : l))
        }));
        onNotify('Status lead diperbarui.', 'success');
      }
    } catch (err) {
      onNotify(err.message, 'error');
    }
  };

  const handleSaveMetode = async (e) => {
    e.preventDefault();
    setSaving(true);
    bumpWriteEpoch();
    try {
      const res = await gasRequest('save_metode', editingMetode, { onSessionExpired: onLogout });
      if (res.ok) {
        const saved = res.data;
        setData((prev) => {
          const exists = prev.metode.some((m) => m.id_metode === saved.id_metode);
          return {
            ...prev,
            metode: exists
              ? prev.metode.map((m) => (m.id_metode === saved.id_metode ? saved : m))
              : [...prev.metode, saved]
          };
        });
        setEditingMetode(null);
        onNotify('Metode pembayaran disimpan.', 'success');
      } else {
        onNotify(res.pesan, 'error');
      }
    } finally {
      setSaving(false);
    }
  };

  const handleSaveKupon = async (e) => {
    e.preventDefault();
    setSaving(true);
    bumpWriteEpoch();
    try {
      const res = await gasRequest('save_kupon', editingKupon, { onSessionExpired: onLogout });
      if (res.ok) {
        const saved = res.data;
        setData((prev) => {
          const exists = prev.kupon.some((k) => k.id_kupon === saved.id_kupon);
          return {
            ...prev,
            kupon: exists
              ? prev.kupon.map((k) => (k.id_kupon === saved.id_kupon ? saved : k))
              : [...prev.kupon, saved]
          };
        });
        setEditingKupon(null);
        onNotify('Kupon promo disimpan.', 'success');
      } else {
        onNotify(res.pesan, 'error');
      }
    } finally {
      setSaving(false);
    }
  };

  const handleSaveTesti = async (e) => {
    e.preventDefault();
    setSaving(true);
    bumpWriteEpoch();
    try {
      const res = await gasRequest('save_testimoni', editingTesti, { onSessionExpired: onLogout });
      if (res.ok) {
        const saved = res.data;
        setData((prev) => {
          const exists = prev.testimoni.some((t) => t.id_testimoni === saved.id_testimoni);
          return {
            ...prev,
            testimoni: exists
              ? prev.testimoni.map((t) => (t.id_testimoni === saved.id_testimoni ? saved : t))
              : [...prev.testimoni, saved]
          };
        });
        setEditingTesti(null);
        onNotify('Testimoni disimpan.', 'success');
      } else {
        onNotify(res.pesan, 'error');
      }
    } finally {
      setSaving(false);
    }
  };

  const handleSaveFaq = async (e) => {
    e.preventDefault();
    setSaving(true);
    bumpWriteEpoch();
    try {
      const res = await gasRequest('save_faq', editingFaq, { onSessionExpired: onLogout });
      if (res.ok) {
        const saved = res.data;
        setData((prev) => {
          const exists = prev.faq.some((f) => f.id_faq === saved.id_faq);
          return {
            ...prev,
            faq: exists
              ? prev.faq.map((f) => (f.id_faq === saved.id_faq ? saved : f))
              : [...prev.faq, saved]
          };
        });
        setEditingFaq(null);
        onNotify('FAQ disimpan.', 'success');
      } else {
        onNotify(res.pesan, 'error');
      }
    } finally {
      setSaving(false);
    }
  };

  const executeDelete = async () => {
    if (!confirmDelete) return;
    const { type, id } = confirmDelete;
    setSaving(true);
    bumpWriteEpoch();
    try {
      const mapAction = {
        produk: ['delete_produk', { id_produk: id }],
        order: ['delete_order', { id_order: id }],
        lead: ['delete_lead', { id_lead: id }],
        metode: ['delete_metode', { id_metode: id }],
        kupon: ['delete_kupon', { id_kupon: id }],
        testimoni: ['delete_testimoni', { id_testimoni: id }],
        faq: ['delete_faq', { id_faq: id }]
      };
      const [act, pay] = mapAction[type];
      const res = await gasRequest(act, pay, { onSessionExpired: onLogout });
      if (res.ok) {
        setData((prev) => ({
          ...prev,
          produk: type === 'produk' ? prev.produk.filter((x) => x.id_produk !== id) : prev.produk,
          orders: type === 'order' ? prev.orders.filter((x) => x.id_order !== id) : prev.orders,
          leads: type === 'lead' ? prev.leads.filter((x) => x.id_lead !== id) : prev.leads,
          metode: type === 'metode' ? prev.metode.filter((x) => x.id_metode !== id) : prev.metode,
          kupon: type === 'kupon' ? prev.kupon.filter((x) => x.id_kupon !== id) : prev.kupon,
          testimoni: type === 'testimoni' ? prev.testimoni.filter((x) => x.id_testimoni !== id) : prev.testimoni,
          faq: type === 'faq' ? prev.faq.filter((x) => x.id_faq !== id) : prev.faq
        }));
        onNotify('Data berhasil dihapus.', 'success');
      } else {
        onNotify(res.pesan, 'error');
      }
    } finally {
      setSaving(false);
      setConfirmDelete(null);
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    if (newPassword.length < 6) {
      onNotify('Password baru minimal 6 karakter.', 'error');
      return;
    }
    setSaving(true);
    try {
      const res = await gasRequest('change_password', { new_password: newPassword }, { onSessionExpired: onLogout });
      if (res.ok) {
        setNewPassword('');
        onNotify('Password admin berhasil diubah!', 'success');
      } else {
        onNotify(res.pesan, 'error');
      }
    } finally {
      setSaving(false);
    }
  };

  const pendingOrdersCount = data.orders.filter((o) => o.status_pembayaran === 'MENUNGGU_VERIFIKASI').length;
  const totalOmzetLunas = data.orders
    .filter((o) => o.status_pembayaran === 'LUNAS')
    .reduce((acc, cur) => acc + Number(cur.total_bayar || 0), 0);
  const newLeadsCount = data.leads.filter((l) => l.status_follow_up === 'BARU').length;

  const menuItems = [
    { id: 'dashboard', label: 'Ringkasan', icon: LayoutDashboard },
    { id: 'orders', label: 'Transaksi & Bukti', icon: CreditCard, badge: pendingOrdersCount },
    { id: 'produk', label: 'Katalog Produk', icon: Package },
    { id: 'leads', label: 'Leads & Custom', icon: Users, badge: newLeadsCount },
    { id: 'payment', label: 'Rekening & Kupon', icon: Wallet },
    { id: 'content', label: 'Testimoni & FAQ', icon: MessageSquareQuote },
    { id: 'settings', label: 'Brand & Tema', icon: Settings }
  ];

  return (
    <div className="min-h-screen bg-slate-100 text-slate-900 flex flex-col lg:flex-row">
      {/* Sidebar Desktop */}
      <aside className="lg:w-64 bg-slate-900 text-slate-100 flex flex-col shrink-0">
        <div className="p-4 border-b border-slate-800 flex items-center justify-between">
          <div>
            <div className="text-xs font-bold uppercase tracking-wider text-blue-400">Admin Panel</div>
            <div className="font-bold text-sm truncate max-w-[180px]">{data.brand?.nama_brand || 'AppShowcase'}</div>
          </div>
          <button
            onClick={onBackToLanding}
            className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs flex items-center gap-1"
            title="Lihat Landing Page"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex lg:flex-col gap-1 p-2.5 overflow-x-auto">
          {menuItems.map((m) => {
            const Icon = m.icon;
            const active = tab === m.id;
            return (
              <button
                key={m.id}
                onClick={() => setTab(m.id)}
                className={`flex items-center justify-between gap-2 px-3.5 py-2.5 rounded-xl text-xs sm:text-sm font-medium whitespace-nowrap transition ${
                  active ? 'bg-blue-600 text-white shadow' : 'text-slate-300 hover:bg-slate-800'
                }`}
              >
                <span className="flex items-center gap-2.5">
                  <Icon className="w-4 h-4 shrink-0" />
                  {m.label}
                </span>
                {m.badge > 0 && (
                  <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-amber-500 text-slate-950">
                    {m.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        <div className="mt-auto p-3 border-t border-slate-800 hidden lg:flex flex-col gap-2">
          <button
            onClick={onBackToLanding}
            className="w-full py-2 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-200 flex items-center justify-center gap-2"
          >
            <ExternalLink className="w-3.5 h-3.5" /> Lihat Web Publik
          </button>
          <button
            onClick={onLogout}
            className="w-full py-2 px-3 rounded-xl bg-rose-500/15 hover:bg-rose-500/25 text-rose-400 text-xs font-semibold flex items-center justify-center gap-2"
          >
            <LogOut className="w-3.5 h-3.5" /> Keluar Admin
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-24 gap-3 text-slate-500">
            <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
            <p className="text-sm font-medium">Memuat data panel admin...</p>
          </div>
        ) : (
          <>
            {/* TAB: DASHBOARD */}
            {tab === 'dashboard' && (
              <div className="space-y-6">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <h1 className="text-2xl font-extrabold">Ringkasan Performa</h1>
                    <p className="text-sm text-slate-500">Pantau penjualan aplikasi, verifikasi transfer, dan prospek masuk.</p>
                  </div>
                  <button
                    onClick={onLogout}
                    className="lg:hidden px-3 py-2 rounded-xl bg-rose-600 text-white text-xs font-semibold flex items-center gap-1.5"
                  >
                    <LogOut className="w-3.5 h-3.5" /> Keluar
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
                    <div className="text-xs font-semibold text-slate-500 uppercase">Total Omzet Lunas</div>
                    <div className="text-2xl font-extrabold text-emerald-600 mt-1">{formatRupiah(totalOmzetLunas)}</div>
                  </div>
                  <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
                    <div className="text-xs font-semibold text-slate-500 uppercase">Perlu Verifikasi Bayar</div>
                    <div className="text-2xl font-extrabold text-amber-600 mt-1">{pendingOrdersCount} Order</div>
                  </div>
                  <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
                    <div className="text-xs font-semibold text-slate-500 uppercase">Produk Aktif</div>
                    <div className="text-2xl font-extrabold text-blue-600 mt-1">
                      {data.produk.filter((p) => p.status === 'AKTIF').length} Aplikasi
                    </div>
                  </div>
                  <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
                    <div className="text-xs font-semibold text-slate-500 uppercase">Leads Baru</div>
                    <div className="text-2xl font-extrabold text-indigo-600 mt-1">{newLeadsCount} Pesan</div>
                  </div>
                </div>

                {/* Recent Orders */}
                <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="font-bold text-base">Transaksi Terbaru</h2>
                    <button onClick={() => setTab('orders')} className="text-xs font-semibold text-blue-600 hover:underline">
                      Kelola Semua →
                    </button>
                  </div>
                  {data.orders.length === 0 ? (
                    <p className="text-sm text-slate-500 py-6 text-center">Belum ada transaksi masuk.</p>
                  ) : (
                    <div className="space-y-2.5">
                      {data.orders.slice(0, 5).map((o) => (
                        <div key={o.id_order} className="p-3 rounded-xl bg-slate-50 border border-slate-200/80 flex flex-wrap items-center justify-between gap-2 text-xs sm:text-sm">
                          <div>
                            <span className="font-bold">{o.id_order}</span> — {o.nama_pembeli} ({o.nama_produk})
                          </div>
                          <div className="flex items-center gap-3">
                            <span className="font-bold">{formatRupiah(o.total_bayar)}</span>
                            <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold ${
                              o.status_pembayaran === 'LUNAS'
                                ? 'bg-emerald-100 text-emerald-700'
                                : o.status_pembayaran === 'MENUNGGU_VERIFIKASI'
                                ? 'bg-amber-100 text-amber-700'
                                : 'bg-slate-200 text-slate-700'
                            }`}>
                              {o.status_pembayaran}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* TAB: ORDERS & VERIFIKASI BUKTI TRANSFER */}
            {tab === 'orders' && (
              <div className="space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <h1 className="text-2xl font-extrabold">Transaksi & Verifikasi Transfer</h1>
                  <select
                    value={filterOrderStatus}
                    onChange={(e) => setFilterOrderStatus(e.target.value)}
                    className="px-3.5 py-2 rounded-xl border border-slate-300 bg-white text-xs sm:text-sm font-medium"
                  >
                    <option value="ALL">Semua Status</option>
                    <option value="MENUNGGU_VERIFIKASI">Menunggu Verifikasi</option>
                    <option value="MENUNGGU_TRANSFER">Menunggu Transfer</option>
                    <option value="LUNAS">Lunas</option>
                    <option value="DITOLAK">Ditolak</option>
                  </select>
                </div>

                <div className="space-y-3">
                  {data.orders
                    .filter((o) => filterOrderStatus === 'ALL' || o.status_pembayaran === filterOrderStatus)
                    .map((o) => {
                      const prod = data.produk.find((p) => p.id_produk === o.id_produk);
                      const waDeliver = buildWaLink(
                        o.nomor_wa,
                        `Halo Kak *${o.nama_pembeli}*, pembayaran untuk *${o.nama_produk}* (ID: *${o.id_order}*) telah kami verifikasi *LUNAS*.

Link Akses Produk:
${prod?.url_akses_produk || '(Cek di menu Cek Order pada website)'}

Terima kasih!`
                      );

                      return (
                        <div key={o.id_order} className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-sm space-y-3">
                          <div className="flex flex-wrap items-start justify-between gap-2">
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="font-extrabold text-sm">{o.id_order}</span>
                                <span className="text-xs text-slate-400">{o.tanggal_order}</span>
                              </div>
                              <div className="font-bold text-base mt-0.5">{o.nama_produk}</div>
                              <div className="text-xs text-slate-600">
                                Pembeli: <strong>{o.nama_pembeli}</strong> • WA: {o.nomor_wa}
                              </div>
                            </div>

                            <div className="text-right">
                              <div className="text-lg font-extrabold text-blue-600">{formatRupiah(o.total_bayar)}</div>
                              <span className={`inline-block mt-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold ${
                                o.status_pembayaran === 'LUNAS'
                                  ? 'bg-emerald-100 text-emerald-700'
                                  : o.status_pembayaran === 'MENUNGGU_VERIFIKASI'
                                  ? 'bg-amber-100 text-amber-700'
                                  : o.status_pembayaran === 'DITOLAK'
                                  ? 'bg-rose-100 text-rose-700'
                                  : 'bg-slate-100 text-slate-600'
                              }`}>
                                {o.status_pembayaran}
                              </span>
                            </div>
                          </div>

                          <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-slate-100">
                            {o.url_bukti_transfer ? (
                              <button
                                onClick={() => setPreviewProofUrl(o.url_bukti_transfer)}
                                className="px-3 py-1.5 rounded-lg bg-blue-50 text-blue-700 hover:bg-blue-100 text-xs font-semibold flex items-center gap-1.5"
                              >
                                <Eye className="w-3.5 h-3.5" /> Lihat Bukti Transfer
                              </button>
                            ) : (
                              <span className="text-xs text-slate-400 italic">Belum upload bukti</span>
                            )}

                            {o.status_pembayaran !== 'LUNAS' && (
                              <button
                                disabled={saving}
                                onClick={() => handleVerifyOrder(o, 'LUNAS')}
                                className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold flex items-center gap-1"
                              >
                                <CheckCircle2 className="w-3.5 h-3.5" /> Setujui (Lunas)
                              </button>
                            )}

                            {o.status_pembayaran !== 'DITOLAK' && (
                              <button
                                disabled={saving}
                                onClick={() => handleVerifyOrder(o, 'DITOLAK')}
                                className="px-3 py-1.5 rounded-lg bg-rose-50 text-rose-600 hover:bg-rose-100 text-xs font-semibold flex items-center gap-1"
                              >
                                <XCircle className="w-3.5 h-3.5" /> Tolak
                              </button>
                            )}

                            <a
                              href={waDeliver}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="px-3 py-1.5 rounded-lg bg-slate-900 text-white hover:bg-slate-800 text-xs font-semibold ml-auto"
                            >
                              Kirim Akses via WA
                            </a>

                            <button
                              onClick={() => setConfirmDelete({ type: 'order', id: o.id_order, label: o.id_order })}
                              className="p-1.5 rounded-lg text-rose-500 hover:bg-rose-50"
                              title="Hapus Order"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      );
                    })}
                </div>
              </div>
            )}

            {/* TAB: KATALOG PRODUK */}
            {tab === 'produk' && (
              <div className="space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <h1 className="text-2xl font-extrabold">Katalog Produk & Live Demo</h1>
                  <button
                    onClick={() =>
                      setEditingProduk({
                        nama_produk: '',
                        kategori: 'Web App',
                        deskripsi_singkat: '',
                        deskripsi_lengkap: '',
                        fitur_unggulan: '',
                        teknologi: 'Google Sheets, React, Tailwind CSS',
                        harga_normal: 0,
                        harga_promo: 499000,
                        satuan_harga: 'Sekali Bayar',
                        url_thumbnail: '',
                        tipe_demo: 'IFRAME_LIVE',
                        url_live_demo: '',
                        info_akun_demo: '',
                        badge_label: '',
                        urutan: data.produk.length + 1,
                        status: 'AKTIF',
                        url_akses_produk: '',
                        catatan_instalasi: ''
                      })
                    }
                    className="px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs sm:text-sm font-semibold flex items-center gap-1.5 shadow"
                  >
                    <Plus className="w-4 h-4" /> Tambah Produk
                  </button>
                </div>

                <div className="relative max-w-md">
                  <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    value={searchProduk}
                    onChange={(e) => setSearchProduk(e.target.value)}
                    placeholder="Cari nama aplikasi..."
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-300 bg-white text-sm"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {data.produk
                    .filter((p) => p.nama_produk.toLowerCase().includes(searchProduk.toLowerCase()))
                    .map((p) => (
                      <div key={p.id_produk} className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between gap-3">
                        <div className="flex gap-3">
                          <img
                            src={p.url_thumbnail || 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&w=400&q=80'}
                            alt={p.nama_produk}
                            className="w-20 h-20 rounded-xl object-cover shrink-0 bg-slate-100"
                          />
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2">
                              <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${p.status === 'AKTIF' ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-200 text-slate-600'}`}>
                                {p.status}
                              </span>
                              <span className="text-xs text-slate-400">{p.kategori}</span>
                            </div>
                            <h3 className="font-bold text-sm sm:text-base truncate mt-0.5">{p.nama_produk}</h3>
                            <div className="text-sm font-extrabold text-blue-600">{formatRupiah(p.harga_promo)}</div>
                            <div className="text-[11px] text-slate-400 mt-0.5">
                              {p.jumlah_dilihat || 0} dilihat • {p.jumlah_demo || 0} klik demo
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                          <button
                            onClick={() => setEditingProduk({ ...p })}
                            className="px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-xs font-semibold flex items-center gap-1"
                          >
                            <Pencil className="w-3.5 h-3.5" /> Edit
                          </button>
                          <button
                            onClick={() => setConfirmDelete({ type: 'produk', id: p.id_produk, label: p.nama_produk })}
                            className="px-3 py-1.5 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-600 text-xs font-semibold flex items-center gap-1"
                          >
                            <Trash2 className="w-3.5 h-3.5" /> Hapus
                          </button>
                        </div>
                      </div>
                    ))}
                </div>
              </div>
            )}

            {/* TAB: LEADS & CUSTOM */}
            {tab === 'leads' && (
              <div className="space-y-4">
                <h1 className="text-2xl font-extrabold">Leads & Permintaan Custom</h1>
                <div className="space-y-3">
                  {data.leads.length === 0 ? (
                    <div className="bg-white p-8 rounded-2xl text-center text-sm text-slate-500">Belum ada pesan masuk.</div>
                  ) : (
                    data.leads.map((l) => (
                      <div key={l.id_lead} className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm space-y-2">
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <div>
                            <span className="font-bold text-sm">{l.nama_pengirim}</span>
                            <span className="text-xs text-slate-500 ml-2">({l.nomor_wa}) • {l.jenis_kebutuhan}</span>
                          </div>
                          <select
                            value={l.status_follow_up}
                            onChange={(e) => handleUpdateLead(l, e.target.value)}
                            className="px-2.5 py-1 rounded-lg border border-slate-300 text-xs font-semibold"
                          >
                            <option value="BARU">BARU</option>
                            <option value="DIHUBUNGI">DIHUBUNGI</option>
                            <option value="DEAL">DEAL</option>
                            <option value="BATAL">BATAL</option>
                          </select>
                        </div>
                        <p className="text-xs sm:text-sm text-slate-700 bg-slate-50 p-3 rounded-xl">{l.pesan}</p>
                        <div className="flex items-center justify-between pt-1">
                          <a
                            href={buildWaLink(l.nomor_wa, `Halo Kak ${l.nama_pengirim}, menindaklanjuti permintaan Anda mengenai *${l.nama_produk}*...`)}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="px-3 py-1.5 rounded-lg bg-emerald-600 text-white text-xs font-semibold"
                          >
                            Balas via WhatsApp
                          </a>
                          <button
                            onClick={() => setConfirmDelete({ type: 'lead', id: l.id_lead, label: l.nama_pengirim })}
                            className="text-rose-500 text-xs hover:underline"
                          >
                            Hapus
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}

            {/* TAB: REKENING & KUPON */}
            {tab === 'payment' && (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Rekening / Metode Bayar */}
                <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-4">
                  <div className="flex items-center justify-between">
                    <h2 className="font-bold text-base">Rekening & E-Wallet</h2>
                    <button
                      onClick={() => setEditingMetode({ jenis: 'BANK', nama_provider: '', nomor_rekening: '', atas_nama: '', url_qris: '', status: 'AKTIF' })}
                      className="px-3 py-1.5 rounded-lg bg-blue-600 text-white text-xs font-semibold flex items-center gap-1"
                    >
                      <Plus className="w-3.5 h-3.5" /> Tambah
                    </button>
                  </div>
                  <div className="space-y-2.5">
                    {data.metode.map((m) => (
                      <div key={m.id_metode} className="p-3 rounded-xl border border-slate-200 flex items-center justify-between text-xs sm:text-sm">
                        <div>
                          <div className="font-bold">{m.nama_provider} ({m.jenis})</div>
                          <div className="font-mono text-slate-600">{m.nomor_rekening} — {m.atas_nama}</div>
                        </div>
                        <div className="flex gap-1">
                          <button onClick={() => setEditingMetode({ ...m })} className="p-1.5 text-slate-600 hover:bg-slate-100 rounded">
                            <Pencil className="w-4 h-4" />
                          </button>
                          <button onClick={() => setConfirmDelete({ type: 'metode', id: m.id_metode, label: m.nama_provider })} className="p-1.5 text-rose-500 hover:bg-rose-50 rounded">
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Kupon Promo */}
                <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-4">
                  <div className="flex items-center justify-between">
                    <h2 className="font-bold text-base">Kode Kupon Diskon</h2>
                    <button
                      onClick={() => setEditingKupon({ kode_kupon: '', tipe_diskon: 'NOMINAL', nilai_diskon: 50000, kuota: 50, status: 'AKTIF' })}
                      className="px-3 py-1.5 rounded-lg bg-blue-600 text-white text-xs font-semibold flex items-center gap-1"
                    >
                      <Tag className="w-3.5 h-3.5" /> Buat Kupon
                    </button>
                  </div>
                  <div className="space-y-2.5">
                    {data.kupon.map((k) => (
                      <div key={k.id_kupon} className="p-3 rounded-xl border border-slate-200 flex items-center justify-between text-xs sm:text-sm">
                        <div>
                          <div className="font-extrabold text-blue-600">{k.kode_kupon}</div>
                          <div className="text-slate-600">
                            Potongan: {k.tipe_diskon === 'PERSEN' ? `${k.nilai_diskon}%` : formatRupiah(k.nilai_diskon)} • Terpakai: {k.terpakai}/{k.kuota || '∞'}
                          </div>
                        </div>
                        <div className="flex gap-1">
                          <button onClick={() => setEditingKupon({ ...k })} className="p-1.5 text-slate-600 hover:bg-slate-100 rounded">
                            <Pencil className="w-4 h-4" />
                          </button>
                          <button onClick={() => setConfirmDelete({ type: 'kupon', id: k.id_kupon, label: k.kode_kupon })} className="p-1.5 text-rose-500 hover:bg-rose-50 rounded">
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* TAB: TESTIMONI & FAQ */}
            {tab === 'content' && (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-4">
                  <div className="flex items-center justify-between">
                    <h2 className="font-bold text-base">Testimoni Klien</h2>
                    <button
                      onClick={() => setEditingTesti({ nama_klien: '', jabatan_usaha: '', produk_terkait: '', rating: 5, isi_testimoni: '', status: 'TAMPIL' })}
                      className="px-3 py-1.5 rounded-lg bg-blue-600 text-white text-xs font-semibold flex items-center gap-1"
                    >
                      <Plus className="w-3.5 h-3.5" /> Tambah
                    </button>
                  </div>
                  <div className="space-y-2.5">
                    {data.testimoni.map((t) => (
                      <div key={t.id_testimoni} className="p-3 rounded-xl border border-slate-200 text-xs space-y-1">
                        <div className="flex justify-between font-bold">
                          <span>{t.nama_klien} ({t.jabatan_usaha})</span>
                          <div className="flex gap-1">
                            <button onClick={() => setEditingTesti({ ...t })} className="text-blue-600">Edit</button>
                            <span>•</span>
                            <button onClick={() => setConfirmDelete({ type: 'testimoni', id: t.id_testimoni, label: t.nama_klien })} className="text-rose-500">Hapus</button>
                          </div>
                        </div>
                        <p className="text-slate-600">"{t.isi_testimoni}"</p>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-4">
                  <div className="flex items-center justify-between">
                    <h2 className="font-bold text-base">Daftar FAQ</h2>
                    <button
                      onClick={() => setEditingFaq({ pertanyaan: '', jawaban: '', urutan: data.faq.length + 1, status: 'AKTIF' })}
                      className="px-3 py-1.5 rounded-lg bg-blue-600 text-white text-xs font-semibold flex items-center gap-1"
                    >
                      <Plus className="w-3.5 h-3.5" /> Tambah
                    </button>
                  </div>
                  <div className="space-y-2.5">
                    {data.faq.map((f) => (
                      <div key={f.id_faq} className="p-3 rounded-xl border border-slate-200 text-xs space-y-1">
                        <div className="flex justify-between font-bold gap-2">
                          <span>{f.pertanyaan}</span>
                          <div className="flex gap-1 shrink-0">
                            <button onClick={() => setEditingFaq({ ...f })} className="text-blue-600">Edit</button>
                            <span>•</span>
                            <button onClick={() => setConfirmDelete({ type: 'faq', id: f.id_faq, label: f.id_faq })} className="text-rose-500">Hapus</button>
                          </div>
                        </div>
                        <p className="text-slate-600">{f.jawaban}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* TAB: PENGATURAN BRAND & TEMA WARNA */}
            {tab === 'settings' && (
              <div className="space-y-6 max-w-4xl">
                <form onSubmit={handleSaveBrand} className="bg-white p-5 sm:p-6 rounded-2xl border border-slate-200 shadow-sm space-y-5">
                  <h2 className="text-lg font-extrabold">Identitas Brand, Hero & Tema Warna</h2>

                  {/* Theme Switcher Cards */}
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
                      Pilih Palet Tema Warna Landing Page
                    </label>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                      {Object.values(THEMES).map((th) => {
                        const selected = (brandForm.tema_warna || 'ROYAL_BLUE') === th.id;
                        return (
                          <button
                            type="button"
                            key={th.id}
                            onClick={() => setBrandForm({ ...brandForm, tema_warna: th.id })}
                            className={`p-3 rounded-xl border text-left transition ${
                              selected ? 'border-blue-600 ring-2 ring-blue-600/20 bg-blue-50/50' : 'border-slate-200 hover:border-slate-300'
                            }`}
                          >
                            <div className="font-bold text-xs">{th.name}</div>
                            <div className="text-[11px] text-slate-500 mt-1 leading-snug">{th.desc}</div>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold mb-1">Nama Brand / Studio</label>
                      <input
                        type="text"
                        value={brandForm.nama_brand || ''}
                        onChange={(e) => setBrandForm({ ...brandForm, nama_brand: e.target.value })}
                        className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold mb-1">Nomor WhatsApp Admin (628...)</label>
                      <input
                        type="text"
                        value={brandForm.nomor_wa || ''}
                        onChange={(e) => setBrandForm({ ...brandForm, nomor_wa: e.target.value })}
                        className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-sm"
                      />
                    </div>
                    <div className="sm:col-span-2">
                      <label className="block text-xs font-semibold mb-1">Judul Utama Hero (Headline)</label>
                      <input
                        type="text"
                        value={brandForm.hero_judul || ''}
                        onChange={(e) => setBrandForm({ ...brandForm, hero_judul: e.target.value })}
                        className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-sm"
                      />
                    </div>
                    <div className="sm:col-span-2">
                      <label className="block text-xs font-semibold mb-1">Subjudul Hero</label>
                      <textarea
                        rows={2}
                        value={brandForm.hero_subjudul || ''}
                        onChange={(e) => setBrandForm({ ...brandForm, hero_subjudul: e.target.value })}
                        className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold mb-1">Badge Hero</label>
                      <input
                        type="text"
                        value={brandForm.hero_badge || ''}
                        onChange={(e) => setBrandForm({ ...brandForm, hero_badge: e.target.value })}
                        className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold mb-1">Kode Unik Transfer Otomatis</label>
                      <select
                        value={brandForm.kode_unik_aktif || 'YA'}
                        onChange={(e) => setBrandForm({ ...brandForm, kode_unik_aktif: e.target.value })}
                        className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-sm"
                      >
                        <option value="YA">Aktif (Tambah 3 Digit Kode Unik)</option>
                        <option value="TIDAK">Nonaktif (Nominal Pas)</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-semibold mb-1">Statistik Klien</label>
                      <input
                        type="text"
                        value={brandForm.stat_klien || ''}
                        onChange={(e) => setBrandForm({ ...brandForm, stat_klien: e.target.value })}
                        className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold mb-1">Statistik Aplikasi</label>
                      <input
                        type="text"
                        value={brandForm.stat_aplikasi || ''}
                        onChange={(e) => setBrandForm({ ...brandForm, stat_aplikasi: e.target.value })}
                        className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-sm"
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={saving}
                    className="px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold shadow disabled:opacity-50"
                  >
                    {saving ? 'Menyimpan...' : 'Simpan Pengaturan'}
                  </button>
                </form>

                {/* Ganti Password Admin */}
                <form onSubmit={handleChangePassword} className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-wrap items-end gap-3">
                  <div className="flex-1 min-w-[220px]">
                    <label className="block text-xs font-bold mb-1">Ganti Password Admin Baru</label>
                    <input
                      type="password"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="Minimal 6 karakter"
                      className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-sm"
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={saving}
                    className="px-5 py-2 rounded-xl bg-slate-900 text-white text-sm font-semibold"
                  >
                    Perbarui Password
                  </button>
                </form>
              </div>
            )}
          </>
        )}
      </main>

      {/* MODAL: FORM PRODUK */}
      {editingProduk && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 flex items-center justify-center p-3 overflow-y-auto">
          <form onSubmit={handleSaveProduk} className="bg-white rounded-2xl max-w-2xl w-full p-5 sm:p-6 space-y-4 my-auto max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center border-b pb-3">
              <h3 className="font-bold text-lg">{editingProduk.id_produk ? 'Edit Produk' : 'Tambah Produk Baru'}</h3>
              <button type="button" onClick={() => setEditingProduk(null)}><XCircle className="w-5 h-5 text-slate-400" /></button>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs sm:text-sm">
              <div className="sm:col-span-2">
                <label className="font-semibold block mb-1">Nama Aplikasi / Produk *</label>
                <input required type="text" value={editingProduk.nama_produk} onChange={(e) => setEditingProduk({ ...editingProduk, nama_produk: e.target.value })} className="w-full px-3 py-2 border rounded-xl" />
              </div>
              <div>
                <label className="font-semibold block mb-1">Kategori</label>
                <input type="text" value={editingProduk.kategori} onChange={(e) => setEditingProduk({ ...editingProduk, kategori: e.target.value })} className="w-full px-3 py-2 border rounded-xl" />
              </div>
              <div>
                <label className="font-semibold block mb-1">Badge Sorotan (Terlaris/Baru)</label>
                <input type="text" value={editingProduk.badge_label || ''} onChange={(e) => setEditingProduk({ ...editingProduk, badge_label: e.target.value })} className="w-full px-3 py-2 border rounded-xl" />
              </div>
              <div>
                <label className="font-semibold block mb-1">Harga Coret (Normal)</label>
                <input type="number" value={editingProduk.harga_normal} onChange={(e) => setEditingProduk({ ...editingProduk, harga_normal: e.target.value })} className="w-full px-3 py-2 border rounded-xl" />
              </div>
              <div>
                <label className="font-semibold block mb-1">Harga Jual Utama (Promo)</label>
                <input type="number" value={editingProduk.harga_promo} onChange={(e) => setEditingProduk({ ...editingProduk, harga_promo: e.target.value })} className="w-full px-3 py-2 border rounded-xl" />
              </div>
              <div className="sm:col-span-2">
                <label className="font-semibold block mb-1">URL Gambar Thumbnail</label>
                <input type="url" value={editingProduk.url_thumbnail || ''} onChange={(e) => setEditingProduk({ ...editingProduk, url_thumbnail: e.target.value })} className="w-full px-3 py-2 border rounded-xl" />
              </div>
              <div>
                <label className="font-semibold block mb-1">Mode Live Demo</label>
                <select value={editingProduk.tipe_demo} onChange={(e) => setEditingProduk({ ...editingProduk, tipe_demo: e.target.value })} className="w-full px-3 py-2 border rounded-xl">
                  <option value="IFRAME_LIVE">Embed Langsung (Iframe Studio)</option>
                  <option value="EXTERNAL_LINK">Buka Tab Baru (External Link)</option>
                  <option value="NONE">Tanpa Demo</option>
                </select>
              </div>
              <div>
                <label className="font-semibold block mb-1">Status Tayang</label>
                <select value={editingProduk.status} onChange={(e) => setEditingProduk({ ...editingProduk, status: e.target.value })} className="w-full px-3 py-2 border rounded-xl">
                  <option value="AKTIF">AKTIF (Tampil)</option>
                  <option value="DRAFT">DRAFT (Sembunyi)</option>
                </select>
              </div>
              <div className="sm:col-span-2">
                <label className="font-semibold block mb-1">URL Live Demo Aplikasi</label>
                <input type="url" value={editingProduk.url_live_demo || ''} onChange={(e) => setEditingProduk({ ...editingProduk, url_live_demo: e.target.value })} placeholder="https://..." className="w-full px-3 py-2 border rounded-xl" />
              </div>
              <div className="sm:col-span-2">
                <label className="font-semibold block mb-1">Info Akun Demo (Ditampilkan di Bar Demo)</label>
                <input type="text" value={editingProduk.info_akun_demo || ''} onChange={(e) => setEditingProduk({ ...editingProduk, info_akun_demo: e.target.value })} placeholder="User: admin | Pass: 123456" className="w-full px-3 py-2 border rounded-xl" />
              </div>
              <div className="sm:col-span-2">
                <label className="font-semibold block mb-1">Deskripsi Singkat</label>
                <textarea rows={2} value={editingProduk.deskripsi_singkat || ''} onChange={(e) => setEditingProduk({ ...editingProduk, deskripsi_singkat: e.target.value })} className="w-full px-3 py-2 border rounded-xl" />
              </div>
              <div className="sm:col-span-2">
                <label className="font-semibold block mb-1">Fitur Unggulan (Pisahkan tiap fitur dengan baris baru / Enter)</label>
                <textarea rows={3} value={editingProduk.fitur_unggulan || ''} onChange={(e) => setEditingProduk({ ...editingProduk, fitur_unggulan: e.target.value })} className="w-full px-3 py-2 border rounded-xl" />
              </div>
              <div className="sm:col-span-2 p-3 rounded-xl bg-emerald-50 border border-emerald-200">
                <label className="font-bold text-emerald-800 block mb-1">Link Akses Produk / Download (Rahasia — Terbuka Setelah Pembeli Lunas)</label>
                <input type="url" value={editingProduk.url_akses_produk || ''} onChange={(e) => setEditingProduk({ ...editingProduk, url_akses_produk: e.target.value })} placeholder="https://drive.google.com/..." className="w-full px-3 py-2 border rounded-xl bg-white" />
              </div>
            </div>
            <div className="flex justify-end gap-2 pt-3 border-t">
              <button type="button" onClick={() => setEditingProduk(null)} className="px-4 py-2 rounded-xl border text-sm">Batal</button>
              <button type="submit" disabled={saving} className="px-5 py-2 rounded-xl bg-blue-600 text-white text-sm font-semibold">
                {saving ? 'Menyimpan...' : 'Simpan Produk'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* MODAL: PREVIEW BUKTI TRANSFER */}
      {previewProofUrl && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 flex items-center justify-center p-4" onClick={() => setPreviewProofUrl('')}>
          <div className="bg-white rounded-2xl max-w-lg w-full p-4 space-y-3" onClick={(e) => e.stopPropagation()}>
            <div className="flex justify-between items-center">
              <h4 className="font-bold text-sm">Bukti Transfer Pembeli</h4>
              <a href={previewProofUrl} target="_blank" rel="noopener noreferrer" className="text-xs text-blue-600 font-semibold flex items-center gap-1">
                Buka Asli <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </div>
            <img src={previewProofUrl} alt="Bukti Transfer" className="w-full max-h-[65vh] object-contain rounded-xl bg-slate-100" />
            <button onClick={() => setPreviewProofUrl('')} className="w-full py-2 rounded-xl bg-slate-900 text-white text-xs font-semibold">
              Tutup Pratinjau
            </button>
          </div>
        </div>
      )}

      {/* MODAL: METODE PEMBAYARAN */}
      {editingMetode && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 flex items-center justify-center p-4">
          <form onSubmit={handleSaveMetode} className="bg-white rounded-2xl max-w-md w-full p-5 space-y-3 text-sm">
            <h3 className="font-bold text-base">Form Metode Pembayaran</h3>
            <select value={editingMetode.jenis} onChange={(e) => setEditingMetode({ ...editingMetode, jenis: e.target.value })} className="w-full px-3 py-2 border rounded-xl">
              <option value="BANK">Transfer Bank</option>
              <option value="EWALLET">E-Wallet</option>
              <option value="QRIS">QRIS</option>
            </select>
            <input required placeholder="Nama Bank / Provider (Misal: Bank BCA)" value={editingMetode.nama_provider} onChange={(e) => setEditingMetode({ ...editingMetode, nama_provider: e.target.value })} className="w-full px-3 py-2 border rounded-xl" />
            <input required placeholder="Nomor Rekening / No HP" value={editingMetode.nomor_rekening} onChange={(e) => setEditingMetode({ ...editingMetode, nomor_rekening: e.target.value })} className="w-full px-3 py-2 border rounded-xl" />
            <input required placeholder="Atas Nama Pemilik" value={editingMetode.atas_nama} onChange={(e) => setEditingMetode({ ...editingMetode, atas_nama: e.target.value })} className="w-full px-3 py-2 border rounded-xl" />
            <input placeholder="URL Gambar QRIS (Opsional)" value={editingMetode.url_qris || ''} onChange={(e) => setEditingMetode({ ...editingMetode, url_qris: e.target.value })} className="w-full px-3 py-2 border rounded-xl" />
            <div className="flex justify-end gap-2 pt-2">
              <button type="button" onClick={() => setEditingMetode(null)} className="px-4 py-2 border rounded-xl">Batal</button>
              <button type="submit" disabled={saving} className="px-4 py-2 bg-blue-600 text-white rounded-xl font-semibold">Simpan</button>
            </div>
          </form>
        </div>
      )}

      {/* MODAL: KUPON PROMO */}
      {editingKupon && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 flex items-center justify-center p-4">
          <form onSubmit={handleSaveKupon} className="bg-white rounded-2xl max-w-md w-full p-5 space-y-3 text-sm">
            <h3 className="font-bold text-base">Form Kupon Diskon</h3>
            <input required placeholder="Kode Kupon (Misal: HEMAT50)" value={editingKupon.kode_kupon} onChange={(e) => setEditingKupon({ ...editingKupon, kode_kupon: e.target.value.toUpperCase() })} className="w-full px-3 py-2 border rounded-xl uppercase" />
            <select value={editingKupon.tipe_diskon} onChange={(e) => setEditingKupon({ ...editingKupon, tipe_diskon: e.target.value })} className="w-full px-3 py-2 border rounded-xl">
              <option value="NOMINAL">Potongan Nominal (Rp)</option>
              <option value="PERSEN">Potongan Persen (%)</option>
            </select>
            <input required type="number" placeholder="Nilai Diskon" value={editingKupon.nilai_diskon} onChange={(e) => setEditingKupon({ ...editingKupon, nilai_diskon: e.target.value })} className="w-full px-3 py-2 border rounded-xl" />
            <input type="number" placeholder="Kuota Pemakaian (0 = Tanpa Batas)" value={editingKupon.kuota} onChange={(e) => setEditingKupon({ ...editingKupon, kuota: e.target.value })} className="w-full px-3 py-2 border rounded-xl" />
            <div className="flex justify-end gap-2 pt-2">
              <button type="button" onClick={() => setEditingKupon(null)} className="px-4 py-2 border rounded-xl">Batal</button>
              <button type="submit" disabled={saving} className="px-4 py-2 bg-blue-600 text-white rounded-xl font-semibold">Simpan</button>
            </div>
          </form>
        </div>
      )}

      {/* MODAL: TESTIMONI */}
      {editingTesti && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 flex items-center justify-center p-4">
          <form onSubmit={handleSaveTesti} className="bg-white rounded-2xl max-w-md w-full p-5 space-y-3 text-sm">
            <h3 className="font-bold text-base">Form Testimoni</h3>
            <input required placeholder="Nama Klien" value={editingTesti.nama_klien} onChange={(e) => setEditingTesti({ ...editingTesti, nama_klien: e.target.value })} className="w-full px-3 py-2 border rounded-xl" />
            <input placeholder="Jabatan / Nama Usaha" value={editingTesti.jabatan_usaha || ''} onChange={(e) => setEditingTesti({ ...editingTesti, jabatan_usaha: e.target.value })} className="w-full px-3 py-2 border rounded-xl" />
            <input placeholder="Produk yang Digunakan" value={editingTesti.produk_terkait || ''} onChange={(e) => setEditingTesti({ ...editingTesti, produk_terkait: e.target.value })} className="w-full px-3 py-2 border rounded-xl" />
            <textarea required rows={3} placeholder="Isi ulasan klien..." value={editingTesti.isi_testimoni} onChange={(e) => setEditingTesti({ ...editingTesti, isi_testimoni: e.target.value })} className="w-full px-3 py-2 border rounded-xl" />
            <div className="flex justify-end gap-2 pt-2">
              <button type="button" onClick={() => setEditingTesti(null)} className="px-4 py-2 border rounded-xl">Batal</button>
              <button type="submit" disabled={saving} className="px-4 py-2 bg-blue-600 text-white rounded-xl font-semibold">Simpan</button>
            </div>
          </form>
        </div>
      )}

      {/* MODAL: FAQ */}
      {editingFaq && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 flex items-center justify-center p-4">
          <form onSubmit={handleSaveFaq} className="bg-white rounded-2xl max-w-md w-full p-5 space-y-3 text-sm">
            <h3 className="font-bold text-base">Form FAQ</h3>
            <input required placeholder="Pertanyaan" value={editingFaq.pertanyaan} onChange={(e) => setEditingFaq({ ...editingFaq, pertanyaan: e.target.value })} className="w-full px-3 py-2 border rounded-xl" />
            <textarea required rows={3} placeholder="Jawaban lengkap" value={editingFaq.jawaban} onChange={(e) => setEditingFaq({ ...editingFaq, jawaban: e.target.value })} className="w-full px-3 py-2 border rounded-xl" />
            <div className="flex justify-end gap-2 pt-2">
              <button type="button" onClick={() => setEditingFaq(null)} className="px-4 py-2 border rounded-xl">Batal</button>
              <button type="submit" disabled={saving} className="px-4 py-2 bg-blue-600 text-white rounded-xl font-semibold">Simpan</button>
            </div>
          </form>
        </div>
      )}

      {/* MODAL KONFIRMASI HAPUS (TANPA window.confirm BROWSER) */}
      {confirmDelete && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-sm w-full p-5 space-y-4 text-center">
            <h4 className="font-bold text-base">Konfirmasi Hapus Data</h4>
            <p className="text-xs sm:text-sm text-slate-600">
              Apakah Anda yakin ingin menghapus <strong>{confirmDelete.label}</strong>? Tindakan ini tidak dapat dibatalkan.
            </p>
            <div className="flex gap-2">
              <button onClick={() => setConfirmDelete(null)} className="flex-1 py-2 rounded-xl border text-xs font-semibold">Batal</button>
              <button onClick={executeDelete} disabled={saving} className="flex-1 py-2 rounded-xl bg-rose-600 text-white text-xs font-semibold">
                {saving ? 'Menghapus...' : 'Ya, Hapus'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
