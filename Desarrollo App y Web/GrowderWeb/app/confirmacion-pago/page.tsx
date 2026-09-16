'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { usarCarrito } from '@/app/datoscarro/estadocarro';
import { useAuth } from '@/src/lib/context/AuthContext';
import { supabase } from '@/src/lib/supabase';

// Regiones oficiales de Chile
const REGIONES_CHILE = [
  'Región Metropolitana de Santiago',
  'Arica y Parinacota',
  'Tarapacá',
  'Antofagasta',
  'Atacama',
  'Coquimbo',
  'Valparaíso',
  'Libertador General Bernardo O’Higgins',
  'Maule',
  'Ñuble',
  'Biobío',
  'La Araucanía',
  'Los Ríos',
  'Los Lagos',
  'Aysén del General Carlos Ibáñez del Campo',
  'Magallanes y de la Antártica Chilena',
];

const COSTO_ENVIO_FIJO = 2650; // $2.650 CLP fijo

export default function ConfirmacionPagoPage() {
  const router = useRouter();
  const { carrito, total, actualizarCantidad, eliminarDelCarrito, limpiarCarrito } = usarCarrito();
  const { usuario, cargando: authCargando } = useAuth();

  const [estaAutenticado, setEstaAutenticado] = useState<boolean | null>(null);

  // Estados para inicio de sesión o registro inline
  const [tabAuth, setTabAuth] = useState<'login' | 'registro'>('login');
  const [authEmail, setAuthEmail] = useState('');
  const [authPassword, setAuthPassword] = useState('');
  const [authTelefono, setAuthTelefono] = useState('');
  const [authCargandoSubmit, setAuthCargandoSubmit] = useState(false);
  const [authError, setAuthError] = useState('');

  // Estados de Ubicación y Envío
  const [nombre, setNombre] = useState('');
  const [email, setEmail] = useState('');
  const [telefono, setTelefono] = useState('');
  const [region, setRegion] = useState('Región Metropolitana de Santiago');
  const [comuna, setComuna] = useState('');
  const [direccion, setDireccion] = useState('');
  const [depto, setDepto] = useState('');
  const [instrucciones, setInstrucciones] = useState('');

  // Método de pago seleccionado (ahora Webpay es el principal)
  const [metodoPago, setMetodoPago] = useState<'mercadopago' | 'webpay'>('webpay');
  const [procesandoPago, setProcesandoPago] = useState(false); // NUEVO ESTADO PARA WEBPAY

  // Estado del modal de confirmación final (Para pagos manuales)
  const [mostrarModalExito, setMostrarModalExito] = useState(false);
  const [numeroPedido, setNumeroPedido] = useState('');

  // Verificación robusta de sesión
  useEffect(() => {
    let montado = true;

    async function verificarSesion() {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        const user = session?.user;

        if (user || usuario) {
          if (!montado) return;
          setEstaAutenticado(true);
          const emailActivo = user?.email || usuario?.email || '';
          if (emailActivo) setEmail(emailActivo);

          const meta = user?.user_metadata || {};
          if (meta.nombre) setNombre(meta.nombre);
          if (meta.telefono) setTelefono(meta.telefono);

          const userId = user?.id || usuario?.id;
          if (userId) {
            const { data } = await supabase
              .from('usuario')
              .select('telefono')
              .eq('id', userId)
              .single();

            if (data?.telefono && !meta.telefono) {
              setTelefono(data.telefono);
            }
          }
        } else if (!authCargando) {
          if (!montado) return;
          setEstaAutenticado(false);
        }
      } catch (err) {
        console.error('Error al verificar sesión:', err);
        if (montado && !authCargando) {
          setEstaAutenticado(!!usuario);
        }
      }
    }

    verificarSesion();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!montado) return;
      if (session?.user) {
        setEstaAutenticado(true);
        if (session.user.email) setEmail(session.user.email);
        const meta = session.user.user_metadata || {};
        if (meta.nombre) setNombre(meta.nombre);
        if (meta.telefono) setTelefono(meta.telefono);
      } else {
        setEstaAutenticado(false);
      }
    });

    return () => {
      montado = false;
      subscription.unsubscribe();
    };
  }, [usuario, authCargando]);

  const handleInlineLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthCargandoSubmit(true);
    setAuthError('');

    const { data, error } = await supabase.auth.signInWithPassword({
      email: authEmail,
      password: authPassword,
    });

    setAuthCargandoSubmit(false);

    if (error) {
      setAuthError(error.message);
      return;
    }

    if (data.session?.user) {
      setEstaAutenticado(true);
      setEmail(data.session.user.email || authEmail);
      const meta = data.session.user.user_metadata || {};
      if (meta.nombre) setNombre(meta.nombre);
      if (meta.telefono) setTelefono(meta.telefono);
    }
  };

  const handleInlineRegistro = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthCargandoSubmit(true);
    setAuthError('');

    const { data, error } = await supabase.auth.signUp({
      email: authEmail,
      password: authPassword,
      options: {
        data: {
          telefono: authTelefono,
        },
      },
    });

    setAuthCargandoSubmit(false);

    if (error) {
      setAuthError(error.message);
      return;
    }

    if (data.session?.user) {
      setEstaAutenticado(true);
      setEmail(data.session.user.email || authEmail);
      if (authTelefono) setTelefono(authTelefono);
      return;
    }

    alert('Registro completado. Ingresa tu contraseña en la pestaña Iniciar Sesión para continuar.');
    setTabAuth('login');
  };

  const totalProductos = carrito.reduce((acc, item) => acc + item.cantidad, 0);
  const totalFinal = total + (carrito.length > 0 ? COSTO_ENVIO_FIJO : 0);

  const formatearPrecio = (valor: number) => {
    return new Intl.NumberFormat('es-CL', {
      style: 'currency',
      currency: 'CLP',
      maximumFractionDigits: 0,
    }).format(valor);
  };

  const [errores, setErrores] = useState<{
    nombre?: string;
    telefono?: string;
    email?: string;
    comuna?: string;
    direccion?: string;
  }>({});

  const validarCampos = () => {
    const nuevosErrores: any = {};
    if (!nombre.trim()) nuevosErrores.nombre = 'Completa este campo';
    if (!telefono.trim()) nuevosErrores.telefono = 'Completa este campo';
    if (!email.trim()) nuevosErrores.email = 'Completa este campo';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) nuevosErrores.email = 'Ingresa un correo válido';
    if (!comuna.trim()) nuevosErrores.comuna = 'Completa este campo';
    if (!direccion.trim()) nuevosErrores.direccion = 'Completa este campo';
    return nuevosErrores;
  };

  // ============================================================================
  // INTEGRACIÓN WEBPAY AL CONFIRMAR
  // ============================================================================
  const handleConfirmarPedido = async (e: React.FormEvent) => {
    e.preventDefault();

    const validationErrors = validarCampos();
    if (Object.keys(validationErrors).length > 0) {
      setErrores(validationErrors);
      const primerCampo = Object.keys(validationErrors)[0];
      const el = document.getElementById(`campo-${primerCampo}`);
      if (el) {
        el.focus();
        el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
      return;
    }

    setErrores({});
    const codigo = `SM-${Math.floor(100000 + Math.random() * 900000)}`;
    setNumeroPedido(codigo);

    if (metodoPago === 'webpay') {
      // 1. INICIAR FLUJO DE WEBPAY
      setProcesandoPago(true);
      try {
        const response = await fetch('/api/webpay/create', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            amount: totalFinal,
            buyOrder: codigo,
            sessionId: `sesion-${Date.now()}`,
            returnUrl: `${window.location.origin}/api/webpay/commit`
          })
        });

        const data = await response.json();

        if (data.url && data.token) {
          // 2. Crear formulario oculto para ir a la pantalla de Transbank
          const form = document.createElement('form');
          form.action = data.url;
          form.method = 'POST';
          
          const input = document.createElement('input');
          input.type = 'hidden';
          input.name = 'token_ws';
          input.value = data.token;
          
          form.appendChild(input);
          document.body.appendChild(form);
          form.submit();
        } else {
          alert("Error al inicializar Webpay. Intenta nuevamente.");
          setProcesandoPago(false);
        }
      } catch (error) {
        console.error("Error en Webpay:", error);
        alert("Ocurrió un error al conectar con el servidor de pagos.");
        setProcesandoPago(false);
      }
    } else {
      // Flujo original (Simulado para Mercado Pago / Transferencia)
      setMostrarModalExito(true);
    }
  };

  if (estaAutenticado === null) {
    return (
      <div className="min-h-screen bg-[#f8f3e9] flex items-center justify-center">
        <div className="text-center">
          <div className="w-10 h-10 border-4 border-[#8C7762] border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-stone-600 font-semibold text-sm">Verificando sesión...</p>
        </div>
      </div>
    );
  }

  if (!estaAutenticado) {
    return (
      <div className="site-shell min-h-screen flex flex-col bg-[#f8f3e9]">
        <header className="border-b border-[#8C7762]/20 bg-white/90 backdrop-blur-md sticky top-0 z-30">
          <div className="max-w-6xl mx-auto px-5 py-4 flex items-center justify-between">
            <Link href="/" className="flex items-center gap-3">
              <img src="/logocircular.png" alt="SuMate Logo" className="h-11 w-auto object-contain" />
              <span className="brand-serif font-bold text-xl text-[#1A1A1A]">SuMateCL</span>
            </Link>
            <Link href="/" className="text-xs font-semibold text-[#314235] hover:text-[#8C7762] transition flex items-center gap-1.5">
              ← Volver a la tienda
            </Link>
          </div>
        </header>

        <main className="flex-1 flex items-center justify-center p-4 sm:p-6">
          <div className="max-w-md w-full bg-white rounded-3xl p-6 sm:p-8 shadow-xl border border-stone-200">
            <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-amber-50 text-amber-700 flex items-center justify-center border border-amber-200">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
            </div>

            <h1 className="brand-serif text-xl sm:text-2xl font-bold text-stone-900 text-center mb-1">Identifícate para continuar</h1>
            <p className="text-stone-600 text-xs text-center mb-5 leading-relaxed">Ingresa a tu cuenta para confirmar tu pedido y coordinar el despacho seguro a tu dirección.</p>

            {carrito.length > 0 && (
              <div className="mb-5 p-3.5 rounded-2xl bg-[#f8f3e9] border border-[#8C7762]/20 text-xs flex justify-between items-center">
                <div>
                  <span className="font-bold text-stone-800 block">Tu Carrito Actual</span>
                  <span className="text-stone-500">{totalProductos} {totalProductos === 1 ? 'producto' : 'productos'}</span>
                </div>
                <span className="font-bold text-[#314235] text-sm">{formatearPrecio(totalFinal)}</span>
              </div>
            )}

            <div className="flex border-b border-stone-200 mb-5 text-xs font-bold">
              <button type="button" onClick={() => { setTabAuth('login'); setAuthError(''); }} className={`flex-1 py-2.5 text-center border-b-2 transition cursor-pointer ${tabAuth === 'login' ? 'border-[#314235] text-[#314235]' : 'border-transparent text-stone-400 hover:text-stone-600'}`}>Iniciar Sesión</button>
              <button type="button" onClick={() => { setTabAuth('registro'); setAuthError(''); }} className={`flex-1 py-2.5 text-center border-b-2 transition cursor-pointer ${tabAuth === 'registro' ? 'border-[#314235] text-[#314235]' : 'border-transparent text-stone-400 hover:text-stone-600'}`}>Crear Cuenta</button>
            </div>

            {authError && <div className="mb-4 p-3 bg-red-50 text-red-700 rounded-xl border border-red-200 text-xs">{authError}</div>}

            {tabAuth === 'login' ? (
              <form onSubmit={handleInlineLogin} className="space-y-4">
                <div><label className="block text-xs font-bold text-stone-700 mb-1">Correo electrónico</label><input type="email" required placeholder="correo@ejemplo.cl" value={authEmail} onChange={(e) => setAuthEmail(e.target.value)} className="w-full text-xs rounded-xl border px-3.5 py-2.5 outline-none focus:border-[#314235] transition" /></div>
                <div><label className="block text-xs font-bold text-stone-700 mb-1">Contraseña</label><input type="password" required placeholder="Tu contraseña" value={authPassword} onChange={(e) => setAuthPassword(e.target.value)} className="w-full text-xs rounded-xl border px-3.5 py-2.5 outline-none focus:border-[#314235] transition" /></div>
                <button type="submit" disabled={authCargandoSubmit} className="w-full bg-[#314235] hover:bg-[#243127] disabled:opacity-60 text-white font-bold py-3 rounded-full text-xs transition shadow-md cursor-pointer">{authCargandoSubmit ? 'Iniciando sesión...' : 'Ingresar y Continuar al Pago'}</button>
              </form>
            ) : (
              <form onSubmit={handleInlineRegistro} className="space-y-3.5">
                <div><label className="block text-xs font-bold text-stone-700 mb-1">Correo electrónico</label><input type="email" required placeholder="correo@ejemplo.cl" value={authEmail} onChange={(e) => setAuthEmail(e.target.value)} className="w-full text-xs rounded-xl border px-3.5 py-2.5 outline-none focus:border-[#314235] transition" /></div>
                <div><label className="block text-xs font-bold text-stone-700 mb-1">Contraseña</label><input type="password" required minLength={6} placeholder="Mínimo 6 caracteres" value={authPassword} onChange={(e) => setAuthPassword(e.target.value)} className="w-full text-xs rounded-xl border px-3.5 py-2.5 outline-none focus:border-[#314235] transition" /></div>
                <div><label className="block text-xs font-bold text-stone-700 mb-1">Teléfono de Contacto</label><input type="tel" placeholder="912345678" value={authTelefono} onChange={(e) => setAuthTelefono(e.target.value.replace(/\D/g, '').slice(0, 9))} className="w-full text-xs rounded-xl border px-3.5 py-2.5 outline-none focus:border-[#314235] transition" /></div>
                <button type="submit" disabled={authCargandoSubmit} className="w-full bg-[#8C7762] hover:bg-[#725F4C] disabled:opacity-60 text-white font-bold py-3 rounded-full text-xs transition shadow-md cursor-pointer">{authCargandoSubmit ? 'Creando cuenta...' : 'Crear Cuenta y Continuar'}</button>
              </form>
            )}
            <div className="mt-5 text-center"><Link href="/" className="text-xs font-semibold text-stone-400 hover:text-stone-700 transition">← Volver al catálogo</Link></div>
          </div>
        </main>
      </div>
    );
  }

  if (carrito.length === 0 && !mostrarModalExito) {
    return (
      <div className="site-shell min-h-screen flex flex-col bg-[#f8f3e9]">
        <header className="border-b border-[#8C7762]/20 bg-white/90 backdrop-blur-md sticky top-0 z-30">
          <div className="max-w-6xl mx-auto px-5 py-4 flex items-center justify-between">
            <Link href="/" className="flex items-center gap-3"><img src="/logocircular.png" alt="SuMate Logo" className="h-11 w-auto object-contain" /><span className="brand-serif font-bold text-xl text-[#1A1A1A]">SuMateCL</span></Link>
            <Link href="/" className="text-xs font-semibold text-[#314235] hover:text-[#8C7762] transition flex items-center gap-1.5">← Volver al catálogo</Link>
          </div>
        </header>
        <main className="flex-1 flex items-center justify-center p-6">
          <div className="max-w-md w-full bg-white rounded-3xl p-8 text-center shadow-lg border border-stone-200">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-[#f8f3e9] flex items-center justify-center text-stone-600"><svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" /></svg></div>
            <h1 className="brand-serif text-2xl font-bold text-stone-900 mb-2">Tu carrito está vacío</h1>
            <p className="text-stone-600 text-sm mb-6 leading-relaxed">Aún no has añadido mates o accesorios a tu orden de compra. Explora nuestro catálogo artesanal para continuar.</p>
            <Link href="/" className="inline-block w-full bg-[#314235] hover:bg-[#243127] text-white font-bold py-3.5 px-6 rounded-full transition shadow-md text-sm">Ir a ver productos</Link>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="site-shell min-h-screen flex flex-col bg-[#f8f3e9]">
      <header className="border-b border-[#8C7762]/20 bg-white/90 backdrop-blur-md sticky top-0 z-30">
        <div className="max-w-6xl mx-auto px-5 sm:px-8 py-3.5 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3 group">
            <img src="/logocircular.png" alt="SuMate Logo" className="h-11 w-auto object-contain transition-transform group-hover:scale-105" />
            <div>
              <span className="block brand-serif font-bold tracking-tight text-lg leading-none text-[#1A1A1A]">SuMateCL</span>
              <span className="block mt-0.5 text-[9px] uppercase tracking-[0.2em] text-[#8C7762] font-bold">Confirmación de Pago</span>
            </div>
          </Link>
          <div className="flex items-center gap-4 text-xs">
            <div className="hidden sm:flex items-center gap-2 text-stone-600 bg-[#f8f3e9] px-3 py-1.5 rounded-full border border-stone-200">
              <svg className="w-3.5 h-3.5 text-[#314235]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
              <span className="text-[#314235] font-bold">Compra Segura</span><span>·</span><span>Envío a todo Chile</span>
            </div>
            <Link href="/" className="font-semibold text-stone-600 hover:text-[#314235] transition flex items-center gap-1">← <span className="hidden xs:inline">Volver a la</span> tienda</Link>
          </div>
        </div>
      </header>

      <section className="bg-white border-b border-stone-200 py-3 px-5">
        <div className="max-w-6xl mx-auto flex items-center justify-center gap-2 sm:gap-4 text-xs font-semibold">
          <div className="flex items-center gap-1.5 text-emerald-700"><span className="w-5 h-5 rounded-full bg-emerald-100 flex items-center justify-center text-[10px] font-bold">✓</span><span>Carrito</span></div><span className="text-stone-300">──</span>
          <div className="flex items-center gap-1.5 text-[#314235] font-bold"><span className="w-5 h-5 rounded-full bg-[#314235] text-white flex items-center justify-center text-[10px]">2</span><span>Despacho & Ubicación</span></div><span className="text-stone-300">──</span>
          <div className="flex items-center gap-1.5 text-[#8C7762]"><span className="w-5 h-5 rounded-full bg-[#8C7762]/20 text-[#8C7762] flex items-center justify-center text-[10px]">3</span><span>Método de Pago</span></div>
        </div>
      </section>

      <main className="max-w-6xl mx-auto px-4 sm:px-8 py-8 sm:py-12 flex-1 w-full">
        <div className="mb-8">
          <h1 className="brand-serif text-2xl sm:text-3xl font-bold text-stone-900">Revisión y Confirmación de Pedido</h1>
          <p className="text-stone-600 text-sm mt-1">Verifica la ubicación de despacho, el detalle de tus productos y el método de pago seleccionado.</p>
        </div>

        <form noValidate onSubmit={handleConfirmarPedido} className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          <div className="lg:col-span-7 space-y-8">
            <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-sm border border-stone-200">
              <div className="flex items-center justify-between pb-4 border-b border-stone-100 mb-6">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-2xl bg-[#314235]/10 text-[#314235] flex items-center justify-center"><svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg></div>
                  <div><h2 className="font-bold text-stone-900 text-base sm:text-lg">Ubicación a donde se enviará</h2><p className="text-xs text-stone-500">Despacho a domicilio en todo el territorio nacional</p></div>
                </div>
                <span className="text-[11px] font-bold text-emerald-800 bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-full">Tarifa Fija: $2.650 CLP</span>
              </div>

              <div className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="campo-nombre" className={`block text-xs font-bold uppercase tracking-wider mb-1.5 transition-colors ${errores.nombre ? 'text-red-600' : 'text-stone-600'}`}>Nombre y Apellido *</label>
                    <input id="campo-nombre" type="text" placeholder="Ej: Matías González" value={nombre} onChange={(e) => { setNombre(e.target.value); if (errores.nombre) setErrores((prev) => ({ ...prev, nombre: undefined })); }} className={`w-full text-sm rounded-xl border px-3.5 py-2.5 outline-none transition ${errores.nombre ? 'border-red-500 bg-red-50/20 text-stone-900 focus:border-red-600 focus:ring-1 focus:ring-red-500' : 'border-stone-300 focus:border-[#314235] focus:ring-1 focus:ring-[#314235]'}`} />
                    {errores.nombre && (<p className="mt-1 text-xs text-red-600 font-medium flex items-center gap-1"><svg className="w-3.5 h-3.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg><span>{errores.nombre}</span></p>)}
                  </div>
                  <div>
                    <label htmlFor="campo-telefono" className={`block text-xs font-bold uppercase tracking-wider mb-1.5 transition-colors ${errores.telefono ? 'text-red-600' : 'text-stone-600'}`}>Teléfono de Contacto *</label>
                    <input id="campo-telefono" type="tel" placeholder="Ej: 912345678" value={telefono} onChange={(e) => { setTelefono(e.target.value); if (errores.telefono) setErrores((prev) => ({ ...prev, telefono: undefined })); }} className={`w-full text-sm rounded-xl border px-3.5 py-2.5 outline-none transition ${errores.telefono ? 'border-red-500 bg-red-50/20 text-stone-900 focus:border-red-600 focus:ring-1 focus:ring-red-500' : 'border-stone-300 focus:border-[#314235] focus:ring-1 focus:ring-[#314235]'}`} />
                    {errores.telefono && (<p className="mt-1 text-xs text-red-600 font-medium flex items-center gap-1"><svg className="w-3.5 h-3.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg><span>{errores.telefono}</span></p>)}
                  </div>
                </div>

                <div>
                  <label htmlFor="campo-email" className={`block text-xs font-bold uppercase tracking-wider mb-1.5 transition-colors ${errores.email ? 'text-red-600' : 'text-stone-600'}`}>Correo Electrónico *</label>
                  <input id="campo-email" type="email" placeholder="correo@ejemplo.cl" value={email} onChange={(e) => { setEmail(e.target.value); if (errores.email) setErrores((prev) => ({ ...prev, email: undefined })); }} className={`w-full text-sm rounded-xl border px-3.5 py-2.5 outline-none transition ${errores.email ? 'border-red-500 bg-red-50/20 text-stone-900 focus:border-red-600 focus:ring-1 focus:ring-red-500' : 'border-stone-300 focus:border-[#314235] focus:ring-1 focus:ring-[#314235]'}`} />
                  {errores.email && (<p className="mt-1 text-xs text-red-600 font-medium flex items-center gap-1"><svg className="w-3.5 h-3.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg><span>{errores.email}</span></p>)}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-stone-600 mb-1.5">Región *</label>
                    <select value={region} onChange={(e) => setRegion(e.target.value)} className="w-full text-sm rounded-xl border border-stone-300 px-3.5 py-2.5 outline-none focus:border-[#314235] focus:ring-1 focus:ring-[#314235] transition bg-white">
                      {REGIONES_CHILE.map((reg) => (<option key={reg} value={reg}>{reg}</option>))}
                    </select>
                  </div>
                  <div>
                    <label htmlFor="campo-comuna" className={`block text-xs font-bold uppercase tracking-wider mb-1.5 transition-colors ${errores.comuna ? 'text-red-600' : 'text-stone-600'}`}>Comuna / Ciudad *</label>
                    <input id="campo-comuna" type="text" placeholder="Ej: Providencia" value={comuna} onChange={(e) => { setComuna(e.target.value); if (errores.comuna) setErrores((prev) => ({ ...prev, comuna: undefined })); }} className={`w-full text-sm rounded-xl border px-3.5 py-2.5 outline-none transition ${errores.comuna ? 'border-red-500 bg-red-50/20 text-stone-900 focus:border-red-600 focus:ring-1 focus:ring-red-500' : 'border-stone-300 focus:border-[#314235] focus:ring-1 focus:ring-[#314235]'}`} />
                    {errores.comuna && (<p className="mt-1 text-xs text-red-600 font-medium flex items-center gap-1"><svg className="w-3.5 h-3.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg><span>{errores.comuna}</span></p>)}
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="sm:col-span-2">
                    <label htmlFor="campo-direccion" className={`block text-xs font-bold uppercase tracking-wider mb-1.5 transition-colors ${errores.direccion ? 'text-red-600' : 'text-stone-600'}`}>Calle y Número *</label>
                    <input id="campo-direccion" type="text" placeholder="Ej: Av. Providencia 1234" value={direccion} onChange={(e) => { setDireccion(e.target.value); if (errores.direccion) setErrores((prev) => ({ ...prev, direccion: undefined })); }} className={`w-full text-sm rounded-xl border px-3.5 py-2.5 outline-none transition ${errores.direccion ? 'border-red-500 bg-red-50/20 text-stone-900 focus:border-red-600 focus:ring-1 focus:ring-red-500' : 'border-stone-300 focus:border-[#314235] focus:ring-1 focus:ring-[#314235]'}`} />
                    {errores.direccion && (<p className="mt-1 text-xs text-red-600 font-medium flex items-center gap-1"><svg className="w-3.5 h-3.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg><span>{errores.direccion}</span></p>)}
                  </div>
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-stone-600 mb-1.5">Depto / Casa <span className="text-stone-400 font-normal">(Opcional)</span></label>
                    <input type="text" placeholder="Ej: Depto 502" value={depto} onChange={(e) => setDepto(e.target.value)} className="w-full text-sm rounded-xl border border-stone-300 px-3.5 py-2.5 outline-none focus:border-[#314235] focus:ring-1 focus:ring-[#314235] transition" />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-stone-600 mb-1.5">Instrucciones de entrega <span className="text-stone-400 font-normal">(Opcional)</span></label>
                  <textarea rows={2} placeholder="Ej: Dejar en conserjería..." value={instrucciones} onChange={(e) => setInstrucciones(e.target.value)} className="w-full text-sm rounded-xl border border-stone-300 px-3.5 py-2 outline-none focus:border-[#314235] focus:ring-1 focus:ring-[#314235] transition resize-none" />
                </div>
              </div>
            </div>

            <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-sm border border-stone-200">
              <div className="flex items-center justify-between pb-4 border-b border-stone-100 mb-6">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-2xl bg-[#8C7762]/15 text-[#8C7762] flex items-center justify-center"><svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" /></svg></div>
                  <div><h2 className="font-bold text-stone-900 text-base sm:text-lg">Método de Pago</h2><p className="text-xs text-stone-500">Selecciona cómo deseas pagar tu compra</p></div>
                </div>
              </div>

              <div className="space-y-4">
                {/* WEBPAY (AHORA ES EL PRINCIPAL) */}
                <div onClick={() => setMetodoPago('webpay')} className={`p-4 rounded-2xl border-2 cursor-pointer transition-all ${metodoPago === 'webpay' ? 'border-[#E31B23] bg-[#E31B23]/5 shadow-sm ring-2 ring-[#E31B23]/15' : 'border-stone-200 hover:border-stone-300'}`}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-4 h-4 rounded-full border-2 border-stone-300 flex items-center justify-center">{metodoPago === 'webpay' && (<div className="w-2 h-2 rounded-full bg-[#E31B23]" />)}</div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-sm text-stone-900">Webpay Plus (Transbank)</span>
                          <span className="text-[10px] font-bold bg-[#E31B23] text-white px-2 py-0.5 rounded-md uppercase">Modo Prueba</span>
                        </div>
                        <p className="text-xs text-stone-500 mt-0.5">Redcompra, débito y crédito a través de Transbank.</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* MERCADO PAGO */}
                <div onClick={() => setMetodoPago('mercadopago')} className={`p-4 rounded-2xl border-2 cursor-pointer transition-all ${metodoPago === 'mercadopago' ? 'border-[#009EE3] bg-[#009EE3]/5 shadow-sm ring-2 ring-[#009EE3]/15' : 'border-stone-200 hover:border-stone-300'}`}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-4 h-4 rounded-full border-2 border-stone-300 flex items-center justify-center">{metodoPago === 'mercadopago' && (<div className="w-2 h-2 rounded-full bg-[#009EE3]" />)}</div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-sm text-stone-900">Mercado Pago</span>
                          <span className="text-[10px] font-bold bg-[#009EE3] text-white px-2 py-0.5 rounded-md uppercase">Próximamente</span>
                        </div>
                        <p className="text-xs text-stone-500 mt-0.5">Tarjetas de crédito, débito y dinero en cuenta.</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* COLUMNA DERECHA */}
          <div className="lg:col-span-5 sticky top-24 space-y-6">
            <div className="bg-white rounded-3xl p-6 shadow-sm border border-stone-200">
              <div className="flex items-center justify-between pb-4 border-b border-stone-100">
                <h2 className="font-bold text-stone-900 text-lg brand-serif">Detalle del Pedido</h2>
                <span className="text-xs font-bold text-[#8C7762] bg-[#8C7762]/10 px-3 py-1 rounded-full">{totalProductos} {totalProductos === 1 ? 'producto' : 'productos'}</span>
              </div>

              <div className="divide-y divide-stone-100 my-4 max-h-[380px] overflow-y-auto pr-1">
                {carrito.map((item) => (
                  <div key={item.id} className="py-3.5 flex items-center gap-3">
                    <img src={item.imagen} alt={item.nombre} className="w-14 h-14 object-cover rounded-xl border border-stone-200 shrink-0" onError={(e) => { (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1597481499750-3e6b22637e12?auto=format&fit=crop&w=200&q=80'; }} />
                    <div className="flex-1 min-w-0">
                      <h3 className="text-xs font-bold text-stone-900 truncate">{item.nombre}</h3>
                      <p className="text-[11px] text-stone-500">{formatearPrecio(item.precio)} c/u</p>
                      <div className="flex items-center gap-2 mt-1.5">
                        {actualizarCantidad && (
                          <div className="flex items-center border border-stone-200 rounded-lg bg-stone-50 text-xs">
                            <button type="button" onClick={() => actualizarCantidad(item.id, -1)} className="px-2 py-0.5 text-stone-600 hover:text-black font-bold cursor-pointer">-</button>
                            <span className="px-2 font-bold text-stone-800 text-xs">{item.cantidad}</span>
                            <button type="button" onClick={() => actualizarCantidad(item.id, 1)} className="px-2 py-0.5 text-stone-600 hover:text-black font-bold cursor-pointer">+</button>
                          </div>
                        )}
                        <button type="button" onClick={() => eliminarDelCarrito(item.id)} className="text-[10px] text-red-500 hover:underline cursor-pointer ml-1">Quitar</button>
                      </div>
                    </div>
                    <div className="text-right"><span className="text-xs font-bold text-stone-900 block">{formatearPrecio(item.precio * item.cantidad)}</span></div>
                  </div>
                ))}
              </div>

              <div className="border-t border-stone-100 pt-4 space-y-2.5 text-xs">
                <div className="flex justify-between text-stone-600"><span>Subtotal productos:</span><span className="font-semibold text-stone-900">{formatearPrecio(total)}</span></div>
                <div className="flex justify-between items-center text-stone-600"><div className="flex items-center gap-1.5"><span>Despacho a domicilio:</span><span className="bg-emerald-100 text-emerald-800 text-[10px] font-bold px-1.5 py-0.5 rounded">Fijo</span></div><span className="font-bold text-emerald-800">{formatearPrecio(COSTO_ENVIO_FIJO)}</span></div>
                <div className="border-t border-stone-200 pt-3.5 mt-2 flex justify-between items-baseline"><div><span className="text-sm font-bold text-stone-900 block">Total a Pagar</span><span className="text-[10px] text-stone-500">IVA y despacho incluidos</span></div><span className="text-xl font-bold text-[#314235] brand-serif">{formatearPrecio(totalFinal)}</span></div>
              </div>

              {Object.keys(errores).length > 0 && (
                <div className="mt-4 p-3.5 rounded-2xl bg-red-50 border border-red-200 text-xs text-red-700 flex items-start gap-2.5"><svg className="w-4 h-4 text-red-600 shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg><div><span className="font-bold block">Faltan campos por completar</span><span>Revisa los campos destacados en rojo.</span></div></div>
              )}

              {/* BOTON DE PAGO: CAMBIA SU TEXTO SI ESTÁ CARGANDO */}
              <button
                type="submit"
                disabled={carrito.length === 0 || procesandoPago}
                className="mt-6 w-full bg-[#314235] hover:bg-[#243127] text-white py-4 rounded-full font-bold text-sm transition shadow-lg hover:shadow-xl disabled:bg-stone-400 cursor-pointer flex items-center justify-center gap-2"
              >
                <span>{procesandoPago ? 'Conectando con Webpay...' : metodoPago === 'webpay' ? 'Pagar con Webpay Plus' : 'Confirmar Pedido'}</span>
                {!procesandoPago && <span>→</span>}
              </button>
            </div>
          </div>
        </form>
      </main>

      {/* MODAL DE CONFIRMACIÓN (SOLO SI ES MERCADO PAGO / MANUAL) */}
      {mostrarModalExito && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-2xl border border-stone-200">
            <div className="w-14 h-14 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center text-2xl mx-auto mb-4">✓</div>
            <h3 className="brand-serif text-2xl font-bold text-stone-900 text-center mb-1">¡Pedido Registrado con Éxito!</h3>
            <p className="text-center text-xs text-stone-500 mb-6">Código de referencia: <span className="font-bold text-stone-800">{numeroPedido}</span></p>
            <button onClick={() => { if (limpiarCarrito) limpiarCarrito(); setMostrarModalExito(false); router.push('/'); }} className="w-full bg-stone-100 hover:bg-stone-200 text-stone-700 font-bold py-3 rounded-full text-sm transition cursor-pointer">Volver a la tienda</button>
          </div>
        </div>
      )}
    </div>
  );
}