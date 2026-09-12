'use client'
import { usarCarrito } from './estadocarro'

export default function CarroDesplegable() {
  const { carrito, eliminarDelCarrito, carritoAbierto, setCarritoAbierto, total } = usarCarrito()

  if (!carritoAbierto) return null

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-black/40 backdrop-blur-xs">
      <div className="absolute inset-y-0 right-0 max-w-full flex pl-10">
        <div className="w-screen max-w-md bg-white p-6 shadow-2xl flex flex-col justify-between">

          <div>
            <div className="flex items-center justify-between border-b pb-4">
              <h2 className="text-lg font-bold text-[#1A1A1A]">Tu Carrito</h2>
              <button 
                onClick={() => setCarritoAbierto(false)}
                className="text-gray-500 hover:text-black font-bold p-1 cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="mt-6 space-y-4 max-h-[60vh] overflow-y-auto pr-2">
              {carrito.length === 0 ? (
                <p className="text-gray-500 text-sm text-center py-8">Tu carrito está vacío.</p>
              ) : (
                carrito.map((item) => (
                  <div key={item.id} className="flex items-center justify-between border-b pb-3 gap-3">
                    <img src={item.imagen} alt={item.nombre} className="w-12 h-12 object-cover rounded-md" />
                    <div className="flex-1">
                      <h4 className="text-sm font-semibold text-[#1A1A1A]">{item.nombre}</h4>
                      <p className="text-xs text-[#8C7762]">
                        {item.cantidad} x ${item.precio.toLocaleString('es-CL')}
                      </p>
                    </div>
                    <button 
                      onClick={() => eliminarDelCarrito(item.id)}
                      className="text-red-500 text-xs font-semibold hover:underline cursor-pointer"
                    >
                      Quitar
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="border-t pt-4">
            <div className="flex justify-between items-center mb-4 text-base font-bold text-[#1A1A1A]">
              <span>Total:</span>
              <span className="text-[#8C7762]">${total.toLocaleString('es-CL')}</span>
            </div>

            <button
              onClick={() => alert('Próximamente paso a pago')}
              disabled={carrito.length === 0}
              className="w-full bg-[#8C7762] hover:bg-[#725F4C] text-white py-3 rounded-full font-bold transition shadow-md disabled:bg-gray-300 cursor-pointer"
            >
              Ir a Pagar
            </button>
          </div>

        </div>
      </div>
    </div>
  )
}