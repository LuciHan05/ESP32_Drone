# Încarcă fotografii pe ESP32_DRONE

Configurarea de mai jos se face o singură dată. După aceea folosești `/admin` pentru fotografii, componente, etape și cod.

## 1. Creează spațiul pentru conținut

În proiectul **Esp32Drone**, deschide **SQL Editor → New query**. Copiază tot conținutul fișierului `supabase/migrations/202610010001_admin_content.sql`, lipește în editor și apasă **Run**. Așteaptă mesajul de succes.

Scriptul creează `drone_content`, `admin_users` și bucket-ul `drone-images`. Vizitatorii pot citi conținutul public, dar nu pot modifica nimic. Nu adăuga politici care permit scrierea tuturor utilizatorilor.

## 2. Creează contul tău de administrator

1. În Supabase, intră în **Authentication → Users**.
2. Alege **Add user → Create new user**.
3. Introdu emailul tău și alege o parolă. Completează parola direct în Supabase, nu în chat sau Git.
4. Lasă activată **Auto Confirm User**, dacă apare, și creează utilizatorul.
5. Copiază **User UID** al acestui utilizator.
6. În `supabase/seed-admin.example.sql`, înlocuiește `REPLACE_WITH_AUTH_USER_UUID` cu UID-ul copiat.
7. Copiază scriptul completat într-un query nou din **SQL Editor** și apasă **Run**.

Contul pentru administrarea site-ului este separat de contul cu care te conectezi la dashboard-ul Supabase. Numai contul adăugat în `admin_users` poate încărca și publica.

## 3. Conectează site-ul local

În **Connect** sau **Project Settings → API Keys**, copiază URL-ul proiectului și cheia **Publishable**. Completează `.env.local`:

```dotenv
NEXT_PUBLIC_SUPABASE_URL=https://PROJECT_REF.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=sb_publishable_...
```

Sunt valori publice. Cheia **secret/service_role** și parola bazei de date nu sunt necesare. `.env.local` este exclus din Git.

Repornește `npm run dev`. Deschide `http://localhost:3000/admin` și autentifică-te cu emailul și parola create la pasul 2.

## 4. Conectează site-ul pe Vercel

1. Deschide proiectul site-ului în Vercel.
2. Intră în **Settings → Environment Variables**.
3. Adaugă exact cele două nume de variabile de mai sus, cu valorile din Supabase.
4. Selectează Production și mediile suplimentare pe care le folosești.
5. Fă **Redeploy** din Deployments, după rularea scriptului SQL.
6. Deschide `https://ADRESA-SITE-ULUI/admin` și autentifică-te.

## 5. Încarcă fotografii

1. În administrare, alege **Fotografii dronă**.
2. Selectează un JPEG, PNG sau WebP din calculator sau telefon.
3. Completează descrierea imaginii și, opțional, legenda.
4. Alege fotografia principală dacă vrei să apară în prima secțiune a site-ului.
5. Apasă **Publică modificările**.
6. Deschide site-ul într-o altă filă și verifică rezultatul.

Pentru poze ale componentelor sau etapelor de construcție, selectează secțiunea respectivă și deschide elementul dorit. În **Cod**, poți publica fișierele de firmware sau un link extern. Acestea sunt salvate în Supabase, nu în repository-ul site-ului.

## Dacă apare o eroare

- „Conectarea la Supabase este necesară”: verifică variabilele de mediu și repornește serverul / fă redeploy.
- „Verifică migrarea Supabase”: rulează scriptul SQL în proiectul corect.
- „Acest cont nu are acces de administrare”: verifică UID-ul și pasul 2.6.
- Încărcarea eșuează: verifică formatul, dimensiunea, spațiul Storage și bucket-ul `drone-images`.
- Conflict la publicare: păstrează textele importante, apoi încarcă ultima versiune în editor.

Referințe: [Next.js și Supabase](https://supabase.com/docs/guides/getting-started/quickstarts/nextjs), [Storage](https://supabase.com/docs/guides/storage), [Row Level Security](https://supabase.com/docs/guides/database/postgres/row-level-security).
