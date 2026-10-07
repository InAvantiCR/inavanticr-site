# In Avanti — instrucciones para Claude Code

Sitio web oficial de In Avanti (restaurante y alimentación para empresas en La Aurora, Heredia, Costa Rica). Publicado en https://inavanticr.com mediante Cloudflare Pages: cada merge a `main` se publica automáticamente; cada rama genera una vista previa.

## Reglas de trabajo
- Nunca hacer push directo a `main`. Una rama por cambio y un Pull Request; el dueño revisa la vista previa y hace el merge.
- El repositorio es **público**: nunca guardar contraseñas, claves, precios internos, cédulas ni datos de clientes.
- Sitio estático: HTML semántico + CSS, fuentes del sistema, sin frameworks ni dependencias. El único paso de build es `node build.mjs` (Node puro, sin paquetes), que arma el sitio en `dist/`. No agregar otros pasos ni dependencias sin consultarlo.
- Las imágenes e íconos viven en la raíz del repo (no hay carpeta `assets/`).
- Mantener `_headers` (seguridad). Si se agrega un servicio de terceros (analítica, mapas, formularios), actualizar la Content-Security-Policy.
- Idioma del sitio: español de Costa Rica. Tono de la web: de usted, formal y ejecutivo.

## Ficha maestra (`ficha.json`)
- `ficha.json` es la única fuente de los datos del negocio: nombre, lema, dirección, GPS, teléfono, WhatsApp, correo, horario, redes, servicios, colores. Cambiar un dato ahí lo cambia en todo el sitio y en el JSON-LD.
- Nunca escribir esos datos a mano en el HTML. Usar `{{campo}}` (texto escapado) o `{{{campo}}}` (HTML que arma `build.mjs`, como `horario_html` o `schema`). Los campos calculados (`tel.<teléfono>`, `wa.<mensaje>`, `mapa_url`, `waze_url`, `direccion_completa`, `anio`) están en `build.mjs`.
- Dos teléfonos en `telefonos`: `pedidos` (restaurante, llamada y WhatsApp; es el principal en Google) y `administracion` (empresas, convenios, eventos). Cada mensaje de `whatsapp_mensajes` indica a qué teléfono va. `redes` alimenta `sameAs`; `enlaces` guarda Google Maps, Waze y Uber Eats.
- El JSON-LD `Restaurant` se genera con `{{{schema}}}`; agrega `geo` y `sameAs` solo cuando la ficha tiene coordenadas y redes.
- Si un campo no existe, el build falla a propósito y Cloudflare no publica. Probar siempre con `node build.mjs` antes de abrir el PR.
- `ficha.json`, `build.mjs` y `CLAUDE.md` no se publican en el sitio.

## Estándares SEO
- Un H1 por página con la actividad y la zona; title (~50–60 caracteres) y meta description (~140–155) únicos.
- `alt` descriptivo en cada imagen; WebP con `width` y `height`.
- Datos de negocio (nombre, dirección, teléfono, horario) idénticos en todas las páginas y en el JSON-LD.
- Schema.org: `Restaurant` con `@id` fijo `https://inavanticr.com/#restaurant`; `Menu`, `Service` y `BreadcrumbList` según la página.
- Actualizar `sitemap.xml` al agregar páginas. Menú siempre en HTML, nunca solo en PDF o imagen.
- Objetivos: Lighthouse ≥ 90 en móvil; Core Web Vitals en verde.

## Datos públicos del negocio
Ver `ficha.json`.
