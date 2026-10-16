/* ===== Carrito de compras · Vámonos Pa' Que Monche =====
   Los precios y los platos viven en menu.js. Aquí solo está la lógica. */
const WHATSAPP = "584145676868";
const STORAGE_KEY = "monche_carrito_v2"; // v2: solo guarda id + cantidad; el precio siempre sale de menu.js
const DATOS_KEY = "monche_datos_v1";

const $ = id => document.getElementById(id);

/* ---------- ajustes (vienen de menu.js) ---------- */
const CFG = Object.assign(
  { tasaBs: 0, pedidoMinimo: {}, zonasDelivery: [], ocultarAgotados: false },
  typeof AJUSTES !== "undefined" ? AJUSTES : {}
);
CFG.pedidoMinimo = Object.assign({ retiro: 0, delivery: 0 }, CFG.pedidoMinimo);

let carrito = [];   // [{id, cant}]
let CATALOGO = {};  // id -> {id, nombre, nombreCarrito, nota, precio, agotado, ...}
let quitados = 0;   // platos del carrito guardado que ya no existen / se agotaron

/* ---------- utilidades ---------- */
function esc(s){
  return String(s).replace(/[&<>"']/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
}
function fmt(n){ return "$" + n.toFixed(2); }
function fmtPrecio(n){ return Number.isInteger(n) ? "$" + n : "$" + n.toFixed(2); }
function fmtNum(n){ return n.toLocaleString("es-VE", { minimumFractionDigits: 2, maximumFractionDigits: 2 }); }
function slug(s){
  return String(s).normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase()
    .replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
}

function guardar(){
  try{ localStorage.setItem(STORAGE_KEY, JSON.stringify(carrito)); }catch(e){}
}
function cargar(){
  quitados = 0;
  try{
    const data = JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
    if(Array.isArray(data)){
      carrito = data.filter(i => {
        const p = i && CATALOGO[i.id];
        const ok = p && !p.agotado && i.cant > 0;
        if(!ok) quitados++;
        return ok;
      }).map(i => ({ id: i.id, cant: Math.floor(i.cant) }));
    }
  }catch(e){ carrito = []; }
}

/* ---------- menú: se arma a partir de menu.js ---------- */
function prepararMenu(){
  CATALOGO = {};
  if(typeof MENU === "undefined") return [];
  const usados = {};
  const secs = [];

  MENU.forEach(sec => {
    let grupos;
    if(sec.acomp !== undefined && typeof ACOMPANANTES !== "undefined"){
      grupos = [{ items: ACOMPANANTES.map(a => ({
        nombre: a.nombre, precio: a.precios[sec.acomp], agotado: a.agotado
      })) }];
    }else if(sec.grupos){
      grupos = sec.grupos;
    }else{
      grupos = [{ items: sec.items || [] }];
    }

    const gruposOk = [];
    grupos.forEach(g => {
      const items = [];
      g.items.forEach(raw => {
        if(typeof raw.precio !== "number" || isNaN(raw.precio)) return;
        const it = Object.assign({}, raw);
        it.agotado = !!raw.agotado;
        if(it.agotado && CFG.ocultarAgotados) return;

        const base = it.producto || it.nombre;
        it.nombreCarrito = it.detalle ? base + " · " + it.detalle : base;
        it.nota = sec.nota || "";

        let id = sec.id + ":" + slug(it.nombreCarrito);
        if(usados[id]){ usados[id]++; id += "-" + usados[id]; } else usados[id] = 1;
        it.id = id;

        CATALOGO[id] = it;
        items.push(it);
      });
      if(items.length) gruposOk.push({ subtitulo: g.subtitulo, items });
    });
    if(gruposOk.length) secs.push({ id: sec.id, titulo: sec.titulo, grupos: gruposOk });
  });
  return secs;
}

function htmlItem(it){
  const ag = it.agotado;
  return '<div class="card order-item' + (ag ? ' agotado' : '') + '"' +
    ' data-id="' + esc(it.id) + '" data-product="' + esc(it.nombreCarrito) + '"' +
    ' role="button" tabindex="' + (ag ? '-1' : '0') + '"' + (ag ? ' aria-disabled="true"' : '') + '>' +
    '<h3>' + esc(it.nombre) + '</h3>' +
    (it.desc ? '<p class="desc">' + esc(it.desc) + '</p>' : '') +
    (it.detalle ? '<p class="desc"><strong>' + esc(it.detalle) + '</strong></p>' : '') +
    '<span class="price">' + (ag ? 'Agotado' : fmtPrecio(it.precio)) + '</span>' +
  '</div>';
}
function renderMenu(secs){
  const ancla = $("acciones");
  secs.forEach(sec => {
    const s = document.createElement("section");
    s.id = sec.id;
    let h = '<h2>' + esc(sec.titulo) + '</h2><div class="divider"></div>';
    sec.grupos.forEach(g => {
      if(g.subtitulo) h += '<h3 class="sub-title">' + esc(g.subtitulo) + '</h3>';
      h += '<div class="card-grid">' + g.items.map(htmlItem).join("") + '</div>';
    });
    s.innerHTML = h;
    if(ancla) ancla.parentNode.insertBefore(s, ancla); else document.body.appendChild(s);
  });
}

/* ---------- lógica del carrito ---------- */
function pedirProducto(el){
  const p = CATALOGO[el.dataset.id];
  if(!p) return;
  if(p.agotado){ mostrarToast(p.nombreCarrito + " está agotado por ahora", true); return; }

  const existente = carrito.find(i => i.id === p.id);
  if(existente) existente.cant++;
  else carrito.push({ id: p.id, cant: 1 });

  guardar();
  render();
  mostrarToast("Agregado: " + p.nombreCarrito);
  const fab = $("cart-fab");
  if(fab){ fab.classList.remove("bump"); void fab.offsetWidth; fab.classList.add("bump"); }
}
function cambiarCantidad(id, delta){
  const item = carrito.find(i => i.id === id);
  if(!item) return;
  item.cant += delta;
  if(item.cant <= 0) carrito = carrito.filter(i => i.id !== id);
  guardar();
  render();
}
function quitar(id){
  carrito = carrito.filter(i => i.id !== id);
  guardar();
  render();
}
function vaciarCarrito(){
  if(!carrito.length) return;
  if(confirm("¿Vaciar el carrito?")){
    carrito = [];
    guardar();
    render();
  }
}
function lineas(){
  return carrito.map(i => Object.assign({ cant: i.cant }, CATALOGO[i.id]));
}
function subtotal(){
  return lineas().reduce((s, l) => s + l.precio * l.cant, 0);
}
function cantidadTotal(){
  return carrito.reduce((s, i) => s + i.cant, 0);
}

/* ---------- horario (hora de Venezuela) ---------- */
const HORARIO = {
  zona: "America/Caracas",
  abre: 11,      // 11:00 am
  cierra: 18,    // 6:00 pm
  dias: [0,1,2,3,4,5,6] // 0 = domingo ... 6 = sábado (quita un número para un día de descanso)
};
const DIAS_ES = ["domingo","lunes","martes","miércoles","jueves","viernes","sábado"];

function fmtHora(h){
  const suf = h >= 12 ? "pm" : "am";
  const h12 = h % 12 === 0 ? 12 : h % 12;
  return h12 + ":00 " + suf;
}
function ahoraZona(fecha){
  const partes = new Intl.DateTimeFormat("en-US", {
    timeZone: HORARIO.zona, weekday: "short", hour: "numeric", minute: "numeric", hour12: false
  }).formatToParts(fecha || new Date());
  const get = t => (partes.find(p => p.type === t) || {}).value;
  const dia = ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"].indexOf(get("weekday"));
  return { dia, min: (parseInt(get("hour"), 10) % 24) * 60 + parseInt(get("minute"), 10) };
}
function estadoLocal(fecha){
  const { dia, min } = ahoraZona(fecha);
  const abre = HORARIO.abre * 60, cierra = HORARIO.cierra * 60;

  if(HORARIO.dias.includes(dia) && min >= abre && min < cierra){
    const falta = cierra - min;
    return {
      abierto: true,
      texto: falta <= 30 ? "Abierto · cierra en " + falta + " min" : "Abierto ahora"
    };
  }
  if(HORARIO.dias.includes(dia) && min < abre){
    return { abierto: false, texto: "Cerrado · abrimos hoy a las " + fmtHora(HORARIO.abre) };
  }
  for(let i = 1; i <= 7; i++){
    const d = (dia + i) % 7;
    if(HORARIO.dias.includes(d)){
      const cuando = i === 1 ? "mañana" : "el " + DIAS_ES[d];
      return { abierto: false, texto: "Cerrado · abrimos " + cuando + " a las " + fmtHora(HORARIO.abre) };
    }
  }
  return { abierto: false, texto: "Cerrado" };
}
function actualizarHorario(){
  const e = estadoLocal();
  const box = $("open-status");
  const txt = $("open-text");
  if(box && txt){
    txt.textContent = e.texto;
    box.classList.toggle("is-open", e.abierto);
    box.classList.toggle("is-closed", !e.abierto);
  }
  const nota = $("cart-hours-note");
  if(nota){
    nota.hidden = e.abierto;
    nota.textContent = e.abierto ? "" :
      "Ahora estamos cerrados (horario " + fmtHora(HORARIO.abre) + " – " + fmtHora(HORARIO.cierra) +
      "). Puedes dejar tu pedido y lo atendemos al abrir.";
  }
}

/* ---------- datos del pedido (retiro / delivery / zona / mínimo) ---------- */
function modoEntrega(){
  const r = document.querySelector('input[name="cart-mode"]:checked');
  return r ? r.value : "retiro";
}
function iniciarZonas(){
  const sel = $("cart-zone");
  if(!sel) return;
  const zonas = CFG.zonasDelivery;
  if(!zonas.length){ sel.hidden = true; return; }
  sel.innerHTML = '<option value="">Zona de entrega</option>' + zonas.map((z, i) =>
    '<option value="' + i + '">' + esc(z.nombre) + ' · ' +
    (typeof z.costo === "number" ? fmt(z.costo) : "costo por confirmar") + '</option>'
  ).join("");
  sel.hidden = false;
  const hint = $("cart-delivery-hint");
  if(hint) hint.textContent = "El costo del delivery se suma al total según tu zona.";
}
function zonaElegida(){
  const sel = $("cart-zone");
  if(!sel || sel.hidden || modoEntrega() !== "delivery" || sel.value === "") return null;
  return CFG.zonasDelivery[Number(sel.value)] || null;
}
function costoDelivery(){
  const z = zonaElegida();
  return z && typeof z.costo === "number" ? z.costo : 0;
}
function totalCarrito(){
  return subtotal() + costoDelivery();
}
function minimoActual(){
  return Number(CFG.pedidoMinimo[modoEntrega()]) || 0;
}
function faltaMinimo(){
  const f = Math.round((minimoActual() - subtotal()) * 100) / 100;
  return minimoActual() > 0 && f > 0 ? f : 0;
}
function aplicarModo(){
  $("cart-address-wrap").hidden = modoEntrega() !== "delivery";
  $("cart-error").textContent = "";
}
function guardarDatos(){
  try{
    localStorage.setItem(DATOS_KEY, JSON.stringify({
      nombre: $("cart-name").value, modo: modoEntrega(),
      direccion: $("cart-address").value, pago: $("cart-pay").value,
      zona: $("cart-zone").value
    }));
  }catch(e){}
}
function cargarDatos(){
  try{
    const d = JSON.parse(localStorage.getItem(DATOS_KEY) || "{}");
    if(d.nombre) $("cart-name").value = d.nombre;
    if(d.direccion) $("cart-address").value = d.direccion;
    if(d.pago && [...$("cart-pay").options].some(o => o.text === d.pago)) $("cart-pay").value = d.pago;
    if(d.zona !== undefined && [...$("cart-zone").options].some(o => o.value === String(d.zona))) $("cart-zone").value = d.zona;
    const radio = document.querySelector('input[name="cart-mode"][value="' + (d.modo === "delivery" ? "delivery" : "retiro") + '"]');
    if(radio) radio.checked = true;
  }catch(e){}
  aplicarModo();
}

function enviarPedido(){
  if(!carrito.length) return;
  const nombre = ($("cart-name").value || "").trim();
  const notas = ($("cart-notes").value || "").trim();
  const modo = modoEntrega();
  const direccion = ($("cart-address").value || "").trim();
  const pago = $("cart-pay").value;
  const zona = zonaElegida();
  const err = $("cart-error");
  err.textContent = "";

  if(!nombre){ err.textContent = "Escribe tu nombre."; $("cart-name").focus(); return; }
  if(modo === "delivery" && CFG.zonasDelivery.length && !zona){ err.textContent = "Elige tu zona de entrega."; $("cart-zone").focus(); return; }
  if(modo === "delivery" && !direccion){ err.textContent = "Escribe la dirección para el delivery."; $("cart-address").focus(); return; }
  if(!pago){ err.textContent = "Elige un método de pago."; $("cart-pay").focus(); return; }
  const falta = faltaMinimo();
  if(falta){
    err.textContent = "El pedido mínimo " + (modo === "delivery" ? "para delivery" : "para retiro") +
      " es " + fmt(minimoActual()) + ". Te faltan " + fmt(falta) + ".";
    return;
  }

  guardarDatos();

  const sub = subtotal(), costo = costoDelivery(), total = sub + costo;
  const tasa = Number(CFG.tasaBs) || 0;

  let msg = "Hola, quiero hacer un pedido en Vámonos Pa' Que Monche.\n\n";
  msg += "Nombre: " + nombre + "\n";
  msg += "Tipo de pedido: " + (modo === "delivery" ? "Delivery 🛵" : "Retiro en el local 🏪") + "\n";
  if(modo === "delivery"){
    if(zona) msg += "Zona: " + zona.nombre + "\n";
    msg += "Dirección: " + direccion + "\n";
  }
  msg += "Pago: " + pago + "\n\n";
  msg += "Pedido:\n";
  lineas().forEach(i => {
    msg += "• " + i.cant + " x " + i.nombreCarrito +
           (i.nota ? " (" + i.nota + ")" : "") +
           " - " + fmt(i.precio * i.cant) + "\n";
  });

  if(modo === "delivery" && zona && typeof zona.costo === "number"){
    msg += "\nSubtotal: " + fmt(sub) + "\nDelivery (" + zona.nombre + "): " + fmt(costo);
    msg += "\nTotal: " + fmt(total);
  }else{
    msg += "\nTotal: " + fmt(total);
    if(modo === "delivery") msg += " (+ delivery por confirmar)";
  }
  if(tasa > 0) msg += "\n≈ " + "Bs. " + fmtNum(total * tasa) + " (tasa Bs. " + fmtNum(tasa) + ")";
  if(notas) msg += "\n\nNotas: " + notas;
  if(!estadoLocal().abierto) msg += "\n\nSé que ahora están cerrados; quedo atento para cuando abran.";
  msg += "\n\n¿Me pueden confirmar disponibilidad?";

  const url = "https://wa.me/" + WHATSAPP + "?text=" + encodeURIComponent(msg);
  window.open(url, "_blank");
  abrirConfirmacion(url);
}

/* ---------- confirmación después de enviar ---------- */
function abrirConfirmacion(url){
  $("cart-done-link").href = url;
  $("cart-drawer").classList.add("enviado");
  $("cart-drawer").scrollTop = 0;
}
function cerrarConfirmacion(){
  $("cart-drawer").classList.remove("enviado");
}
function pedidoEnviado(){
  carrito = [];
  guardar();
  $("cart-notes").value = "";
  cerrarConfirmacion();
  render();
  cerrarCarrito();
  mostrarToast("¡Gracias por tu pedido! Te confirmamos por WhatsApp", true);
}

/* ---------- interfaz ---------- */
function abrirCarrito(){
  $("cart-drawer").classList.add("open");
  $("cart-overlay").classList.add("open");
  document.body.classList.add("cart-lock");
}
function cerrarCarrito(){
  $("cart-drawer").classList.remove("open");
  $("cart-overlay").classList.remove("open");
  document.body.classList.remove("cart-lock");
  cerrarConfirmacion();
}

let toastTimer;
function mostrarToast(texto, sinCheck){
  const t = $("cart-toast");
  if(!t) return;
  t.textContent = (sinCheck ? "" : "✓ ") + texto;
  t.classList.add("show");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => t.classList.remove("show"), 2200);
}

function render(){
  const lista = $("cart-items");
  if(!lista) return;

  const cant = cantidadTotal();
  const badge = $("cart-count");
  badge.textContent = cant;
  badge.style.display = cant ? "grid" : "none";

  const sub = subtotal();
  const delivery = modoEntrega() === "delivery";
  const zona = zonaElegida();
  const total = sub + costoDelivery();

  // fila de delivery (solo si hay zona elegida)
  $("cart-delivery-row").hidden = !(delivery && zona);
  if(delivery && zona) $("cart-delivery").textContent = typeof zona.costo === "number" ? fmt(zona.costo) : "por confirmar";

  $("cart-total").textContent = fmt(total);

  // bolívares
  const tasa = Number(CFG.tasaBs) || 0;
  const bs = $("cart-bs");
  bs.hidden = !(tasa > 0 && carrito.length);
  if(!bs.hidden) bs.textContent = "≈ Bs. " + fmtNum(total * tasa) + " · tasa Bs. " + fmtNum(tasa);

  // pedido mínimo
  const min = minimoActual();
  const hint = $("cart-min");
  hint.hidden = !(min > 0);
  if(min > 0){
    const falta = faltaMinimo();
    hint.classList.toggle("falta", carrito.length > 0 && falta > 0);
    hint.textContent = "Pedido mínimo " + (delivery ? "para delivery" : "para retiro") + ": " + fmt(min) +
      (carrito.length && falta > 0 ? " · te faltan " + fmt(falta) : "");
  }

  // si el aviso de "pedido mínimo" ya no aplica (agregó más platos o cambió a retiro), se quita solo
  const errEl = $("cart-error");
  if(!faltaMinimo() && /mínimo/.test(errEl.textContent)) errEl.textContent = "";

  $("cart-send").disabled = !carrito.length;
  $("cart-clear").disabled = !carrito.length;

  if(!carrito.length){
    lista.innerHTML = '<p class="cart-empty">Tu carrito está vacío.<br>Toca cualquier plato del menú para agregarlo.</p>';
    return;
  }

  lista.innerHTML = lineas().map(i => {
    const id = esc(i.id);
    return '<div class="cart-row">' +
      '<div class="cart-info">' +
        '<strong>' + esc(i.nombreCarrito) + '</strong>' +
        (i.nota ? '<small>' + esc(i.nota) + '</small>' : '') +
        '<span>' + fmt(i.precio) + ' c/u</span>' +
      '</div>' +
      '<div class="cart-qty">' +
        '<button type="button" data-act="menos" data-id="' + id + '" aria-label="Quitar uno">−</button>' +
        '<b>' + i.cant + '</b>' +
        '<button type="button" data-act="mas" data-id="' + id + '" aria-label="Agregar uno">+</button>' +
      '</div>' +
      '<div class="cart-line">' + fmt(i.precio * i.cant) +
        '<button type="button" class="cart-del" data-act="del" data-id="' + id + '" aria-label="Eliminar">✕</button>' +
      '</div>' +
    '</div>';
  }).join("");
}

function construirUI(){
  // El HTML del carrito ya está en index.html; aquí solo se activan los botones.

  // Clic / teclado en cualquier plato del menú
  document.addEventListener("click", e => {
    const item = e.target.closest(".order-item");
    if(item) pedirProducto(item);
  });
  document.addEventListener("keydown", e => {
    if(e.key !== "Enter" && e.key !== " ") return;
    const item = e.target.closest && e.target.closest(".order-item");
    if(item){ e.preventDefault(); pedirProducto(item); }
  });

  $("cart-fab").addEventListener("click", abrirCarrito);
  $("cart-close").addEventListener("click", cerrarCarrito);
  $("cart-overlay").addEventListener("click", cerrarCarrito);
  $("cart-send").addEventListener("click", enviarPedido);
  $("cart-clear").addEventListener("click", vaciarCarrito);
  $("cart-done-ok").addEventListener("click", pedidoEnviado);
  $("cart-done-back").addEventListener("click", cerrarConfirmacion);
  document.addEventListener("keydown", e => { if(e.key === "Escape") cerrarCarrito(); });

  $("cart-items").addEventListener("click", e => {
    const b = e.target.closest("button[data-act]");
    if(!b) return;
    const id = b.dataset.id;
    if(b.dataset.act === "mas") cambiarCantidad(id, 1);
    else if(b.dataset.act === "menos") cambiarCantidad(id, -1);
    else if(b.dataset.act === "del") quitar(id);
  });
}

document.addEventListener("DOMContentLoaded", () => {
  renderMenu(prepararMenu());            // 1) arma el menú (antes del buscador y los filtros)
  try{ localStorage.removeItem("monche_carrito_v1"); }catch(e){}
  cargar();
  construirUI();
  iniciarZonas();
  cargarDatos();
  render();
  actualizarHorario();
  setInterval(actualizarHorario, 60000);

  document.querySelectorAll('input[name="cart-mode"]').forEach(r => r.addEventListener("change", () => { aplicarModo(); guardarDatos(); render(); }));
  $("cart-zone").addEventListener("change", () => { guardarDatos(); render(); });
  ["cart-name","cart-address","cart-pay"].forEach(id => {
    $(id).addEventListener("input", () => { $("cart-error").textContent = ""; });
    $(id).addEventListener("change", guardarDatos);
  });

  if(quitados) mostrarToast("Quitamos del carrito platos que ya no están disponibles", true);
});


/* ===== Explorador visual del menú: búsqueda y filtros ===== */
document.addEventListener("DOMContentLoaded", () => {
  const input = document.getElementById("menu-search-input");
  const clear = document.getElementById("menu-search-clear");
  const filters = document.getElementById("menu-filters");
  const results = document.getElementById("menu-results");
  if (!input || !filters || !results) return;

  const sections = [...document.querySelectorAll("body > section:not(.menu-explorer)")];
  const products = [...document.querySelectorAll(".order-item")];
  let activeFilter = "all";

  sections.forEach(section => {
    if (!section.id || section.id === "acciones") return;
    const heading = section.querySelector("h2");
    if (!heading) return;
    const button = document.createElement("button");
    button.type = "button";
    button.className = "filter-chip";
    button.dataset.filter = section.id;
    button.textContent = heading.textContent.trim();
    filters.appendChild(button);
  });

  function updateMenu() {
    const query = input.value.trim().toLocaleLowerCase("es");
    let visible = 0;

    products.forEach(product => {
      const section = product.closest("section");
      const categoryMatches = activeFilter === "all" || (section && section.id === activeFilter);
      const text = (product.textContent + " " + (product.dataset.product || "")).toLocaleLowerCase("es");
      const searchMatches = !query || text.includes(query);
      const show = categoryMatches && searchMatches;
      product.hidden = !show;
      if (show) visible++;
    });

    sections.forEach(section => {
      if (section.id === "acciones") return;
      const hasVisible = [...section.querySelectorAll(".order-item")].some(item => !item.hidden);
      section.classList.toggle("menu-filter-empty", !hasVisible);
    });

    filters.querySelectorAll(".filter-chip").forEach(button => {
      const active = button.dataset.filter === activeFilter;
      button.classList.toggle("active", active);
      button.setAttribute("aria-pressed", String(active));
    });
    results.textContent = query || activeFilter !== "all"
      ? `${visible} ${visible === 1 ? "plato encontrado" : "platos encontrados"}`
      : "Selecciona un plato para agregarlo a tu pedido";
  }

  filters.addEventListener("click", event => {
    const button = event.target.closest(".filter-chip");
    if (!button) return;
    activeFilter = button.dataset.filter || "all";
    updateMenu();
  });
  input.addEventListener("input", updateMenu);
  clear?.addEventListener("click", () => {
    input.value = "";
    activeFilter = "all";
    updateMenu();
    input.focus();
  });
  updateMenu();
});
