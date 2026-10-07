# In Avanti — instrucciones para Claude Code

Sitio web oficial de In Avanti (restaurante y alimentación para empresas en La Aurora, Heredia, Costa Rica). Publicado en https://inavanticr.com mediante Cloudflare Pages: cada merge a `main` se publica automáticamente; cada rama genera una vista previa.

## Reglas de trabajo
- Nunca hacer push directo a `main`. Una rama por cambio y un Pull Request; el dueño revisa la vista previa y hace el merge.
- El repositorio es **público**: nunca guardar contraseñas, claves, precios internos, cédulas ni datos de clientes.
- Sitio estático: HTML semántico + CSS, fuentes del sistema, sin frameworks ni dependencias. No agregar un paso de build sin consultarlo.
- Las imágenes e íconos viven en la raíz del repo (no hay carpeta `assets/`).
- Mantener `_headers` (seguridad). Si se agrega un servicio de terceros (analítica, mapas, formularios), actualizar la Content-Security-Policy.
- Idioma del sitio: español de Costa Rica. Tono de la web: de usted, formal y ejecutivo.

## Estándares SEO
- Un H1 por página con la actividad y la zona; title (~50–60 caracteres) y meta description (~140–155) únicos.
- `alt` descriptivo en cada imagen; WebP con `width` y `height`.
- Datos de negocio (nombre, dirección, teléfono, horario) idénticos en todas las páginas y en el JSON-LD.
- Schema.org: `Restaurant` con `@id` fijo `https://inavanticr.com/#restaurant`; `Menu`, `Service` y `BreadcrumbList` según la página.
- Actualizar `sitemap.xml` al agregar páginas. Menú siempre en HTML, nunca solo en PDF o imagen.
- Objetivos: Lighthouse ≥ 90 en móvil; Core Web Vitals en verde.

## Datos públicos del negocio
- In Avanti — "El Placer de la Variedad"
- Outlet Center, local #10, 200 m oeste de la Zona Franca Metropolitana, La Aurora, Ulloa, Heredia
- Lunes a viernes 7:00 a.m.–3:00 p.m. · Sábado 7:00 a.m.–2:30 p.m.
- Tel./WhatsApp +506 7019-1780 · admin@inavanticr.com
