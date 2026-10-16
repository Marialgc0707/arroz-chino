/* =====================================================================
   MENÚ · Vámonos Pa' Que Monche
   Este es el ÚNICO archivo donde se cambian precios, platos que se
   acabaron y ajustes del pedido. La página se arma sola a partir de aquí.
   ===================================================================== */

/* ---------- AJUSTES DEL PEDIDO ---------- */
const AJUSTES = {
  // Tasa del día (Bs. por cada $1). Con 0 no se muestran bolívares.
  // Ejemplo: tasaBs: 36.5  → el carrito muestra "≈ Bs. 365,00"
  tasaBs: 879.12,

  // Pedido mínimo en $ (solo productos, sin delivery). Con 0 no hay mínimo.
  pedidoMinimo: { retiro: 0, delivery: 0 },

  // Zonas de delivery. Si la lista está vacía, el cliente solo escribe su dirección
  // y el costo se confirma por WhatsApp. Ejemplo:
  //   { nombre: "Centro", costo: 2 },
  //   { nombre: "Otra zona", costo: null },   // null = costo por confirmar
  zonasDelivery: [],

  // true = los platos agotados desaparecen del menú. false = se ven marcados como "Agotado".
  ocultarAgotados: false
};

/* ---------- ACOMPAÑANTES (se repiten en los 3 tipos de arroz) ----------
   precios: [con Arroz Tradicional, con Arroz Especial, con Arroz con Camarones]
   Para marcar uno agotado en los tres arroces a la vez, agrega: agotado: true    */
const ACOMPANANTES = [
  { nombre: "🍌 Plátano Frito",                     precios: [3.30, 4.30, 6.30] },
  { nombre: "🍟 Papas Fritas",                      precios: [3.30, 4.30, 6.30] },
  { nombre: "🥟 Lumpia",                            precios: [3.80, 4.80, 6.80] },
  { nombre: "🥢 Chop Suey",                         precios: [4, 5, 7] },
  { nombre: "🍗 Pollo Tempura Agridulce · 4 pzas",  precios: [4, 5, 7] },
  { nombre: "🍗 Pollo Tempura Agridulce · 8 pzas",  precios: [5, 6, 7] },
  { nombre: "🍗 Pollo a la Broaster · 1 pza",       precios: [4.20, 5.20, 7.20] },
  { nombre: "🍗 Pollo a la Broaster · 2 pzas",      precios: [5, 6, 8] },
  { nombre: "🥩 Costilla de Cerdo Agridulce",       precios: [5.50, 6.50, 8.50] }
];

/* ---------- MENÚ ----------
   Cada plato: { nombre, precio }  y opcionalmente:
     detalle: "2 pzas"      → texto de porción (también va en el pedido)
     desc: "..."            → descripción corta
     agotado: true          → se marca como "Agotado" y no se puede pedir        */
const MENU = [
  { id: "entradas", titulo: "Arroz y Pasta China", items: [
    { nombre: "🍚 Arroz Chino Tradicional",             precio: 3 },
    { nombre: "🍚 Arroz Chino Especial",                precio: 4 },
    { nombre: "🍤 Arroz Chino Especial con Camarones",  precio: 6 },
    { nombre: "🍜 Pasta China",                         precio: 4 },
    { nombre: "🍤 Pasta China con Camarones",           precio: 6 }
  ]},

  { id: "tradicional", titulo: "Arroz Chino Tradicional con",     nota: "con Arroz Chino Tradicional",     acomp: 0 },
  { id: "especial",    titulo: "Arroz Chino Especial con",        nota: "con Arroz Chino Especial",        acomp: 1 },
  { id: "camarones",   titulo: "Arroz Chino con Camarones y",     nota: "con Arroz Chino con Camarones",   acomp: 2 },

  { id: "pollo", titulo: "Pollo a la Broaster", grupos: [
    { subtitulo: "Servicio con papas, arepitas y ensalada", items: [
      { nombre: "🍗 Servicio de Pollo a la Broaster", detalle: "2 pzas", desc: "Con papas, arepitas y ensalada.", precio: 6 },
      { nombre: "🍗 Servicio de Pollo a la Broaster", detalle: "3 pzas", desc: "Con papas, arepitas y ensalada.", precio: 7 },
      { nombre: "🍗 Tender de Pollo",                                   desc: "Con papas, arepitas y ensalada.", precio: 6 }
    ]},
    { subtitulo: "Solo pollo broaster", items: [
      { nombre: "🍗 Solo Pollo Broaster", producto: "🍗 Pollo Broaster (solo pollo)", detalle: "3 pzas",  precio: 4.50 },
      { nombre: "🍗 Solo Pollo Broaster", producto: "🍗 Pollo Broaster (solo pollo)", detalle: "6 pzas",  precio: 9 },
      { nombre: "🍗 Solo Pollo Broaster", producto: "🍗 Pollo Broaster (solo pollo)", detalle: "12 pzas", precio: 16 }
    ]}
  ]},

  { id: "extras", titulo: "Extras", nota: "Extra", items: [
    { nombre: "🍗 Pollo Agridulce · 8 pzas",              precio: 2.50 },
    { nombre: "🍗 Pollo a la Broaster · 1 pza",           precio: 1.30 },
    { nombre: "🍟 Papas Fritas",                          precio: 1 },
    { nombre: "🍌 Plátano Frito",                         precio: 1 },
    { nombre: "🫓 Arepitas Fritas",                       precio: 1 },
    { nombre: "🥗 Ensalada Rayada",                       precio: 2 },
    { nombre: "🥟 Lumpias Tradicional · 2 unid.",         precio: 2 },
    { nombre: "🥟 Lumpias Cordon Bleu",                   precio: 2.50 },
    { nombre: "🥟 Lumpias de Jamón y Queso Amarillo",     precio: 2.80 },
    { nombre: "🥟 Lumpias de Lomito Salteado",            precio: 3 },
    { nombre: "🥘 Pachenchoy",                            precio: 3.50 },
    { nombre: "🍤 Pachenchoy con Camarones",              precio: 5 }
  ]},

  { id: "kilo", titulo: "Llévalo por Kg", items: [
    { nombre: "🍚 Arroz Chino Tradicional",              detalle: "1 kg", precio: 13 },
    { nombre: "🍚 Arroz Chino Especial",                 detalle: "1 kg", precio: 18 },
    { nombre: "🍤 Arroz Chino Especial con Camarones",   detalle: "1 kg", precio: 30 },
    { nombre: "🥢 Chop Suey",                            detalle: "1 kg", precio: 15 },
    { nombre: "🍜 Pasta China",                          detalle: "1 kg", precio: 20 },
    { nombre: "🍤 Pasta China con Camarones",            detalle: "1 kg", precio: 35 }
  ]}
];
