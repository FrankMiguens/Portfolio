# Patricio Plaza — Portfolio Oficial

Sitio web y portafolio profesional del cineasta, director de animación y productor argentino **Patricio Plaza**. La plataforma está concebida como una carta de presentación cinematográfica dirigida a productores, fondos de fomento, festivales internacionales, programadores, prensa especializada y audiencia general interesada en cine de animación de autor con enfoque político, terror folclórico y fantasía oscura.

* **Sitio Web Publicado:** [https://portfolio-two-hazel-77.vercel.app/#/inicio](https://portfolio-two-hazel-77.vercel.app/#/inicio)
* **Repositorio de Código (GitHub):** [https://github.com/FrankMiguens/Portfolio](https://github.com/FrankMiguens/Portfolio)

---

## 🎨 Arquitectura de Diseño y Secciones del Sitio

La web sigue una dirección visual minimalista y cinemática en **Pure Dark Mode** (`#000000`), priorizando el impacto visual de los fotogramas y fragmentos de video en relación de aspecto `16:9`, con tipografía *Inter* y toques sutiles de acento (`--accent: #e23d8d`).

### 1. Sistema de Enrutamiento Hash (`HashRouting`)
La aplicación opera como una SPA (*Single Page Application*) que gestiona la navegación mediante fragmentos de URL (`window.location.hash`), por ejemplo `#/inicio`, `#/bio`, `#/films`, `#/film/:slug`, `#/contacto`. Este enfoque garantiza compatibilidad total con servidores estáticos, GitHub Pages, Vercel, Netlify o subcarpetas de almacenamiento (ej. Google Drive o servidores corporativos) sin requerir reescrituras de URL (*URL rewrites*) ni configuración compleja en el servidor.

### 2. Soporte Bilingüe (Español / Inglés)
El sitio cuenta con un selector de idioma (`ES / EN`) globalmente accesible en la barra de navegación. Todo el contenido textual, fichas técnicas, sinopsis y etiquetas de accesibilidad se encuentran tipadas y centralizadas en el objeto `copy` dentro de `app.tsx`.

### 3. Vistas Principales

* **Inicio (`#/inicio`)**:
  * **Hero Carousel**: Carrusel con soporte híbrido para videos en bucle (`.mp4` optimizados en `public/videos/`) e imágenes fijas en alta resolución (`public/hero_pp/`). Los videos cuentan con reproducción inline silenciosa (`autoPlay`, `muted`, `loop`, `playsInline`) y gestión de ciclo de vida (se reproducen solo cuando el slide está activo y se pausan al cambiar de slide para optimizar memoria y rendimiento).
  * **Botones e Indicadores**: Cartel de título del proyecto y botón interactivo "Ver proyecto ▸" (con tamaño uniforme y proporcional tanto en escritorio como en mobile), además de un reel de puntos interactivo en la esquina superior izquierda.
  * **Presentación**: Declaración de principios (*artist statement*) y síntesis biográfica del director.

* **Biografía (`#/bio`)**:
  * **Retrato Oficial**: Fotografía de Patricio Plaza enmarcada con desfase de acento estético, centrada en dispositivos móviles y anclada a la cuadrícula en escritorio.
  * **Statement Destacado**: Recuadro con la premisa artística central.
  * **4 Bloques Temáticos**:
    1. *Formación* (Educación formal y académica).
    2. *Experiencia Profesional* (Trayectoria docente y en la industria).
    3. *Obra* (Filmografía destacada y premios internacionales).
    4. *Divulgación* (Conferencias, jurados y labor de curaduría).

* **Catálogo de Films (`#/films`)**:
  * Cuadrícula de obras finalizadas y proyectos en desarrollo. Cada tarjeta muestra el póster en ratio `16:9` con un overlay que revela título, estado/año y género, optimizado para interacción por cursor (*hover*) y pantallas táctiles (*tap*).

* **Ficha de Proyecto (`#/film/:slug`)**:
  * **Previsualización / Media**: Player de video (Vimeo/YouTube) o póster fotográfico.
  * **Sinopsis**: Resumen argumental en el idioma activo.
  * **Ficha Técnica (9 campos estandarizados)**: Título, Guion, Dirección, Producción, Género, Formato / Técnica, Duración, Audiencia / Target y Estado del proyecto.
  * **Reconocimientos Dinámicos**:
    * *Proyectos finalizados*: Tira deslizante de laureles de festivales internacionales (`laurels-wrap`), con flechas de desplazamiento lateral en escritorio y desplazamiento táctil nativo tipo carrete en celulares.
    * *Proyectos en desarrollo*: Tarjetas y logotipos de fondos de desarrollo, mercados y residencias (Mifa, NEF Animation, Ventana Sur, etc.).
  * **Galería de Stills con Lightbox**: Fotogramas ampliables en modal con navegación por teclado (flechas izquierda/derecha, tecla Escape) y botones táctiles.
  * **Barra de Paginación Inferior**: Navegación entre proyectos (`<` Anterior | `FILMS` al centro | `>` Siguiente).

* **Contacto (`#/contacto`)**:
  * **Vías Directas**: Tarjetas para contacto personal (`info@patricioplaza.com.ar`) y productora *Ojo Raro* (`contacto@ojoraro.com.ar`).
  * **Formulario**: Soporta envío asíncrono hacia servicios como Formspree/Basin a través de `FORM_ENDPOINT`, con mecanismo de respaldo nativo vía `mailto:` si el endpoint no está activo.

### 4. Responsividad y Navegación Móvil
* **Escritorio**: Barra lateral izquierda fija (`.sidebar`) con navegación vertical, selector de idioma y línea divisoria estética.
* **Móviles / Tablets (`@media (max-width: 680px)`)**: Cabecera fija superior con marca (`Patricio Plaza`), selector de idioma `ES / EN` y menú desplegable (*dropdown*) tipo hamburguesa accesible y animado que no se superpone con los controles de idioma.

---

## 💻 Tecnologías Utilizadas

* **React 18** (`react`, `react-dom`): Arquitectura de componentes funcionales y hooks reactivos (`useState`, `useEffect`, `useRef`, `useMemo`).
* **TypeScript 5**: Tipado estricto para entidades de películas (`Film`), internacionalización (`Language`, `L10n`) y props de componentes.
* **Vite 6**: Empaquetador ultrarrápido con soporte HMR (*Hot Module Replacement*) y base de rutas relativas configurada para portabilidad.
* **Tailwind CSS 4** (`@tailwindcss/vite`): Motor de estilos de última generación integrado junto a tokens personalizados en CSS puro.
* **HTML5 Video & Intersection Observer**: Reproducción eficiente de bucles de video en el Hero y transiciones animadas progresivas (*reveal on scroll*).

---

## 📁 Estructura del Proyecto

```
Portfolio/
├── public/                                # Archivos estáticos servidos directamente
│   ├── bio/                               # Fotografía de retrato para la sección Bio
│   │   └── recurso-1.png
│   ├── hero_pp/                           # Fotogramas originales en alta resolución (hero_01 a hero_07)
│   ├── laureles_películas/                # Laureles de festivales organizados por film
│   │   ├── CarnedeDios_laureles/
│   │   ├── elempleo_laureles/
│   │   ├── padre_laureles/
│   │   ├── santasombra_laureles/
│   │   └── ...Versiones con sufijo _Bl (para contraste alternativo)
│   ├── stills_pp/                         # Fotogramas de producción (16:9) por proyecto
│   ├── videos/                            # Bucles de video optimizados para el carrusel de Inicio
│   │   ├── BD LOOP.mp4                    # Diarios Negros
│   │   ├── EL EMPLEO LOOP.mp4             # El Empleo
│   │   ├── LUZ DIABLA loop.mp4            # Luz Diabla
│   │   ├── PADRE LOOP.mp4                 # Padre
│   │   └── SASI LOOP.mp4                  # Santa Sombra
│   └── favicon.svg                        # Favicon vectorial oficial
├── app.tsx                                # Aplicación SPA completa (componentes, datos y lógica)
├── index.css                              # Sistema de diseño, tokens CSS, breakpoints y animaciones
├── index.html                             # Plantilla HTML con tipografía Inter y metaetiquetas
├── main.tsx                               # Punto de entrada de renderizado React
├── package.json                           # Manifiesto de dependencias y scripts de npm
├── tsconfig.json                          # Configuración de compilación de TypeScript
└── vite.config.ts                         # Configuración de Vite con base relativa ("./")
```

---

## 🚀 Instalación y Ejecución en Local

### Requisitos previos
* **Node.js**: Versión 18.0.0 o superior recomendada.
* **npm**: Incluido con Node.js (o alternativamente `pnpm` / `yarn`).

### Pasos

1. **Clonar o descargar el repositorio**:
   ```bash
   git clone https://github.com/FrankMiguens/Portfolio.git
   cd Portfolio
   ```

2. **Instalar dependencias**:
   ```bash
   npm install
   ```

3. **Iniciar el servidor de desarrollo local**:
   ```bash
   npm run dev
   ```
   Abre [http://localhost:5173](http://localhost:5173) en tu navegador para ver la web con recarga instantánea en caliente (*HMR*).

4. **Compilar para producción**:
   ```bash
   npm run build
   ```
   Genera los archivos optimizados y minificados en la carpeta `dist/`.

5. **Previsualizar el build de producción**:
   ```bash
   npm run preview
   ```

---

## 📦 Despliegue (Deploy)

El proyecto está configurado con `base: "./"` en [vite.config.ts](file:///c:/Users/Franco/Documents/GitHub/Portfolio/vite.config.ts), lo que permite desplegarlo sin modificaciones en cualquier entorno:

* **Vercel**: Conectado a la rama `main` del repositorio para despliegue automático continuo.
* **Netlify / GitHub Pages / Cloudflare Pages**: Funciona de forma automática seleccionando el comando de build `npm run build` y la carpeta de publicación `dist`.
* **Hosting tradicional (FTP / cPanel / Apache / Nginx)**: Basta con subir el contenido de la carpeta `dist/` a la raíz de la web.

---

## ℹ️ Datos Clave para el Programador que Reciba el Proyecto

1. **Gestión de Películas y Datos (`films`)**:
   * Toda la filmografía está declarada de forma estructurada en el arreglo `films` dentro de [app.tsx](file:///c:/Users/Franco/Documents/GitHub/Portfolio/app.tsx#L188-L560).
   * Para añadir un nuevo proyecto o editar uno existente, basta con replicar el esquema tipado por la interfaz `Film`.
2. **Configuración del Carrusel Hero (`heroImages`)**:
   * Los elementos del banner principal se definen en el arreglo `heroImages` en [app.tsx](file:///c:/Users/Franco/Documents/GitHub/Portfolio/app.tsx#L975-L1025).
   * Cada elemento puede recibir una imagen fija (`image: hero("...")`) y opcionalmente un video en bucle (`video: heroVideo("...")`). Si incluye video, el componente `HeroVideo` se encargará automáticamente del autoplay y de pausarlo al salir de pantalla.
3. **Resolución de Assets y Fallbacks (`FallbackImg`)**:
   * El componente `FallbackImg` implementa un algoritmo inteligente en `imageCandidates()` que prueba extensiones alternativas (`.png`, `.webp`, `.jpg`) y normalizaciones de nombres para asegurar que ninguna imagen falle si se cambia de formato.
4. **Endpoint de Contacto (`FORM_ENDPOINT`)**:
   * En la cabecera de [app.tsx](file:///c:/Users/Franco/Documents/GitHub/Portfolio/app.tsx#L20), la constante `FORM_ENDPOINT` permite conectar de inmediato un proveedor de formularios (ej. Formspree, Basin, Web3Forms o API serverless). Si se deja vacía (`""`), el formulario utiliza de forma automática un fallback seguro `mailto:`.
5. **Archivos a Subir a Google Drive**:
   * Para pasarle el proyecto a otro programador por Drive de forma limpia y liviana, **excluye** la carpeta `node_modules/` (se regenera con `npm install`) y la carpeta `dist/` (se genera con `npm run build`).

---

## 📬 Contacto y Soporte Técnico

Si tienes dudas sobre el código, la arquitectura o la configuración del proyecto, puedes contactarte directamente con:

* **Desarrollador / Mantenedor:** Franco Nicolás Miguens
* **Correo electrónico:** [miguensfranconicolas@gmail.com](mailto:miguensfranconicolas@gmail.com)
* **Teléfono / WhatsApp:** 1166017060
