/**
 * Datos de prueba para trabajar sin base de datos. Son los mismos que usa la demostración:
 * mesas 01 a 07 abiertas, la 08 cerrada y un producto agotado para probar los errores.
 */
export const DATOS_INICIALES = Object.freeze({
  mesas: [
    { id: '01', nombre: 'Mesa 01', estado: 'abierta' },
    { id: '02', nombre: 'Mesa 02', estado: 'abierta' },
    { id: '03', nombre: 'Mesa 03', estado: 'abierta' },
    { id: '04', nombre: 'Mesa 04', estado: 'abierta' },
    { id: '05', nombre: 'Mesa 05', estado: 'abierta' },
    { id: '06', nombre: 'Mesa 06', estado: 'abierta' },
    { id: '07', nombre: 'Mesa 07', estado: 'abierta' },
    { id: '08', nombre: 'Mesa 08', estado: 'cerrada' },
  ],
  productos: [
    { id: 1, nombre: 'Silpancho', descripcion: 'Carne apanada, arroz, papa, huevo y salsa criolla.', categoria: 'Platos principales', precio: 35, disponible: true, imagenUrl: '', tiempoEstimado: 15 },
    { id: 2, nombre: 'Pique macho', descripcion: 'Carne de res, salchicha, papas, tomate, cebolla y locoto.', categoria: 'Platos principales', precio: 52, disponible: true, imagenUrl: '', tiempoEstimado: 18 },
    { id: 3, nombre: 'Sopa de maní', descripcion: 'Sopa tradicional con fideo, papa frita y perejil.', categoria: 'Platos principales', precio: 22, disponible: true, imagenUrl: '', tiempoEstimado: 10 },
    { id: 4, nombre: 'Salteña de pollo', descripcion: 'Unidad, horneada al momento.', categoria: 'Entradas', precio: 8, disponible: true, imagenUrl: '', tiempoEstimado: 6 },
    { id: 5, nombre: 'Limonada', descripcion: 'Vaso de 500 ml, limón recién exprimido.', categoria: 'Bebidas', precio: 12, disponible: true, imagenUrl: '', tiempoEstimado: 5 },
    { id: 6, nombre: 'Mocochinchi', descripcion: 'Vaso de 500 ml con durazno deshidratado y canela.', categoria: 'Bebidas', precio: 8, disponible: true, imagenUrl: '', tiempoEstimado: 4 },
    { id: 7, nombre: 'Agua sin gas', descripcion: 'Botella de 500 ml.', categoria: 'Bebidas', precio: 6, disponible: true, imagenUrl: '', tiempoEstimado: 2 },
    { id: 8, nombre: 'Api con pastel', descripcion: 'Api morado caliente con pastel de queso.', categoria: 'Postres', precio: 15, disponible: true, imagenUrl: '', tiempoEstimado: 8 },
    { id: 9, nombre: 'Helado de canela', descripcion: 'Dos bolas de helado artesanal.', categoria: 'Postres', precio: 12, disponible: false, imagenUrl: '', tiempoEstimado: 4 },
  ],
});
