import type { Metadata } from "next";
import { DM_Sans, Fraunces } from "next/font/google";
import "./globals.css";
import { ProveedorCarrito } from "./datoscarro/estadocarro";
import CarroDesplegable from "./datoscarro/carrodesplegable";
import { AuthProvider } from "@/src/lib/context/AuthContext";

const dmSans = DM_Sans({
  variable: "--font-dm-sans",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

const fraunces = Fraunces({
  variable: "--font-fraunces",
  subsets: ["latin"],
  weight: ["600", "700", "800"],
});

export const metadata: Metadata = {
  title: "SuMate | Mates y Accesorios Artesanales",
  description: "E-Commerce y Gestión Integral de Inventario para SuMate / SuMateCL",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="es"
      data-scroll-behavior="smooth"
      className={`${dmSans.variable} ${fraunces.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <ProveedorCarrito>
          <AuthProvider>{children}</AuthProvider>
          <CarroDesplegable />
        </ProveedorCarrito>
      </body>
    </html>
  );
}