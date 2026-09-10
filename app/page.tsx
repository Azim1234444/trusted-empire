'use client';
import { useEffect, useRef, useState } from 'react';
import { motion, useReducedMotion } from 'motion/react';
import {
  ArrowUpRight,
  ArrowRight,
  Check,
  Copy,
  Crown,
  Play,
  QrCode,
  Send,
  ShieldCheck,
  Tv,
  MessageCircle,
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
const group = 'https://t.me/TrustedEmpire86';
const whatsapp = 'https://wa.me/60163495594';
const plans = [
  {
    id: 'netflix',
    name: 'Netflix',
    mark: 'NETFLIX',
    detail: 'Premium UHD · 4K',
    price: 17,
    color: '#ff3846',
  },
  {
    id: 'hbo',
    name: 'HBO Max',
    mark: 'HBO max',
    detail: 'Langganan 1 bulan',
    price: 15,
    color: '#b5a7ff',
  },
  {
    id: 'prime',
    name: 'Amazon Prime',
    mark: 'prime video',
    detail: 'Langganan 1 bulan',
    price: 10,
    color: '#67c9ff',
  },
  {
    id: 'viu',
    name: 'VIU',
    mark: 'viu',
    detail: 'Langganan 1 bulan',
    price: 10,
    color: '#ffda43',
  },
  {
    id: 'iqiyi',
    name: 'iQIYI',
    mark: 'iQIYI',
    detail: 'Langganan 1 bulan',
    price: 10,
    color: '#59e991',
  },
];
type Plan = (typeof plans)[number];
export default function Home() {
  const requestId = useRef('');
  const sending = useRef(false);
  const [contact, setContact] = useState('');
  const [notificationState, setNotificationState] = useState<
    'idle' | 'sending' | 'sent' | 'error'
  >('idle');
  const [notificationFeedback, setNotificationFeedback] = useState('');
  useEffect(() => {
    const context = (
      document as Document & {
        modelContext?: {
          registerTool: (
            tool: unknown,
            options: { signal: AbortSignal },
          ) => void | Promise<void>;
        };
      }
    ).modelContext;
    if (!context?.registerTool) return;
    const lifecycle = new AbortController();
    try {
      void Promise.resolve(
        context.registerTool(
          {
            name: 'list_subscription_plans',
            description:
              'Read available subscription plans and prices in MYR. Does not create an order or confirm payment.',
            inputSchema: {
              type: 'object',
              properties: {},
              additionalProperties: false,
            },
            annotations: { readOnlyHint: true },
            execute(input: unknown) {
              if (
                !input ||
                typeof input !== 'object' ||
                Array.isArray(input) ||
                Object.keys(input).length
              )
                throw new Error('Expected an empty object');
              return {
                plans: plans.map((p) => ({
                  platform: p.name,
                  months: 1,
                  priceMYR: p.price,
                })),
                netflixTwoMonths: { priceMYR: 33, renewal: 'monthly' },
                iptv: 'Ask admin for pricing',
                paymentVerification: 'Manual admin review',
              };
            },
          },
          { signal: lifecycle.signal },
        ),
      ).catch(() => {});
    } catch {}
    return () => lifecycle.abort();
  }, []);
  const [selected, setSelected] = useState<Plan | null>(null),
    [months, setMonths] = useState(1),
    [name, setName] = useState(''),
    [notice, setNotice] = useState(''),
    [message, setMessage] = useState('');
  const reduced = useReducedMotion();
  const total =
    selected?.id === 'netflix' && months === 2 ? 33 : (selected?.price ?? 0);
  function choose(plan: Plan) {
    if (sending.current) return;
    requestId.current = crypto.randomUUID();
    setContact('');
    setNotificationState('idle');
    setNotificationFeedback('');
    setSelected(plan);
    setMonths(1);
    setName('');
    setMessage('');
    setNotice('');
  }
  async function copy(value: string) {
    try {
      await navigator.clipboard.writeText(value);
      setNotice('Berjaya disalin.');
    } catch {
      setNotice('Tidak dapat menyalin. Sila salin teks secara manual.');
    }
  }
  async function prepare(e: React.FormEvent) {
    e.preventDefault();
    if (sending.current || notificationState === 'sent' || !selected) return;
    sending.current = true;
    setNotificationState('sending');
    setNotificationFeedback('Sedang memaklumkan kepada admin…');
    const id = requestId.current;
    setMessage(
      `Salam Trusted Empire, saya ${name.trim()}. No. pesanan: ${id}. Saya ingin mengesahkan bayaran untuk ${selected?.name}, ${months} bulan, RM${total}. Hubungi: ${contact.trim()}. Rujukan bayaran: ${name.trim()}. Saya akan lampirkan resit untuk semakan.`,
    );
    try {
      const response = await fetch('/api/notify-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          requestId: id,
          planId: selected.id,
          months,
          name: name.trim(),
          contact: contact.trim(),
          paymentClaimed: true,
        }),
        signal: AbortSignal.timeout(20000),
      });
      const result = (await response.json()) as {
        error?: string;
        orderId?: string;
      };
      if (response.status === 400) {
        setNotificationState('idle');
        setNotificationFeedback(result.error ?? 'Semak maklumat anda.');
        return;
      }
      if (!response.ok)
        throw new Error(
          result.error || 'Tidak dapat menghantar notifikasi. Hubungi admin.',
        );
      setNotificationState('sent');
      setNotificationFeedback(
        `Notifikasi dihantar kepada admin. Pesanan ${result.orderId}. Bayaran masih menunggu semakan.`,
      );
    } catch (error) {
      setNotificationState('error');
      setNotificationFeedback(
        error instanceof Error && error.name !== 'TimeoutError'
          ? error.message
          : 'Sambungan terganggu. Hubungi admin dengan nombor pesanan di bawah.',
      );
    } finally {
      sending.current = false;
    }
  }
  return (
    <>
      <a className="skip" href="#pelan">
        Terus ke pelan
      </a>
      <header className="header wrap">
        <a href="#" className="brand">
          <span className="brand-icon">
            <Crown size={22} />
          </span>
          <span>
            TRUSTED<span className="brand-light">EMPIRE</span>
          </span>
        </a>
        <nav aria-label="Navigasi utama">
          <a className="active" href="#pelan">
            Pilihan pelan
          </a>
          <a href="#cara">Cara melanggan</a>
          <a href="#bantuan">Bantuan</a>
        </nav>
        <a className="community" href={group} target="_blank" rel="noreferrer">
          <Send size={16} /> Komuniti Telegram <ArrowUpRight size={15} />
        </a>
      </header>
      <main>
        <section className="hero wrap">
          <motion.div
            className="hero-copy"
            initial={reduced ? false : { opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7 }}
          >
            <div className="eyebrow">HIBURAN PILIHAN ANDA</div>
            <h1>
              Satu tempat.
              <br />
              Beribu <em>cerita.</em>
            </h1>
            <p>
              Dari movie night ke marathon drama. Pilih langganan kegemaran
              anda, bermula RM10 sebulan.
            </p>
            <a className="btn primary" href="#pelan">
              Cari pelan anda <ArrowUpRight size={20} />
            </a>
          </motion.div>
          <div className="hero-visual" aria-label="Pilihan platform hiburan">
            <div className="cinema-art" />
            <div className="orbit-card netflix">
              <span>NETFLIX</span>
              <small>PREMIUM UHD</small>
              <div className="mini-play">
                <Play fill="currentColor" size={17} />
              </div>
            </div>
            <div className="orbit-card hbo">
              HBO <b>max</b>
            </div>
            <div className="orbit-card viu">viu</div>
            <div className="orbit-card iqiyi">iQIYI</div>
          </div>
        </section>
        <div className="service-strip wrap">
          <span>
            <ShieldCheck /> Maklumat bayaran yang jelas
          </span>
          <span>
            <QrCode /> Bayar dengan QR atau CIMB
          </span>
          <span>
            <MessageCircle /> WhatsApp & Telegram
          </span>
        </div>
        <section id="pelan" className="catalog wrap">
          <div className="section-heading">
            <h2>Pilih dunia hiburan anda.</h2>
            <p>Langganan bulanan. Pilih yang kena dengan selera anda.</p>
          </div>
          <div className="plan-grid">
            {plans.map((plan, i) => (
              <motion.article
                key={plan.id}
                className={`plan-card ${plan.id}`}
                style={{ '--brand-color': plan.color } as React.CSSProperties}
                initial={reduced ? false : { opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.06 }}
              >
                <div className="platform-art">
                  <span className="platform-mark">{plan.mark}</span>
                  {plan.id === 'netflix' && (
                    <span className="quality">4K UHD</span>
                  )}
                </div>
                <div className="plan-body">
                  <h3>{plan.name}</h3>
                  <p>{plan.detail}</p>
                  <div className="price">
                    <span>RM</span>
                    {plan.price}
                    <small>/ bulan</small>
                  </div>
                  <div className="plan-meta">
                    <Check size={15} />
                    {plan.id === 'netflix'
                      ? '28–30 hari setiap bulan'
                      : '1 bulan langganan'}
                  </div>
                  <button className="plan-button" onClick={() => choose(plan)}>
                    Pilih pelan <ArrowUpRight size={18} />
                  </button>
                  {plan.id === 'netflix' && (
                    <small className="renew-note">
                      2 bulan RM33 · Monthly renew
                    </small>
                  )}
                </div>
              </motion.article>
            ))}
          </div>
          <div className="iptv">
            <div className="iptv-icon">
              <Tv size={29} />
            </div>
            <div>
              <h3>Lagi banyak pilihan dengan IPTV.</h3>
              <p>
                MSTV <span>·</span> Sybertv <span>·</span> WDHD <span>·</span>{' '}
                Myiptv4k
              </p>
            </div>
            <a
              href={`${whatsapp}?text=${encodeURIComponent('Salam Trusted Empire, saya ingin tahu harga dan ketersediaan IPTV: MSTV, Sybertv, WDHD dan Myiptv4k.')}`}
              target="_blank"
              rel="noreferrer"
            >
              Tanya harga & ketersediaan <ArrowUpRight size={18} />
            </a>
          </div>
        </section>
        <section id="cara" className="how wrap">
          <div>
            <h2>
              Pilih. Bayar.
              <br />
              <span>Mula menonton.</span>
            </h2>
            <p>Hanya beberapa langkah untuk langganan anda.</p>
          </div>
          <ol>
            <li>
              <span>01</span>
              <div>
                <h3>Pilih pelan kegemaran</h3>
                <p>Pilih platform dan tempoh langganan yang anda mahukan.</p>
              </div>
            </li>
            <li>
              <span>02</span>
              <div>
                <h3>Bayar melalui QR atau CIMB</h3>
                <p>
                  Letakkan <strong>nama pendek</strong> sahaja pada ruangan
                  reference payment.
                </p>
              </div>
            </li>
            <li>
              <span>03</span>
              <div>
                <h3>Maklumkan selepas pembayaran</h3>
                <p>
                  Sediakan mesej pesanan dan resit. Admin akan menyemak bayaran
                  serta menguruskan langganan anda.
                </p>
              </div>
            </li>
          </ol>
        </section>
        <section id="bantuan" className="help wrap">
          <Send size={34} />
          <div>
            <h2>Jangan terlepas apa-apa info.</h2>
            <p>
              Sertai komuniti Trusted Empire untuk maklumat langganan dan
              bantuan admin.
            </p>
          </div>
          <a
            className="btn secondary"
            href={group}
            target="_blank"
            rel="noreferrer"
          >
            Sertai Telegram <ArrowUpRight size={18} />
          </a>
        </section>
        <section className="contact-admin wrap" aria-labelledby="admin-title">
          <div>
            <h2 id="admin-title">Perlukan bantuan admin?</h2>
            <p>
              Hantar resit melalui WhatsApp. Sertai group Telegram untuk info
              langganan dan pengumuman.
            </p>
            <div className="contact-actions">
              <a
                className="btn primary"
                href={whatsapp}
                target="_blank"
                rel="noreferrer"
              >
                <MessageCircle size={18} /> WhatsApp 016-349 5594
              </a>
              <a
                className="btn secondary"
                href={group}
                target="_blank"
                rel="noreferrer"
              >
                <Send size={18} /> Group Trusted Empire
              </a>
            </div>
          </div>
        </section>
      </main>
      <footer className="wrap">
        <a className="brand" href="#">
          <Crown size={20} /> TRUSTED EMPIRE
        </a>
        <p>Hiburan anda, pilihan anda.</p>
        <small>Nama dan tanda dagangan milik pemilik masing-masing.</small>
      </footer>
      <Dialog
        open={!!selected}
        onOpenChange={(open) => {
          if (!open && !sending.current) setSelected(null);
        }}
      >
        <DialogContent className="checkout sm:max-w-[540px]">
          <DialogTitle className="text-2xl">
            Langgan {selected?.name}
          </DialogTitle>
          <DialogDescription>
            Pilih tempoh, buat bayaran dan maklumkan kepada admin untuk semakan.
          </DialogDescription>
          <div className="order-summary">
            <span>{selected?.detail}</span>
            <strong>RM{total}</strong>
          </div>
          {selected?.id === 'netflix' && (
            <div
              className="duration"
              role="group"
              aria-label="Tempoh langganan"
            >
              <button
                className={months === 1 ? 'chosen' : ''}
                aria-pressed={months === 1}
                disabled={notificationState !== 'idle'}
                onClick={() => {
                  setMonths(1);
                  setMessage('');
                }}
              >
                1 bulan · RM17
              </button>
              <button
                className={months === 2 ? 'chosen' : ''}
                aria-pressed={months === 2}
                disabled={notificationState !== 'idle'}
                onClick={() => {
                  setMonths(2);
                  setMessage('');
                }}
              >
                2 bulan · RM33
              </button>
            </div>
          )}
          {months === 2 && (
            <p className="small-copy">
              Pembaharuan dibuat setiap bulan (monthly renew).
            </p>
          )}
          <div className="payment">
            <div className="payment-qr-heading">
              <QrCode size={19} />
              <strong>Imbas QR untuk bayar</strong>
            </div>
            <p className="qr-recipient">ROSMISZAN BIN HUSAIN</p>
            <a
              className="payment-qr-frame"
              href="/payment-qr.png"
              target="_blank"
              rel="noreferrer"
              aria-label="Buka gambar penuh QR pembayaran Rosmiszan bin Husain"
            >
              <img
                src="/payment-qr.png"
                width={573}
                height={1280}
                alt="QR pembayaran DuitNow Rosmiszan bin Husain daripada TnG"
              />
            </a>
            <p className="qr-instructions">
              Bayar <strong>RM{total}</strong>. Semak nama penerima dan jumlah
              dalam aplikasi sebelum sahkan bayaran.
            </p>
            <a
              className="btn secondary"
              href="/payment-qr.png"
              download="Trusted-Empire-QR.png"
            >
              Simpan gambar QR <ArrowUpRight size={16} />
            </a>
            <p className="qr-instructions">
              Guna telefon yang sama? Simpan QR dan pilih gambar itu dalam
              pengimbas aplikasi bank atau TnG.
            </p>
            <div className="bank-label">
              PINDAHAN BANK <span>CIMB</span>
            </div>
            <p>ROSMISZAN BIN HUSAIN</p>
            <button
              className="account"
              onClick={() => copy('8606241982')}
              aria-label="Salin nombor akaun CIMB 8606241982"
            >
              8606 2419 82 <Copy size={18} />
            </button>
          </div>
          <p className="payment-note">
            Reference payment: gunakan <strong>NAMA PENDEK</strong> anda sahaja.
          </p>
          <form onSubmit={prepare}>
            <fieldset disabled={notificationState !== 'idle'}>
              <label htmlFor="customer-name">Nama pendek pada bayaran</label>
              <input
                id="customer-name"
                value={name}
                onChange={(e) => {
                  setName(e.target.value);
                  setMessage('');
                }}
                required
                maxLength={40}
                pattern=".*\S.*"
                placeholder="Contoh: Aina"
                autoComplete="given-name"
              />
              <label htmlFor="customer-contact">
                Nombor WhatsApp atau @username Telegram
              </label>
              <input
                id="customer-contact"
                value={contact}
                onChange={(e) => setContact(e.target.value)}
                required
                maxLength={33}
                placeholder="Contoh: 0123456789 atau @username"
                autoComplete="off"
              />
              <p className="small-copy">
                Nama dan maklumat hubungan ini dihantar kepada admin untuk
                semakan pesanan. Hantar resit melalui WhatsApp
                selepas ini.
              </p>
              <button className="btn primary full" type="submit">
                {notificationState === 'sending'
                  ? 'Sedang menghantar…'
                  : notificationState === 'sent'
                    ? 'Admin telah dimaklumkan'
                    : 'Saya dah bayar — maklumkan admin'}{' '}
                <ArrowRight size={18} />
              </button>
            </fieldset>
          </form>
          {notificationFeedback && (
            <p className="notification-feedback" role="status">
              {notificationFeedback}
            </p>
          )}
          {message && (
            <div className="prepared">
              <p>
                Buka WhatsApp dengan mesej siap diisi. Lampirkan gambar resit
                dan tekan hantar dalam aplikasi WhatsApp.
              </p>
              <textarea aria-label="Mesej pesanan" readOnly value={message} />
              <div>
                <a
                  className="btn primary"
                  href={`${whatsapp}?text=${encodeURIComponent(message)}`}
                  target="_blank"
                  rel="noreferrer"
                >
                  <MessageCircle size={16} /> Hantar resit di WhatsApp
                </a>
                <button className="btn secondary" onClick={() => copy(message)}>
                  <Copy size={16} /> Salin mesej
                </button>
                <a
                  className="btn secondary"
                  href={group}
                  target="_blank"
                  rel="noreferrer"
                >
                  Group Telegram <Send size={16} />
                </a>
              </div>
              <small>
                Bayaran belum disahkan. Pengaktifan selepas semakan admin.
              </small>
            </div>
          )}
          <p role="status" className="notice">
            {notice}
          </p>
        </DialogContent>
      </Dialog>
    </>
  );
}
