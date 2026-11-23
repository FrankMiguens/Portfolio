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

type Language = "ES" | "EN"
type Theme = "dark"

type L10n = { ES: string; EN: string }

const CONTACT_EMAIL = "info@patricioplaza.com.ar"
const STUDIO_EMAIL = "contacto@ojoraro.com.ar"
const FORM_ENDPOINT = "" // Endpoint de servicio de correo (Formspree, Basin, etc.)

interface Film {
  slug: string
  title: string
  year: string
  status: "completed" | "development"
  preview: string
  youtube?: { id: string; start?: number }
  vimeo?: { id?: string; url?: string }
  synopsis: L10n
  screenplay: string
  direction: string
  production: string
  genre: L10n
  technique: L10n
  duration: L10n
  target: L10n
  laurelsFolder?: string
  laurels?: string[]
  markets?: { name: string; tag: string }[]
  stills: string[]
}

const HERO_DIR = "hero_pp"
const STILLS_DIR = "stills_pp"
const LAURELS_DIR = `${encodeURIComponent("laureles_películas")}`
const PP_DIR = "ParasitosPerfectos"
const HERO_EXT = "png"
const STILLS_EXT = "png"
const LAURELS_EXT = "png"
const PP_EXT = "png"

const still = (name: string) => `${STILLS_DIR}/${encodeURIComponent(name)}.${STILLS_EXT}`
const hero = (name: string) => `${HERO_DIR}/${encodeURIComponent(name)}.${HERO_EXT}`
const laurel = (folder: string, name: string) =>
  `${LAURELS_DIR}/${encodeURIComponent(folder)}/${encodeURIComponent(name)}.${LAURELS_EXT}`
const pp = (name: string) => `${PP_DIR}/${encodeURIComponent(name)}.${PP_EXT}`

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

const resolvedSrc: Record<string, string> = {}

function imageCandidates(src: string): string[] {
  const match = src.match(/^(.*\/)?([^\/]*?)(?:\.([a-zA-Z0-9]+))?$/)
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
  addAll((v) => v.replace("santasombra", "santasombre"))
  addAll((v) => v.replace("santasombre", "santasombra"))
  const names = new Set<string>()
  seeds.forEach((seed) => {
    names.add(seed)
    names.add(seed.toLowerCase())
    names.add(seed.toUpperCase())
  })

  const dirs = new Set<string>([dir])
  if (dir.startsWith("public/")) dirs.add(dir.slice("public/".length))
  else if (dir.startsWith("/")) dirs.add(dir.slice(1))

  // Soporte de auditoría de rutas Hero Steels / hero_pp / stills_pp
  if (dir.toLowerCase().includes("hero steels") || dir.toLowerCase().includes("hero_steels")) {
    dirs.add("stills_pp/")
    dirs.add("hero_pp/")
  }
  if (dir.includes("_laureles_Bl")) dirs.add(dir.replace("_laureles_Bl", "_laureles"))
  if (dir.includes("_laureles/")) dirs.add(dir.replace("_laureles/", "_laureles_Bl/"))

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

function Reveal({
  children,
  className = "",
}: {
  children: ReactNode
  className?: string
}) {
  const ref = useRef<HTMLDivElement>(null)
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const node = ref.current
    if (!node) return
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true)
          observer.disconnect()
        }
      },
      { threshold: 0.1 },
    )
    observer.observe(node)
    return () => observer.disconnect()
  }, [])

  return (
    <div className={`reveal ${visible ? "is-visible" : ""} ${className}`} ref={ref}>
      {children}
    </div>
  )
}

const films: Film[] = [
  {
    slug: "diarios-negros",
    title: "Diarios Negros",
    year: "2026",
    status: "development",
    preview: still("diariosnegros_ stills_01"),
    synopsis: {
      ES: "A comienzos del siglo XX, el diplomático británico Roger Casement presencia atrocidades coloniales en el Congo y el Amazonas, rompe con la Corona y se suma al movimiento independentista irlandés. Tras ser arrestado por traición, sus diarios personales de contenido sexual son utilizados para desacreditarlo.",
      EN: "In the early twentieth century, British diplomat Roger Casement witnesses colonial atrocities in the Congo and the Amazon, breaks with the Crown, and joins the Irish independence movement. Arrested for treason, his personal diaries of a sexual nature are weaponised to discredit him.",
    },
    screenplay: "Patricio Plaza",
    direction: "Patricio Plaza",
    production: "Ojo Raro",
    genre: {
      ES: "Drama biográfico / Histórico / Queer",
      EN: "Biographical Drama / Historical / Queer",
    },
    technique: {
      ES: "Largometraje / Animación 2D",
      EN: "Feature Film / 2D Animation",
    },
    duration: {
      ES: "Largometraje (85 min)",
      EN: "Feature Film (85 min)",
    },
    target: {
      ES: "Adultos (+16)",
      EN: "Adults (16+)",
    },
    markets: [
      { name: "NEF Animation", tag: "Résidence d'écriture de Fontevraud (Francia)" },
      { name: "La Maison des Auteurs", tag: "Résidence Angoulême (Francia)" },
      { name: "Cité internationale des arts", tag: "Résidence d'écriture Paris" },
      { name: "INCAA / FNA", tag: "Fondo Nacional de las Artes & Concurso Federal" },
    ],
    stills: [
      still("diariosnegros_ stills_01"),
      still("diariosnegros_ stills_02"),
      still("diariosnegros_ stills_03"),
    ],
  },
  {
    slug: "parasitos-perfectos",
    title: "Parásitos Perfectos",
    year: "2026",
    status: "development",
    preview: still("parasitosperfectos_still_01"),
    synopsis: {
      ES: "En un ecosistema post-humano saturado de organismos bioluminiscentes y mutaciones celulares, dos entidades biológicas desarrollan una relación simbiótica extrema que pone en crisis los límites de la identidad, la parasitosis y la supervivencia orgánica.",
      EN: "In a post-human ecosystem saturated with bioluminescent organisms and cellular mutations, two biological entities enter into an extreme symbiotic relationship that challenges the boundaries of identity, parasitism, and organic survival.",
    },
    screenplay: "Patricio Plaza",
    direction: "Patricio Plaza",
    production: "Ojo Raro",
    genre: {
      ES: "Ciencia ficción especulativa / Horror biológico",
      EN: "Speculative Sci-Fi / Body Horror",
    },
    technique: {
      ES: "Animación 2D digital & Concept Art",
      EN: "2D Digital Animation & Concept Art",
    },
    duration: {
      ES: "En desarrollo",
      EN: "In Development",
    },
    target: {
      ES: "Adultos (+18)",
      EN: "Adults (18+)",
    },
    stills: [
      still("parasitosperfectos_still_01"),
      still("parasitosperfectos_still_02"),
      still("parasitosperfectos_still_03"),
    ],
  },
  {
    slug: "luz-diabla",
    title: "Luz Diabla",
    year: "2025",
    status: "completed",
    preview: still("luzdiabla_stills_01"),
    vimeo: { url: "https://vimeo.com/783131170" },
    synopsis: {
      ES: "Martín, un joven raver urbano, se ve envuelto en un extraño accidente en la ruta camino a una fiesta en medio de la Pampa argentina. Encontrando refugio en una misteriosa pulpería campestre y cobijado por dos extraños lugareños, la paranoia de Martín comienza a apoderarse de él. Mientras las horas avanzan, su percepción empieza a distorsionarse, desatando visiones inquietantes que lo llevarán a enfrentarse a las fuerzas sobrenaturales que se esconden en la noche.",
      EN: "Martín, a young urban raver, becomes involved in a strange accident on the road while traveling to a party in the heart of the Argentine Pampas. Taking refuge in a mysterious rural general store and sheltered by two enigmatic locals, Martín begins to succumb to paranoia. As the hours pass, his perception starts to distort, unleashing unsettling visions that will force him to confront the supernatural forces lurking in the night.",
    },
    screenplay: "Paula Boffo",
    direction: "Gervasio Canda, Paula Boffo & Patricio Plaza",
    production: "Ojo Raro, Lakeside Animation (Canadá)",
    genre: {
      ES: "Terror psicológico / Fantasía oscura",
      EN: "Psychological Horror / Dark Fantasy",
    },
    technique: {
      ES: "Cortometraje / Animación 2D digital",
      EN: "Short Film / 2D Digital Animation",
    },
    duration: {
      ES: "12 min",
      EN: "12 min",
    },
    target: {
      ES: "Adultos (+16)",
      EN: "Adults (16+)",
    },
    laurelsFolder: "CarnedeDios_laureles",
    laurels: [
      "CHILEMONOS-Corto-latinoamericano-1er-lugar (1)",
      "Laureles-2-Mardel",
      "macaron_annecy_palme_2023",
    ],
    stills: [
      still("luzdiabla_stills_01"),
      still("luzdiabla_stills_02"),
      still("luzdiabla_stills_03"),
    ],
  },
  {
    slug: "carne-de-dios",
    title: "Carne de Dios",
    year: "2023",
    status: "completed",
    preview: still("carne de dios_stills_01"),
    vimeo: { url: "https://vimeo.com/783131170" },
    synopsis: {
      ES: "En el México de la etapa colonial, un fraile español víctima de una extraña enfermedad deberá soportar en su propio cuerpo los rituales nativos que ha estado persiguiendo.",
      EN: "In colonial Mexico, a Spanish friar afflicted by a strange illness must endure in his own flesh the native rituals he has been relentlessly pursuing.",
    },
    screenplay: "Patricio Plaza",
    direction: "Patricio Plaza",
    production: "Ojo Raro, Maurizius Cine, OSA Estudio",
    genre: {
      ES: "Horror folclórico / Drama histórico",
      EN: "Folk Horror / Historical Drama",
    },
    technique: {
      ES: "Cortometraje / Animación 2D digital cuadro a cuadro",
      EN: "Short Film / 2D Digital Frame-by-Frame Animation",
    },
    duration: {
      ES: "21 min",
      EN: "21 min",
    },
    target: {
      ES: "Adultos (+16)",
      EN: "Adults (16+)",
    },
    laurelsFolder: "CarnedeDios_laureles",
    laurels: [
      "CHILEMONOS-Corto-latinoamericano-1er-lugar (1)",
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
    title: "Santa Sombra",
    year: "2023",
    status: "development",
    preview: still("santasombra_stills_01"),
    vimeo: { url: "https://vimeo.com/783131170" },
    synopsis: {
      ES: "Juana es una chica de 15 años que vive en el Altiplano, cuya hermana mayor Marisol es capturada por una red de trata. Juana hace un pacto con “Las Degolladas”, dos espíritus malditos que toman la forma de dos machetes. El poder de los machetes transformará a Juana en “Santa Sombra”, una antiheroína sedienta de venganza que busca rescatar a su hermana y exterminar a los abusadores de la región.",
      EN: "Juana is a 15-year-old girl living in the Altiplano whose older sister, Marisol, is captured by a human trafficking network. Juana makes a pact with “Las Degolladas,” two cursed spirits that take the form of a pair of machetes. Empowered by the blades, Juana transforms into “Santa Sombra,” a vengeance-driven antiheroine determined to rescue her sister and eradicate the abusers who prey on the region.",
    },
    screenplay: "Paula Boffo & Patricio Plaza",
    direction: "Paula Boffo & Patricio Plaza",
    production: "Ojo Raro",
    genre: {
      ES: "Western animado / Thriller sobrenatural",
      EN: "Animated Western / Supernatural Thriller",
    },
    technique: {
      ES: "Serie de animación / Animación 2D",
      EN: "Animated Series / 2D Animation",
    },
    duration: {
      ES: "Serie (Episodios de 22 min)",
      EN: "Series (22 min episodes)",
    },
    target: {
      ES: "Jóvenes Adultos / Adultos (+16)",
      EN: "Young Adults / Adults (16+)",
    },
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
    markets: [
      { name: "Mifa Pitches / MIFA", tag: "Festival International du Film d'Animation d'Annecy" },
      { name: "Animation! Ventana Sur", tag: "Pitching Sessions / Mercado Latinoamericano" },
      { name: "Weird Market", tag: "Mercado Internacional de Animación" },
      { name: "INCAA", tag: "Desarrollo de Series de Animación" },
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
    status: "completed",
    preview: still("padre_stills_01"),
    vimeo: { url: "https://vimeo.com/ojoraro" },
    synopsis: {
      ES: "Día a día, la hija de un oficial militar retirado cuida a su padre postrado en cama, manteniendo una rutina rígida y absorbente. La dictadura ha terminado en la Argentina, pero no en la vida de esta mujer.",
      EN: "Day after day, the daughter of a retired military officer cares for her bedridden father, adhering to a strict, consuming routine. The dictatorship has ended in Argentina, but not in this woman’s life.",
    },
    screenplay: "Patricio Plaza & Santiago ‘Bou’ Grasso",
    direction: "Santiago ‘Bou’ Grasso & Patricio Plaza",
    production: "OpusBou, Les Films de L’Arlequin & Ojo Raro",
    genre: {
      ES: "Drama histórico / Político",
      EN: "Historical Drama / Political",
    },
    technique: {
      ES: "Cortometraje / Stop Motion & Animación 2D",
      EN: "Short Film / Stop Motion & 2D Animation",
    },
    duration: {
      ES: "12 min",
      EN: "12 min",
    },
    target: {
      ES: "Adultos / Jóvenes Adultos (+13)",
      EN: "Adults / Young Adults (13+)",
    },
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
    status: "completed",
    preview: still("elempleo_stills_01"),
    vimeo: { url: "https://vimeo.com/ojoraro" },
    synopsis: {
      ES: "Un hombre realiza su rutinario viaje al trabajo, inmerso en un mundo donde el uso de las personas es algo cotidiano.",
      EN: "A man goes through his routine commute to work, immersed in a world where using people is an everyday occurrence.",
    },
    screenplay: "Patricio Plaza",
    direction: "Patricio Plaza & Santiago ‘Bou’ Grasso",
    production: "OpusBou",
    genre: {
      ES: "Sátira social / Distopía",
      EN: "Social Satire / Dystopian Drama",
    },
    technique: {
      ES: "Cortometraje / Animación 2D tradicional",
      EN: "Short Film / Traditional 2D Animation",
    },
    duration: {
      ES: "7 min",
      EN: "7 min",
    },
    target: {
      ES: "Todo público / Adultos",
      EN: "General Audience / Adults",
    },
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

const copy = {
  ES: {
    home: "Inicio",
    bio: "Bio",
    films: "Films",
    contact: "Contacto",
    mainNav: "Navegación principal",
    language: "Idioma",
    role: "Productor de animación, director y guionista",
    statement:
      "Animación política con géneros populares: el horror y la fantasía para abordar luchas históricas y políticas de América Latina.",
    biography:
      "Realizador y productor de cine de animación radicado en Buenos Aires, Argentina. Su obra combina el terror folclórico y la fantasía oscura para reflexionar sobre luchas sociales, identitarias y de derechos humanos en América Latina.",
    viewFilms: "Ver film",
    viewFilm: "Ver film",
    viewMore: "Ver más",
    back: "Films",
    synopsis: "Sinopsis",
    details: "Ficha Técnica",
    fieldTitle: "Título",
    fieldScreenplay: "Guion",
    fieldDirection: "Dirección",
    fieldProduction: "Producción / Casas Productoras",
    fieldGenre: "Género",
    fieldTechnique: "Formato / Técnica",
    fieldDuration: "Duración",
    fieldTarget: "Audiencia / Target",
    fieldStatus: "Estado del proyecto",
    statusCompleted: "Finalizado",
    statusDevelopment: "En desarrollo",
    development: "En desarrollo",
    coProduction: "Coproducción",
    online: "En línea",
    watchVimeo: "Ver en Vimeo",
    watchTrailer: "Ver trailer en Vimeo",
    galleryTitle: "Fotogramas",
    awardsTitle: "Premios y Selecciones",
    marketsTitle: "Fondos, Residencias y Mercados",
    enlarge: "Ampliar imagen",
    stillOf: "Still",
    filmsNav: "Navegación entre films",
    newer: "Más recientes",
    older: "Anteriores",
    previous: "Anterior",
    next: "Siguiente",
    close: "Cerrar",
    slideshow: "Fotogramas destacados",
    prevSlide: "Fotograma anterior",
    nextSlide: "Fotograma siguiente",
    pauseSlides: "Pausar pase de fotogramas",
    playSlides: "Reanudar pase de fotogramas",
    goToSlide: "Ir al fotograma",
    bioPhotoAlt: "Retrato de Patricio Plaza",
    video: "Video",
    laurelsHint: "Desliza para ver todos los reconocimientos",
    laurelsPrev: "Ver laureles anteriores",
    laurelsNext: "Ver más laureles",
    // 4 Bloques Semánticos de Bio
    bioThemes: [
      {
        title: "Formación",
        content:
          "Estudió Artes Visuales y Comunicación Audiovisual en la Universidad Nacional de La Plata. Cuenta con una sólida base académica y artística en cine y animación, complementada con residencias de escritura y desarrollo en instituciones de renombre internacional como NEF Animation, La Maison des Auteurs de Angulema y la Cité internationale des arts de París.",
      },
      {
        title: "Experiencia Profesional",
        content:
          "Trabaja en la industria de la animación desde hace más de dos décadas como director, guionista y productor. En 2019 fundó Ojo Raro, colectivo de producción dedicado a la creación de proyectos autorales desde una perspectiva sudamericana, transfeminista y queer, articulando coproducciones internacionales y colaboraciones con estudios de América Latina, Europa y Norteamérica.",
      },
      {
        title: "Obra",
        content:
          "Su filmografía se centra en la animación política de autor, valiéndose de géneros como el horror folclórico y la fantasía para explorar las tensiones históricas y sociales latinoamericanas. Ha escrito y dirigido obras clave como El Empleo (2008), Padre (2013), Carne de Dios (2023) y Luz Diabla (2025), además de liderar el desarrollo de proyectos de largometraje y series como Diarios Negros, Santa Sombra y Parásitos Perfectos. Sus producciones han competido en festivales de primer orden mundial como Annecy, Sundance, Guadalajara, Mar del Plata y los Premios Annie.",
      },
      {
        title: "Divulgación",
        content:
          "Comprometido con la formación y la defensa de los derechos humanos y la diversidad, Patricio colabora activamente con organizaciones sociales y lidera iniciativas como Voces del Sur y Miradas Furtivas. Curó el programa Hidden Desires en el Festival de Annecy y ha dictado su masterclass 'Horror político en la animación latinoamericana' en universidades y festivales de Argentina, México y Colombia, con el apoyo de organismos como el INCAA, FONCA y el Institut français.",
      },
    ],
    // Vías de contacto
    personalContactBadge: "Personal / Directo",
    personalContactTitle: "Patricio Plaza",
    personalContactDesc: "Consultas artísticas, dirección, guion y colaboraciones personales.",
    institutionalContactBadge: "Institucional / Productora",
    institutionalContactTitle: "Ojo Raro",
    institutionalContactDesc: "Coproducciones, proyectos audiovisuales, festivales y prensa.",
    fieldName: "Nombre",
    fieldEmail: "Email",
    fieldMessage: "Mensaje",
    fieldWebsite: "Sitio web",
    errName: "Ingresá tu nombre.",
    errEmail: "Ingresá un email válido.",
    errMessage: "Escribí un mensaje.",
    sendMessage: "Enviar un mensaje",
    send: "Enviar mensaje",
    sending: "Enviando…",
    sent: "Mensaje enviado. Muchas gracias.",
    sentMailto: "Se abrió tu aplicación de correo para enviar el mensaje. Muchas gracias.",
    sendError: "Hubo un error al enviar. Podés escribir directamente a info@patricioplaza.com.ar",
    sendAnother: "Enviar otro mensaje",
    skip: "Saltar al contenido principal",
    mailSubject: "Contacto desde sitio web",
    notFoundTitle: "Página no encontrada",
    notFoundText: "La página que buscás no existe o cambió de lugar.",
    notFoundLink: "Ir al listado de films",
  },
  EN: {
    home: "Home",
    bio: "Bio",
    films: "Films",
    contact: "Contact",
    mainNav: "Main navigation",
    language: "Language",
    role: "Animation Producer, Director & Screenwriter",
    statement:
      "Political animation through popular genres: horror and fantasy as a way to address Latin America's historical and political struggles.",
    biography:
      "Patricio Plaza is an animation filmmaker and producer based in Buenos Aires, Argentina. His work blends folk horror and dark fantasy to critically examine historical and social struggles across Latin America.",
    viewFilms: "View films",
    viewFilm: "View film",
    viewMore: "View more",
    back: "Films",
    synopsis: "Synopsis",
    details: "Technical Specifications",
    fieldTitle: "Title",
    fieldScreenplay: "Screenplay",
    fieldDirection: "Direction",
    fieldProduction: "Production / Production Companies",
    fieldGenre: "Genre",
    fieldTechnique: "Format / Technique",
    fieldDuration: "Running Time",
    fieldTarget: "Target Audience",
    fieldStatus: "Project Status",
    statusCompleted: "Completed",
    statusDevelopment: "In Development",
    development: "In development",
    coProduction: "Co-production",
    online: "Online",
    watchVimeo: "Watch on Vimeo",
    watchTrailer: "Watch trailer on Vimeo",
    galleryTitle: "Stills",
    awardsTitle: "Awards & Official Selections",
    marketsTitle: "Funds, Residencies & Industry Markets",
    enlarge: "Enlarge image",
    stillOf: "Still",
    filmsNav: "Films navigation",
    newer: "Newer",
    older: "Older",
    previous: "Previous",
    next: "Next",
    close: "Close",
    slideshow: "Featured stills",
    prevSlide: "Previous slide",
    nextSlide: "Next slide",
    pauseSlides: "Pause slideshow",
    playSlides: "Play slideshow",
    goToSlide: "Go to slide",
    bioPhotoAlt: "Portrait of Patricio Plaza",
    video: "Video",
    laurelsHint: "Scroll to view all awards",
    laurelsPrev: "Show previous awards",
    laurelsNext: "Show more awards",
    bioThemes: [
      {
        title: "Education & Background",
        content:
          "He studied Visual Arts and Audiovisual Communication at the Universidad Nacional de La Plata. His academic and artistic background is reinforced by prestigious international writing and development residencies at NEF Animation, La Maison des Auteurs in Angoulême, and the Cité internationale des arts in Paris.",
      },
      {
        title: "Professional Experience",
        content:
          "With over twenty years of experience as an animation director, writer, and producer, Plaza founded Ojo Raro in 2019—a production collective dedicated to crafting auteur animation from a South American and queer perspective, fostering international co-productions across Latin America, North America, and Europe.",
      },
      {
        title: "Body of Work",
        content:
          "His filmography focuses on political animation, blending folk horror and dark fantasy to dissect Latin America's historical and socio-political tensions. Key titles include El Empleo (2008), Padre (2013), Carne de Dios (2023), and Luz Diabla (2025), alongside upcoming projects such as Black Diaries, Santa Sombra, and Parásitos Perfectos. His films have screened in official competitions at major international festivals including Annecy, Sundance, Guadalajara, Mar del Plata, and the Annie Awards.",
      },
      {
        title: "Outreach & Masterclasses",
        content:
          "Actively engaged in mentoring, human rights advocacy, and supporting underrepresented and LGBTIQ+ animation creators across Latin America, he leads initiatives like Voces del Sur and Miradas Furtivas. He curated the Hidden Desires programme at the Annecy International Animation Festival and has taught his masterclass 'Political Horror in Latin American Animation' throughout Argentina, Mexico, and Colombia with support from INCAA, FONCA, and the Institut français.",
      },
    ],
    personalContactBadge: "Personal / Direct",
    personalContactTitle: "Patricio Plaza",
    personalContactDesc: "Artistic inquiries, direction, screenwriting, and personal collaborations.",
    institutionalContactBadge: "Studio / Production",
    institutionalContactTitle: "Ojo Raro",
    institutionalContactDesc: "Co-productions, film projects, festival distribution, and press.",
    fieldName: "Name",
    fieldEmail: "Email",
    fieldMessage: "Message",
    fieldWebsite: "Website",
    errName: "Enter your name.",
    errEmail: "Enter a valid email.",
    errMessage: "Write a message.",
    sendMessage: "Send a message",
    send: "Send message",
    sending: "Sending…",
    sent: "Message sent. Thank you.",
    sentMailto: "Your email app should have opened with your message ready to send. Thank you.",
    sendError: "An error occurred. You can write directly to info@patricioplaza.com.ar",
    sendAnother: "Send another message",
    skip: "Skip to main content",
    mailSubject: "Website inquiry",
    notFoundTitle: "Page not found",
    notFoundText: "The page you are looking for does not exist.",
    notFoundLink: "View all films",
  },
}

function useRoute(): string {
  const get = () => {
    const raw = window.location.hash.replace(/^#\/?/, "");
    return raw ? raw.replace(/^\/+/, "") : "inicio";
  }
  const [route, setRoute] = useState(get)

  useEffect(() => {
    const handler = () => setRoute(get())
    window.addEventListener("hashchange", handler)
    return () => window.removeEventListener("hashchange", handler)
  }, [])

  return route
}

function writeStorage(key: string, value: string) {
  try {
    window.localStorage.setItem(key, value)
  } catch {
    /* almacenamiento deshabilitado */
  }
}

function readStorage(key: string): string | null {
  try {
    return window.localStorage.getItem(key)
  } catch {
    return null
  }
}

function youtubeEmbed(youtube: { id: string; start?: number }) {
  const start = youtube.start ? `&start=${youtube.start}` : ""
  return `https://www.youtube-nocookie.com/embed/${encodeURIComponent(youtube.id)}?rel=0&modestbranding=1${start}`
}

function Sidebar({
  route,
  language,
  setLanguage,
}: {
  route: string
  language: Language
  setLanguage: (language: Language) => void
}) {
  const t = copy[language]
  const sections = ["inicio", "bio", "films", "contacto"]
  const activeSection = route.startsWith("film/") || route === "films" ? "films" : sections.includes(route) ? route : ""
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
      </div>
    </header>
  )
}

const heroImages: { image: string; slug?: string; title?: string }[] = [
  { image: hero("hero_01"), slug: "diarios-negros", title: "Diarios Negros" },
  { image: hero("hero_02"), slug: "parasitos-perfectos", title: "Parásitos Perfectos" },
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
  const [index, setIndex] = useState(0)
  const [animate, setAnimate] = useState(true)
  const [hoverPaused, setHoverPaused] = useState(false)
  const [userPaused, setUserPaused] = useState(false)
  const [cartelVisible, setCartelVisible] = useState(false)
  const touchStartX = useRef<number | null>(null)
  const slides = count > 0 ? [...items, items[0]] : []

  const isPaused = hoverPaused || userPaused

  // El cartel aparece únicamente después de que la foto terminó su animación inicial / keyframe
  useEffect(() => {
    const timer = window.setTimeout(() => {
      setCartelVisible(true)
    }, 850)
    return () => window.clearTimeout(timer)
  }, [])

  useEffect(() => {
    if (isPaused || count <= 1) return
    const fadeTimer = window.setTimeout(() => {
      setCartelVisible(false)
    }, 4100)
    const timer = window.setInterval(() => {
      setIndex((current) => current + 1)
    }, 4500)
    return () => {
      window.clearTimeout(fadeTimer)
      window.clearInterval(timer)
    }
  }, [isPaused, count, index])

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

  // Reactivar el cartel únicamente luego de completada la transición de imagen (850ms)
  useEffect(() => {
    const timer = window.setTimeout(() => {
      setCartelVisible(true)
    }, 850)
    return () => window.clearTimeout(timer)
  }, [index])

  if (!count) return null

  const goToSlide = (pos: number) => {
    setCartelVisible(false)
    setIndex(pos)
  }

  const goNext = () => {
    setCartelVisible(false)
    setIndex((current) => (current >= count ? current : current + 1))
  }

  const goPrevious = () => {
    setCartelVisible(false)
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
    if (touchStartX.current === null) return
    const delta = event.changedTouches[0].clientX - touchStartX.current
    if (Math.abs(delta) > 40) {
      if (delta < 0) goNext()
      else goPrevious()
    }
    touchStartX.current = null
  }

  const currentItem = items[index % count]

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
      {/* Carrete / reel: ubicado en la esquina superior izquierda y más chico */}
      <div className="hero-dots">
        {items.map((_, position) => (
          <button
            aria-current={position === index % count ? "true" : undefined}
            aria-label={`${t.goToSlide} ${position + 1}`}
            className={position === index % count ? "is-active" : ""}
            key={position}
            onClick={() => goToSlide(position)}
            type="button"
          >
            <span />
          </button>
        ))}
      </div>

      <div
        className={`hero-track ${animate ? "is-animating" : ""}`}
        style={{ transform: `translateX(-${index * 100}%)` }}
      >
        {slides.map((slide, position) => {
          const isClone = position === count
          const content = <FallbackImg alt={slide.title ?? ""} src={slide.image} />
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

      {/* Cartel / bloque de títulos: rosa con 85% de opacidad y tipografía negra.
          Aparece únicamente después de terminar la animación. Nunca se desplaza con la foto encima. */}
      {currentItem?.title && (
        <div className={`hero-label ${cartelVisible ? "is-visible" : ""}`}>
          {currentItem.title}
        </div>
      )}

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
            <Triangle dir="left" size={16} />
          </button>
          <button
            aria-label={t.nextSlide}
            className="hero-control hero-arrow next"
            onClick={goNext}
            type="button"
          >
            <Triangle size={16} />
          </button>
        </>
      )}

      <div className="hero-bottom-right">
        <a
          className="hero-action-link"
          href={currentItem?.slug ? `#/film/${currentItem.slug}` : "#/films"}
        >
          {t.viewFilm}
          <Triangle size={9} />
        </a>
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
          <p className="profile-role">{t.role}</p>
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
      </header>
      <div className="bio-layout">
        <Reveal className="bio-photo">
          <div className="bio-photo-container">
            <div className="bio-photo-frame">
              <FallbackImg alt={t.bioPhotoAlt} src="bio/recurso-1.png" />
            </div>
          </div>
          <h2 className="bio-photo-name">Patricio Plaza</h2>
        </Reveal>
        <div className="bio-main">
          <Reveal className="bio-featured-statement">
            <div className="bio-statement-box">
              <p className="bio-statement-text">{t.statement}</p>
            </div>
          </Reveal>

          <div className="bio-thematic-blocks">
            {t.bioThemes.map((theme, index) => {
              // Crecen únicamente de tamaño los títulos de Formación, Experiencia Profesional y Obra
              const isProminentTitle = index === 0 || index === 1 || index === 2
              return (
                <Reveal className="bio-theme-card" key={theme.title}>
                  <h3 className={`bio-theme-title ${isProminentTitle ? "is-prominent-title" : ""}`}>
                    {theme.title}
                  </h3>
                  <p className="bio-theme-text">{theme.content}</p>
                </Reveal>
              )
            })}
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
      <a
        aria-label={`${film.title} - ${film.status === "development" ? t.statusDevelopment : film.year}`}
        className="card-media"
        href={link}
      >
        <FallbackImg alt="" loading="lazy" src={film.preview} />
        <div className="film-card-overlay">
          <div className="film-card-content">
            <h2>{film.title}</h2>
            <div className="film-card-footer">
              <p className="film-card-meta">
                <span>{film.status === "development" ? t.statusDevelopment : film.year}</span>
                <span className="dot-sep">•</span>
                <span>{film.genre[language]}</span>
              </p>
              <span aria-hidden="true" className="film-card-arrow">
                <svg
                  aria-hidden="true"
                  fill="none"
                  height="15"
                  stroke="currentColor"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  viewBox="0 0 24 24"
                  width="15"
                >
                  <line x1="5" y1="12" x2="19" y2="12" />
                  <polyline points="12 5 19 12 12 19" />
                </svg>
              </span>
            </div>
          </div>
        </div>
      </a>
    </article>
  )
}

function FilmsPage({ language }: { language: Language }) {
  const t = copy[language]
  return (
    <section className="films-page page">
      <header className="page-intro">
        <h1>{t.films}</h1>
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
  const onCloseRef = useRef(onClose)
  onCloseRef.current = onClose

  const goPrevious = () => setIndex((current) => (current - 1 + total) % total)
  const goNext = () => setIndex((current) => (current + 1) % total)

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onCloseRef.current()
      if (event.key === "ArrowLeft") setIndex((current) => (current - 1 + total) % total)
      if (event.key === "ArrowRight") setIndex((current) => (current + 1) % total)
    }
    document.body.classList.add("lightbox-open")
    window.addEventListener("keydown", onKeyDown)
    return () => {
      document.body.classList.remove("lightbox-open")
      window.removeEventListener("keydown", onKeyDown)
    }
  }, [total])

  return (
    <div
      aria-label={film.title}
      aria-modal="true"
      className="lightbox"
      onClick={() => onCloseRef.current()}
      ref={dialogRef}
      role="dialog"
    >
      <button
        aria-label={t.close}
        className="lightbox-button lightbox-close"
        onClick={() => onCloseRef.current()}
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
          {index > 0 && (
            <button
              aria-label={t.previous}
              className="lightbox-arrow previous"
              onClick={(event) => {
                event.stopPropagation()
                setIndex((current) => Math.max(0, current - 1))
              }}
              type="button"
            >
              <Triangle dir="left" size={22} />
            </button>
          )}
          {index < total - 1 && (
            <button
              aria-label={t.next}
              className="lightbox-arrow next"
              onClick={(event) => {
                event.stopPropagation()
                setIndex((current) => Math.min(total - 1, current + 1))
              }}
              type="button"
            >
              <Triangle size={22} />
            </button>
          )}
        </>
      )}

      <span className="lightbox-count">
        {index + 1} / {total}
      </span>
    </div>
  )
}

function LaurelsStrip({
  children,
  label,
  nextLabel,
  prevLabel,
  title,
}: {
  children: ReactNode
  label: string
  nextLabel: string
  prevLabel: string
  title: string
}) {
  const ref = useRef<HTMLUListElement>(null)
  const [edges, setEdges] = useState({ start: true, end: false })
  const [hasOverflow, setHasOverflow] = useState(false)

  const updateEdges = () => {
    const el = ref.current
    if (!el) return
    const overflow = el.scrollWidth > el.clientWidth + 2
    setHasOverflow(overflow)
    const start = el.scrollLeft <= 4
    const end = el.scrollLeft + el.clientWidth >= el.scrollWidth - 4
    setEdges({ start, end })
  }

  useLayoutEffect(() => {
    updateEdges()
  }, [])

  useEffect(() => {
    const el = ref.current
    if (!el) return
    const onScroll = () => updateEdges()
    el.addEventListener("scroll", onScroll, { passive: true })
    window.addEventListener("resize", onScroll)

    const observer = new ResizeObserver(() => updateEdges())
    observer.observe(el)

    const imgs = el.querySelectorAll("img")
    imgs.forEach((img) => {
      if (!img.complete) {
        img.addEventListener("load", updateEdges)
      }
    })

    return () => {
      el.removeEventListener("scroll", onScroll)
      window.removeEventListener("resize", onScroll)
      observer.disconnect()
      imgs.forEach((img) => img.removeEventListener("load", updateEdges))
    }
  }, [])

  const scrollByPage = (direction: -1 | 1) => {
    const el = ref.current
    if (!el) return
    el.scrollBy({ left: direction * (el.clientWidth * 0.75), behavior: "smooth" })
  }

  return (
    <div className={`laurels-scroller ${edges.start ? "" : "has-prev"} ${edges.end ? "" : "has-next"}`}>
      <ul aria-label={label} className="laurels" ref={ref} tabIndex={0} title={title}>
        {children}
      </ul>
      {hasOverflow && !edges.start && (
        <button
          aria-label={prevLabel}
          className="laurels-arrow previous"
          onClick={() => scrollByPage(-1)}
          type="button"
        >
          <Triangle dir="left" size={14} />
        </button>
      )}
      {hasOverflow && !edges.end && (
        <button
          aria-label={nextLabel}
          className="laurels-arrow next"
          onClick={() => scrollByPage(1)}
          type="button"
        >
          <Triangle size={14} />
        </button>
      )}
    </div>
  )
}

function getMarketColsClass(count: number): string {
  if (count === 4) return "cols-4"
  return "cols-3"
}

function FilmPage({
  film,
  language,
}: {
  film: Film
  language: Language
}) {
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null)
  const t = copy[language]
  const currentIndex = navigableFilms.findIndex((item) => item.slug === film.slug)
  const newer = currentIndex > 0 ? navigableFilms[currentIndex - 1] : null
  const older = currentIndex < navigableFilms.length - 1 ? navigableFilms[currentIndex + 1] : null

  // 9 Campos Obligatorios estrictos
  const fields = [
    { label: t.fieldTitle, value: film.title },
    { label: t.fieldScreenplay, value: film.screenplay },
    { label: t.fieldDirection, value: film.direction },
    { label: t.fieldProduction, value: film.production },
    { label: t.fieldGenre, value: film.genre[language] },
    { label: t.fieldTechnique, value: film.technique[language] },
    { label: t.fieldDuration, value: film.duration[language] },
    { label: t.fieldTarget, value: film.target[language] },
    {
      label: t.fieldStatus,
      value: film.status === "completed" ? t.statusCompleted : t.statusDevelopment,
    },
  ]

  const half = Math.ceil(fields.length / 2)
  const col1 = fields.slice(0, half)
  const col2 = fields.slice(half)

  // Reproductor: YouTube únicamente para El Empleo y Padre
  const isYouTubeMonetized = (film.slug === "el-empleo" || film.slug === "padre") && Boolean(film.youtube)

  return (
    <article className="film-page page">
      {isYouTubeMonetized ? (
        <>
          <Reveal className="main-image film-video">
            <iframe
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
              allowFullScreen
              loading="lazy"
              src={youtubeEmbed(film.youtube!)}
              title={`${t.video}: ${film.title}`}
            />
          </Reveal>
          <div className="film-body-container">
            <div className="film-title-bar">
              <div className="film-title">
                <h1>{film.title}</h1>
                <p>{film.year}</p>
              </div>
              {film.youtube && (
                <div className="film-watch-cta">
                  <a
                    className="outline-button"
                    href={`https://www.youtube.com/watch?v=${film.youtube.id}`}
                    rel="noreferrer"
                    target="_blank"
                  >
                    {language === "ES" ? "Ver en YouTube" : "Watch on YouTube"}
                    <Triangle />
                  </a>
                </div>
              )}
            </div>

            {film.synopsis && (
              <Reveal className="film-details">
                <section className="synopsis-section">
                  <h2>{t.synopsis}</h2>
                  <p>{film.synopsis[language]}</p>
                </section>
              </Reveal>
            )}

            <Reveal className="film-details">
              <section className="credits-section">
                <h2>{t.details}</h2>
                <div className="credits-columns is-two-columns">
                  <dl className="credits-dl">
                    {col1.map((item) => (
                      <div key={item.label}>
                        <dt>{item.label}</dt>
                        <dd>{item.value}</dd>
                      </div>
                    ))}
                  </dl>
                  <dl className="credits-dl">
                    {col2.map((item) => (
                      <div key={item.label}>
                        <dt>{item.label}</dt>
                        <dd>{item.value}</dd>
                      </div>
                    ))}
                  </dl>
                </div>
              </section>
            </Reveal>

            {film.laurels && film.laurels.length > 0 && (
              <Reveal className="laurels-wrap">
                <h2>{t.awardsTitle}</h2>
                <LaurelsStrip
                  label={`${t.awardsTitle}: ${film.title}`}
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

            {film.markets && film.markets.length > 0 && (
              <Reveal className="markets-wrap">
                <h2>{t.marketsTitle}</h2>
                <div className={`markets-grid ${getMarketColsClass(film.markets.length)}`}>
                  {film.markets.map((m) => (
                    <div className="market-card" key={m.name}>
                      <strong className="market-name">{m.name}</strong>
                      <p className="market-tag">{m.tag}</p>
                    </div>
                  ))}
                </div>
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
                <a aria-label={`${t.newer}: ${newer.title}`} className="pagination-newer" href={`#/film/${newer.slug}`}>
                  <Triangle dir="left" size={16} />
                </a>
              ) : (
                <span className="pagination-empty" />
              )}
              <div className="pagination-center">
                <a className="text-link pagination-film-btn" href="#/films">
                  {t.films}
                </a>
              </div>
              {older ? (
                <a aria-label={`${t.older}: ${older.title}`} className="pagination-older" href={`#/film/${older.slug}`}>
                  <Triangle dir="right" size={16} />
                </a>
              ) : (
                <span className="pagination-empty" />
              )}
            </nav>
          </div>
        </>
      ) : (
        <>
          {/* Imagen principal (hero): pegada al borde del sidebar y margen superior sin marco envolvente */}
          <div className="film-hero-full">
            <FallbackImg alt={film.title} src={film.preview} />
          </div>

          <div className="film-body-container">
            {/* Título de la película alineado horizontalmente con Sinopsis */}
            <Reveal className="film-intro-grid">
              <div className="film-heading-col">
                <h1 className="film-standalone-title">{film.title}</h1>
                <p className="film-standalone-status">
                  {film.status === "development" ? t.statusDevelopment : film.year}
                </p>
                {/* Botón directo a Vimeo: margen izquierdo alineado con los elementos inferiores */}
                {film.vimeo?.url && (
                  <div className="film-vimeo-action">
                    <a
                      className="outline-button vimeo-button"
                      href={film.vimeo.url}
                      rel="noreferrer"
                      target="_blank"
                    >
                      {t.watchVimeo}
                      <Triangle />
                    </a>
                  </div>
                )}
              </div>

              {film.synopsis && (
                <section className="synopsis-section">
                  <h2>{t.synopsis}</h2>
                  <p>{film.synopsis[language]}</p>
                </section>
              )}
            </Reveal>

            <Reveal className="film-details">
              <section className="credits-section">
                <h2>{t.details}</h2>
                <div className="credits-columns is-two-columns">
                  <dl className="credits-dl">
                    {col1.map((item) => (
                      <div key={item.label}>
                        <dt>{item.label}</dt>
                        <dd>{item.value}</dd>
                      </div>
                    ))}
                  </dl>
                  <dl className="credits-dl">
                    {col2.map((item) => (
                      <div key={item.label}>
                        <dt>{item.label}</dt>
                        <dd>{item.value}</dd>
                      </div>
                    ))}
                  </dl>
                </div>
              </section>
            </Reveal>

            {/* Lógica Condicional: Laureles para finalizadas, Logotipos de Mercados/Fondos para desarrollo */}
            {film.laurels && film.laurels.length > 0 && (
              <Reveal className="laurels-wrap">
                <h2>{t.awardsTitle}</h2>
                <LaurelsStrip
                  label={`${t.awardsTitle}: ${film.title}`}
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

            {film.markets && film.markets.length > 0 && (
              <Reveal className="markets-wrap">
                <h2>{t.marketsTitle}</h2>
                <div className={`markets-grid ${getMarketColsClass(film.markets.length)}`}>
                  {film.markets.map((m) => (
                    <div className="market-card" key={m.name}>
                      <strong className="market-name">{m.name}</strong>
                      <p className="market-tag">{m.tag}</p>
                    </div>
                  ))}
                </div>
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
                <a aria-label={`${t.newer}: ${newer.title}`} className="pagination-newer" href={`#/film/${newer.slug}`}>
                  <Triangle dir="left" size={16} />
                </a>
              ) : (
                <span className="pagination-empty" />
              )}
              <div className="pagination-center">
                <a className="text-link pagination-film-btn" href="#/films">
                  {t.films}
                </a>
              </div>
              {older ? (
                <a aria-label={`${t.older}: ${older.title}`} className="pagination-older" href={`#/film/${older.slug}`}>
                  <Triangle dir="right" size={16} />
                </a>
              ) : (
                <span className="pagination-empty" />
              )}
            </nav>
          </div>
        </>
      )}

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

    const nextErrors: FormErrors = {}
    if (!name) nextErrors.name = t.errName
    if (!/^[^s@]+@[^s@]+.[^s@]+$/.test(email)) nextErrors.email = t.errEmail
    if (!message) nextErrors.message = t.errMessage
    setErrors(nextErrors)

    const firstError = (["name", "email", "message"] as const).find((key) => nextErrors[key])
    if (firstError) {
      document.getElementById(firstError)?.focus()
      return
    }

    // Sin servicio configurado: solución mailto: directa y limpia
    if (!FORM_ENDPOINT) {
      const subject = `${t.mailSubject} - ${name}`
      const body = `${message}\n\nDe: ${name}\nEmail: ${email}`
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
      <header className="page-intro contact-header">
        <h1>{t.contact}</h1>
      </header>

      <div className="contact-grid">
        <div className="contact-copy">
          {/* Dos vías de contacto directo bien diferenciadas visualmente */}
          <div className="contact-channels">
            <div className="contact-channel-card personal">
              <div className="contact-channel-header">
                <div className="contact-photo-frame">
                  <FallbackImg alt="Patricio Plaza" className="contact-photo" src="bio/recurso-1.png" />
                </div>
                <div className="contact-channel-title-wrap">
                  <span className="channel-badge">{t.personalContactBadge}</span>
                  <h3>{t.personalContactTitle}</h3>
                </div>
              </div>
              <p>{t.personalContactDesc}</p>
              <a className="channel-email-btn" href={`mailto:${CONTACT_EMAIL}`}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="2" y="4" width="20" height="16" rx="2" />
                  <path d="M22 7l-10 7L2 7" />
                </svg>
                <span>{CONTACT_EMAIL}</span>
              </a>
            </div>

            <div className="contact-channel-card institutional">
              <span className="channel-badge">{t.institutionalContactBadge}</span>
              <h3>{t.institutionalContactTitle}</h3>
              <p>{t.institutionalContactDesc}</p>
              <div className="channel-actions">
                <a className="channel-email-btn" href={`mailto:${STUDIO_EMAIL}`}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <rect x="2" y="4" width="20" height="16" rx="2" />
                    <path d="M22 7l-10 7L2 7" />
                  </svg>
                  <span>{STUDIO_EMAIL}</span>
                </a>
                <a className="studio-web-link" href="https://ojoraro.com.ar/" rel="noreferrer" target="_blank">
                  <span>ojoraro.com.ar</span>
                  <Triangle />
                </a>
              </div>
            </div>
          </div>

          <address className="contact-social">
            <a href="https://www.instagram.com/pat.plaza/" rel="noreferrer" target="_blank">
              Instagram @pat.plaza
            </a>
          </address>
        </div>

        <div className={`contact-form-wrap ${done ? "is-sent" : ""}`}>
          <div className="contact-form-card">
            <h3 className="form-card-title">{t.sendMessage}</h3>
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
                  <Triangle />
                </button>
              </form>
            )}
          </div>
        </div>
      </div>
    </section>
  )
}

export default function App() {
  const route = useRoute()
  const [language, setLanguage] = useState<Language>(() => (readStorage("language") === "EN" ? "EN" : "ES"))
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
    // Tema oscuro estricto global
    document.documentElement.dataset.theme = "dark"
    document.documentElement.style.backgroundColor = "#000000"
    document.body.style.backgroundColor = "#000000"
  }, [])

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
