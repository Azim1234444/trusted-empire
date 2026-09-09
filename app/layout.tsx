import type { Metadata } from 'next';
import './globals.css';
export const metadata: Metadata = {
  title: 'Trusted Empire | Pilih Dunia Hiburan Anda',
  description:
    'Langganan Netflix Premium UHD, HBO Max, Amazon Prime, VIU, iQIYI dan IPTV. Pilih pelan dan lihat maklumat bayaran CIMB serta QR TnG.',
};
export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ms" className="dark">
      <body>{children}</body>
    </html>
  );
}
