// Arma el sitio en dist/ a partir de ficha.json (la ficha maestra).
// Uso: node build.mjs   (Cloudflare Pages lo ejecuta en cada publicación)
//
// En los .html y .webmanifest:
//   {{campo}}    inserta el valor escapado (ej. {{telefono}}, {{direccion.calle}})
//   {{{campo}}}  inserta HTML ya armado por este script (ej. {{{horario_html}}}, {{{schema}}})
// Un campo que no exista detiene la publicación, para no subir una página rota.

import { readFileSync, writeFileSync, mkdirSync, rmSync, readdirSync, copyFileSync, statSync } from "node:fs";
import { join, extname } from "node:path";

const OUT = "dist";
const NO_PUBLICAR = new Set(["dist", "node_modules", "build.mjs", "ficha.json", "CLAUDE.md", "README.md", "package.json"]);
const PLANTILLAS = new Set([".html", ".webmanifest"]);

const ficha = JSON.parse(readFileSync("ficha.json", "utf8"));

for (const campo of ["nombre", "lema", "sitio", "correo", "telefono_principal", "direccion.calle", "direccion.localidad", "direccion.distrito", "direccion.provincia"]) {
  if (!valor(ficha, campo)) falla(`ficha.json: falta "${campo}"`);
}
if (!Array.isArray(ficha.horario) || ficha.horario.length === 0) falla(`ficha.json: falta "horario"`);
const telefonos = ficha.telefonos || {};
for (const [k, t] of Object.entries(telefonos)) {
  if (!/^\+506 \d{4}-\d{4}$/.test(t.numero || "")) falla(`ficha.json: telefonos.${k}.numero debe tener formato +506 XXXX-XXXX`);
}
if (!telefonos[ficha.telefono_principal]) falla(`ficha.json: telefono_principal "${ficha.telefono_principal}" no está en telefonos`);
for (const [k, m] of Object.entries(ficha.whatsapp_mensajes || {})) {
  if (!telefonos[m.telefono]) falla(`ficha.json: whatsapp_mensajes.${k} usa el teléfono "${m.telefono}", que no está en telefonos`);
}

const soloDigitos = (s) => s.replace(/\D/g, "");
const d = ficha.direccion;
const sitio = ficha.sitio.replace(/\/$/, "");
const tieneGeo = ficha.geo && typeof ficha.geo.lat === "number" && typeof ficha.geo.lng === "number";
const destino = tieneGeo ? `${ficha.geo.lat},${ficha.geo.lng}` : `${d.calle.split(",")[0]} ${d.localidad} ${d.provincia}`;
const enlaces = ficha.enlaces || {};
const telPrincipal = `+${soloDigitos(telefonos[ficha.telefono_principal].numero)}`;

// Valores calculados a partir de la ficha
const datos = {
  ...ficha,
  anio: String(new Date().getFullYear()),
  direccion_completa: `${d.calle}, ${d.localidad}, ${d.distrito}, ${d.provincia}`,
  tel: Object.fromEntries(Object.entries(telefonos).map(([k, t]) => [k, `tel:+${soloDigitos(t.numero)}`])),
  correo_enlace: `mailto:${ficha.correo}`,
  wa: Object.fromEntries(
    Object.entries(ficha.whatsapp_mensajes || {}).map(([k, m]) => [
      k,
      `https://wa.me/${soloDigitos(telefonos[m.telefono].numero)}?text=${encodeURIComponent(m.texto)}`,
    ])
  ),
  mapa_url: enlaces.google_maps || `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(destino)}`,
  waze_url:
    enlaces.waze ||
    (tieneGeo
      ? `https://waze.com/ul?ll=${encodeURIComponent(destino)}&navigate=yes`
      : `https://waze.com/ul?q=${encodeURIComponent(destino)}&navigate=yes`),
  horario_html: ficha.horario
    .map((h) => `${esc(h.dias)}: ${hora(h.abre)} a ${hora(h.cierra)}`)
    .concat(ficha.horario_empresas ? [esc(ficha.horario_empresas)] : [])
    .join("<br>"),
  schema: `<script type="application/ld+json">\n${JSON.stringify(schema(), null, 2).replace(/</g, "\\u003c")}\n</script>`,
};

rmSync(OUT, { recursive: true, force: true });
copiar(".", OUT);
console.log(`Sitio armado en ${OUT}/ con los datos de ficha.json`);

function copiar(origen, destinoDir) {
  mkdirSync(destinoDir, { recursive: true });
  for (const nombre of readdirSync(origen)) {
    if (nombre.startsWith(".") || NO_PUBLICAR.has(nombre)) continue;
    const de = join(origen, nombre);
    const a = join(destinoDir, nombre);
    if (statSync(de).isDirectory()) copiar(de, a);
    else if (PLANTILLAS.has(extname(nombre))) writeFileSync(a, rellenar(readFileSync(de, "utf8"), de));
    else copyFileSync(de, a);
  }
}

function rellenar(texto, archivo) {
  const salida = texto.replace(/\{\{\{\s*([\w.]+)\s*\}\}\}|\{\{\s*([\w.]+)\s*\}\}/g, (_, crudo, normal) => {
    const campo = crudo || normal;
    const v = valor(datos, campo);
    if (v === undefined || v === null || typeof v === "object") falla(`${archivo}: el campo "${campo}" no existe en ficha.json`);
    return crudo ? String(v) : esc(String(v));
  });
  if (salida.includes("{{")) falla(`${archivo}: quedó un "{{" sin cerrar`);
  return salida;
}

function schema() {
  const s = {
    "@context": "https://schema.org",
    "@type": "Restaurant",
    "@id": `${sitio}/#restaurant`,
    name: ficha.nombre,
    slogan: ficha.lema,
    description: ficha.descripcion_corta,
    url: `${sitio}/`,
    logo: `${sitio}/logo.png`,
    image: `${sitio}/og.jpg`,
    telephone: telPrincipal,
    email: ficha.correo,
    priceRange: ficha.rango_precios,
    servesCuisine: ficha.cocina,
    acceptsReservations: true,
    foundingDate: ficha.fundacion,
    address: {
      "@type": "PostalAddress",
      streetAddress: d.calle,
      addressLocality: `${d.localidad}, ${d.distrito}`,
      addressRegion: d.provincia,
      postalCode: d.codigo_postal,
      addressCountry: d.pais,
    },
    openingHoursSpecification: ficha.horario.map((h) => ({
      "@type": "OpeningHoursSpecification",
      dayOfWeek: h.dias_en,
      opens: h.abre,
      closes: h.cierra,
    })),
    areaServed: ficha.area_servida,
    hasOfferCatalog: {
      "@type": "OfferCatalog",
      name: "Servicios para empresas",
      itemListElement: (ficha.servicios || []).map((nombre) => ({ "@type": "Offer", itemOffered: { "@type": "Service", name: nombre } })),
    },
  };
  s.contactPoint = Object.values(telefonos).map((t) => ({
    "@type": "ContactPoint",
    telephone: `+${soloDigitos(t.numero)}`,
    contactType: t.uso,
    areaServed: "CR",
    availableLanguage: "es",
  }));
  if (tieneGeo) s.geo = { "@type": "GeoCoordinates", latitude: ficha.geo.lat, longitude: ficha.geo.lng };
  if (enlaces.google_maps) s.hasMap = enlaces.google_maps;
  const perfiles = Object.values(ficha.redes || {}).filter(Boolean);
  if (perfiles.length) s.sameAs = perfiles;
  return s;
}

// "07:00" -> "7:00 a.m.", "14:30" -> "2:30 p.m."
function hora(hhmm) {
  const [h, m] = hhmm.split(":").map(Number);
  const sufijo = h < 12 ? "a.m." : "p.m.";
  return `${h % 12 || 12}:${String(m).padStart(2, "0")} ${sufijo}`;
}

function valor(obj, ruta) {
  return ruta.split(".").reduce((o, k) => (o == null ? undefined : o[k]), obj);
}

function esc(s) {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

function falla(msg) {
  console.error(`ERROR: ${msg}`);
  process.exit(1);
}
