# ESP32_DRONE

Portofoliu tehnic în limba română pentru construirea unei drone. Next.js App Router, React, TypeScript și Tailwind CSS 4. Conținutul este prerandat, iar meniul și documentația expandabilă folosesc elemente HTML native.

Descrierea inițială a proiectului este păstrată în [Project overview](docs/PROJECT_OVERVIEW.md).

## Pornire locală

Este necesar Node.js 20.9+ (recomandat Node.js 22 LTS) și npm.

```bash
npm ci
npm run dev
```

Deschide http://localhost:3000. Pentru verificarea versiunii de producție:

```bash
npm run lint
npm run build
npm run typecheck
npm start
```

## Structură

```text
src/
  app/
    page.tsx                      # Pagina principală și cele patru secțiuni
    layout.tsx                    # Limba, metadatele și stilurile globale
    globals.css                   # Tailwind, identitate vizuală, responsive
    icon.svg                      # Favicon propriu
  components/
    header.tsx                    # Navigare desktop și mobil
    mobile-menu.tsx               # Închidere meniu după navigare / Escape
    drone-illustration.tsx         # Placeholder vectorial pentru hero
    project-media.tsx             # Fotografie optimizată sau placeholder
    timeline.tsx                  # Pași generați automat din date
    footer.tsx                    # GitHub, email și portofoliu opționale
    icons.tsx                     # Iconuri SVG, fără bibliotecă suplimentară
  data/
    project.ts                    # Configurație, hardware, software și pași
public/
  images/                         # Fotografiile tale
  videos/                         # Filmarea opțională
  documents/                      # Scheme și PDF-uri
.github/workflows/ci.yml           # Lint, build și TypeScript pe GitHub
next.config.ts
postcss.config.mjs
package.json
package-lock.json
```

## Personalizare

Toate datele se editează în `src/data/project.ts`:

- `project.name` și `project.author`: numele proiectului și autorul.
- `project.githubUrl`: profilul GitHub; în prezent `https://github.com/LuciHan05`.
- `project.repositoryUrl`: URL-ul repository-ului după creare; apare un link către cod în secțiunea Software când este completat.
- `project.email`: adresa de contact; `null` ascunde butonul de email.
- `project.portfolioUrl`: adresa portofoliului general; `null` ascunde linkul.
- `hardware` / `software`: componentele și tehnologiile.
- `steps`: etapele documentației, în ordinea în care apar.

Datele reflectă discuțiile despre prototipul ESP32, MPU6050, ESP-NOW, controlul PID și testele inițiale. Modelele motoarelor, ESC-urilor, bateria, dimensiunile și fotografiile necesită completare. ESP32-CAM este marcat ca planificat; stabilitatea completă și autonomia nu sunt prezentate ca rezultate măsurate. Nu publica informații de contact pe care nu vrei să le faci publice.

### Imaginea principală

Pune o fotografie reală în `public/images/drone.webp`, apoi modifică:

```ts
heroMedia: {
  src: "/images/drone.webp",
  alt: "Drona ESP32_DRONE asamblată, văzută de sus",
},
```

Fotografia înlocuiește automat schema vectorială ilustrativă. Sunt recomandate fotografii comprimate WebP/AVIF de aproximativ 1600 px lățime, ideal sub 300–500 KB. Spațiul imaginii este rezervat pentru a evita salturile de layout. Hero-ul este încărcat prioritar; imaginile etapelor folosesc încărcare lazy și dimensiuni responsive prin `next/image`.

### Video

Pune un MP4 în `public/videos/drone.mp4`, setează `heroVideo: "/videos/drone.mp4"` și folosește `heroMedia` drept poster. Clipul are controale, nu pornește automat și utilizează `preload="none"`. Adaugă subtitrări cu `<track>` în `page.tsx` dacă filmarea conține vorbire; menține o descriere textuală a rezultatelor în jurnal. Clipurile mari pot fi găzduite separat, folosind URL-ul lor în `heroVideo`.

### Adaugă un pas

Adaugă un obiect nou în array-ul `steps`. Numărul și numărul total de etape se actualizează automat. Folosește un `id` unic, fără spații. URL-urile directe sunt de forma `/#pas-autonomie`.

```ts
{
  id: "autonomie",
  category: "07 / MĂSURĂTORI",
  title: "Cât timp rămâne în aer?",
  summary: "Măsurători de autonomie în condiții documentate.",
  status: "testing", // documented | testing | planned
  media: {
    src: "/images/test-autonomie.webp",
    alt: "Montajul folosit pentru testul de autonomie",
  },
  imageCaption: "Test de autonomie",
  documentation: [
    "Primul paragraf al documentației.",
    "Condiții de test, instrumente și rezultate măsurate.",
  ],
  challenge: "Descrie provocarea întâmpinată.",
  nextToDocument: "Fotografii, loguri și rezultatele următorului test.",
  resources: [
    { label: "Schema electrică (PDF)", href: "/documents/schema.pdf" },
  ],
},
```

Nu include `media` până când fișierul există; va fi afișat un placeholder. Linkurile din `resources` trebuie să indice fișiere reale sau URL-uri valide. Conținutul este redat ca text, fără HTML nesigur.

## GitHub

Repository: [LuciHan05/ESP32_Drone](https://github.com/LuciHan05/ESP32_Drone).

Pentru conectarea unei copii locale noi, comenzile sunt:

```bash
git init -b main
git add .
git commit -m "Build ESP32_DRONE technical portfolio"
git remote add origin https://github.com/LuciHan05/ESP32_Drone.git
git push -u origin main
```

Dacă repository-ul local este deja inițializat și are remote-ul `origin`, sari peste acești pași. Nu comite `node_modules`, `.next`, `.env` sau `.vercel`; sunt deja în `.gitignore`. `project.repositoryUrl` este configurat către repository-ul de mai sus.

## Deployment gratuit pe Vercel

1. Conectează-te la [Vercel](https://vercel.com) cu același cont GitHub folosit pentru DirtBooking.
2. Selectează **Add New → Project** și importă repository-ul `ESP32_Drone`. Acordă acces repository-ului dacă nu apare.
3. Păstrează **Framework Preset: Next.js**, **Root Directory: ./**, build `npm run build` și setările implicite pentru output. Site-ul nu necesită variabile de mediu sau bază de date.
4. Apasă **Deploy**. Vei primi o adresă publică HTTPS de forma `nume-proiect.vercel.app`.
5. Deschide adresa de producție într-o fereastră privată pentru a verifica accesul public. Dacă Vercel cere autentificare, verifică **Settings → Deployment Protection** pentru deployment-ul de producție.

După conectare, fiecare push pe `main` declanșează un nou deployment de producție. Branch-urile și pull request-urile pot avea preview-uri separate. Pentru modificări ulterioare:

```bash
git add .
git commit -m "Update drone documentation"
git push
```

Planul [Vercel Hobby](https://vercel.com/docs/plans/hobby) este gratuit pentru proiecte personale, necomerciale, în limitele planului. Un domeniu propriu este opțional și poate costa separat. Instrucțiunile au fost verificate în documentația [Next.js pe Vercel](https://vercel.com/docs/frameworks/full-stack/nextjs) și [integrarea Git](https://vercel.com/docs/git) la 1 octombrie 2026. Acest proiect nu a fost publicat automat.

## Performanță și accesibilitate

- Pagina se generează static la build; conținutul nu așteaptă un API sau o bază de date.
- Componentele sunt server-side implicit. Singura componentă client este meniul mobil, pentru închidere după navigare și la Escape. Nu există biblioteci de animație, carusele, polling sau canvas 3D.
- Meniu și secțiuni expandabile bazate pe `<details>`, funcționale și fără JavaScript.
- Fonturi de sistem, fără cereri către Google Fonts și fără dependență de rețea la build.
- Imagini locale optimizate cu `next/image`; video doar la inițiativa vizitatorului.
- HTML semantic, limbă română declarată, focus vizibil, skip-link și `prefers-reduced-motion`.
- Layout responsive; menținerea performanței depinde și de fotografiile/clipurile adăugate și de conexiunea vizitatorului.

După deployment, verifică pagina publică în Lighthouse/PageSpeed Insights pe mobil. Nu există o garanție absolută de „zero lag” pe orice dispozitiv sau conexiune.
