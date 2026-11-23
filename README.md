# Patricio Plaza — Filmmaker & Animation Director Portfolio

Sitio web y portafolio oficial del cineasta y director de animación **Patricio Plaza**. Construido con **React 18**, **TypeScript**, **Vite** y **Lucide React**, diseñado bajo una estética cinematográfica contemporánea en **Pure Dark Mode** (`#000000`).

---

## 🚀 Inicio Rápido (Desarrollo y Build)

### Requisitos previos
- **Node.js**: v18.0.0 o superior
- **npm** o **pnpm**

### Comandos principales

```bash
# Instalar dependencias
npm install

# Iniciar servidor de desarrollo local
npm run dev

# Compilar para producción (TypeScript + Vite bundling)
npm run build

# Previsualizar el build de producción
npm run preview
```

---

## 🎨 Arquitectura y Decisiones de Diseño UI/UX

1. **Pure Dark Mode (`#000000`)**:
   - Todo el fondo del sitio, hero, navegación y fichas de proyecto utilizan negro puro para maximizar el contraste cinemático y la inmersión visual.
   - Laureles de festivales y logotipos institucionales cuentan con filtros de contraste optimizados (`filter: brightness(0) invert(1)`) para legibilidad sobre fondo negro.
2. **Portadas y Stills en Proporción 16:9**:
   - Encuadres estandarizados en ratio `16:9` con `object-fit: cover` y alineación centrada para preservar rostros y composiciones clave sin deformación ni recortes perjudiciales.
   - Portadas limpias basadas en fotogramas originales (*stills* de producción), sin títulos ni laureles incrustados en la imagen base.
3. **Biografía Estructurada en 4 Bloques Temáticos**:
   - Eliminación de métricas estadísticas superfluas y rangos numéricos rígidos.
   - Organización semántica con encabezados `<h3>`:
     1. **Formación** / *Education & Background*
     2. **Experiencia Profesional** / *Professional Experience*
     3. **Obra** / *Body of Work & Filmography*
     4. **Divulgación** / *Teaching & Cultural Outreach*
4. **Fichas Técnicas Estandarizadas (9 Campos Obligatorios)**:
   - Todas las obras (*El Empleo*, *Padre*, *Carne de Dios*, *Luz Diabla*, *Santa Sombra*, *Diarios Negros*, *Parásitos*) comparten una cuadrícula técnica uniforme con 9 campos obligatorios:
     - Título
     - Guion
     - Dirección
     - Producción / Casas Productoras
     - Género
     - Formato / Técnica
     - Duración
     - Audiencia / Target
     - Estado del proyecto (*Finalizado* / *En desarrollo*)
   - **Lógica condicional de reconocimientos**:
     - *Proyectos finalizados*: Tira de laureles de festivales internacionales.
     - *Proyectos en desarrollo*: Sellos y logotipos de fondos de fomento, mercados y residencias (Mifa, NEF Animation, Ventana Sur, Ciclic, etc.).
5. **Reproductores de Video (Vimeo vs YouTube)**:
   - Reproducción y enlaces externos migrados a **Vimeo** para evitar bloqueos por restricción de edad de YouTube (*Carne de Dios*, *Luz Diabla*, *Santa Sombra*, *Diarios Negros*, *Parásitos*).
   - Excepción monetizada mantenida en **YouTube** exclusivamente para *El Empleo* y *Padre*.
6. **Canales de Contacto Directo**:
   - Tarjetas diferenciadas para:
     - **Contacto Personal / Directo**: `info@patricioplaza.com.ar`
     - **Contacto Institucional / Productora (Ojo Raro)**: `contacto@ojoraro.com.ar`

---

## 📬 Configuración Técnica del Formulario de Contacto

El componente `ContactPage` en `app.tsx` implementa una solución híbrida:

1. **Envío vía API (Endpoint Asíncrono)**: Si se define la constante `FORM_ENDPOINT`, el formulario envía los datos mediante una solicitud `fetch` con método `POST` y cabeceras JSON.
2. **Fallback Nativo (`mailto:`)**: Si no hay un endpoint configurado o si ocurre un fallo en la red, el formulario genera automáticamente un enlace `mailto:` codificado con el asunto y cuerpo del mensaje, abriendo el cliente de correo predeterminado del usuario sin pérdida de datos.

### Opciones recomendadas para el backend de correo

#### Opción A: Formspree (Sin servidor)
1. Crea una cuenta en [formspree.io](https://formspree.io) y crea un nuevo formulario apuntando a `info@patricioplaza.com.ar`.
2. Obtén tu ID de formulario (ej. `https://formspree.io/f/xpzgqwer`).
3. En `app.tsx`, asigna la URL a la variable:
   ```ts
   const FORM_ENDPOINT = "https://formspree.io/f/tu-id-aqui";
   ```

#### Opción B: useBasin / Web3Forms
1. Obtén tu clave pública en [usebasin.com](https://usebasin.com) o [web3forms.com](https://web3forms.com).
2. Asigna la URL del endpoint en `app.tsx`:
   ```ts
   const FORM_ENDPOINT = "https://usebasin.com/f/<TU_KEY>";
   ```

#### Opción C: Serverless Function / Cloudflare Worker / Vercel API
Si despliegas en Vercel, Netlify o Cloudflare Pages, puedes crear una función sin servidor:
```ts
// api/contact.ts
import type { VercelRequest, VercelResponse } from '@vercel/node';
import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  const { name, email, message } = req.body;
  try {
    await resend.emails.send({
      from: 'Portfolio Contact <noreply@patricioplaza.com.ar>',
      to: 'info@patricioplaza.com.ar',
      replyTo: email,
      subject: `Nuevo mensaje de ${name} vía portfolio`,
      text: message,
    });
    return res.status(200).json({ success: true });
  } catch (error) {
    return res.status(500).json({ error: 'Error enviando correo' });
  }
}
```
Y configurar en `app.tsx`:
```ts
const FORM_ENDPOINT = "/api/contact";
```

---

## 📁 Estructura del Proyecto

```
mi-sitio/
├── public/
│   ├── hero_pp/                   # Fotogramas principales de gran formato
│   ├── stills_pp/                 # Fotogramas de producción (16:9) por proyecto
│   ├── laureles_películas/        # Laureles de festivales por film
│   │   ├── carne_de_dios_laureles/
│   │   ├── elempleo_laureles/
│   │   ├── padre_laureles/
│   │   ├── santasombra_laureles/
│   │   └── ...
│   ├── ParasitosPerfectos/        # Concept art y stills de Parásitos
│   └── mercados_residencias/      # Sellos institucionales de fondos y mercados (Mifa, etc.)
├── app.tsx                        # Componente raíz y enrutamiento SPA
├── index.css                      # Sistema de diseño, tokens CSS y Pure Dark Mode
├── index.html                     # Entrypoint HTML
├── package.json
└── vite.config.ts
```

---

## 🛠️ Auditoría de Assets: Santa Sombra

Durante la auditoría técnica de rutas:
- Se detectó que los archivos originales en `public/stills_pp/` estaban nombrados con `e`: `santasombre_stills_01.png`, `02.png`, `03.png`.
- Se crearon alias normalizados con `a` (`santasombra_stills_01.png`, etc.) y se implementó una función de resolución dinámica `imageCandidates()` con soporte para variantes de nombres y carpetas como `Hero Steels` / `hero_pp` / `stills_pp`.
- Se corrigió la ubicación de los laureles de festival correspondientes a *Santa Sombra* que se encontraban archivados en carpetas alternativas.
