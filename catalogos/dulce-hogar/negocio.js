// Datos del negocio. Es lo único que cambia de un catálogo a otro (junto con productos.csv o la hoja).
window.NEGOCIO = {
  id: 'dulce-hogar',
  nombre: 'Dulce Hogar',
  rubro: 'Repostería',
  ciudad: 'Medellín',
  iniciales: 'DH',
  logo: '',                     // enlace a la imagen del logo; vacío = iniciales
  color: '#c2335a',             // color de la marca
  whatsapp: '',                 // número con código de país, solo dígitos (ej. 573001234567); vacío = muestra
  horario: 'Martes a domingo · 9:00 a 18:00',
  aviso: 'Las tortas se piden con 1 día de anticipación.',
  moneda: { simbolo: '$', decimales: 0 },
  entrega: {
    domicilio: { costo: 3 },
    retiro: { direccion: 'Cra 43A #10-25, El Poblado' },
  },
  pagos: ['Nequi', 'Transferencia', 'Efectivo'],
  notaEjemplo: 'Ej. escribir "Feliz cumple Sofi"',
  hoja: '',                     // enlace CSV de la hoja publicada; vacío = usa productos.csv
  productos: 'productos.csv',
};
