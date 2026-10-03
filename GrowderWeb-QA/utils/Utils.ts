// Funciones generales de apoyo para las pruebas
export class Utils {
  // Formateador de moneda para verificar montos chilenos
  static formatearMonedaCLP(monto: number): string {
    return `$${monto.toLocaleString('es-CL')}`;
  }

  // Generador de cadenas aleatorias para datos de prueba
  static generarCadenaAleatoria(longitud: number = 6): string {
    const caracteres = 'abcdefghijklmnopqrstuvwxyz0123456789';
    let resultado = '';
    for (let i = 0; i < longitud; i++) {
      resultado += caracteres.charAt(Math.floor(Math.random() * caracteres.length));
    }
    return resultado;
  }
}
