// Datos constantes para alimentar formularios de prueba
export const DatosClientePrueba = {
  nombre: 'Matias Alarcon',
  telefono: '912345678',
  email: 'matias.prueba@growder.cl',
  password: 'ClaveSegura123!',
  comuna: 'Providencia',
  direccion: 'Av. Providencia 1234',
  depto: 'Depto 402',
  instrucciones: 'Dejar en conserjeria'
};

// Credenciales validadas para pruebas de autenticacion real
export const CredencialesUsuario = {
  email: 'mat.riosr@duocuc.cl',
  passwordValida: 'chile123',
  passwordInvalida: 'hola123'
};

// Pedido simulado para verificacion de stepper logistico
export const PedidoPrueba = {
  id: 101,
  codigo_pedido: 'SOMATE-101',
  usuario_id: 'usr-prueba-qa',
  nombre_cliente: 'Matias Alarcon',
  email_cliente: 'mat.riosr@duocuc.cl',
  telefono_cliente: '912345678',
  region: 'Metropolitana',
  comuna: 'Providencia',
  direccion: 'Av. Providencia 1234',
  estado: 'en despacho',
  estado_pago: 'aprobado',
  metodo_pago: 'webpay',
  total: 25000,
  subtotal: 22350,
  costo_envio: 2650,
  created_at: '2026-09-30T10:00:00Z',
  items: [
    {
      id: 1,
      idproducto: 1,
      nombre: 'Mate Imperial Premium',
      precio: 22350,
      cantidad: 1,
      foto: '/logocircular.png'
    }
  ]
};
