import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'TerraAsk — Ask Earth What is Changing | Climate Intelligence Interface',
  description:
    'Natural-language climate intelligence interface backed by verified NOAA IBTrACS tropical cyclone tracks, NASA GIBS satellite imagery, and ECMWF ERA5 reanalysis.',
  keywords: [
    'climate intelligence',
    'Earth observation',
    'cyclone tracking',
    'Bay of Bengal',
    'NOAA IBTrACS',
    'NASA GIBS',
    'ECMWF ERA5',
    'Odisha coastal resilience',
  ],
  authors: [{ name: 'TerraAsk Intelligence Team' }],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body className="bg-earth-950 text-slate-100 antialiased selection:bg-cyan-500/30 selection:text-cyan-200">
        {children}
      </body>
    </html>
  );
}
