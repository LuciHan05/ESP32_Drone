# ESP32_DRONE — website

Codul sursă al site-ului și al zonei de administrare: Next.js, React, TypeScript, Tailwind CSS și Supabase.

Repository-ul conține site-ul. Fotografiile, documentația dronei și fișierele de firmware publicate din administrare sunt păstrate în Supabase și afișate pe site. Poți adăuga și un link extern către firmware. Acestea nu sunt trimise automat în GitHub.

## Pornire locală

Node.js 22 LTS recomandat (minimum 20.9).

```bash
npm ci
```

Copiază `.env.example` în `.env.local`, completează URL-ul și cheia publică Supabase, apoi urmează [configurarea administrării](docs/ADMIN_SETUP.md).

```bash
npm run dev
```

Site: http://localhost:3000. Administrare: http://localhost:3000/admin.

Fără variabile Supabase sunt afișate datele inițiale, iar administrarea explică pașii de conectare. Cu Supabase configurat, scriptul SQL trebuie rulat înainte de build.

## Pagini

- `/` — prezentare și fotografie principală.
- `/componente` — inventar și fotografii.
- `/constructie` — pași, fotografii și documentație.
- `/cod` — firmware, copiere, descărcare și link extern opțional.
- `/galerie` — fotografiile dronei, componentelor și etapelor.
- `/admin` — autentificare și editor pentru administrator.

## Adaugă fotografii

1. Autentifică-te pe `/admin`.
2. Selectează Fotografii dronă, Componente sau Etape. Pentru ultimele două, deschide elementul dorit.
3. Alege fotografiile și completează descrierea și legenda.
4. În galeria dronei poți alege fotografia principală.
5. Apasă **Publică modificările**. Nu este nevoie de commit sau redeployment.

JPEG, PNG și WebP; pentru HEIC, exportă în JPEG. Maximum 8 fotografii per selecție și 20 MB pentru un original. Browserul redimensionează la maximum 1920 px; serverul verifică și recodează în WebP, elimină metadatele EXIF și acceptă maximum 3 MB după comprimare.

Eliminarea din editor scoate fotografia din site după publicare; fișierul rămâne în Storage pentru recuperare. Și încărcările abandonate rămân în Storage. Bucket-ul este public: imaginile încărcate pot fi văzute de oricine cunoaște adresa lor.

Modificările nesalvate rămân doar în pagina deschisă. Editorul avertizează la închidere și detectează conflictele dintre publicările din două pagini.

## Structură

```text
src/app/                   # Pagini publice, administrare și API
src/components/admin/      # Editor și încărcare fotografii
src/components/            # Galerie, timeline și afișare cod
src/data/project.ts        # Identitatea site-ului și date inițiale
src/lib/                   # Modele, validare și integrare Supabase
supabase/migrations/       # Schema și regulile de acces
supabase/seed-admin.example.sql
public/                    # Resurse statice ale site-ului
docs/ADMIN_SETUP.md         # Configurare pas cu pas
tests/                     # Verificări pentru imagini și validare
```

## Vercel

Importă repository-ul cu preset **Next.js**. În **Settings → Environment Variables**, adaugă cele două variabile din `.env.example` pentru Production și mediile suplimentare folosite. Aplică scriptul Supabase, configurează administratorul și fă **Redeploy** după adăugarea variabilelor.

Planul [Hobby](https://vercel.com/docs/plans/hobby) este destinat proiectelor personale necomerciale, în limitele sale. Verifică limitele Vercel și Supabase în dashboard.

## Verificări

```bash
npm run test
npm run lint
npm run build
npm run typecheck
```

Conținutul public utilizează cache și revalidare după publicare. Nu există animații continue, polling sau autoplay. Imaginile sunt optimizate, iar domeniul extern permis este limitat la proiectul Supabase configurat. Autentificarea este verificată pe server; politicile RLS permit editarea și încărcarea doar administratorului.

`.env.local`, `.next`, `node_modules`, `.vercel` și artefactele locale nu sunt trimise în Git. Nu folosi cheia secretă/service_role în variabile publice.
