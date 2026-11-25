import React, { useState, useEffect, useMemo } from 'react';
import {
  Play, ShoppingCart, Search, Sparkles, CheckCircle2, Star,
  ChevronDown, MessageCircle, Lock, ArrowRight, ShieldCheck,
  Calculator, Send, Loader2, Layers, Menu, X, Eye
} from 'lucide-react';
import { gasRequest, formatRupiah, buildWaLink, getToken, setToken } from './api/gasClient';
import { getTheme } from './themes';
import LiveDemoModal from './components/LiveDemoModal';
import CheckoutModal from './components/CheckoutModal';
import OrderTrackerModal from './components/OrderTrackerModal';
import ProductDetailModal from './components/ProductDetailModal';
import AdminPanel from './pages/AdminPanel';

export default function App() {
  const [view, setView] = useState('landing'); // 'landing' | 'admin-login' | 'admin-panel'
  const [loadingBoot, setLoadingBoot] = useState(true);
  const [bootError, setBootError] = useState('');

  const [bootData, setBootData] = useState({
    brand: {
      nama_brand: 'Nusantara Digital Studio',
      tagline: 'Solusi Aplikasi Siap Pakai & Custom',
      hero_badge: 'Katalog Aplikasi & SaaS 2026',
      hero_judul: 'Bangun & Kelola Bisnis Lebih Cepat dengan Aplikasi Siap Pakai',
      hero_subjudul: 'Uji coba langsung seluruh fitur melalui Live Demo interaktif sebelum membeli.',
      nomor_wa: '6281234567890',
      stat_klien: '240+',
      stat_aplikasi: '18+',
      stat_kepuasan: '99.4%',
      tema_warna: 'ROYAL_BLUE'
    },
    produk: [],
    testimoni: [],
    faq: [],
    metode_pembayaran: []
  });

  // UI & Filter States
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState('Semua');
  const [searchQuery, setSearchQuery] = useState('');
  const [openFaqId, setOpenFaqId] = useState(null);

  // Active Modals
  const [demoProduct, setDemoProduct] = useState(null);
  const [detailProduct, setDetailProduct] = useState(null);
  const [checkoutProduct, setCheckoutProduct] = useState(null);
  const [trackerOpen, setTrackerOpen] = useState(false);

  // Custom App Estimator & Inquiry Form
  const [estPlatform, setEstPlatform] = useState('Web App (Google Sheets / Cloud)');
  const [estModul, setEstModul] = useState(4);
  const [estUrgency, setEstUrgency] = useState('normal');
  const [inqNama, setInqNama] = useState('');
  const [inqWa, setInqWa] = useState('');
  const [inqPesan, setInqPesan] = useState('');
  const [sendingInq, setSendingInq] = useState(false);

  // Admin Login Form
  const [loginUser, setLoginUser] = useState('');
  const [loginPass, setLoginPass] = useState('');
  const [loggingIn, setLoggingIn] = useState(false);

  // Toast Notification
  const [toast, setToast] = useState(null);
  const notify = (msg, type = 'info') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3500);
  };

  const loadBootstrap = async () => {
    setLoadingBoot(true);
    setBootError('');
    try {
      const res = await gasRequest('boot', {}, { deduplicate: true });
      if (res.ok && res.data) {
        setBootData(res.data);
      } else {
        setBootError(res.pesan || 'Gagal memuat katalog.');
      }
    } catch (err) {
      setBootError(err.message);
    } finally {
      setLoadingBoot(false);
    }
  };

  useEffect(() => {
    loadBootstrap();
  }, []);

  const theme = useMemo(() => getTheme(bootData.brand?.tema_warna), [bootData.brand?.tema_warna]);

  const categories = useMemo(() => {
    const cats = new Set(['Semua']);
    (bootData.produk || []).forEach((p) => {
      if (p.kategori) cats.add(p.kategori);
    });
    return Array.from(cats);
  }, [bootData.produk]);

  const filteredProducts = useMemo(() => {
    return (bootData.produk || []).filter((p) => {
      const matchCat = selectedCategory === 'Semua' || p.kategori === selectedCategory;
      const q = searchQuery.toLowerCase().trim();
      const matchSearch =
        !q ||
        p.nama_produk.toLowerCase().includes(q) ||
        (p.deskripsi_singkat || '').toLowerCase().includes(q) ||
        (p.teknologi || '').toLowerCase().includes(q);
      return matchCat && matchSearch;
    });
  }, [bootData.produk, selectedCategory, searchQuery]);

  // Kalkulator Estimasi Custom
  const estimasiBiaya = useMemo(() => {
    const base = estPlatform.includes('Mobile') ? 2500000 : 1200000;
    const perModul = Number(estModul || 1) * 350000;
    const mult = estUrgency === 'express' ? 1.25 : 1;
    return Math.round((base + perModul) * mult);
  }, [estPlatform, estModul, estUrgency]);

  const handleOpenDemo = (product) => {
    setDemoProduct(product);
    gasRequest('track_metric', { id_produk: product.id_produk, metric: 'demo' }).catch(() => {});
  };

  const handleOpenDetail = (product) => {
    setDetailProduct(product);
    gasRequest('track_metric', { id_produk: product.id_produk, metric: 'view' }).catch(() => {});
  };

  const handleSendCustomInquiry = async (e) => {
    e.preventDefault();
    if (!inqNama.trim() || !inqWa.trim()) {
      notify('Nama dan nomor WhatsApp wajib diisi.', 'error');
      return;
    }
    setSendingInq(true);
    const fullMessage = `[Estimasi Custom: ${estPlatform}, ${estModul} Modul, Estimasi ${formatRupiah(estimasiBiaya)}] — ${inqPesan}`;
    try {
      const res = await gasRequest('submit_inquiry', {
        nama_pengirim: inqNama.trim(),
        nomor_wa: inqWa.trim(),
        jenis_kebutuhan: 'Request Custom',
        nama_produk: estPlatform,
        pesan: fullMessage
      });
      if (res.ok) {
        notify('Permintaan penawaran terkirim! Tim kami segera menghubungi Anda.', 'success');
        setInqNama('');
        setInqWa('');
        setInqPesan('');
      } else {
        notify(res.pesan, 'error');
      }
    } catch (err) {
      notify(err.message, 'error');
    } finally {
      setSendingInq(false);
    }
  };

  const handleAdminAccessClick = () => {
    if (getToken()) {
      setView('admin-panel');
    } else {
      setView('admin-login');
    }
  };

  const handleAdminLogin = async (e) => {
    e.preventDefault();
    setLoggingIn(true);
    try {
      const res = await gasRequest('admin_login', { username: loginUser, password: loginPass });
      if (res.ok && res.data?.token) {
        setToken(res.data.token);
        setLoginPass('');
        setView('admin-panel');
        notify('Selamat datang kembali, Admin!', 'success');
      } else {
        notify(res.pesan || 'Login gagal.', 'error');
      }
    } catch (err) {
      notify(err.message, 'error');
    } finally {
      setLoggingIn(false);
    }
  };

  const handleAdminLogout = () => {
    gasRequest('admin_logout').catch(() => {});
    setToken('');
    setView('landing');
    loadBootstrap();
    notify('Anda telah keluar dari panel admin.', 'info');
  };

  // VIEW: ADMIN PANEL
  if (view === 'admin-panel') {
    return (
      <>
        <AdminPanel
          onBackToLanding={() => {
            setView('landing');
            loadBootstrap();
          }}
          onLogout={handleAdminLogout}
          onNotify={notify}
          onBrandUpdated={(updatedBrand) =>
            setBootData((prev) => ({ ...prev, brand: updatedBrand }))
          }
        />
        {toast && <ToastBanner toast={toast} />}
      </>
    );
  }

  // VIEW: ADMIN LOGIN
  if (view === 'admin-login') {
    return (
      <div className="min-h-screen bg-slate-950 text-white flex items-center justify-center p-4">
        <div className="w-full max-w-sm bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-2xl space-y-5">
          <div className="text-center space-y-1">
            <div className="w-12 h-12 rounded-2xl bg-blue-600/20 border border-blue-500/30 text-blue-400 flex items-center justify-center mx-auto mb-3">
              <Lock className="w-6 h-6" />
            </div>
            <h2 className="text-xl font-extrabold">Login Administrator</h2>
            <p className="text-xs text-slate-400">Kelola produk, live demo, dan verifikasi pembayaran</p>
          </div>

          <form onSubmit={handleAdminLogin} className="space-y-3.5">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Username</label>
              <input
                type="text"
                required
                value={loginUser}
                onChange={(e) => setLoginUser(e.target.value)}
                placeholder="admin"
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-sm outline-none focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Password</label>
              <input
                type="password"
                required
                value={loginPass}
                onChange={(e) => setLoginPass(e.target.value)}
                placeholder="••••••••"
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-sm outline-none focus:border-blue-500"
              />
            </div>
            <button
              type="submit"
              disabled={loggingIn}
              className="w-full py-3 rounded-xl bg-blue-600 hover:bg-blue-500 font-semibold text-sm flex items-center justify-center gap-2 transition disabled:opacity-50"
            >
              {loggingIn ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Masuk ke Panel Admin'}
            </button>
          </form>

          <button
            onClick={() => setView('landing')}
            className="w-full text-center text-xs text-slate-400 hover:text-white transition"
          >
            ← Kembali ke Halaman Utama
          </button>
        </div>
        {toast && <ToastBanner toast={toast} />}
      </div>
    );
  }

  // VIEW: LANDING PAGE PUBLIK
  const brand = bootData.brand || {};

  return (
    <div className={`min-h-screen transition-colors duration-300 ${theme.pageBg}`}>
      {/* STICKY GLASS NAVBAR */}
      <header className={`sticky top-0 z-40 backdrop-blur-md border-b ${theme.navBg}`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
          <a href="#top" className="flex items-center gap-2.5 min-w-0">
            {brand.url_logo ? (
              <img src={brand.url_logo} alt="Logo" className="w-9 h-9 rounded-xl object-cover" />
            ) : (
              <div className={`w-9 h-9 rounded-xl flex items-center justify-center font-extrabold text-sm shadow ${theme.primaryBtn}`}>
                {(brand.nama_brand || 'AS').slice(0, 2).toUpperCase()}
              </div>
            )}
            <div className="min-w-0">
              <div className="font-extrabold text-sm sm:text-base truncate">{brand.nama_brand}</div>
              <div className={`text-[11px] truncate hidden sm:block ${theme.subText}`}>{brand.tagline}</div>
            </div>
          </a>

          {/* Desktop Nav */}
          <nav className="hidden md:flex items-center gap-6 text-sm font-medium">
            <a href="#katalog" className="hover:opacity-75 transition">Katalog Aplikasi</a>
            <a href="#custom" className="hover:opacity-75 transition">Estimasi Custom</a>
            <a href="#testimoni" className="hover:opacity-75 transition">Testimoni</a>
            <a href="#faq" className="hover:opacity-75 transition">FAQ</a>
          </nav>

          {/* Right Actions */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setTrackerOpen(true)}
              className={`px-3 py-2 rounded-xl border text-xs font-semibold flex items-center gap-1.5 transition ${theme.primarySoft}`}
            >
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Cek Order</span>
            </button>

            <a
              href={buildWaLink(brand.nomor_wa, brand.pesan_wa_default)}
              target="_blank"
              rel="noopener noreferrer"
              className="hidden sm:inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold shadow-sm transition"
            >
              <MessageCircle className="w-3.5 h-3.5" /> Konsultasi
            </a>

            <button
              onClick={handleAdminAccessClick}
              className="p-2 rounded-xl hover:bg-slate-500/10 opacity-60 hover:opacity-100 transition"
              title="Panel Admin"
            >
              <Lock className="w-4 h-4" />
            </button>

            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 rounded-xl hover:bg-slate-500/10"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Mobile Dropdown Menu */}
        {mobileMenuOpen && (
          <div className={`md:hidden px-4 pb-4 pt-2 border-b space-y-2 text-sm font-medium ${theme.navBg}`}>
            <a href="#katalog" onClick={() => setMobileMenuOpen(false)} className="block py-1.5">Katalog Aplikasi</a>
            <a href="#custom" onClick={() => setMobileMenuOpen(false)} className="block py-1.5">Estimasi Custom</a>
            <a href="#testimoni" onClick={() => setMobileMenuOpen(false)} className="block py-1.5">Testimoni</a>
            <a href="#faq" onClick={() => setMobileMenuOpen(false)} className="block py-1.5">FAQ</a>
          </div>
        )}
      </header>

      {/* HERO SECTION */}
      <section id="top" className="relative overflow-hidden pt-12 pb-16 sm:pt-20 sm:pb-24">
        <div className={`absolute inset-0 bg-gradient-to-b ${theme.heroGlow} pointer-events-none`} />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 relative text-center max-w-4xl">
          {brand.hero_badge && (
            <div className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full border text-xs font-semibold mb-6 ${theme.primarySoft}`}>
              <Sparkles className="w-3.5 h-3.5" />
              <span>{brand.hero_badge}</span>
            </div>
          )}

          <h1 className="text-3xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight leading-[1.15] mb-5">
            {brand.hero_judul}
          </h1>

          <p className={`text-base sm:text-lg max-w-2xl mx-auto leading-relaxed mb-8 ${theme.mutedText}`}>
            {brand.hero_subjudul}
          </p>

          <div className="flex flex-wrap items-center justify-center gap-3 sm:gap-4 mb-12">
            <a
              href="#katalog"
              className={`px-6 py-3.5 rounded-2xl font-bold text-sm sm:text-base flex items-center gap-2 shadow-xl transition ${theme.primaryBtn}`}
            >
              Jelajahi Katalog Aplikasi <ArrowRight className="w-4 h-4" />
            </a>
            {bootData.produk?.[0] && (
              <button
                onClick={() => handleOpenDemo(bootData.produk[0])}
                className={`px-6 py-3.5 rounded-2xl font-bold text-sm sm:text-base border flex items-center gap-2 transition ${
                  theme.isDark ? 'border-slate-700 hover:bg-slate-800' : 'border-slate-300 bg-white hover:bg-slate-50'
                }`}
              >
                <Play className="w-4 h-4 fill-current" /> Coba Live Demo
              </button>
            )}
          </div>

          {/* Social Proof Metrics */}
          <div className="grid grid-cols-3 gap-3 sm:gap-6 max-w-2xl mx-auto">
            <div className={`p-4 rounded-2xl border ${theme.cardBg}`}>
              <div className={`text-xl sm:text-3xl font-extrabold ${theme.accentText}`}>{brand.stat_klien || '200+'}</div>
              <div className={`text-xs mt-0.5 ${theme.subText}`}>Klien & Bisnis</div>
            </div>
            <div className={`p-4 rounded-2xl border ${theme.cardBg}`}>
              <div className={`text-xl sm:text-3xl font-extrabold ${theme.accentText}`}>{brand.stat_aplikasi || '15+'}</div>
              <div className={`text-xs mt-0.5 ${theme.subText}`}>Produk Siap Pakai</div>
            </div>
            <div className={`p-4 rounded-2xl border ${theme.cardBg}`}>
              <div className={`text-xl sm:text-3xl font-extrabold ${theme.accentText}`}>{brand.stat_kepuasan || '99%'}</div>
              <div className={`text-xs mt-0.5 ${theme.subText}`}>Kepuasan Pengguna</div>
            </div>
          </div>
        </div>
      </section>

      {/* KATALOG PRODUK & LIVE DEMO */}
      <section id="katalog" className="py-14 sm:py-20 max-w-7xl mx-auto px-4 sm:px-6">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
          <div>
            <span className={`text-xs font-bold uppercase tracking-wider ${theme.accentText}`}>
              Etalase Produk Digital
            </span>
            <h2 className="text-2xl sm:text-3xl font-extrabold mt-1">Pilih Aplikasi & Uji Live Demo</h2>
          </div>

          {/* Search Input */}
          <div className="relative w-full md:w-80">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Cari nama aplikasi atau teknologi..."
              className={`w-full pl-10 pr-4 py-2.5 rounded-xl border text-sm outline-none focus:ring-2 ${theme.inputBg}`}
            />
          </div>
        </div>

        {/* Category Filter Tabs */}
        <div className="flex items-center gap-2 overflow-x-auto pb-4 mb-6">
          {categories.map((cat) => {
            const active = selectedCategory === cat;
            return (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold whitespace-nowrap transition ${
                  active
                    ? theme.primaryBtn
                    : theme.isDark
                    ? 'bg-slate-900 text-slate-300 border border-slate-800 hover:border-slate-700'
                    : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100'
                }`}
              >
                {cat}
              </button>
            );
          })}
        </div>

        {/* Loading Skeleton / Error / Product Grid */}
        {loadingBoot ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map((n) => (
              <div key={n} className={`rounded-2xl border p-4 space-y-4 animate-pulse ${theme.cardBg}`}>
                <div className="h-48 rounded-xl bg-slate-400/20" />
                <div className="h-5 w-3/4 rounded bg-slate-400/20" />
                <div className="h-12 rounded bg-slate-400/20" />
                <div className="h-10 rounded-xl bg-slate-400/20" />
              </div>
            ))}
          </div>
        ) : bootError ? (
          <div className="p-8 rounded-2xl border border-rose-500/30 bg-rose-500/10 text-center space-y-3">
            <p className="text-sm font-semibold text-rose-500">{bootError}</p>
            <button onClick={loadBootstrap} className="px-4 py-2 rounded-xl bg-rose-600 text-white text-xs font-semibold">
              Muat Ulang Data
            </button>
          </div>
        ) : filteredProducts.length === 0 ? (
          <div className={`p-12 rounded-2xl border text-center space-y-2 ${theme.cardBg}`}>
            <Layers className="w-10 h-10 mx-auto text-slate-400" />
            <h3 className="font-bold text-base">Aplikasi Tidak Ditemukan</h3>
            <p className={`text-xs ${theme.subText}`}>Coba ubah kata kunci pencarian atau pilih kategori "Semua".</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredProducts.map((item) => {
              const techs = String(item.teknologi || '')
                .split(',')
                .map((s) => s.trim())
                .filter(Boolean)
                .slice(0, 3);

              return (
                <article
                  key={item.id_produk}
                  className={`group rounded-2xl border overflow-hidden flex flex-col transition-all duration-300 ${theme.cardBg}`}
                >
                  {/* Thumbnail 16:9 */}
                  <div className="relative aspect-video bg-slate-800 overflow-hidden">
                    <img
                      src={item.url_thumbnail || 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&w=900&q=80'}
                      alt={item.nama_produk}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                    <div className="absolute top-3 left-3 flex items-center gap-1.5">
                      <span className="px-2.5 py-1 rounded-lg text-[11px] font-bold bg-slate-950/75 text-white backdrop-blur-sm">
                        {item.kategori}
                      </span>
                      {item.badge_label && (
                        <span className={`px-2.5 py-1 rounded-lg text-[11px] font-extrabold shadow ${theme.badgeBg}`}>
                          {item.badge_label}
                        </span>
                      )}
                    </div>

                    {item.tipe_demo !== 'NONE' && item.url_live_demo && (
                      <button
                        onClick={() => handleOpenDemo(item)}
                        className="absolute bottom-3 right-3 px-3 py-1.5 rounded-xl bg-slate-950/85 hover:bg-blue-600 text-white text-xs font-bold flex items-center gap-1.5 backdrop-blur-sm transition shadow-lg"
                      >
                        <Play className="w-3.5 h-3.5 fill-current" /> Live Demo
                      </button>
                    )}
                  </div>

                  {/* Body */}
                  <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
                    <div>
                      <div className="flex flex-wrap gap-1.5 mb-2.5">
                        {techs.map((t, idx) => (
                          <span key={idx} className={`px-2 py-0.5 rounded-md text-[10px] font-semibold border ${theme.primarySoft}`}>
                            {t}
                          </span>
                        ))}
                      </div>

                      <h3
                        onClick={() => handleOpenDetail(item)}
                        className="font-extrabold text-lg leading-snug cursor-pointer hover:opacity-80 transition"
                      >
                        {item.nama_produk}
                      </h3>
                      <p className={`text-xs sm:text-sm mt-1.5 line-clamp-2 leading-relaxed ${theme.mutedText}`}>
                        {item.deskripsi_singkat}
                      </p>
                    </div>

                    <div className="pt-3 border-t border-slate-300/20 space-y-3">
                      <div className="flex items-end justify-between">
                        <div>
                          {Number(item.harga_normal) > Number(item.harga_promo) && (
                            <div className="text-xs line-through text-slate-400">
                              {formatRupiah(item.harga_normal)}
                            </div>
                          )}
                          <div className={`text-xl font-extrabold ${theme.accentText}`}>
                            {formatRupiah(item.harga_promo)}
                          </div>
                        </div>
                        <span className={`text-[11px] flex items-center gap-1 ${theme.subText}`}>
                          <Eye className="w-3.5 h-3.5" /> {item.jumlah_dilihat || 0}
                        </span>
                      </div>

                      <div className="grid grid-cols-2 gap-2">
                        <button
                          onClick={() => handleOpenDetail(item)}
                          className={`py-2.5 px-3 rounded-xl border text-xs font-bold transition ${
                            theme.isDark ? 'border-slate-700 hover:bg-slate-800' : 'border-slate-300 hover:bg-slate-100'
                          }`}
                        >
                          Detail Fitur
                        </button>
                        <button
                          onClick={() => setCheckoutProduct(item)}
                          className={`py-2.5 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 shadow transition ${theme.primaryBtn}`}
                        >
                          <ShoppingCart className="w-3.5 h-3.5" /> Beli Aplikasi
                        </button>
                      </div>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </section>

      {/* KALKULATOR ESTIMASI JASA CUSTOM */}
      <section id="custom" className={`py-14 sm:py-20 ${theme.sectionAlt}`}>
        <div className="max-w-6xl mx-auto px-4 sm:px-6 grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          <div className="lg:col-span-5 space-y-4">
            <div className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full border text-xs font-semibold ${theme.primarySoft}`}>
              <Calculator className="w-3.5 h-3.5" /> Simulasi Biaya Pembuatan Custom
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold leading-tight">
              Butuh Aplikasi Khusus Sesuai Alur Kerja Perusahaan Anda?
            </h2>
            <p className={`text-sm leading-relaxed ${theme.mutedText}`}>
              Gunakan kalkulator interaktif di samping untuk menghitung perkiraan investasi pembuatan sistem custom, lalu kirimkan detail kebutuhan Anda kepada tim developer kami.
            </p>
            <ul className="space-y-2 text-xs sm:text-sm">
              <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-500" /> Bebas biaya sewa server bulanan (Cloud GAS / Vercel)</li>
              <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-500" /> Hak milik penuh atas database & source code</li>
              <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-500" /> Garansi pemeliharaan & panduan penggunaan tim</li>
            </ul>
          </div>

          <div className={`lg:col-span-7 p-5 sm:p-7 rounded-2xl border ${theme.cardBg}`}>
            <form onSubmit={handleSendCustomInquiry} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold mb-1">Jenis Platform</label>
                  <select
                    value={estPlatform}
                    onChange={(e) => setEstPlatform(e.target.value)}
                    className={`w-full px-3.5 py-2.5 rounded-xl border text-sm outline-none ${theme.inputBg}`}
                  >
                    <option>Web App (Google Sheets / Cloud)</option>
                    <option>Web App + PWA Android/iOS</option>
                    <option>Sistem ERP / Multi-Cabang</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold mb-1">Jumlah Modul / Menu Utama: {estModul} Modul</label>
                  <input
                    type="range"
                    min="2"
                    max="15"
                    value={estModul}
                    onChange={(e) => setEstModul(e.target.value)}
                    className="w-full mt-2 accent-blue-600"
                  />
                </div>
              </div>

              <div className="flex items-center justify-between p-4 rounded-xl bg-blue-600/10 border border-blue-500/20">
                <div>
                  <div className="text-xs font-semibold opacity-80">Perkiraan Investasi Mulai Dari</div>
                  <div className={`text-2xl font-extrabold ${theme.accentText}`}>{formatRupiah(estimasiBiaya)}</div>
                </div>
                <select
                  value={estUrgency}
                  onChange={(e) => setEstUrgency(e.target.value)}
                  className={`px-3 py-1.5 rounded-lg border text-xs font-semibold ${theme.inputBg}`}
                >
                  <option value="normal">Waktu Normal (7-14 Hari)</option>
                  <option value="express">Prioritas Kilat (3-6 Hari)</option>
                </select>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <input
                  type="text"
                  required
                  value={inqNama}
                  onChange={(e) => setInqNama(e.target.value)}
                  placeholder="Nama Anda *"
                  className={`w-full px-3.5 py-2.5 rounded-xl border text-sm outline-none ${theme.inputBg}`}
                />
                <input
                  type="tel"
                  required
                  value={inqWa}
                  onChange={(e) => setInqWa(e.target.value)}
                  placeholder="Nomor WhatsApp *"
                  className={`w-full px-3.5 py-2.5 rounded-xl border text-sm outline-none ${theme.inputBg}`}
                />
              </div>

              <textarea
                rows={2}
                required
                value={inqPesan}
                onChange={(e) => setInqPesan(e.target.value)}
                placeholder="Ceritakan singkat alur aplikasi yang ingin dibuat..."
                className={`w-full px-3.5 py-2.5 rounded-xl border text-sm outline-none ${theme.inputBg}`}
              />

              <button
                type="submit"
                disabled={sendingInq}
                className={`w-full py-3 rounded-xl font-bold text-sm flex items-center justify-center gap-2 shadow-lg transition ${theme.primaryBtn}`}
              >
                {sendingInq ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                Kirim Permintaan Penawaran
              </button>
            </form>
          </div>
        </div>
      </section>

      {/* TESTIMONI */}
      {bootData.testimoni?.length > 0 && (
        <section id="testimoni" className="py-14 sm:py-20 max-w-7xl mx-auto px-4 sm:px-6">
          <div className="text-center max-w-2xl mx-auto mb-10">
            <span className={`text-xs font-bold uppercase tracking-wider ${theme.accentText}`}>Dipercaya Pelaku Usaha</span>
            <h2 className="text-2xl sm:text-3xl font-extrabold mt-1">Apa Kata Pengguna Aplikasi Kami?</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {bootData.testimoni.map((t) => (
              <div key={t.id_testimoni} className={`p-6 rounded-2xl border flex flex-col justify-between space-y-4 ${theme.cardBg}`}>
                <div className="space-y-3">
                  <div className="flex gap-1 text-amber-400">
                    {Array.from({ length: Number(t.rating || 5) }).map((_, i) => (
                      <Star key={i} className="w-4 h-4 fill-current" />
                    ))}
                  </div>
                  <p className={`text-sm leading-relaxed italic ${theme.mutedText}`}>"{t.isi_testimoni}"</p>
                </div>
                <div className="pt-3 border-t border-slate-300/20 flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-xs ${theme.primaryBtn}`}>
                    {t.nama_klien.slice(0, 2).toUpperCase()}
                  </div>
                  <div>
                    <div className="font-bold text-sm">{t.nama_klien}</div>
                    <div className={`text-xs ${theme.subText}`}>{t.jabatan_usaha}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* FAQ ACCORDION */}
      {bootData.faq?.length > 0 && (
        <section id="faq" className={`py-14 sm:py-20 ${theme.sectionAlt}`}>
          <div className="max-w-3xl mx-auto px-4 sm:px-6">
            <div className="text-center mb-8">
              <span className={`text-xs font-bold uppercase tracking-wider ${theme.accentText}`}>Pertanyaan Umum</span>
              <h2 className="text-2xl sm:text-3xl font-extrabold mt-1">Frequently Asked Questions</h2>
            </div>

            <div className="space-y-3">
              {bootData.faq.map((f) => {
                const isOpen = openFaqId === f.id_faq;
                return (
                  <div key={f.id_faq} className={`rounded-2xl border overflow-hidden ${theme.cardBg}`}>
                    <button
                      onClick={() => setOpenFaqId(isOpen ? null : f.id_faq)}
                      className="w-full px-5 py-4 text-left font-bold text-sm sm:text-base flex items-center justify-between gap-3"
                    >
                      <span>{f.pertanyaan}</span>
                      <ChevronDown className={`w-4 h-4 shrink-0 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
                    </button>
                    {isOpen && (
                      <div className={`px-5 pb-4 text-xs sm:text-sm leading-relaxed border-t border-slate-300/20 pt-3 ${theme.mutedText}`}>
                        {f.jawaban}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </section>
      )}

      {/* FOOTER */}
      <footer className="py-10 px-4 sm:px-6 border-t border-slate-300/20">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 text-xs sm:text-sm">
          <div>
            <span className="font-extrabold">{brand.nama_brand}</span> — {brand.alamat_footer || 'Indonesia'}
          </div>
          <div className={`flex items-center gap-4 ${theme.subText}`}>
            <button onClick={() => setTrackerOpen(true)} className="hover:underline">Cek Status Order</button>
            <a href={buildWaLink(brand.nomor_wa, brand.pesan_wa_default)} target="_blank" rel="noopener noreferrer" className="hover:underline">
              WhatsApp Support
            </a>
            <button onClick={handleAdminAccessClick} className="hover:underline">Admin</button>
          </div>
        </div>
      </footer>

      {/* MODALS */}
      <LiveDemoModal
        product={demoProduct}
        brand={brand}
        onClose={() => setDemoProduct(null)}
        onOrder={(p) => setCheckoutProduct(p)}
        onNotify={notify}
      />

      <ProductDetailModal
        product={detailProduct}
        brand={brand}
        theme={theme}
        onClose={() => setDetailProduct(null)}
        onDemo={handleOpenDemo}
        onOrder={(p) => setCheckoutProduct(p)}
      />

      <CheckoutModal
        product={checkoutProduct}
        brand={brand}
        metodeList={bootData.metode_pembayaran}
        theme={theme}
        onClose={() => setCheckoutProduct(null)}
        onNotify={notify}
      />

      {trackerOpen && (
        <OrderTrackerModal
          theme={theme}
          onClose={() => setTrackerOpen(false)}
          onNotify={notify}
        />
      )}

      {toast && <ToastBanner toast={toast} />}
    </div>
  );
}

function ToastBanner({ toast }) {
  const bg =
    toast.type === 'error'
      ? 'bg-rose-600 text-white'
      : toast.type === 'success'
      ? 'bg-emerald-600 text-white'
      : 'bg-slate-900 text-white';
  return (
    <div className={`fixed top-4 right-4 z-[60] px-4 py-3 rounded-xl shadow-2xl text-xs sm:text-sm font-semibold max-w-sm animate-bounce ${bg}`}>
      {toast.msg}
    </div>
  );
}
