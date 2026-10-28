import type { Metadata } from "next";
import "./globals.css";
import { ProveedorCarrito } from "./datoscarro/estadocarro";
import CarroDesplegable from "./datoscarro/carrodesplegable";
import { AuthProvider } from "@/src/lib/context/AuthContext";

// 1. Importación del Chatbot flotante
// Ajusta la ruta si guardaste el archivo en otra ubicación (ej: "@/app/components/ChatFlotante")
import ChatFlotante from "./components/ChatFlotante";

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
      className="h-full antialiased"
    >
      <body className="min-h-full flex flex-col font-sans">
        <ProveedorCarrito>
          <AuthProvider>{children}</AuthProvider>
          <CarroDesplegable />

          {/* 2. Componente inyectado globalmente (dentro del proveedor para ocultarse con el carrito abierto) */}
          <ChatFlotante />
        </ProveedorCarrito>
      </body>
    </html>
  );
}