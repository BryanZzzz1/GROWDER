/* eslint-disable @next/next/no-img-element */
"use client";

import {
  Suspense,
  useEffect,
  useMemo,
  useState,
} from "react";

import Link from "next/link";

import {
  useRouter,
  useSearchParams,
} from "next/navigation";

import type { User } from "@supabase/supabase-js";

import { supabase } from "@/src/lib/supabase";

import {
  usarCarrito,
  type ItemCarrito,
} from "@/app/datoscarro/estadocarro";

import SubNavbar, {
  type CategoriaBD,
} from "@/app/components/SubNavbar";

import BarraBusquedaNav from "@/app/components/BarraBusquedaNav";

/* =========================================================
   TIPOS
========================================================= */

interface Producto {
  idproducto: number;
  nombre: string;
  descripcion: string;
  precio: number;
  cantidad: number;
  activo: boolean;
  categoria?: string;
  categoria_id?: number | null;
  foto?: string;
}

interface ImagenDB {
  id?: number;
  url?: string;
  productoid?: number;
  idproducto?: number;
}

interface BannerSlide {
  imagen: string;
  alt: string;
}

/* =========================================================
   BANNERS DEL CARRUSEL

   IMPORTANTE:
   Aquí SOLO van imágenes publicitarias.

   NO productos de Supabase.
========================================================= */

const BANNERS: BannerSlide[] = [
  {
    imagen: "/banners/envio-50.png",
    alt: "50% de descuento en tu primer envío - SuMateCL",
  },

  /*
  Cuando tengas otro banner, simplemente agregas:

  {
    imagen: "/banners/banner-2.png",
    alt: "Nueva promoción SuMateCL",
  },

  {
    imagen: "/banners/banner-3.png",
    alt: "Productos destacados SuMateCL",
  },
  */
];

/* =========================================================
   HOME
========================================================= */

function ContenidoHome() {
  const router = useRouter();

  const searchParams =
    useSearchParams();

  const paramCat =
    searchParams.get("categoria") ||
    "todos";

  const paramQ =
    searchParams.get("q") || "";

  /* =======================================================
     PRODUCTOS
  ======================================================= */

  const [
    productos,
    setProductos,
  ] = useState<Producto[]>([]);

  const [
    cargando,
    setCargando,
  ] = useState(true);

  /* =======================================================
     USUARIO
  ======================================================= */

  const [
    usuario,
    setUsuario,
  ] = useState<User | null>(null);

  const [
    isAdminLocal,
    setIsAdminLocal,
  ] = useState(false);

  /* =======================================================
     CARRITO
  ======================================================= */

  const {
    carrito,
    carritoAbierto,
    setCarritoAbierto,
    eliminarDelCarrito,
    total,
  } = usarCarrito();

  /* =======================================================
     CATEGORIAS
  ======================================================= */

  const [
    categoriasBD,
    setCategoriasBD,
  ] = useState<CategoriaBD[]>([]);

  const [
    categoriaActiva,
    setCategoriaActiva,
  ] = useState<
    string | number
  >(paramCat);

  const [
    busquedaNav,
    setBusquedaNav,
  ] = useState(paramQ);

  /* =======================================================
     CARRUSEL
  ======================================================= */

  const [
    slideActivo,
    setSlideActivo,
  ] = useState(0);

  /* =======================================================
     PARAMETROS URL
  ======================================================= */

  const [
    prevParams,
    setPrevParams,
  ] = useState(searchParams);

  if (
    searchParams !== prevParams
  ) {
    setPrevParams(searchParams);

    if (
      searchParams.get(
        "categoria"
      )
    ) {
      setCategoriaActiva(
        searchParams.get(
          "categoria"
        )!
      );
    }

    if (
      searchParams.get("q")
    ) {
      setBusquedaNav(
        searchParams.get("q")!
      );
    }
  }

  /* =======================================================
     NOMBRE CATEGORIA
  ======================================================= */

  const nombreCategoriaActiva =
    useMemo(() => {
      if (
        String(
          categoriaActiva
        ) === "todos"
      ) {
        return "Todos los Productos";
      }

      const encontrada =
        categoriasBD.find(
          (categoria) =>
            String(
              categoria.id
            ) ===
            String(
              categoriaActiva
            )
        );

      return encontrada
        ? encontrada.nombre
        : "Todos los Productos";
    }, [
      categoriaActiva,
      categoriasBD,
    ]);

  /* =======================================================
     TOTAL PRODUCTOS CARRITO
  ======================================================= */

  const totalProductos =
    carrito.reduce(
      (
        acumulado,
        item
      ) =>
        acumulado +
        item.cantidad,
      0
    );

  /* =======================================================
     CARGAR CATALOGO
  ======================================================= */

  useEffect(() => {
    async function cargarCatalogo() {
      setCargando(true);

      try {
        const {
          data:
            dataProductos,

          error:
            errorProductos,
        } = await supabase
          .from("producto")
          .select("*")
          .eq(
            "activo",
            true
          )
          .order(
            "idproducto",
            {
              ascending:
                false,
            }
          );

        if (
          errorProductos
        ) {
          throw errorProductos;
        }

        /* CATEGORIAS */

        const {
          data:
            dataCategorias,
        } = await supabase
          .from("categorias")
          .select(
            "id, nombre, descripcion, activo"
          )
          .eq(
            "activo",
            true
          )
          .order("id", {
            ascending:
              true,
          });

        if (
          dataCategorias &&
          dataCategorias.length >
            0
        ) {
          setCategoriasBD(
            dataCategorias
          );
        }

        /* IMAGENES */

        const {
          data:
            dataImagenes,
        } = await supabase
          .from("imagenes")
          .select("*");

        const productosConFoto =
          (
            (dataProductos as Producto[]) ||
            []
          ).map(
            (
              producto
            ) => {
              const fotoEncontrada =
                (
                  (dataImagenes as ImagenDB[]) ||
                  []
                ).find(
                  (
                    imagen
                  ) =>
                    imagen.productoid ===
                      producto.idproducto ||
                    imagen.idproducto ===
                      producto.idproducto
                );

              return {
                ...producto,

                foto:
                  fotoEncontrada
                    ? fotoEncontrada.url
                    : producto.foto,

                categoria:
                  producto.categoria ||
                  "Mates Artesanales",
              };
            }
          );

        setProductos(
          productosConFoto
        );
      } catch (error) {
        console.error(
          "Error al cargar catálogo:",
          error
        );
      } finally {
        setCargando(
          false
        );
      }
    }

    void cargarCatalogo();
  }, []);

  /* =======================================================
     SESION
  ======================================================= */

  useEffect(() => {
    async function revisarSesion() {
      const {
        data: {
          session,
        },
      } =
        await supabase.auth.getSession();

      setUsuario(
        session?.user ??
          null
      );

      if (
        session?.user
      ) {
        const {
          data,
        } = await supabase
          .from("usuario")
          .select(
            "rol_id, activo"
          )
          .eq(
            "id",
            session.user.id
          )
          .single();

        if (
          data &&
          data.activo &&
          (data.rol_id ===
            1 ||
            data.rol_id ===
              2)
        ) {
          setIsAdminLocal(
            true
          );
        }
      }
    }

    void revisarSesion();

    const {
      data: {
        subscription,
      },
    } =
      supabase.auth.onAuthStateChange(
        (
          _event,
          session
        ) => {
          setUsuario(
            session?.user ??
              null
          );

          if (!session) {
            setIsAdminLocal(
              false
            );
          }
        }
      );

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  /* =======================================================
     FORMATO PRECIO
  ======================================================= */

  const formatearPrecio = (
    valor: number
  ) => {
    return new Intl.NumberFormat(
      "es-CL",
      {
        style:
          "currency",

        currency:
          "CLP",

        maximumFractionDigits: 0,
      }
    ).format(valor);
  };

  /* =======================================================
     CARRUSEL AUTOMATICO

     Solo funciona cuando hay
     más de un banner.
  ======================================================= */

  useEffect(() => {
    if (
      BANNERS.length <=
      1
    ) {
      return;
    }

    const intervalo =
      window.setInterval(
        () => {
          setSlideActivo(
            (
              actual
            ) =>
              (actual +
                1) %
              BANNERS.length
          );
        },
        5500
      );

    return () => {
      window.clearInterval(
        intervalo
      );
    };
  }, []);

  const slideAnterior =
    () => {
      setSlideActivo(
        (
          actual
        ) =>
          (actual -
            1 +
            BANNERS.length) %
          BANNERS.length
      );
    };

  const slideSiguiente =
    () => {
      setSlideActivo(
        (
          actual
        ) =>
          (actual +
            1) %
          BANNERS.length
      );
    };

  const bannerActual =
    BANNERS[
      slideActivo
    ] ?? BANNERS[0];

  /* =======================================================
     SCROLL CATALOGO
  ======================================================= */

  const handleSeleccionarCategoria =
    (
      categoriaId:
        | string
        | number
    ) => {
      setCategoriaActiva(
        categoriaId
      );

      const elemento =
        document.getElementById(
          "seccion-catalogo"
        ) ||
        document.getElementById(
          "product-grid"
        );

      if (elemento) {
        elemento.scrollIntoView(
          {
            behavior:
              "smooth",

            block:
              "start",
          }
        );
      }
    };

  /* =======================================================
     FILTRAR PRODUCTOS
  ======================================================= */

  const productosFiltrados =
    productos.filter(
      (
        producto
      ) => {
        /* BUSQUEDA */

        if (
          busquedaNav.trim()
        ) {
          const consulta =
            busquedaNav
              .toLowerCase()
              .trim();

          const texto = `
            ${
              producto.nombre ||
              ""
            }
            ${
              producto.descripcion ||
              ""
            }
            ${
              producto.categoria ||
              ""
            }
          `.toLowerCase();

          if (
            !texto.includes(
              consulta
            )
          ) {
            return false;
          }
        }

        /* TODOS */

        if (
          String(
            categoriaActiva
          ) ===
          "todos"
        ) {
          return true;
        }

        /* ID CATEGORIA */

        if (
          producto.categoria_id &&
          String(
            producto.categoria_id
          ) ===
            String(
              categoriaActiva
            )
        ) {
          return true;
        }

        const categoriaEncontrada =
          categoriasBD.find(
            (
              categoria
            ) =>
              String(
                categoria.id
              ) ===
              String(
                categoriaActiva
              )
          );

        const nombreFiltro =
          (
            categoriaEncontrada
              ? categoriaEncontrada.nombre
              : String(
                  categoriaActiva
                )
          ).toLowerCase();

        const categoriaProducto =
          (
            producto.categoria ||
            ""
          ).toLowerCase();

        if (
          categoriaProducto &&
          (categoriaProducto ===
            nombreFiltro ||
            categoriaProducto.includes(
              nombreFiltro
            ) ||
            nombreFiltro.includes(
              categoriaProducto
            ))
        ) {
          return true;
        }

        const texto = `
          ${
            producto.nombre ||
            ""
          }
          ${
            producto.descripcion ||
            ""
          }
          ${
            producto.categoria ||
            ""
          }
        `.toLowerCase();

        /* MATES */

        if (
          nombreFiltro.includes(
            "mate"
          )
        ) {
          const subTermino =
            nombreFiltro
              .replace(
                "mates",
                ""
              )
              .replace(
                "mate",
                ""
              )
              .trim();

          if (
            subTermino.length >
              2 &&
            texto.includes(
              subTermino
            )
          ) {
            return true;
          }

          return (
            texto.includes(
              "mate"
            ) ||
            texto.includes(
              "torpedo"
            ) ||
            texto.includes(
              "camionero"
            ) ||
            texto.includes(
              "imperial"
            ) ||
            texto.includes(
              "algarrobo"
            )
          );
        }

        /* CALABAZA */

        if (
          nombreFiltro.includes(
            "calabaza"
          ) ||
          nombreFiltro.includes(
            "porongo"
          )
        ) {
          return (
            texto.includes(
              "calabaza"
            ) ||
            texto.includes(
              "porongo"
            ) ||
            texto.includes(
              "uruguay"
            )
          );
        }

        /* BOMBILLAS */

        if (
          nombreFiltro.includes(
            "bombilla"
          )
        ) {
          return (
            texto.includes(
              "bombill"
            ) ||
            texto.includes(
              "pico loro"
            ) ||
            texto.includes(
              "alpaca"
            ) ||
            texto.includes(
              "acero"
            ) ||
            texto.includes(
              "resorte"
            )
          );
        }

        /* TERMOS */

        if (
          nombreFiltro.includes(
            "termo"
          ) ||
          nombreFiltro.includes(
            "matera"
          )
        ) {
          return (
            texto.includes(
              "termo"
            ) ||
            texto.includes(
              "matera"
            ) ||
            texto.includes(
              "bolso"
            ) ||
            texto.includes(
              "canasta"
            ) ||
            texto.includes(
              "botell"
            )
          );
        }

        /* ACCESORIOS */

        if (
          nombreFiltro.includes(
            "accesorio"
          ) ||
          nombreFiltro.includes(
            "limpieza"
          )
        ) {
          return (
            texto.includes(
              "accesorio"
            ) ||
            texto.includes(
              "yerbera"
            ) ||
            texto.includes(
              "despolvillador"
            ) ||
            texto.includes(
              "cepillo"
            ) ||
            texto.includes(
              "limpieza"
            )
          );
        }

        return texto.includes(
          nombreFiltro
        );
      }
    );

  /* =======================================================
     CONTEO CATEGORIAS
  ======================================================= */

  const conteoPorCategoria =
    useMemo(() => {
      const mapa: {
        [key:
          | string
          | number]: number;
      } = {
        todos:
          productos.length,
      };

      categoriasBD.forEach(
        (
          categoria
        ) => {
          const nombreCategoria =
            categoria.nombre.toLowerCase();

          const cantidad =
            productos.filter(
              (
                producto
              ) => {
                if (
                  producto.categoria_id &&
                  String(
                    producto.categoria_id
                  ) ===
                    String(
                      categoria.id
                    )
                ) {
                  return true;
                }

                const categoriaProducto =
                  (
                    producto.categoria ||
                    ""
                  ).toLowerCase();

                if (
                  categoriaProducto &&
                  (categoriaProducto ===
                    nombreCategoria ||
                    categoriaProducto.includes(
                      nombreCategoria
                    ) ||
                    nombreCategoria.includes(
                      categoriaProducto
                    ))
                ) {
                  return true;
                }

                const texto = `
                  ${
                    producto.nombre ||
                    ""
                  }
                  ${
                    producto.descripcion ||
                    ""
                  }
                  ${
                    producto.categoria ||
                    ""
                  }
                `.toLowerCase();

                if (
                  nombreCategoria.includes(
                    "mate"
                  )
                ) {
                  const subTermino =
                    nombreCategoria
                      .replace(
                        "mates",
                        ""
                      )
                      .replace(
                        "mate",
                        ""
                      )
                      .trim();

                  if (
                    subTermino.length >
                      2 &&
                    texto.includes(
                      subTermino
                    )
                  ) {
                    return true;
                  }

                  return (
                    texto.includes(
                      "mate"
                    ) ||
                    texto.includes(
                      "torpedo"
                    ) ||
                    texto.includes(
                      "camionero"
                    ) ||
                    texto.includes(
                      "imperial"
                    )
                  );
                }

                if (
                  nombreCategoria.includes(
                    "calabaza"
                  )
                ) {
                  return (
                    texto.includes(
                      "calabaza"
                    ) ||
                    texto.includes(
                      "porongo"
                    )
                  );
                }

                if (
                  nombreCategoria.includes(
                    "bombilla"
                  )
                ) {
                  return (
                    texto.includes(
                      "bombill"
                    ) ||
                    texto.includes(
                      "pico loro"
                    )
                  );
                }

                if (
                  nombreCategoria.includes(
                    "termo"
                  ) ||
                  nombreCategoria.includes(
                    "matera"
                  )
                ) {
                  return (
                    texto.includes(
                      "termo"
                    ) ||
                    texto.includes(
                      "matera"
                    ) ||
                    texto.includes(
                      "botell"
                    )
                  );
                }

                if (
                  nombreCategoria.includes(
                    "accesorio"
                  )
                ) {
                  return (
                    texto.includes(
                      "accesorio"
                    ) ||
                    texto.includes(
                      "yerbera"
                    ) ||
                    texto.includes(
                      "limpieza"
                    )
                  );
                }

                return texto.includes(
                  nombreCategoria
                );
              }
            ).length;

          mapa[
            categoria.id
          ] = cantidad;

          mapa[
            categoria.nombre
          ] = cantidad;
        }
      );

      return mapa;
    }, [
      productos,
      categoriasBD,
    ]);

  /* =======================================================
     RENDER
  ======================================================= */

  return (
    <div className="site-shell flex min-h-screen flex-col bg-[#f8f4eb]">
      {/* ===================================================
          HEADER
      ==================================================== */}

      <header className="sticky top-0 z-30 w-full border-b border-[#8C7762]/20 bg-white/95 backdrop-blur-md">
        <div className="mx-auto flex w-full max-w-7xl items-center justify-between gap-3 px-4 py-3 sm:gap-5 sm:px-8">
          {/* LOGO */}

          <Link
            href="/"
            className="group flex shrink-0 items-center gap-3 text-left"
          >
            <img
              src="/logocircular.png"
              alt="SuMate Logo"
              className="h-11 w-auto object-contain transition-transform group-hover:scale-105 sm:h-14"
            />

            <div className="hidden lg:block">
              <span className="brand-serif block text-xl font-bold leading-none tracking-tight text-[#1A1A1A]">
                SuMateCL
              </span>

              <span className="mt-1 block text-[10px] font-semibold uppercase tracking-[0.22em] text-[#8C7762]">
                Más que un mate, una experiencia
              </span>
            </div>
          </Link>

          {/* BUSCADOR */}

          <div className="mx-2 min-w-[200px] max-w-lg flex-1 sm:mx-4 sm:min-w-[280px]">
            <BarraBusquedaNav
              valorInicial={
                busquedaNav
              }
              alCambiarTexto={(
                valor
              ) =>
                setBusquedaNav(
                  valor
                )
              }
              alBuscar={(
                termino
              ) => {
                const consulta =
                  termino.trim();

                if (
                  consulta
                ) {
                  router.push(
                    `/buscar?q=${encodeURIComponent(
                      consulta
                    )}`
                  );
                } else {
                  router.push(
                    "/buscar"
                  );
                }
              }}
              placeholder="Buscar mates, bombillas, termos..."
            />
          </div>

          {/* ACCIONES */}

          <div className="flex shrink-0 items-center gap-2 sm:gap-3">
            {/* CARRITO */}

            <div className="group relative">
              <button
                onClick={() =>
                  setCarritoAbierto(
                    !carritoAbierto
                  )
                }
                className="flex cursor-pointer items-center gap-2 rounded-full border border-[#8C7762] px-3 py-1.5 text-xs font-bold text-[#8C7762] transition hover:bg-[#8C7762]/10"
                aria-label="Abrir carrito"
              >
                <span className="hidden sm:inline">
                  $
                  {(
                    total ||
                    0
                  ).toLocaleString(
                    "es-CL"
                  )}
                </span>

                <div className="relative flex items-center">
                  <svg
                    width="18"
                    height="18"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <circle
                      cx="8"
                      cy="21"
                      r="1"
                    />

                    <circle
                      cx="19"
                      cy="21"
                      r="1"
                    />

                    <path d="M2.05 2.05h2l2.66 12.42a2 2 0 0 0 2 1.58h9.78a2 2 0 0 0 1.95-1.57l1.65-7.43H5.12" />
                  </svg>

                  {totalProductos >
                    0 && (
                    <span className="-ml-1 -mt-2 flex h-4 w-4 items-center justify-center rounded-full bg-[#8C7762] text-[10px] font-bold text-white">
                      {
                        totalProductos
                      }
                    </span>
                  )}
                </div>
              </button>

              {/* MINI CARRITO */}

              <div className="absolute right-0 top-full z-50 mt-2 hidden w-72 rounded-2xl border border-stone-200 bg-white p-4 shadow-xl transition-all group-hover:block">
                {carrito.length ===
                0 ? (
                  <p className="py-3 text-center text-xs text-stone-500">
                    El carrito está vacío
                  </p>
                ) : (
                  <>
                    <div className="max-h-48 space-y-3 overflow-y-auto pr-1">
                      {carrito.map(
                        (
                          item: ItemCarrito
                        ) => (
                          <div
                            key={
                              item.id
                            }
                            className="flex items-center justify-between gap-2 border-b border-stone-100 pb-2 text-xs"
                          >
                            <img
                              src={
                                item.imagen
                              }
                              alt={
                                item.nombre
                              }
                              className="h-9 w-9 rounded-md object-cover"
                            />

                            <div className="min-w-0 flex-1">
                              <p className="truncate font-semibold text-stone-800">
                                {
                                  item.nombre
                                }
                              </p>

                              <p className="text-stone-500">
                                {
                                  item.cantidad
                                }{" "}
                                × $
                                {(
                                  item.precio ||
                                  0
                                ).toLocaleString(
                                  "es-CL"
                                )}
                              </p>
                            </div>

                            {eliminarDelCarrito && (
                              <button
                                onClick={() =>
                                  eliminarDelCarrito(
                                    item.id
                                  )
                                }
                                className="cursor-pointer text-sm font-bold text-stone-400 hover:text-red-500"
                                title="Quitar producto"
                              >
                                ✕
                              </button>
                            )}
                          </div>
                        )
                      )}
                    </div>

                    <div className="my-3 flex items-center justify-between border-t pt-2 text-xs font-bold text-stone-800">
                      <span>
                        Subtotal:
                      </span>

                      <span>
                        $
                        {(
                          total ||
                          0
                        ).toLocaleString(
                          "es-CL"
                        )}
                      </span>
                    </div>

                    <button
                      onClick={() =>
                        setCarritoAbierto(
                          true
                        )
                      }
                      className="w-full cursor-pointer rounded-full border border-[#8C7762] py-2 text-xs font-bold uppercase text-[#8C7762] transition hover:bg-[#8C7762]/10"
                    >
                      Ver carrito
                    </button>
                  </>
                )}
              </div>
            </div>

            {/* CUENTA */}

            {usuario ? (
              <div className="flex items-center gap-2">
                <Link
                  href="/cuenta"
                  className="hidden items-center gap-2 rounded-full border border-[#8C7762]/20 bg-[#f8f3e9] py-1 pl-2.5 pr-3 transition hover:bg-[#efe7d8] xl:flex"
                >
                  <div className="flex h-7 w-7 items-center justify-center rounded-full bg-[#314235] text-xs font-bold uppercase text-white">
                    {usuario.email?.charAt(
                      0
                    )}
                  </div>

                  <div className="max-w-[110px] leading-tight">
                    <p className="text-[9px] font-bold uppercase tracking-wider text-stone-400">
                      Mi cuenta
                    </p>

                    <p className="truncate text-xs font-semibold text-stone-700">
                      {
                        usuario.email
                      }
                    </p>
                  </div>
                </Link>

                <Link
                  href="/mis-compras"
                  className="flex cursor-pointer items-center gap-1.5 rounded-full border border-[#314235]/30 px-3 py-1.5 text-xs font-semibold text-[#314235] transition hover:border-[#314235] hover:bg-[#314235]/5"
                >
                  <svg
                    className="h-3.5 w-3.5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"
                    />
                  </svg>

                  <span className="hidden sm:inline">
                    Mis compras
                  </span>
                </Link>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Link
                  href="/login"
                  className="text-xs font-semibold text-[#8C7762] transition hover:text-[#725F4C]"
                >
                  Iniciar sesión
                </Link>

                <Link
                  href="/registro"
                  className="hidden rounded-full bg-[#314235] px-3.5 py-1.5 text-xs font-semibold text-white transition hover:bg-[#243127] sm:block"
                >
                  Crear cuenta
                </Link>
              </div>
            )}
          </div>
        </div>

        {/* CATEGORIAS */}

        <SubNavbar
          categorias={
            categoriasBD
          }
          categoriaActiva={
            categoriaActiva
          }
          onSeleccionarCategoria={
            handleSeleccionarCategoria
          }
          conteoPorCategoria={
            conteoPorCategoria
          }
        />
      </header>

      {/* ===================================================
          CONTENIDO
      ==================================================== */}

      <main className="flex-1">
        {/* =================================================
            CARRUSEL DE PUBLICIDAD

            SOLO BANNERS.
            NO PRODUCTOS.
        ================================================== */}

        <section className="mx-auto w-full max-w-[1600px] px-3 pb-5 pt-5 sm:px-5 sm:pt-7 lg:px-6">
          <div
            className="relative w-full overflow-hidden rounded-[24px] bg-[#eadbc6] shadow-[0_16px_45px_rgba(53,45,34,0.13)] sm:rounded-[28px]"
            style={{
              aspectRatio:
                "1916 / 821",
            }}
          >
            {/* BANNER */}

            <img
              key={
                bannerActual.imagen
              }
              src={
                bannerActual.imagen
              }
              alt={
                bannerActual.alt
              }
              className="absolute inset-0 h-full w-full object-cover object-center"
            />

            {/* =============================================
                CONTROLES

                Solo aparecen cuando
                tengas 2 o más banners.
            ============================================== */}

            {BANNERS.length >
              1 && (
              <>
                {/* FLECHA IZQUIERDA */}

                <button
                  type="button"
                  onClick={
                    slideAnterior
                  }
                  aria-label="Banner anterior"
                  className="absolute left-4 top-1/2 z-20 hidden h-11 w-11 -translate-y-1/2 cursor-pointer items-center justify-center rounded-full border border-white/40 bg-black/20 text-2xl text-white shadow-lg backdrop-blur-md transition hover:bg-white hover:text-[#314235] md:flex"
                >
                  ‹
                </button>

                {/* FLECHA DERECHA */}

                <button
                  type="button"
                  onClick={
                    slideSiguiente
                  }
                  aria-label="Siguiente banner"
                  className="absolute right-4 top-1/2 z-20 hidden h-11 w-11 -translate-y-1/2 cursor-pointer items-center justify-center rounded-full border border-white/40 bg-black/20 text-2xl text-white shadow-lg backdrop-blur-md transition hover:bg-white hover:text-[#314235] md:flex"
                >
                  ›
                </button>

                {/* PUNTOS */}

                <div className="absolute bottom-5 left-1/2 z-20 flex -translate-x-1/2 items-center gap-2 rounded-full bg-black/25 px-4 py-2 backdrop-blur-md">
                  {BANNERS.map(
                    (
                      _banner,
                      indice
                    ) => (
                      <button
                        key={
                          indice
                        }
                        type="button"
                        aria-label={`Ir al banner ${
                          indice +
                          1
                        }`}
                        onClick={() =>
                          setSlideActivo(
                            indice
                          )
                        }
                        className={`cursor-pointer rounded-full transition-all duration-300 ${
                          indice ===
                          slideActivo
                            ? "h-2.5 w-7 bg-white"
                            : "h-2.5 w-2.5 bg-white/50 hover:bg-white/80"
                        }`}
                      />
                    )
                  )}
                </div>
              </>
            )}
          </div>
        </section>

        {/* =================================================
            CATALOGO

            DESDE AQUI SON PRODUCTOS REALES DE SUPABASE.
        ================================================== */}

        <section
          id="seccion-catalogo"
          className="mx-auto w-full max-w-7xl scroll-mt-28 px-5 pb-16 pt-10 sm:px-8 sm:pt-12"
        >
          {/* CABECERA */}

          <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <p className="text-xs font-bold uppercase tracking-[0.22em] text-[#a75632]">
                  Nuestra tienda
                </p>

                {/* BUSQUEDA ACTIVA */}

                {busquedaNav.trim() && (
                  <>
                    <span className="text-xs text-stone-400">
                      ·
                    </span>

                    <span className="inline-flex items-center gap-1.5 rounded-full bg-[#8C7762]/10 px-2.5 py-0.5 text-xs font-bold text-[#8C7762]">
                      <span>
                        Búsqueda:
                        &quot;
                        {
                          busquedaNav
                        }
                        &quot;
                      </span>

                      <button
                        type="button"
                        onClick={() =>
                          setBusquedaNav(
                            ""
                          )
                        }
                        className="ml-0.5 cursor-pointer text-xs hover:text-red-500"
                      >
                        ✕
                      </button>
                    </span>
                  </>
                )}

                {/* CATEGORIA ACTIVA */}

                {String(
                  categoriaActiva
                ) !==
                  "todos" && (
                  <>
                    <span className="text-xs text-stone-400">
                      ·
                    </span>

                    <span className="inline-flex items-center gap-1.5 rounded-full bg-[#314235]/10 px-2.5 py-0.5 text-xs font-bold text-[#314235]">
                      <span>
                        {
                          nombreCategoriaActiva
                        }
                      </span>

                      <button
                        type="button"
                        onClick={() =>
                          handleSeleccionarCategoria(
                            "todos"
                          )
                        }
                        className="ml-0.5 cursor-pointer text-xs hover:text-red-500"
                      >
                        ✕
                      </button>
                    </span>
                  </>
                )}
              </div>

              <h2 className="brand-serif mt-2 text-4xl leading-tight text-[#2d2a23] sm:text-5xl">
                {busquedaNav.trim()
                  ? `Resultados para "${busquedaNav}"`
                  : String(
                        categoriaActiva
                      ) ===
                      "todos"
                    ? "Encuentra tu próximo mate"
                    : nombreCategoriaActiva}
              </h2>

              {!busquedaNav.trim() &&
                String(
                  categoriaActiva
                ) ===
                  "todos" && (
                  <p className="mt-3 max-w-xl text-sm leading-6 text-stone-500">
                    Mates,
                    bombillas,
                    termos y
                    accesorios
                    para acompañar
                    cada cebada.
                  </p>
                )}
            </div>

            <p className="text-sm font-semibold text-stone-500">
              {cargando
                ? "Cargando catálogo..."
                : productosFiltrados.length ===
                    1
                  ? "1 producto disponible"
                  : `${productosFiltrados.length} productos disponibles`}
            </p>
          </div>

          {/* =================================================
              CARGANDO
          ================================================== */}

          {cargando ? (
            <div className="mt-12 py-20 text-center">
              <div className="mx-auto h-9 w-9 animate-spin rounded-full border-2 border-[#314235] border-t-transparent" />

              <p className="mt-4 font-medium text-stone-600">
                Cargando inventario de SuMateCL...
              </p>
            </div>
          ) : productosFiltrados.length ===
            0 ? (
            /* ===============================================
               SIN PRODUCTOS
            =============================================== */

            <div className="mt-9 rounded-3xl border border-dashed border-[#746a52]/45 bg-white/45 px-6 py-14 text-center">
              <h3 className="brand-serif text-2xl text-[#2d2a23]">
                {busquedaNav.trim()
                  ? "No se encontraron productos coincidentes"
                  : "No hay productos en esta categoría"}
              </h3>

              <p className="mt-2 text-stone-600">
                {busquedaNav.trim()
                  ? `No encontramos artículos que coincidan con "${busquedaNav}".`
                  : `Aún no disponemos de artículos bajo la categoría "${nombreCategoriaActiva}".`}
              </p>

              <div className="mt-5 flex items-center justify-center gap-3">
                {busquedaNav.trim() && (
                  <button
                    type="button"
                    onClick={() =>
                      setBusquedaNav(
                        ""
                      )
                    }
                    className="inline-flex cursor-pointer items-center gap-2 rounded-full border border-[#314235] px-5 py-2 text-xs font-bold text-[#314235] transition hover:bg-[#314235]/10"
                  >
                    Quitar búsqueda
                  </button>
                )}

                <button
                  type="button"
                  onClick={() => {
                    setBusquedaNav(
                      ""
                    );

                    handleSeleccionarCategoria(
                      "todos"
                    );
                  }}
                  className="inline-flex cursor-pointer items-center gap-2 rounded-full bg-[#314235] px-6 py-2 text-xs font-bold text-white transition hover:bg-[#243127]"
                >
                  Ver todos los productos
                </button>
              </div>
            </div>
          ) : (
            /* ===============================================
               PRODUCTOS
            =============================================== */

            <div
              id="product-grid"
              className="mt-9 grid grid-cols-1 gap-x-6 gap-y-10 sm:grid-cols-2 xl:grid-cols-3"
            >
              {productosFiltrados.map(
                (
                  producto
                ) => {
                  const sinStock =
                    producto.cantidad <=
                    0;

                  const stockCritico =
                    producto.cantidad >
                      0 &&
                    producto.cantidad <=
                      3;

                  return (
                    <article
                      key={
                        producto.idproducto
                      }
                      className="group relative"
                    >
                      {/* LINK COMPLETO */}

                      <Link
                        href={`/product/${producto.idproducto}`}
                        className="absolute inset-0 z-10 rounded-[28px]"
                        aria-label={`Ver ${producto.nombre}`}
                      />

                      {/* =====================================
                          FOTO GRANDE
                      ====================================== */}

                      <div className="relative aspect-[4/5] overflow-hidden rounded-[28px] bg-[#ede7da] shadow-sm transition duration-300 group-hover:-translate-y-1 group-hover:shadow-xl">
                        {producto.foto ? (
                          <img
                            src={
                              producto.foto
                            }
                            alt={
                              producto.nombre
                            }
                            className="h-full w-full object-cover transition duration-500 group-hover:scale-[1.035]"
                            onError={(
                              event
                            ) => {
                              (
                                event.target as HTMLImageElement
                              ).src =
                                "/logocircular.png";
                            }}
                          />
                        ) : (
                          <div className="flex h-full w-full items-center justify-center bg-[#ede7da] p-12">
                            <img
                              src="/logocircular.png"
                              alt="SuMateCL"
                              className="h-32 w-32 object-contain opacity-45"
                            />
                          </div>
                        )}

                        {/* SOMBRA ABAJO */}

                        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-28 bg-gradient-to-t from-black/35 to-transparent" />

                        {/* CATEGORIA */}

                        <span className="absolute left-4 top-4 rounded-full border border-white/50 bg-white/85 px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.1em] text-[#314235] shadow-sm backdrop-blur-md">
                          {producto.categoria ||
                            "Mates Artesanales"}
                        </span>

                        {/* STOCK */}

                        <span
                          className={`absolute bottom-4 left-4 rounded-full px-3 py-1.5 text-[10px] font-bold shadow-sm backdrop-blur-md ${
                            sinStock
                              ? "bg-red-600 text-white"
                              : stockCritico
                                ? "bg-amber-100 text-amber-900"
                                : "bg-white/90 text-[#314235]"
                          }`}
                        >
                          {sinStock
                            ? "Sin stock"
                            : stockCritico
                              ? `Últimas ${producto.cantidad} unidades`
                              : `${producto.cantidad} disponibles`}
                        </span>

                        {/* FLECHA */}

                        <div className="absolute bottom-4 right-4 flex h-10 w-10 items-center justify-center rounded-full bg-white text-lg font-bold text-[#314235] shadow-md transition duration-300 group-hover:translate-x-1">
                          →
                        </div>
                      </div>

                      {/* =====================================
                          INFORMACION PRODUCTO
                      ====================================== */}

                      <div className="px-1 pt-4">
                        <div className="flex items-start justify-between gap-4">
                          <h3 className="brand-serif text-[22px] font-semibold leading-tight text-[#2d2a23] transition group-hover:text-[#a75632]">
                            {
                              producto.nombre
                            }
                          </h3>

                          <span className="shrink-0 text-lg font-bold text-[#a75632]">
                            {formatearPrecio(
                              producto.precio
                            )}
                          </span>
                        </div>

                        {producto.descripcion && (
                          <p className="mt-2 line-clamp-2 max-w-[90%] text-sm leading-6 text-stone-500">
                            {
                              producto.descripcion
                            }
                          </p>
                        )}
                      </div>
                    </article>
                  );
                }
              )}
            </div>
          )}
        </section>

        {/* =================================================
            CIERRE
        ================================================== */}

        <section className="border-t border-[#314235]/10 bg-[#eee6d8]">
          <div className="mx-auto flex w-full max-w-7xl flex-col items-start justify-between gap-6 px-5 py-10 sm:px-8 md:flex-row md:items-center">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.22em] text-[#a75632]">
                SuMateCL
              </p>

              <h2 className="brand-serif mt-2 max-w-xl text-3xl text-[#2d2a23]">
                Tradición, diseño y buenos mates.
              </h2>

              <p className="mt-3 max-w-xl text-sm leading-6 text-stone-600">
                Explora nuestra selección y encuentra el producto que acompañará tus próximos mates.
              </p>
            </div>

            <button
              type="button"
              onClick={() => {
                const elemento =
                  document.getElementById(
                    "seccion-catalogo"
                  );

                elemento?.scrollIntoView(
                  {
                    behavior:
                      "smooth",
                  }
                );
              }}
              className="shrink-0 cursor-pointer rounded-full bg-[#314235] px-6 py-3.5 text-sm font-bold text-white transition hover:-translate-y-0.5 hover:bg-[#253329]"
            >
              Ver catálogo
            </button>
          </div>
        </section>
      </main>

      {/* ===================================================
          FOOTER
      ==================================================== */}

      <footer className="w-full border-t border-stone-800/10 bg-[#f8f3e9]">
        <div className="mx-auto flex w-full max-w-7xl flex-col items-center justify-between gap-3 px-5 py-7 text-sm sm:flex-row sm:px-8">
          <div>
            <p className="font-bold text-[#314235]">
              SuMateCL • GROWDER
            </p>

            <p className="text-stone-500">
              Gestión Integral de Inventario y E-Commerce
            </p>
          </div>

          {isAdminLocal && (
            <Link
              href="/admin"
              className="hidden lg:inline-flex items-center gap-2 rounded-full border border-[#314235]/30 bg-transparent px-4 py-2 text-xs font-bold text-[#314235] transition hover:bg-[#314235]/5"
              title="Panel de Administración"
            >
              <svg
                className="h-4 w-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
                />

                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                />
              </svg>

              Gestión Admin
            </Link>
          )}
        </div>
      </footer>
    </div>
  );
}

/* =========================================================
   EXPORT HOME
========================================================= */

export default function Home() {
  return (
    <Suspense
      fallback={
        <div className="site-shell flex min-h-screen items-center justify-center bg-[#f8f3e9]">
          <div className="flex flex-col items-center gap-3">
            <div className="h-10 w-10 animate-spin rounded-full border-[3px] border-[#8C7762] border-t-transparent" />

            <p className="text-sm font-semibold text-stone-500">
              Cargando catálogo...
            </p>
          </div>
        </div>
      }
    >
      <ContenidoHome />
    </Suspense>
  );
}