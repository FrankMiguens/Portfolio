import {
  FormEvent,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type ImgHTMLAttributes,
  type ReactNode,
  type TouchEvent as ReactTouchEvent,
} from "react"
import { createPortal } from "react-dom"
 
type Language = "ES" | "EN"
type Theme = "light" | "dark"
 
type L10n = { ES: string; EN: string }
 
type Credit = { role: L10n; people: string }
 
type Film = {
  slug: string
  title: string
  year: string
  status?: "development"
  feature?: boolean
  preview?: string
  synopsis?: L10n
  credits?: Credit[]
  duration?: string
  coProduction?: string[]
  youtube?: { id: string; start?: number } // video de portada (id de YouTube + segundo de inicio opcional)
  vimeo?: string // TODO: reemplazar por la URL de cada película
  laurelsFolder?: string // subcarpeta dentro de public/laureles_películas/ donde están los PNG de esta película
  laurels?: string[] // nombres de archivo (sin extensión), en el orden en que aparecen en ojoraro.com.ar
  stills: string[]
}
 
/* Rutas de imágenes. Si algo no carga en producción, probá "/hero_pp", "/stills_pp" y "/laureles" (con barra inicial). */
const HERO_DIR = "hero_pp"
const STILLS_DIR = "stills_pp"
// Laureles: public/laureles_películas/<carpeta de la película>/<archivo>.png (misma estructura que el zip)
const LAURELS_DIR = `${encodeURIComponent("laureles_películas")}`
// Parásitos Perfectos: public/ParasitosPerfectos/<archivo>.png (misma estructura que el zip)
const PP_DIR = "ParasitosPerfectos"
const HERO_EXT = "png"
const STILLS_EXT = "png"
const LAURELS_EXT = "png"
const PP_EXT = "png"
 
// encodeURIComponent convierte los espacios en %20 (hay nombres con espacios)
const still = (name: string) => `${STILLS_DIR}/${encodeURIComponent(name)}.${STILLS_EXT}`
const hero = (name: string) => `${HERO_DIR}/${encodeURIComponent(name)}.${HERO_EXT}`
const laurel = (folder: string, name: string) =>
  `${LAURELS_DIR}/${encodeURIComponent(folder)}/${encodeURIComponent(name)}.${LAURELS_EXT}`
// Respeta mayúsculas/minúsculas tal como están los archivos ("CONCEPT 01", "concept 03", etc.)
const pp = (name: string) => `${PP_DIR}/${encodeURIComponent(name)}.${PP_EXT}`
 
// Atajo para escribir un rol de la ficha en los dos idiomas
const role = (ES: string, EN: string): L10n => ({ ES, EN })
 
/* Triángulo (el mismo del indicador del menú lateral) que reemplaza todas las flechas del sitio.
   El color se define con --triangle en index.css (blanco sobre fondos oscuros). */
function Triangle({ dir = "right", size = 10 }: { dir?: "left" | "right"; size?: number }) {
  return (
    <svg
      aria-hidden="true"
      className={`tri ${dir === "left" ? "tri-left" : ""}`}
      fill="currentColor"
      height={size}
      viewBox="0 0 12 12"
      width={size}
    >
      <path d="M2 1L11 6L2 11V1Z" />
    </svg>
  )
}
 
/* Imágenes con reintento: si un archivo no carga, prueba variantes probables del nombre
   (mayúsculas/minúsculas, espacios, extensión, con y sin "public/"). Recuerda la que funcionó. */
const resolvedSrc: Record<string, string> = {}
 
function imageCandidates(src: string): string[] {
  const match = src.match(/^(.*\/)?([^/]*?)(?:\.([a-zA-Z0-9]+))?$/)
  if (!match) return [src]
  const dir = match[1] ?? ""
  let name = match[2]
  try {
    name = decodeURIComponent(name)
  } catch {
    /* nombre ya decodificado */
  }
  const ext = match[3] ?? "png"
 
  const seeds = new Set<string>([name])
  const addAll = (fn: (value: string) => string) => [...seeds].forEach((seed) => seeds.add(fn(seed)))
  addAll((v) => v.replace("_ stills", "_stills"))
  addAll((v) => v.replace("_stills", "_ stills"))
  addAll((v) => v.replace("santasombra", "santa sombra"))
  addAll((v) => v.replace("santasombra", "santa_sombra"))
  const names = new Set<string>()
  seeds.forEach((seed) => {
    names.add(seed)
    names.add(seed.toLowerCase())
    names.add(seed.toUpperCase())
  })
 
  const dirs = new Set<string>([dir])
  if (dir.startsWith("public/")) dirs.add(dir.slice("public/".length))
  else if (dir.startsWith("/")) dirs.add(dir.slice(1))
 
  const exts = [ext, ...["png", "webp", "jpg", "jpeg"].filter((value) => value !== ext)]
  const list: string[] = []
  dirs.forEach((d) =>
    names.forEach((n) => exts.forEach((e) => list.push(`${d}${encodeURIComponent(n)}.${e}`))),
  )
  return [src, ...list.filter((candidate) => candidate !== src)]
}
 
function FallbackImg({
  src,
  hideOnFail,
  onLoad,
  onError,
  ...props
}: ImgHTMLAttributes<HTMLImageElement> & { src: string; hideOnFail?: boolean }) {
  const list = useMemo(() => imageCandidates(src), [src])
  const [attempt, setAttempt] = useState(0)
  const [failed, setFailed] = useState(false)
  const current = resolvedSrc[src] ?? list[attempt]
 
  if (failed && hideOnFail) return null
 
  return (
    <img
      {...props}
      onError={(event) => {
        if (resolvedSrc[src]) delete resolvedSrc[src]
        else if (attempt + 1 < list.length) setAttempt(attempt + 1)
        else setFailed(true)
        onError?.(event)
      }}
      onLoad={(event) => {
        resolvedSrc[src] = current
        onLoad?.(event)
      }}
      src={current}
    />
  )
}
 
const youtubeEmbed = ({ id, start }: { id: string; start?: number }) =>
  `https://www.youtube-nocookie.com/embed/${id}?rel=0&modestbranding=1${start ? `&start=${start}` : ""}`
 
/* Orden: de más nuevo a más viejo */
const films: Film[] = [
  {
    slug: "diarios-negros",
    title: "Diarios Negros",
    year: "",
    status: "development",
    feature: true,
    preview: "films/diarios%20negros%20(1).jpg",
    synopsis: {
      ES: "A comienzos del siglo XX, el diplomático británico Roger Casement presencia atrocidades coloniales en el Congo y el Amazonas, rompe con la Corona y se suma al movimiento independentista irlandés. Arrestado por traición, sus diarios personales de contenido sexual se usan para desacreditarlo.",
      // TODO: traducción mía; reemplazar por el texto en inglés de ojoraro.com.ar/diarios-negros/
      EN: "In the early twentieth century, British diplomat Roger Casement witnesses colonial atrocities in the Congo and the Amazon, breaks with the Crown and joins the Irish independence movement. Arrested for treason, his personal diaries of a sexual nature are used to discredit him.",
    },
    stills: [
      still("diariosnegros_ stills_01"),
      still("diariosnegros_ stills_02"),
      still("diariosnegros_ stills_03"),
    ],
  },
  {
    // Sin ficha ni sinopsis en ojoraro.com.ar: completar cuando estén
    slug: "parasitos-perfectos",
    title: "Parásitos Perfectos",
    year: "",
    status: "development",
    preview: pp("CONCEPT 01"), // portada de la página (y del hero, ver heroImages)
    stills: [
      pp("CONCEPT 02"),
      pp("concept 03"),
      pp("Manos entre parásitos bioluminiscentes"),
    ],
  },
  {
    slug: "luz-diabla",
    youtube: { id: "kb__9UgYDoI" },
    title: "Luz Diabla",
    year: "2025",
    preview: "films/luz%20diabla%20(1).webp",
    synopsis: {
      ES: "Martín, un joven raver urbano, se ve envuelto en un extraño accidente en la ruta camino a una fiesta en medio de la Pampa argentina. Encontrando refugio en una misteriosa pulpería campestre y cobijado por dos extraños lugareños, la paranoia de Martín comienza a apoderarse de él. Mientras las horas avanzan, su percepción empieza a distorsionarse, desatando visiones inquietantes que lo llevarán a enfrentarse a las fuerzas sobrenaturales que se esconden en la noche.",
      EN: "Martín, a young urban raver, becomes involved in a strange accident on the road while traveling to a party in the heart of the Argentine Pampas. Taking refuge in a mysterious rural general store and sheltered by two enigmatic locals, Martín begins to succumb to paranoia. As the hours pass, his perception starts to distort, unleashing unsettling visions that will force him to confront the supernatural forces lurking in the night.",
    },
    credits: [
      { role: role("Idea original y dirección", "Original concept & direction"), people: "Gervasio Canda, Paula Boffo & Patricio Plaza" },
      { role: role("Guion", "Screenplay"), people: "Paula Boffo" },
      { role: role("Dirección de arte", "Art direction"), people: "Gervasio Canda" },
      { role: role("Dirección de animación", "Animation director"), people: "Patricio Plaza, Ana Artaza & Paula Boffo" },
      { role: role("Animación y postproducción", "Animation & post-production"), people: "Lakeside" },
      { role: role("Productor ejecutivo", "Executive producer"), people: "Iouri Stepanov" },
      { role: role("Directora de producción", "Production manager"), people: "Courtney Wolfson" },
      { role: role("Consultoría de guion", "Script consultant"), people: "Aron Dunn" },
      { role: role("Producción", "Producer"), people: "Margo Dubar" },
      { role: role("Supervisión de animación", "Animation supervisor"), people: "Marina Patrakeeva" },
    ],
    duration: "12 min",
    coProduction: ["Lakeside Animation (Canadá)"],
    vimeo: "https://vimeo.com/ojoraro",
    // Luz Diabla no tiene laureles en ojoraro.com.ar
    stills: [
      still("luzdiabla_stills_01"),
      still("luzdiabla_stills_02"),
      still("luzdiabla_stills_03"),
    ],
  },
  {
    slug: "carne-de-dios",
    youtube: { id: "iL4uIMb0gN4", start: 91 },
    title: "Carne de Dios",
    year: "2023",
    preview: "films/carne_de_dios.webp",
    synopsis: {
      ES: "En el México de la etapa colonial, un fraile español víctima de una extraña enfermedad deberá soportar en su propio cuerpo los rituales nativos que ha estado persiguiendo.",
      EN: "In colonial Mexico, a Spanish friar afflicted by a strange illness must endure in his own flesh the native rituals he has been relentlessly pursuing.",
    },
    credits: [
      { role: role("Dirección, guion y montaje", "Direction, screenplay and editing"), people: "Patricio Plaza" },
      { role: role("Dirección de arte", "Art direction"), people: "Gervasio Canda" },
      { role: role("Producción", "Producer"), people: "Patricio Plaza, Rosario Carlino, Lucia Cavalchini & Gustavo Alonso" },
      { role: role("Dirección de animación", "Animation director"), people: "Patricio Plaza & Diego Polieri" },
      { role: role("Dirección de sonido", "Sound direction"), people: "Agustin Genoud" },
      { role: role("Arte en fondos", "Background art"), people: "Sike Facundo Cobbe" },
    ],
    duration: "21 min",
    vimeo: "https://vimeo.com/ojoraro",
    laurelsFolder: "CarnedeDios_laureles",
    laurels: [
      "CHILEMONOS-Corto-latinoamericano-1er-lugar (1)", // el archivo del zip termina en " (1)"
      "Laureles-2-Mardel",
      "Laureles-Carne-de-Dios_0000_TOHORROR",
      "Laureles-Carne-de-Dios_0001_TAF",
      "Laureles-Carne-de-Dios_0002_PLUM",
      "Laureles-Carne-de-Dios_0003_LEONARDO-FAVIO",
      "Laureles-Carne-de-Dios_0004_FAN-23",
      "Laureles-Carne-de-Dios_0005_1000-GRITOS",
      "Laureles-Carne-de-Dios_0006_OFF",
      "Laureles-Carne-de-Dios_0007_CHICAGO",
      "Laureles-Carne-de-Dios_0008_FERATUM",
      "Laureles-Carne-de-Dios_0009_OCULTO",
      "Laureles-Carne-de-Dios_0010_GIRAF",
      "Laureles-Carne-de-Dios_0011_ANIMA-LATINA",
      "Laureles-Carne-de-Dios_0012_BITBANG",
      "Laureles-Carne-de-Dios_0013_CNCI",
      "Laureles-Carne-de-Dios_0014_GRITOS-EN-EL-PLANETARIO",
      "macaron_annecy_palme_2023",
    ],
    stills: [
      still("carne de dios_stills_01"),
      still("carnededios_stills_02"),
      still("carnededios_stills_03"),
    ],
  },
  {
    slug: "santa-sombra",
    youtube: { id: "4J025vJMGEg" },
    title: "Santa Sombra",
    year: "2023",
    preview: "films/SANTA%20SOMBRA%20(1).webp",
    synopsis: {
      ES: "Juana es una chica de 15 años que vive en el Altiplano, cuya hermana mayor Marisol es capturada por una red de trata. Juana hace un pacto con “Las Degolladas”, dos espíritus malditos que toman la forma de dos machetes. El poder de los machetes transformarán a Juana en “Santa Sombra”, una antiheroína sedienta de venganza que busca rescatar a su hermana y exterminar a los abusadores de la región.",
      EN: "Juana is a 15-year-old girl living in the Altiplano whose older sister, Marisol, is captured by a human trafficking network. Juana makes a pact with “Las Degolladas,” two cursed spirits that take the form of a pair of machetes. Empowered by the blades, Juana transforms into “Santa Sombra,” a vengeance-driven antiheroine determined to rescue her sister and eradicate the abusers who prey on the region.",
    },
    credits: [
      { role: role("Idea original", "Original concept"), people: "Paula Boffo" },
      { role: role("Dirección", "Direction"), people: "Paula Boffo & Patricio Plaza" },
      { role: role("Guion y montaje", "Screenplay and editing"), people: "Paula Boffo & Patricio Plaza" },
      { role: role("Producción", "Producer"), people: "Patricio Plaza & Esteban Vijnovich" },
      { role: role("Dirección de animación", "Animation director"), people: "Patricio Plaza" },
      { role: role("Música", "Music"), people: "Paula Boffo & Luciano Vitale" },
      { role: role("Dirección de sonido", "Sound direction"), people: "Rocio Morgenstern & Julian Cohen Rua" },
    ],
    vimeo: "https://vimeo.com/ojoraro",
    laurelsFolder: "santasombra_laureles",
    laurels: [
      "LAURELES-SANTA-SOMBRA_0000_FANTASIA",
      "LAURELES-SANTA-SOMBRA_0001_WEIRD",
      "LAURELES-SANTA-SOMBRA_0002_BUENOS-AIRES-ROJO-SANGRE",
      "LAURELES-SANTA-SOMBRA_0003_TAF",
      "LAURELES-SANTA-SOMBRA_0004_FAN",
      "LAURELES-SANTA-SOMBRA_0005_ANIMASYROS",
      "LAURELES-SANTA-SOMBRA_0006_WFAF",
      "LAURELES-SANTA-SOMBRA_0007_FESALP",
      "LAURELES-SANTA-SOMBRA_0008_FESTIVAL-CARTON",
      "LAURELES-SANTA-SOMBRA_0009_WINDOWS-XP",
      "LAURELES-SANTA-SOMBRA_0010_BITBANG",
    ],
    stills: [
      still("santasombra_stills_01"),
      still("santasombra_stills_02"),
      still("santasombra_stills_03"),
    ],
  },
  {
    slug: "padre",
    youtube: { id: "-0B-fB42zCI", start: 8 },
    title: "Padre",
    year: "2013",
    preview: "films/padre%20(1).webp",
    synopsis: {
      ES: "Día a día, la hija de un anciano comandante militar cuida de su padre postrado en cama. La dictadura ha llegado a su fin en Argentina, pero no en la vida de esta mujer.",
      EN: "Day after day, the daughter of an elderly military commander cares for her bedridden father. The dictatorship has come to an end in Argentina, but not in this woman’s life.",
    },
    credits: [
      { role: role("Guion", "Screenplay"), people: "Patricio Plaza & Santiago ‘Bou’ Grasso" },
      { role: role("Dirección", "Direction"), people: "Patricio Plaza & Santiago ‘Bou’ Grasso" },
      { role: role("Producción", "Producer"), people: "Santiago ‘Bou’ Grasso, Dora Benousilio & Patricio Plaza" },
      { role: role("Compañías productoras", "Production companies"), people: "OpusBou, Les Films de L’Arlequin & Ojo Raro" },
      { role: role("Preproducción", "Pre-production"), people: "Santiago ‘Bou’ Grasso, Silvina Cornillón, Patricio Plaza & Natalia Acosta" },
      { role: role("Cinematografía", "Cinematography"), people: "Sergio Piñeyro" },
      { role: role("Animación", "Animation"), people: "Santiago ‘Bou’ Grasso" },
      { role: role("Música", "Music"), people: "Lucas Nikotian & Santiago ‘Bou’ Grasso" },
      { role: role("Edición", "Editing"), people: "Patricio Plaza & Santiago ‘Bou’ Grasso" },
      { role: role("Postproducción", "Post-production"), people: "Diego Gambarotta, Santiago ‘Bou’ Grasso & Patricio Plaza" },
      { role: role("Vestuario", "Costume design"), people: "Natalia Acosta" },
      { role: role("Atrezzo", "Props"), people: "Santiago ‘Bou’ Grasso, Ariel Bernachea & Cristian Davies" },
      { role: role("Construcción de escenografía", "Set construction"), people: "Florentino Grasso & Santiago ‘Bou’ Grasso" },
      { role: role("CGI", "CGI"), people: "Trexel & Barraca Post" },
    ],
    vimeo: "https://vimeo.com/ojoraro",
    laurelsFolder: "padre_laureles",
    laurels: [
      "LAURELES-PADRE_0000_ANIMA-MUNDI",
      "LAURELES-PADRE_0001_JAPAN-NEW-MEDIA-ARTS-FESTIVAL",
      "LAURELES-PADRE_0002_ENCOUNTERS",
      "LAURELES-PADRE_0003_HUESCA",
      "LAURELES-PADRE_0004_FILMETS",
      "LAURELES-PADRE_0005_ROTTERDAM",
      "LAURELES-PADRE_0006_ANNECY",
      "LAURELES-PADRE_0007_BIARRITZ",
      "LAURELES-PADRE_0008_HIROSHIMA",
      "LAURELES-PADRE_0009_DOK-LEIPZIG",
      "LAURELES-PADRE_0010_LA-HABANA",
      "LAURELES-PADRE_0011_REVIERRUN",
    ],
    stills: [
      still("padre_stills_01"),
      still("padre_stills_02"),
      still("padre_stills_03"),
    ],
  },
  {
    slug: "el-empleo",
    youtube: { id: "5KyifKNlY7A", start: 22 },
    title: "El Empleo",
    year: "2008",
    preview: "films/el%20empleo%20(1).webp",
    synopsis: {
      ES: "Un hombre realiza su rutinario viaje al trabajo, inmerso en un mundo donde el uso de las personas es algo cotidiano.",
      EN: "A man goes through his routine commute to work, immersed in a world where using people is an everyday occurrence.",
    },
    credits: [
      { role: role("Dirección", "Direction"), people: "Patricio Plaza & Santiago ‘Bou’ Grasso" },
      { role: role("Concepto y diseño de personajes", "Character concept & design"), people: "Patricio Plaza" },
      { role: role("Animación 2D", "2D animation"), people: "Patricio Plaza & Santiago ‘Bou’ Grasso" },
      { role: role("CGI", "CGI"), people: "Lautaro González González" },
      { role: role("Diseño de fondos", "Background design"), people: "Santiago ‘Bou’ Grasso" },
      { role: role("Storyboard", "Storyboard"), people: "Patricio Plaza" },
      { role: role("Sonido", "Sound"), people: "Patricio Plaza" },
      { role: role("Composición y efectos", "Compositing & effects"), people: "Santiago ‘Bou’ Grasso" },
      { role: role("Diseño de títulos", "Title design"), people: "Natalia Acosta" },
      { role: role("Colaboradores", "Contributors"), people: "Leonardo Bettinelli, Mariana Díaz, Federico Gimeno & Matías Américo" },
    ],
    vimeo: "https://vimeo.com/ojoraro",
    laurelsFolder: "elempleo_laureles",
    laurels: [
      "EL-EMPLEO_0000_ANNECY",
      "EL-EMPLEO_0001_HIROSHIMA-INTERNATIONAAL-ANIMATION-FESTIVAL",
      "EL-EMPLEO_0002_MAR-DEL-PLATA",
      "EL-EMPLEO_0003_ANIMA-MUNDI-1",
      "EL-EMPLEO_0004_CICDAF",
      "EL-EMPLEO_0005_CINEMATOU-1",
      "EL-EMPLEO_0006_KROK",
      "EL-EMPLEO_0007_ANIM_EST",
      "EL-EMPLEO_0008_LLEIDA",
      "EL-EMPLEO_0009_BANJA-LUKA",
      "EL-EMPLEO_0010_GRAND-OFF",
      "EL-EMPLEO_0011_LANS-EN-VERCORS",
      "EL-EMPLEO_0012_CONDOR-DE-PLATA",
      "EL-EMPLEO_0014_BKKIAF",
      "EL-EMPLEO_0015_ZLIN",
      "EL-EMPLEO_0016_SICAF",
      "EL-EMPLEO_0017_LA-HABANA-1",
      "EL-EMPLEO_0019_ENCOUNTERS-1",
      "EL-EMPLEO_0020_IZMIR",
      "EL-EMPLEO_0021_ISMAILIA",
      "EL-EMPLEO_0022_ETIUDAANIMA",
      "EL-EMPLEO_0023_BOLZANO",
      "EL-EMPLEO_0024_CINEMA-JOVE",
      "EL-EMPLEO_0025_ANIMATED-DREAMS",
      "EL-EMPLEO_0026_ATHENS-ANIMFEST",
      "EL-EMPLEO_0027_TIRANA",
      "EL-EMPLEO_0028_IN-THE-PALACE",
      "EL-EMPLEO_0029_MIEFF",
    ],
    stills: [
      still("elempleo_stills_01"),
      still("elempleo_stills_02"),
      still("elempleo_stills_03"),
    ],
  },
]
 
const navigableFilms = films
 
/* Contacto: completar con el endpoint de Formspree (https://formspree.io/f/xxxxxxx).
   Mientras esté vacío, el formulario abre el cliente de correo (mailto:). */
const FORM_ENDPOINT = ""
const CONTACT_EMAIL = "patricio@ojoraro.com.ar"
 
const copy = {
  ES: {
    home: "Inicio",
    bio: "Bio",
    films: "Films",
    contact: "Contacto",
    skip: "Saltar al contenido",
    mainNav: "Navegación principal",
    close: "Cerrar",
    role: "Animation Producer, writer and filmmaker",
    statement:
      "Animación política con géneros populares: el horror y la fantasía para abordar luchas históricas y políticas de América Latina.",
    biography:
      "Patricio Plaza es cineasta radicado en Buenos Aires. Estudió artes visuales y comunicación audiovisual en la Universidad Nacional de La Plata y realiza películas de animación desde hace más de 20 años. En 2019 fundó Ojo Raro, un espacio de producción con visión crítica sobre el medio, orientado a la animación de géneros populares desde una perspectiva sudamericana y queer.",
    viewFilms: "Ver films",
    viewMore: "Ver más",
    back: "Films",
    synopsis: "Sinopsis",
    details: "Ficha",
    direction: "Dirección",
    screenplay: "Guion",
    coscreenplay: "Coguion",
    duration: "Duración",
    feature: "Largometraje",
    coProduction: "Coproducción",
    online: "Online",
    watchVimeo: "Ver en Vimeo",
    galleryTitle: "Galería",
    laurels: "Laureles",
    enlarge: "Ampliar imagen",
    stillOf: "Still",
    previous: "Anterior",
    next: "Siguiente",
    newer: "Más reciente",
    older: "Más antigua",
    filmsNav: "Films",
    development: "En desarrollo",
    toggleTheme: "Cambiar tema",
    language: "Idioma",
    viewFilm: "Ver film",
    slideshow: "Films destacados",
    gallery: "Galería de",
    prevSlide: "Imagen anterior",
    nextSlide: "Imagen siguiente",
    goToSlide: "Ir a la imagen",
    pauseSlides: "Pausar carrusel",
    playSlides: "Reanudar carrusel",
    notFoundTitle: "Página no encontrada",
    notFoundText: "La dirección que buscás no existe o fue movida.",
    notFoundLink: "Ir a Films",
    bioPhotoAlt: "Retrato de Patricio Plaza",
    video: "Video",
    laurelsHint: "Pasá el mouse y usá la rueda para ver todos",
    laurelsPrev: "Ver laureles anteriores",
    laurelsNext: "Ver más laureles",
    bioStats: [
      ["+20", "años en animación"],
      ["6", "cortometrajes"],
      ["+500", "festivales"],
      ["+240", "premios internacionales"],
    ],
    bioParagraphs: [
      "Patricio Plaza es un cineasta de animación radicado en Buenos Aires, Argentina. Estudió Artes Visuales y Comunicación Audiovisual en la Universidad Nacional de La Plata y trabaja en animación desde hace más de veinte años. Su obra se centra en la animación política y recurre a géneros como el horror y la fantasía para explorar las luchas históricas y políticas de América Latina. Plaza escribió y coescribió seis cortometrajes, seleccionados en más de 500 festivales y distinguidos con más de 240 premios internacionales.",
      "Comenzó su carrera cinematográfica como coautor de dos cortometrajes, El Empleo (2008) y Padre (2013), que juntos obtuvieron alrededor de 180 premios y fueron seleccionados en Annecy.",
      "En 2019 fundó Ojo Raro, un colectivo de producción dedicado a crear animación desde una perspectiva sudamericana y queer. El primer cortometraje del colectivo, Carne de Dios (dirigido por Patricio), fue seleccionado en la Competencia Oficial del Festival Internacional de Cine de Animación de Annecy. Entre sus premios se cuentan Mejor Cortometraje Argentino en el Festival Internacional de Cine de Mar del Plata (festival de categoría A), el Premio Rigo Mora en el Festival Internacional de Cine de Guadalajara, Mejor Cortometraje Latinoamericano en Pixelatl y en Chilemonos, y Mejor Animación en el Festival Internacional del Nuevo Cine Latinoamericano de La Habana.",
      "La película también fue nominada a Mejor Cortometraje en los Premios Annie 2024. En 2025, su cortometraje Luz Diabla fue seleccionado en la Competencia Oficial del Festival de Sundance. En Annecy 2026, Carne de Dios y Luz Diabla formaron parte del Programa Especial Animation Chills and Thrills de Annecy.",
      "Patricio ha colaborado con organismos de derechos humanos como Madres y Abuelas de Plaza de Mayo y apoya activamente a creadores de animación LGBTIQ+ y de minorías racializadas en América Latina, liderando iniciativas como Voces del Sur y Miradas Furtivas: Mujeres y Disidencias de la Animación Argentina. Curó el programa de animación LGBTIQ Hidden Desires en el Festival de Annecy 2023 y dictó su masterclass Horror político en la animación latinoamericana en México, Colombia y Argentina. Recibió apoyo del INCAA y del Fondo Nacional de las Artes de Argentina, del FONCA y la Secretaría de Relaciones Exteriores de México, y del Institut français en Argentina.",
      "En 2026 realizará residencias de escritura en Francia —en NEF Animation, La Maison des Auteurs de Angulema y la Cité internationale des arts de París— para escribir el guion de Diarios Negros, su primer largometraje.",
    ],
    contactIntro: "Proyectos, proyecciones, prensa y colaboraciones.",
    fieldName: "Nombre",
    fieldEmail: "Email",
    fieldReason: "Motivo",
    fieldMessage: "Mensaje",
    fieldWebsite: "Sitio web",
    reasons: ["Proyecto", "Proyección o festival", "Prensa", "Otro"],
    errName: "Ingresá tu nombre.",
    errEmail: "Ingresá un email válido.",
    errMessage: "Escribí un mensaje.",
    send: "Enviar mensaje",
    sending: "Enviando…",
    sent: "Mensaje enviado. Gracias.",
    sentMailto: "Se abrió tu aplicación de correo con el mensaje listo para enviar. Gracias.",
    sendAnother: "Enviar otro mensaje",
    sendError: `No pudimos enviar tu mensaje. Probá de nuevo o escribí a ${CONTACT_EMAIL}.`,
    mailSubject: "Contacto desde el portfolio",
  },
  EN: {
    home: "Home",
    bio: "Bio",
    films: "Films",
    contact: "Contact",
    skip: "Skip to content",
    mainNav: "Main navigation",
    close: "Close",
    role: "Animation Producer, writer and filmmaker",
    statement:
      "Political animation through popular genres: horror and fantasy as a way to address Latin America's historical and political struggles.",
    biography:
      "Patricio Plaza is a filmmaker based in Buenos Aires. He studied visual arts and audiovisual communication at the National University of La Plata and has made animated films for over 20 years. In 2019 he founded Ojo Raro, a production space with a critical perspective on the medium, focused on popular genre animation from a South American and queer point of view.",
    viewFilms: "View films",
    viewMore: "View more",
    back: "Films",
    synopsis: "Synopsis",
    details: "Credits",
    direction: "Direction",
    screenplay: "Screenplay",
    coscreenplay: "Co-screenplay",
    duration: "Running time",
    feature: "Feature film",
    coProduction: "Co-production",
    online: "Online",
    watchVimeo: "Watch on Vimeo",
    galleryTitle: "Gallery",
    laurels: "Awards",
    enlarge: "Enlarge image",
    stillOf: "Still",
    previous: "Previous",
    next: "Next",
    newer: "More recent",
    older: "Older",
    filmsNav: "Films",
    development: "In development",
    toggleTheme: "Toggle theme",
    language: "Language",
    viewFilm: "View film",
    slideshow: "Featured films",
    gallery: "Gallery of",
    prevSlide: "Previous image",
    nextSlide: "Next image",
    goToSlide: "Go to image",
    pauseSlides: "Pause carousel",
    playSlides: "Resume carousel",
    notFoundTitle: "Page not found",
    notFoundText: "The address you're looking for doesn't exist or has moved.",
    notFoundLink: "Go to Films",
    bioPhotoAlt: "Portrait of Patricio Plaza",
    video: "Video",
    laurelsHint: "Hover and use the mouse wheel to see them all",
    laurelsPrev: "Show previous awards",
    laurelsNext: "Show more awards",
    bioStats: [
      ["+20", "years in animation"],
      ["6", "short films"],
      ["+500", "festivals"],
      ["+240", "international awards"],
    ],
    bioParagraphs: [
      "Patricio Plaza is an animation filmmaker based in Buenos Aires, Argentina. He studied Visual Arts and Audiovisual Communication at the Universidad Nacional de La Plata and has worked in animation for over twenty years. His work focuses on political animation, drawing on genres such as horror and fantasy to explore Latin America’s historical and political struggles. Plaza has written and co-written six short films, which have been selected for over 500 festivals and received more than 240 international awards.",
      "He began his filmmaking career by co-authoring two short films, El Empleo (2008) and Padre (2013), which together won around 180 awards and were both selected for Annecy.",
      "In 2019, he founded Ojo Raro, a production collective dedicated to creating animation from a South American and queer perspective. The collective’s first short film, Carne de Dios (directed by Patricio), was selected for the Official Competition at the Annecy International Animation Film Festival. Its awards include Best Argentine Short Film at the Mar del Plata International Film Festival (an A-list festival), the Rigo Mora Award at the Guadalajara International Film Festival, Best Latin American Short Film at both Pixelatl and Chilemonos, and Best Animation at the Havana International Festival of New Latin American Cinema.",
      "The film was also nominated for Best Short Subject at the 2024 Annie Awards. In 2025, his short film Luz Diabla was selected for the Official Competition at the Sundance Film Festival. In Annecy 2026, Carne de Dios and Luz Diabla were part of the Annecy’s Special Program Animation Chills and Thrills.",
      "Patricio has collaborated with human rights organisations such as the Mothers and Grandmothers of Plaza de Mayo and actively supports LGBTIQ+ animation creators and racialised minorities in Latin America, leading initiatives such as Voces del Sur and Miradas Furtivas: Mujeres y Disidencias de la Animación Argentina. He curated the LGBTIQ animation programme Hidden Desires at the 2023 Annecy Festival and has delivered his masterclass Political Horror in Latin American Animation in Mexico, Colombia and Argentina. He has received support from Argentina’s INCAA and National Arts Fund, Mexico’s FONCA and Secretariat of Foreign Affairs, and the Institut français in Argentina.",
      "In 2026, he will undertake writing residencies in France at NEF Animation, La Maison des Auteurs in Angoulême, and the Cité internationale des arts in Paris to write the script of Black Diaries, his first feature film project.",
    ],
    contactIntro: "Projects, screenings, press and collaborations.",
    fieldName: "Name",
    fieldEmail: "Email",
    fieldReason: "Reason",
    fieldMessage: "Message",
    fieldWebsite: "Website",
    reasons: ["Project", "Screening or festival", "Press", "Other"],
    errName: "Enter your name.",
    errEmail: "Enter a valid email.",
    errMessage: "Write a message.",
    send: "Send message",
    sending: "Sending…",
    sent: "Message sent. Thank you.",
    sentMailto: "Your email app should have opened with your message ready to send. Thank you.",
    sendAnother: "Send another message",
    sendError: `We couldn't send your message. Please try again or write to ${CONTACT_EMAIL}.`,
    mailSubject: "Message from the portfolio",
  },
}
 
type Copy = (typeof copy)[Language]
 
const filmYear = (film: Film, t: Copy) => (film.status === "development" ? t.development : film.year)
 
function readStorage(key: string) {
  try {
    return localStorage.getItem(key)
  } catch {
    return null
  }
}
 
function writeStorage(key: string, value: string) {
  try {
    localStorage.setItem(key, value)
  } catch {
    /* modo privado o storage bloqueado */
  }
}
 
/* Posición de scroll por ruta, para restaurarla al volver con Atrás */
const scrollPositions: Record<string, number> = {}
 
function useRoute() {
  const readRoute = () => window.location.hash.replace(/^#\/?/, "") || "inicio"
  const [route, setRoute] = useState(readRoute)
  const current = useRef(route)
  const pendingScroll = useRef(0)
  const linkNavigation = useRef(false)
 
  useEffect(() => {
    window.history.scrollRestoration = "manual"
 
    // Distingue un click en un link interno (arranca arriba) de Atrás/Adelante (restaura)
    const onClick = (event: MouseEvent) => {
      const link = (event.target as HTMLElement).closest?.("a")
      if (link?.getAttribute("href")?.startsWith("#/")) {
        linkNavigation.current = true
        window.setTimeout(() => {
          linkNavigation.current = false
        }, 500)
      }
    }
 
    const update = () => {
      scrollPositions[current.current] = window.scrollY
      const next = readRoute()
      pendingScroll.current = linkNavigation.current ? 0 : (scrollPositions[next] ?? 0)
      linkNavigation.current = false
      current.current = next
      setRoute(next)
    }
 
    document.addEventListener("click", onClick, true)
    window.addEventListener("hashchange", update)
    return () => {
      document.removeEventListener("click", onClick, true)
      window.removeEventListener("hashchange", update)
    }
  }, [])
 
  // Scroll instantáneo (sin animación) una vez renderizada la nueva vista
  useLayoutEffect(() => {
    window.scrollTo({ top: pendingScroll.current, behavior: "instant" as ScrollBehavior })
  }, [route])
 
  return route
}
 
function Reveal({ children, className = "" }: { children: ReactNode; className?: string }) {
  const ref = useRef<HTMLDivElement>(null)
 
  useEffect(() => {
    const node = ref.current
    if (!node) return
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          node.classList.add("is-visible")
          observer.unobserve(node)
        }
      },
      { threshold: 0.12 },
    )
    observer.observe(node)
    return () => observer.disconnect()
  }, [])
 
  return (
    <div className={`reveal ${className}`} ref={ref}>
      {children}
    </div>
  )
}
 
function Sidebar({
  route,
  language,
  setLanguage,
  theme,
  setTheme,
}: {
  route: string
  language: Language
  setLanguage: (language: Language) => void
  theme: Theme
  setTheme: (theme: Theme) => void
}) {
  const t = copy[language]
  const sections = ["inicio", "bio", "films", "contacto"]
  const activeSection = route.startsWith("film/") || route === "films" ? "films" : sections.includes(route) ? route : ""
  const isDark = theme === "dark"
  const navItems: [string, string][] = [
    ["inicio", t.home],
    ["bio", t.bio],
    ["films", t.films],
    ["contacto", t.contact],
  ]
 
  return (
    <header className="sidebar">
      <nav aria-label={t.mainNav} className="section-nav">
        {navItems.map(([href, label]) => (
          <a
            aria-current={activeSection === href ? "page" : undefined}
            className={activeSection === href ? "active" : ""}
            href={`#/${href}`}
            key={href}
          >
            <span className="section-indicator" aria-hidden="true">
              <svg height="12" viewBox="0 0 12 12" width="12">
                <path d="M2 1L11 6L2 11V1Z" fill="currentColor" />
              </svg>
            </span>
            <span>{label}</span>
          </a>
        ))}
      </nav>
      <div className="sidebar-bottom">
        <div aria-label={t.language} className="language-selector" role="group">
          <button
            aria-pressed={language === "ES"}
            className={language === "ES" ? "active" : ""}
            lang="es"
            onClick={() => setLanguage("ES")}
            type="button"
          >
            ES
          </button>
          <span aria-hidden="true">/</span>
          <button
            aria-pressed={language === "EN"}
            className={language === "EN" ? "active" : ""}
            lang="en"
            onClick={() => setLanguage("EN")}
            type="button"
          >
            EN
          </button>
        </div>
        <button
          aria-checked={isDark}
          aria-label={t.toggleTheme}
          className={`theme-toggle ${isDark ? "is-dark" : ""}`}
          onClick={() => setTheme(isDark ? "light" : "dark")}
          role="switch"
          type="button"
        >
          <span className="theme-knob">
            <svg
              aria-hidden="true"
              className="icon-sun"
              fill="none"
              height="14"
              stroke="currentColor"
              strokeLinecap="round"
              strokeWidth="2"
              viewBox="0 0 24 24"
              width="14"
            >
              <circle cx="12" cy="12" r="4" />
              <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41" />
            </svg>
            <svg
              aria-hidden="true"
              className="icon-moon"
              fill="currentColor"
              height="14"
              viewBox="0 0 24 24"
              width="14"
            >
              <path d="M21 14.5A9 9 0 0 1 9.5 3a9 9 0 1 0 11.5 11.5Z" />
            </svg>
          </span>
        </button>
      </div>
    </header>
  )
}
 
/* Orden fijo: hero_01 → hero_07. Cada imagen lleva a la página de su film.
   hero_02 (Parásitos Perfectos) usa CONCEPT 01 de public/ParasitosPerfectos/. */
const heroImages: { image: string; slug?: string; title?: string }[] = [
  { image: hero("hero_01"), slug: "diarios-negros", title: "Diarios Negros" },
  { image: pp("CONCEPT 01"), slug: "parasitos-perfectos", title: "Parásitos Perfectos" },
  { image: hero("hero_03"), slug: "luz-diabla", title: "Luz Diabla" },
  { image: hero("hero_04"), slug: "santa-sombra", title: "Santa Sombra" },
  { image: hero("hero_05"), slug: "carne-de-dios", title: "Carne de Dios" },
  { image: hero("hero_06"), slug: "el-empleo", title: "El Empleo" },
  { image: hero("hero_07"), slug: "padre", title: "Padre" },
]
 
function HeroCarousel({ language }: { language: Language }) {
  const t = copy[language]
  const items = heroImages
  const count = items.length
  const slides = count ? [...items, items[0]] : [] // clon del primero para que el loop sea continuo
  const [index, setIndex] = useState(0)
  const [animate, setAnimate] = useState(true)
  const [hoverPaused, setHoverPaused] = useState(false)
  const [userPaused, setUserPaused] = useState(
    () => window.matchMedia("(prefers-reduced-motion: reduce)").matches,
  )
  const paused = hoverPaused || userPaused
  const touchStartX = useRef<number | null>(null)
 
  // Cada imagen queda quieta ~4 s y luego se corre hacia la izquierda (0,8 s)
  useEffect(() => {
    if (paused || count < 2 || index >= count) return
    const timer = window.setTimeout(() => setIndex((current) => current + 1), 4800)
    return () => window.clearTimeout(timer)
  }, [index, paused, count])
 
  // Al llegar al clon, saltar sin animación a la primera imagen real
  useEffect(() => {
    if (index !== count) return
    const timer = window.setTimeout(() => {
      setAnimate(false)
      setIndex(0)
    }, 800)
    return () => window.clearTimeout(timer)
  }, [index, count])
 
  useEffect(() => {
    if (animate) return
    const frame = requestAnimationFrame(() => requestAnimationFrame(() => setAnimate(true)))
    return () => cancelAnimationFrame(frame)
  }, [animate])
 
  if (!count) return null
 
  const goNext = () => setIndex((current) => (current >= count ? current : current + 1))
  const goPrevious = () => {
    if (index <= 0) {
      setAnimate(false)
      setIndex(count - 1)
    } else {
      setIndex((current) => current - 1)
    }
  }
 
  const onTouchStart = (event: ReactTouchEvent) => {
    touchStartX.current = event.touches[0].clientX
  }
 
  const onTouchEnd = (event: ReactTouchEvent) => {
    if (touchStartX.current === null || count < 2) return
    const delta = event.changedTouches[0].clientX - touchStartX.current
    touchStartX.current = null
    if (delta > 50) goPrevious()
    if (delta < -50) goNext()
  }
 
  return (
    <div
      aria-label={t.slideshow}
      aria-roledescription="carousel"
      className="hero-carousel"
      onBlur={() => setHoverPaused(false)}
      onFocus={() => setHoverPaused(true)}
      onMouseEnter={() => setHoverPaused(true)}
      onMouseLeave={() => setHoverPaused(false)}
      onTouchEnd={onTouchEnd}
      onTouchStart={onTouchStart}
    >
      <div
        className={`hero-track ${animate ? "is-animating" : ""}`}
        style={{ transform: `translateX(-${index * 100}%)` }}
      >
        {slides.map((slide, position) => {
          const isClone = position === count
          const content = (
            <>
              <img alt="" src={slide.image} />
              {slide.title && <span className="hero-label">{slide.title}</span>}
            </>
          )
          return slide.slug ? (
            <a
              aria-hidden={isClone}
              aria-label={`${t.viewFilm}: ${slide.title}`}
              className="hero-slide"
              href={`#/film/${slide.slug}`}
              key={position}
              tabIndex={isClone ? -1 : 0}
            >
              {content}
            </a>
          ) : (
            <div aria-hidden={isClone} className="hero-slide is-static" key={position}>
              {content}
            </div>
          )
        })}
      </div>
 
      <button
        aria-label={userPaused ? t.playSlides : t.pauseSlides}
        className="hero-control hero-pause"
        onClick={() => setUserPaused((value) => !value)}
        type="button"
      >
        {userPaused ? (
          <svg aria-hidden="true" fill="currentColor" height="14" viewBox="0 0 12 12" width="14">
            <path d="M2 1L11 6L2 11V1Z" />
          </svg>
        ) : (
          <svg aria-hidden="true" fill="currentColor" height="14" viewBox="0 0 12 12" width="14">
            <path d="M2 1h3v10H2zM7 1h3v10H7z" />
          </svg>
        )}
      </button>
 
      {count > 1 && (
        <>
          <button
            aria-label={t.prevSlide}
            className="hero-control hero-arrow previous"
            onClick={goPrevious}
            type="button"
          >
            <Triangle dir="left" size={14} />
          </button>
          <button
            aria-label={t.nextSlide}
            className="hero-control hero-arrow next"
            onClick={goNext}
            type="button"
          >
            <Triangle size={14} />
          </button>
        </>
      )}
 
      <div className="hero-dots">
        {items.map((_, position) => (
          <button
            aria-current={position === index % count ? "true" : undefined}
            aria-label={`${t.goToSlide} ${position + 1}`}
            className={position === index % count ? "is-active" : ""}
            key={position}
            onClick={() => setIndex(position)}
            type="button"
          >
            <span />
          </button>
        ))}
      </div>
    </div>
  )
}
 
function HomePage({ language }: { language: Language }) {
  const t = copy[language]
  return (
    <section className="home-page page">
      <HeroCarousel language={language} />
      <div className="home-content">
        <Reveal className="profile-head">
          <h1>Patricio Plaza</h1>
          <div className="profile-meta">
            <p className="profile-role">{t.role}</p>
            <a className="text-link home-link" href="#/films">
              {t.viewFilms}
              <Triangle />
            </a>
          </div>
        </Reveal>
        <Reveal className="profile-grid">
          <p className="statement">{t.statement}</p>
          <div className="profile-bio">
            <p className="biography">{t.biography}</p>
          </div>
        </Reveal>
      </div>
    </section>
  )
}
 
function BioPage({ language }: { language: Language }) {
  const t = copy[language]
  return (
    <section className="bio-page page">
      <header className="page-intro">
        <h1>{t.bio}</h1>
        <p>Patricio Plaza</p>
      </header>
      <div className="bio-layout">
        <Reveal className="bio-photo">
          <div className="bio-photo-frame">
            <img alt={t.bioPhotoAlt} src="films/recurso-1.png" />
          </div>
        </Reveal>
        <div className="bio-main">
          <Reveal>
            <p className="bio-lead">{t.statement}</p>
          </Reveal>
          <Reveal>
            <dl className="bio-stats">
              {t.bioStats.map(([value, label]) => (
                <div key={label}>
                  <dt>{value}</dt>
                  <dd>{label}</dd>
                </div>
              ))}
            </dl>
          </Reveal>
          <div className="bio-blocks">
            {t.bioParagraphs.map((paragraph, position) => (
              <Reveal className="bio-block" key={paragraph.slice(0, 40)}>
                <span aria-hidden="true" className="bio-index">
                  {String(position + 1).padStart(2, "0")}
                </span>
                <p>{paragraph}</p>
              </Reveal>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
 
function FilmCard({ film, language }: { film: Film; language: Language }) {
  const t = copy[language]
  const link = `#/film/${film.slug}`
  return (
    <article className="film-card">
      <a aria-hidden="true" className="card-media" href={link} tabIndex={-1}>
        {film.preview ? (
          <FallbackImg alt="" loading="lazy" src={film.preview} />
        ) : (
          <span>{t.development}</span>
        )}
      </a>
      <h2>
        <a href={link}>{film.title}</a>
      </h2>
      <p>{filmYear(film, t)}</p>
      <a aria-label={`${t.viewFilm}: ${film.title}`} className="outline-button" href={link}>
        {t.viewMore}
        <Triangle />
      </a>
    </article>
  )
}
 
function FilmsPage({ language }: { language: Language }) {
  return (
    <section className="films-page page">
      <header className="page-intro">
        <h1>Films</h1>
        <p>2008—2025</p>
      </header>
      <div className="film-grid">
        {films.map((film) => (
          <Reveal key={film.slug}>
            <FilmCard film={film} language={language} />
          </Reveal>
        ))}
      </div>
    </section>
  )
}
 
function NotFoundPage({ language }: { language: Language }) {
  const t = copy[language]
  return (
    <section className="not-found-page page">
      <h1>{t.notFoundTitle}</h1>
      <p>{t.notFoundText}</p>
      <a className="text-link" href="#/films">
        {t.notFoundLink}
        <Triangle />
      </a>
    </section>
  )
}
 
function Lightbox({
  film,
  initialIndex,
  language,
  onClose,
}: {
  film: Film
  initialIndex: number
  language: Language
  onClose: () => void
}) {
  const t = copy[language]
  const total = film.stills.length
  const [index, setIndex] = useState(initialIndex)
  const dialogRef = useRef<HTMLDivElement>(null)
  const closeRef = useRef<HTMLButtonElement>(null)
  const touchStartX = useRef<number | null>(null)
  const onCloseRef = useRef(onClose)
  onCloseRef.current = onClose
 
  const goPrevious = () => setIndex((current) => (current - 1 + total) % total)
  const goNext = () => setIndex((current) => (current + 1) % total)
 
  // Teclado (Esc, flechas, trampa de foco con Tab) + bloqueo de scroll del fondo
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onCloseRef.current()
      if (event.key === "ArrowLeft") setIndex((current) => (current - 1 + total) % total)
      if (event.key === "ArrowRight") setIndex((current) => (current + 1) % total)
      if (event.key === "Tab") {
        const focusables = dialogRef.current?.querySelectorAll<HTMLElement>("button")
        if (!focusables?.length) return
        const first = focusables[0]
        const last = focusables[focusables.length - 1]
        const active = document.activeElement
        if (!dialogRef.current?.contains(active)) {
          event.preventDefault()
          first.focus()
        } else if (event.shiftKey && active === first) {
          event.preventDefault()
          last.focus()
        } else if (!event.shiftKey && active === last) {
          event.preventDefault()
          first.focus()
        }
      }
    }
    document.body.classList.add("lightbox-open")
    window.addEventListener("keydown", onKeyDown)
    return () => {
      document.body.classList.remove("lightbox-open")
      window.removeEventListener("keydown", onKeyDown)
    }
  }, [total])
 
  // El botón Atrás del navegador cierra el visor en lugar de salir de la página
  useEffect(() => {
    let pushed = false
    let closedByBrowser = false
    const timer = window.setTimeout(() => {
      window.history.pushState({ lightbox: true }, "")
      pushed = true
    }, 0)
    const onPopState = () => {
      closedByBrowser = true
      onCloseRef.current()
    }
    window.addEventListener("popstate", onPopState)
    return () => {
      window.clearTimeout(timer)
      window.removeEventListener("popstate", onPopState)
      if (pushed && !closedByBrowser) window.history.back()
    }
  }, [])
 
  // Foco: entra al visor y vuelve a la miniatura al cerrar
  useEffect(() => {
    const opener = document.activeElement as HTMLElement | null
    closeRef.current?.focus()
    return () => opener?.focus()
  }, [])
 
  // Precarga de la imagen siguiente y la anterior
  useEffect(() => {
    ;[(index + 1) % total, (index - 1 + total) % total].forEach((position) => {
      const image = new Image()
      image.src = resolvedSrc[film.stills[position]] ?? film.stills[position]
    })
  }, [index, total, film.stills])
 
  const onTouchStart = (event: ReactTouchEvent) => {
    touchStartX.current = event.touches[0].clientX
  }
 
  const onTouchEnd = (event: ReactTouchEvent) => {
    if (touchStartX.current === null || total < 2) return
    const delta = event.changedTouches[0].clientX - touchStartX.current
    touchStartX.current = null
    if (delta > 50) goPrevious()
    if (delta < -50) goNext()
  }
 
  // Se renderiza en document.body para que cubra todo, incluido el menú lateral
  return createPortal(
    <div
      aria-label={`${t.gallery} ${film.title}`}
      aria-modal="true"
      className="lightbox"
      onClick={onClose}
      onTouchEnd={onTouchEnd}
      onTouchStart={onTouchStart}
      ref={dialogRef}
      role="dialog"
    >
      <span className="lightbox-title">{film.title}</span>
 
      <button
        aria-label={t.close}
        className="lightbox-button lightbox-close"
        onClick={(event) => {
          event.stopPropagation()
          onClose()
        }}
        ref={closeRef}
        type="button"
      >
        <svg fill="none" height="20" stroke="currentColor" strokeLinecap="round" strokeWidth="1.5" viewBox="0 0 24 24" width="20">
          <path d="M5 5l14 14M19 5L5 19" />
        </svg>
      </button>
 
      <FallbackImg
        alt={`${film.title}, ${index + 1} / ${total}`}
        className="lightbox-image"
        key={index}
        onClick={(event) => event.stopPropagation()}
        src={film.stills[index]}
      />
 
      {total > 1 && (
        <>
          <button
            aria-label={t.previous}
            className="lightbox-button lightbox-arrow previous"
            onClick={(event) => {
              event.stopPropagation()
              goPrevious()
            }}
            type="button"
          >
            <Triangle dir="left" size={14} />
          </button>
          <button
            aria-label={t.next}
            className="lightbox-button lightbox-arrow next"
            onClick={(event) => {
              event.stopPropagation()
              goNext()
            }}
            type="button"
          >
            <Triangle size={14} />
          </button>
        </>
      )}
 
      <span className="lightbox-count">
        {index + 1} / {total}
      </span>
    </div>,
    document.body,
  )
}
 
/* Laureles en una sola fila, sin barra de scroll. Se indica que hay más contenido con un degradé
   en el borde correspondiente y un triángulo chico clickeable. La rueda del mouse (y el swipe en
   móvil) también la desplazan; al llegar al borde, la rueda vuelve a mover la página. */
function LaurelsStrip({
  children,
  label,
  title,
  prevLabel,
  nextLabel,
}: {
  children: ReactNode
  label: string
  title: string
  prevLabel: string
  nextLabel: string
}) {
  const ref = useRef<HTMLUListElement>(null)
  const [edges, setEdges] = useState({ start: true, end: true })
 
  useEffect(() => {
    const node = ref.current
    if (!node) return
    const update = () => {
      const max = node.scrollWidth - node.clientWidth
      const start = node.scrollLeft <= 1
      const end = node.scrollLeft >= max - 1
      setEdges((prev) => (prev.start === start && prev.end === end ? prev : { start, end }))
    }
    const onWheel = (event: WheelEvent) => {
      const max = node.scrollWidth - node.clientWidth
      if (max <= 0) return
      const delta = Math.abs(event.deltaX) > Math.abs(event.deltaY) ? event.deltaX : event.deltaY
      const atStart = node.scrollLeft <= 0 && delta < 0
      const atEnd = node.scrollLeft >= max - 1 && delta > 0
      if (!delta || atStart || atEnd) return
      event.preventDefault()
      node.scrollLeft += delta
    }
    update()
    node.addEventListener("scroll", update, { passive: true })
    node.addEventListener("load", update, true) // las imágenes cambian el ancho al cargar
    node.addEventListener("error", update, true)
    node.addEventListener("wheel", onWheel, { passive: false })
    window.addEventListener("resize", update)
    return () => {
      node.removeEventListener("scroll", update)
      node.removeEventListener("load", update, true)
      node.removeEventListener("error", update, true)
      node.removeEventListener("wheel", onWheel)
      window.removeEventListener("resize", update)
    }
  }, [])
 
  const scrollByPage = (direction: 1 | -1) => {
    const node = ref.current
    if (node) node.scrollBy({ left: direction * node.clientWidth * 0.7, behavior: "smooth" })
  }
 
  return (
    <div className={`laurels-scroller ${edges.start ? "" : "has-prev"} ${edges.end ? "" : "has-next"}`}>
      <ul aria-label={label} className="laurels" ref={ref} tabIndex={0} title={title}>
        {children}
      </ul>
      <button
        aria-label={prevLabel}
        className="laurels-arrow previous"
        disabled={edges.start}
        onClick={() => scrollByPage(-1)}
        type="button"
      >
        <Triangle dir="left" size={9} />
      </button>
      <button
        aria-label={nextLabel}
        className="laurels-arrow next"
        disabled={edges.end}
        onClick={() => scrollByPage(1)}
        type="button"
      >
        <Triangle size={9} />
      </button>
    </div>
  )
}
 
function FilmPage({ film, language }: { film: Film; language: Language }) {
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null)
  const t = copy[language]
  const currentIndex = navigableFilms.findIndex((item) => item.slug === film.slug)
  const newer = currentIndex > 0 ? navigableFilms[currentIndex - 1] : null
  const older = currentIndex < navigableFilms.length - 1 ? navigableFilms[currentIndex + 1] : null
 
  const rows: string[][] = [
    ...(film.credits ?? []).map((credit) => [credit.role[language], credit.people]),
    ...(film.feature || film.duration ? [[t.duration, film.feature ? t.feature : (film.duration as string)]] : []),
  ]
  const hasCredits = rows.length > 0 || Boolean(film.coProduction?.length) || Boolean(film.vimeo)
 
  return (
    <article className="film-page page">
      <header className="film-header">
        <a className="text-link" href="#/films">
          <Triangle dir="left" />
          {t.back}
        </a>
      </header>
 
      {film.youtube ? (
        <Reveal className="main-image film-video">
          <iframe
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
            allowFullScreen
            loading="lazy"
            referrerPolicy="strict-origin-when-cross-origin"
            src={youtubeEmbed(film.youtube)}
            title={`${t.video}: ${film.title}`}
          />
        </Reveal>
      ) : (
        film.preview && (
          <Reveal className="main-image">
            <FallbackImg alt={film.title} src={film.preview} />
          </Reveal>
        )
      )}
 
      <div className="film-title">
        <h1>{film.title}</h1>
        <p>{filmYear(film, t)}</p>
      </div>
 
      {(film.synopsis || hasCredits) && (
        <Reveal className="film-details">
          {film.synopsis && (
            <section>
              <h2>{t.synopsis}</h2>
              <p>{film.synopsis[language]}</p>
            </section>
          )}
          {hasCredits && (
            <section className="credits">
              <h2>{t.details}</h2>
              <dl>
                {rows.map(([label, value]) => (
                  <div key={label}>
                    <dt>{label}</dt>
                    <dd>{value}</dd>
                  </div>
                ))}
                {film.coProduction && film.coProduction.length > 0 && (
                  <div>
                    <dt>{t.coProduction}</dt>
                    <dd>
                      {film.coProduction.map((line) => (
                        <span key={line}>{line}</span>
                      ))}
                    </dd>
                  </div>
                )}
                {film.vimeo && (
                  <div>
                    <dt>{t.online}</dt>
                    <dd>
                      <a className="text-link" href={film.vimeo} rel="noreferrer" target="_blank">
                        {t.watchVimeo}
                        <Triangle />
                      </a>
                    </dd>
                  </div>
                )}
              </dl>
            </section>
          )}
        </Reveal>
      )}
 
      {film.laurels && film.laurels.length > 0 && (
        <Reveal className="laurels-wrap">
          <h2>{t.laurels}</h2>
          <LaurelsStrip
            label={`${t.laurels}: ${film.title}`}
            nextLabel={t.laurelsNext}
            prevLabel={t.laurelsPrev}
            title={t.laurelsHint}
          >
            {film.laurels.map((name) => (
              <li key={name}>
                <FallbackImg alt="" hideOnFail src={laurel(film.laurelsFolder ?? "", name)} />
              </li>
            ))}
          </LaurelsStrip>
        </Reveal>
      )}
 
      {film.stills.length > 0 && (
        <Reveal className="gallery-wrap">
          <h2>{t.galleryTitle}</h2>
          <div className="film-gallery">
            {film.stills.map((image, index) => (
              <button
                aria-label={`${t.enlarge} ${index + 1}`}
                key={image}
                onClick={() => setLightboxIndex(index)}
                type="button"
              >
                <FallbackImg alt={`${film.title}, ${t.stillOf.toLowerCase()} ${index + 1}`} loading="lazy" src={image} />
              </button>
            ))}
          </div>
        </Reveal>
      )}
 
      <nav aria-label={t.filmsNav} className="film-pagination">
        {newer ? (
          <a className="pagination-newer" href={`#/film/${newer.slug}`}>
            <small>
              <Triangle dir="left" />
              {t.newer}
            </small>
            <span>{newer.title}</span>
          </a>
        ) : (
          <span />
        )}
        {older ? (
          <a className="pagination-older" href={`#/film/${older.slug}`}>
            <small>
              {t.older}
              <Triangle />
            </small>
            <span>{older.title}</span>
          </a>
        ) : (
          <span />
        )}
      </nav>
 
      {lightboxIndex !== null && (
        <Lightbox
          film={film}
          initialIndex={lightboxIndex}
          language={language}
          onClose={() => setLightboxIndex(null)}
        />
      )}
    </article>
  )
}
 
type FormErrors = { name?: string; email?: string; message?: string }
type FormStatus = "idle" | "sending" | "sent" | "mailto" | "error"
 
function ContactPage({ language }: { language: Language }) {
  const t = copy[language]
  const [errors, setErrors] = useState<FormErrors>({})
  const [status, setStatus] = useState<FormStatus>("idle")
 
  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const data = new FormData(event.currentTarget)
    if (data.get("website")) return
    const name = String(data.get("name") || "").trim()
    const email = String(data.get("email") || "").trim()
    const message = String(data.get("message") || "").trim()
    const reason = String(data.get("reason") || "")
 
    const nextErrors: FormErrors = {}
    if (!name) nextErrors.name = t.errName
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) nextErrors.email = t.errEmail
    if (!message) nextErrors.message = t.errMessage
    setErrors(nextErrors)
 
    const firstError = (["name", "email", "message"] as const).find((key) => nextErrors[key])
    if (firstError) {
      document.getElementById(firstError)?.focus()
      return
    }
 
    // Sin servicio configurado: solución provisoria con mailto:
    if (!FORM_ENDPOINT) {
      const subject = `${t.mailSubject}: ${reason}`
      const body = `${message}\n\n${name} (${email})`
      window.location.href = `mailto:${CONTACT_EMAIL}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`
      setStatus("mailto")
      return
    }
 
    setStatus("sending")
    try {
      const response = await fetch(FORM_ENDPOINT, {
        method: "POST",
        body: data,
        headers: { Accept: "application/json" },
      })
      setStatus(response.ok ? "sent" : "error")
    } catch {
      setStatus("error")
    }
  }
 
  const done = status === "sent" || status === "mailto"
 
  return (
    <section className="contact-page page">
      <div className="contact-copy">
        <h1>{t.contact}</h1>
        <p>{t.contactIntro}</p>
        <address>
          <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a>
          <a href="https://www.instagram.com/pat.plaza/" rel="noreferrer" target="_blank">
            Instagram @pat.plaza
          </a>
          <a href="https://ojoraro.com.ar/" rel="noreferrer" target="_blank">
            Ojo Raro
            <Triangle />
          </a>
        </address>
      </div>
 
      <div className={`contact-form-wrap ${done ? "is-sent" : ""}`}>
        {done ? (
          <div className="success-message" role="status">
            <p>{status === "mailto" ? t.sentMailto : t.sent}</p>
            <button
              className="text-link"
              onClick={() => {
                setStatus("idle")
                setErrors({})
              }}
              type="button"
            >
              {t.sendAnother}
            </button>
          </div>
        ) : (
          <form noValidate onSubmit={submit}>
            <div className="field">
              <label htmlFor="name">{t.fieldName}</label>
              <input
                aria-describedby={errors.name ? "name-error" : undefined}
                aria-invalid={errors.name ? true : undefined}
                autoComplete="name"
                id="name"
                name="name"
              />
              {errors.name && (
                <span className="field-error" id="name-error">
                  {errors.name}
                </span>
              )}
            </div>
            <div className="field">
              <label htmlFor="email">{t.fieldEmail}</label>
              <input
                aria-describedby={errors.email ? "email-error" : undefined}
                aria-invalid={errors.email ? true : undefined}
                autoComplete="email"
                id="email"
                name="email"
                type="email"
              />
              {errors.email && (
                <span className="field-error" id="email-error">
                  {errors.email}
                </span>
              )}
            </div>
            <div className="field">
              <label htmlFor="reason">{t.fieldReason}</label>
              <select id="reason" name="reason">
                {t.reasons.map((reason) => (
                  <option key={reason} value={reason}>
                    {reason}
                  </option>
                ))}
              </select>
            </div>
            <div className="field">
              <label htmlFor="message">{t.fieldMessage}</label>
              <textarea
                aria-describedby={errors.message ? "message-error" : undefined}
                aria-invalid={errors.message ? true : undefined}
                id="message"
                name="message"
                rows={6}
              />
              {errors.message && (
                <span className="field-error" id="message-error">
                  {errors.message}
                </span>
              )}
            </div>
            <div aria-hidden="true" className="honeypot">
              <label htmlFor="website">{t.fieldWebsite}</label>
              <input autoComplete="off" id="website" name="website" tabIndex={-1} />
            </div>
            {status === "error" && (
              <p className="form-error" role="alert">
                {t.sendError}
              </p>
            )}
            <button className="outline-button" disabled={status === "sending"} type="submit">
              {status === "sending" ? t.sending : t.send}
            </button>
          </form>
        )}
      </div>
    </section>
  )
}
 
export default function App() {
  const route = useRoute()
  const [language, setLanguage] = useState<Language>(() => (readStorage("language") === "EN" ? "EN" : "ES"))
  const [theme, setTheme] = useState<Theme>(() => {
    const savedTheme = readStorage("theme")
    if (savedTheme === "light" || savedTheme === "dark") return savedTheme
    return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light"
  })
  const t = copy[language]
 
  const filmSlug = route.startsWith("film/") ? route.split("/")[1] : null
  const selectedFilm = films.find((film) => film.slug === filmSlug)
  const view = selectedFilm
    ? "film"
    : route === "inicio"
      ? "home"
      : route === "bio"
        ? "bio"
        : route === "films"
          ? "films"
          : route === "contacto"
            ? "contact"
            : "notfound"
 
  const pageTitle =
    view === "film" && selectedFilm
      ? selectedFilm.title
      : view === "bio"
        ? t.bio
        : view === "films"
          ? t.films
          : view === "contact"
            ? t.contact
            : view === "notfound"
              ? t.notFoundTitle
              : ""
  const documentTitle = pageTitle ? `${pageTitle} — Patricio Plaza` : "Patricio Plaza"
 
  useEffect(() => {
    document.documentElement.dataset.theme = theme
    writeStorage("theme", theme)
  }, [theme])
 
  useEffect(() => {
    document.documentElement.lang = language.toLowerCase()
    writeStorage("language", language)
  }, [language])
 
  useEffect(() => {
    document.title = documentTitle
  }, [documentTitle])
 
  return (
    <>
      <a
        className="skip-link"
        href="#main"
        onClick={(event) => {
          event.preventDefault()
          document.getElementById("main")?.focus()
        }}
      >
        {t.skip}
      </a>
      <Sidebar
        language={language}
        route={route}
        setLanguage={setLanguage}
        setTheme={setTheme}
        theme={theme}
      />
      <main className="site-content" id="main" key={route} tabIndex={-1}>
        {view === "film" && selectedFilm ? (
          <FilmPage film={selectedFilm} language={language} />
        ) : view === "films" ? (
          <FilmsPage language={language} />
        ) : view === "bio" ? (
          <BioPage language={language} />
        ) : view === "contact" ? (
          <ContactPage language={language} />
        ) : view === "home" ? (
          <HomePage language={language} />
        ) : (
          <NotFoundPage language={language} />
        )}
      </main>
      <div aria-live="polite" className="sr-only" role="status">
        {documentTitle}
      </div>
    </>
  )
}