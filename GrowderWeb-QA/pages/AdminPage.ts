import { Page, Locator } from '@playwright/test';
import { ControlledAction } from '../utils/ControlledAction';
import { TiempoEspera } from '../enum/TiempoEspera';

// Pagina para el modulo de administracion general
export class AdminPage {
  // Localizadores e iniciadores antes del constructor (Regla 5)
  readonly page: Page;
  readonly tituloPanel: Locator;
  readonly metricasKpi: Locator;
  readonly tabInventario: Locator;
  readonly tabAgregarProducto: Locator;
  readonly tabGestionRoles: Locator;
  readonly tabGestionPedidos: Locator;

  // Seccion Inventario
  readonly tituloInventario: Locator;
  readonly buscadorInventario: Locator;
  readonly botonRefrescarInventario: Locator;
  readonly tarjetasProductos: Locator;
  readonly estadoVacioInventarioTitulo: Locator;
  readonly estadoVacioInventarioMensaje: Locator;
  readonly botonLimpiarInventario: Locator;

  // Seccion Agregar Producto
  readonly tituloAgregarProducto: Locator;
  readonly campoNombreProducto: Locator;
  readonly selectCategoria: Locator;
  readonly campoPrecio: Locator;
  readonly campoStock: Locator;
  readonly campoDescripcion: Locator;
  readonly botonGuardarProducto: Locator;
  readonly botonVolverInventario: Locator;

  // Seccion Gestion de Roles
  readonly tituloGestionRoles: Locator;
  readonly buscadorRoles: Locator;
  readonly botonRefrescarRoles: Locator;
  readonly filasEquipoTrabajo: Locator;
  readonly filasClientes: Locator;
  readonly estadoVacioRolesEquipo: Locator;
  readonly estadoVacioRolesClientes: Locator;
  readonly estadoVacioRolesMensaje: Locator;
  readonly botonLimpiarRoles: Locator;

  // Seccion Gestion de Pedidos
  readonly tituloGestionPedidos: Locator;
  readonly filtroTodosPaquetes: Locator;
  readonly filtroPendientes: Locator;
  readonly filtroEnDespacho: Locator;
  readonly filtroRecibidos: Locator;
  readonly buscadorPedidos: Locator;
  readonly botonActualizarPedidos: Locator;
  readonly botonesVerDetalle: Locator;
  readonly estadoVacioPedidosTitulo: Locator;
  readonly estadoVacioPedidosMensaje: Locator;
  readonly botonLimpiarPedidos: Locator;

  // Modal Detalle de Pedido
  readonly modalDetallePedido: Locator;
  readonly seccionDestinatario: Locator;
  readonly seccionDireccion: Locator;
  readonly botonCerrarModal: Locator;

  // Vista Restringida Movil
  readonly vistaRestringidaMovil: Locator;
  readonly mensajeRestriccionMovil: Locator;
  readonly enlaceVolverTiendaMovil: Locator;

  constructor(page: Page) {
    this.page = page;
    this.tituloPanel = page.locator('h1:has-text("Administración General")');
    this.metricasKpi = page.locator('main div strong');
    this.tabInventario = page.locator('button:has-text("Inventario en tiempo real")');
    this.tabAgregarProducto = page.locator('button:has-text("Agregar Producto")');
    this.tabGestionRoles = page.locator('button:has-text("Gestión de Roles")');
    this.tabGestionPedidos = page.locator('button:has-text("Gestión de Pedidos")');

    // Inventario
    this.tituloInventario = page.locator('h2:has-text("Inventario en tiempo real")');
    this.buscadorInventario = page.locator('input[placeholder="Buscar por nombre o categoría..."]');
    this.botonRefrescarInventario = page.locator('button:has-text("Refrescar")');
    this.tarjetasProductos = page.locator('article');
    this.estadoVacioInventarioTitulo = page.locator('h3:has-text("No se encontraron coincidencias")');
    this.estadoVacioInventarioMensaje = page.locator('p:has-text("No hay productos que coincidan")');
    this.botonLimpiarInventario = this.buscadorInventario.locator('..').locator('button:has-text("✕")');

    // Agregar Producto
    this.tituloAgregarProducto = page.locator('h2:has-text("Añadir un producto")');
    this.campoNombreProducto = page.locator('input[placeholder*="Ej: Mate Torpedo"]');
    this.selectCategoria = page.locator('select');
    this.campoPrecio = page.locator('input[type="number"]').nth(0);
    this.campoStock = page.locator('input[type="number"]').nth(1);
    this.campoDescripcion = page.locator('textarea, input[placeholder*="Describe los materiales"]');
    this.botonGuardarProducto = page.locator('button:has-text("Guardar producto")');
    this.botonVolverInventario = page.locator('button:has-text("Volver al inventario")');

    // Roles
    this.tituloGestionRoles = page.locator('h2:has-text("Gestión de Roles y Permisos")');
    this.buscadorRoles = page.locator('input[placeholder="Buscar por correo o teléfono..."]');
    this.botonRefrescarRoles = page.locator('button:has-text("Refrescar")');
    this.filasEquipoTrabajo = page.locator('table').nth(0).locator('tbody tr');
    this.filasClientes = page.locator('table').nth(1).locator('tbody tr');
    this.estadoVacioRolesEquipo = page.locator('h3:has-text("No se encontraron usuarios")').nth(0);
    this.estadoVacioRolesClientes = page.locator('h3:has-text("No se encontraron usuarios")').nth(1);
    this.estadoVacioRolesMensaje = page.locator('p:has-text("No hay coincidencias para")').nth(0);
    this.botonLimpiarRoles = this.buscadorRoles.locator('..').locator('button:has-text("✕")');

    // Pedidos
    this.tituloGestionPedidos = page.locator('h2:has-text("Seguimiento de Pedidos y Despachos")');
    this.filtroTodosPaquetes = page.locator('button:has-text("Todos los paquetes")');
    this.filtroPendientes = page.locator('button:has-text("Pendientes")');
    this.filtroEnDespacho = page.locator('button:has-text("En Despacho")');
    this.filtroRecibidos = page.locator('button:has-text("Recibidos")');
    this.buscadorPedidos = page.locator('input[placeholder*="Buscar por código, cliente"]');
    this.botonActualizarPedidos = page.locator('button:has-text("Actualizar")');
    this.botonesVerDetalle = page.locator('button:has-text("Ver Detalle")');
    this.estadoVacioPedidosTitulo = page.locator('h4:has-text("No se encontraron paquetes")');
    this.estadoVacioPedidosMensaje = page.locator('p:has-text("No hay envíos que coincidan")');
    this.botonLimpiarPedidos = this.buscadorPedidos.locator('..').locator('button:has-text("✕")');

    // Modal
    this.modalDetallePedido = page.locator('h4:has-text("Datos del Destinatario")');
    this.seccionDestinatario = page.locator('h4:has-text("Datos del Destinatario")');
    this.seccionDireccion = page.locator('h4:has-text("Dirección de Entrega")');
    this.botonCerrarModal = page.locator('button:has-text("Cerrar")');

    // Vista Restringida Movil
    this.vistaRestringidaMovil = page.locator('h1:has-text("Acceso Restringido en Móvil")');
    this.mensajeRestriccionMovil = page.locator('p:has-text("diseñado exclusivamente para uso en escritorio")');
    this.enlaceVolverTiendaMovil = page.locator('a:has-text("Volver a la tienda")');
  }

  // Validar bloqueo en dispositivos moviles
  async verificarBloqueoMovil() {
    await ControlledAction.esperarVisibilidad(this.vistaRestringidaMovil);
    await ControlledAction.esperarVisibilidad(this.mensajeRestriccionMovil);
  }

  // Validar carga del panel de administracion en vista escritorio
  async verificarPanelVisible() {
    await ControlledAction.esperarVisibilidad(this.tituloPanel, TiempoEspera.LARGO);
  }

  // Navegacion entre pestanas principales
  async irAInventario() {
    await ControlledAction.esperarVisibilidad(this.tabInventario, TiempoEspera.LARGO);
    await ControlledAction.click(this.tabInventario);
    await ControlledAction.esperarVisibilidad(this.tituloInventario, TiempoEspera.LARGO);
  }

  async irAAgregarProducto() {
    await ControlledAction.esperarVisibilidad(this.tabAgregarProducto, TiempoEspera.LARGO);
    await ControlledAction.click(this.tabAgregarProducto);
    await ControlledAction.esperarVisibilidad(this.tituloAgregarProducto, TiempoEspera.LARGO);
  }

  async irAGestionRoles() {
    await ControlledAction.esperarVisibilidad(this.tabGestionRoles, TiempoEspera.LARGO);
    await ControlledAction.click(this.tabGestionRoles);
    await ControlledAction.esperarVisibilidad(this.tituloGestionRoles, TiempoEspera.LARGO);
  }

  async irAGestionPedidos() {
    await ControlledAction.esperarVisibilidad(this.tabGestionPedidos, TiempoEspera.LARGO);
    await ControlledAction.click(this.tabGestionPedidos);
    await ControlledAction.esperarVisibilidad(this.tituloGestionPedidos, TiempoEspera.LARGO);
  }

  // Acciones en gestion de roles
  async buscarUsuario(termino: string) {
    await ControlledAction.escribir(this.buscadorRoles, termino);
  }

  // Acciones en gestion de pedidos
  async filtrarPedidosPorEstado(estado: 'todos' | 'pendientes' | 'despacho' | 'recibidos') {
    if (estado === 'todos') await ControlledAction.click(this.filtroTodosPaquetes);
    if (estado === 'pendientes') await ControlledAction.click(this.filtroPendientes);
    if (estado === 'despacho') await ControlledAction.click(this.filtroEnDespacho);
    if (estado === 'recibidos') await ControlledAction.click(this.filtroRecibidos);
  }

  async buscarPedido(termino: string) {
    await ControlledAction.escribir(this.buscadorPedidos, termino);
  }

  async abrirDetallePedidoPorIndice(indice: number = 0) {
    const boton = ControlledAction.obtenerElementoPorIndice(this.botonesVerDetalle, indice);
    await ControlledAction.click(boton);
    await ControlledAction.esperarVisibilidad(this.modalDetallePedido);
  }

  async cerrarModalDetalle() {
    await ControlledAction.click(this.botonCerrarModal);
  }

  // Acciones en agregar producto
  async llenarFormularioProducto(nombre: string, precio: string, stock: string, descripcion: string) {
    await ControlledAction.escribir(this.campoNombreProducto, nombre);
    await ControlledAction.escribir(this.campoPrecio, precio);
    await ControlledAction.escribir(this.campoStock, stock);
    await ControlledAction.escribir(this.campoDescripcion, descripcion);
  }

  async clickGuardarProducto() {
    await ControlledAction.click(this.botonGuardarProducto);
  }

  async volverAInventario() {
    await ControlledAction.click(this.botonVolverInventario);
    await ControlledAction.esperarVisibilidad(this.tituloInventario);
    const primerArticulo = ControlledAction.obtenerElementoPorIndice(this.tarjetasProductos, 0);
    await ControlledAction.esperarVisibilidad(primerArticulo, TiempoEspera.MUY_LARGO);
  }

  // Validaciones y acciones de estados vacios
  async verificarEstadoVacioInventario() {
    await ControlledAction.esperarVisibilidad(this.estadoVacioInventarioTitulo);
    await ControlledAction.esperarVisibilidad(this.estadoVacioInventarioMensaje);
  }

  async limpiarBusquedaInventario() {
    await ControlledAction.click(this.botonLimpiarInventario);
  }

  async verificarEstadoVacioRoles() {
    await ControlledAction.esperarVisibilidad(this.estadoVacioRolesEquipo);
    await ControlledAction.esperarVisibilidad(this.estadoVacioRolesClientes);
    await ControlledAction.esperarVisibilidad(this.estadoVacioRolesMensaje);
  }

  async limpiarBusquedaRoles() {
    await ControlledAction.click(this.botonLimpiarRoles);
  }

  async verificarEstadoVacioPedidos() {
    await ControlledAction.esperarVisibilidad(this.estadoVacioPedidosTitulo);
    await ControlledAction.esperarVisibilidad(this.estadoVacioPedidosMensaje);
  }

  async limpiarBusquedaPedidos() {
    await ControlledAction.click(this.botonLimpiarPedidos);
  }
}
