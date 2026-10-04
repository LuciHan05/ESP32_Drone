"use client";

import { useEffect, useRef, useState, type FormEvent, type ReactNode } from "react";
import type { CodeFile, ConstructionStep, ContentSnapshot, DroneComponent, DroneVideo, GalleryImage, SiteContent, VideoUploadTicket } from "@/lib/content-types";
import { ImagesEditor } from "./images-editor";
import { prepareImage } from "./image-upload";
import { checkVideo, uploadVideo } from "./video-upload";
import { MAX_VIDEOS } from "@/lib/video";
import { createVideoPoster } from "@/lib/video-poster";
import { VideoPlayer } from "../video-player";

type Tab = "gallery" | "components" | "steps" | "codeFiles" | "videos";
const TABS: { id: Tab; label: string; number: string }[] = [
  { id: "gallery", label: "Fotografii dronă", number: "01" },
  { id: "components", label: "Componente", number: "02" },
  { id: "steps", label: "Etape", number: "03" },
  { id: "codeFiles", label: "Cod", number: "04" },
  { id: "videos", label: "Video", number: "05" },
];

class RequestError extends Error {
  constructor(message: string, public status: number) { super(message); }
}

async function request<T>(url: string, init?: RequestInit): Promise<T> {
  let response: Response;
  try { response = await fetch(url, { credentials: "same-origin", cache: "no-store", ...init }); }
  catch { throw new RequestError("Conexiunea a fost întreruptă. Modificările tale sunt păstrate în această pagină. Încearcă din nou.", 0); }
  const body = await response.json().catch(() => null);
  if (!response.ok) throw new RequestError(body?.error || "Solicitarea nu a reușit. Încearcă din nou.", response.status);
  if (!body) throw new RequestError("Răspunsul serverului nu a putut fi citit. Încearcă din nou.", response.status);
  return body as T;
}

function getError(error: unknown) { return error instanceof Error ? error.message : "A apărut o eroare. Încearcă din nou."; }
function newId(prefix: string) { return `${prefix}-${crypto.randomUUID()}`; }

export function AdminWorkspace() {
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<string | null>(null);
  const [content, setContent] = useState<SiteContent | null>(null);
  const [revision, setRevision] = useState(0);
  const [tab, setTab] = useState<Tab>("gallery");
  const [dirty, setDirty] = useState(false);
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [conflict, setConflict] = useState(false);
  const lock = useRef(false);
  const videoAbort = useRef<AbortController | null>(null);
  const [videoProgress, setVideoProgress] = useState<number | null>(null);
  useEffect(() => () => videoAbort.current?.abort(), []);

  useEffect(() => {
    let active = true;
    async function initialize() {
      try {
        const session = await request<{ user: { email: string } }>("/api/admin/session");
        if (!active) return;
        setUser(session.user.email);
        const snapshot = await request<ContentSnapshot>("/api/admin/content");
        if (!active) return;
        setContent(snapshot.content);
        setRevision(snapshot.revision);
      } catch (cause) {
        if (active && !(cause instanceof RequestError && cause.status === 401)) setError(getError(cause));
      } finally { if (active) setLoading(false); }
    }
    void initialize();
    return () => { active = false; };
  }, []);

  useEffect(() => {
    if (!dirty && !busy) return;
    const protectDraft = (event: BeforeUnloadEvent) => { event.preventDefault(); event.returnValue = ""; };
    window.addEventListener("beforeunload", protectDraft);
    return () => window.removeEventListener("beforeunload", protectDraft);
  }, [dirty, busy]);

  function reportError(cause: unknown) {
    if (cause instanceof RequestError && cause.status === 401) {
      setUser(null);
      setError("Sesiunea a expirat. Autentifică-te din nou; modificările nesalvate sunt păstrate în această pagină.");
    } else setError(getError(cause));
  }

  function edit(update: (current: SiteContent) => SiteContent) {
    setContent((current) => current ? update(current) : current);
    setDirty(true);
    setNotice("");
  }

  async function login(email: string, password: string) {
    if (lock.current) return;
    lock.current = true;
    setBusy("Se verifică datele de acces…");
    setError("");
    try {
      await request("/api/admin/login", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email, password }) });
      const session = await request<{ user: { email: string } }>("/api/admin/session");
      setUser(session.user.email);
      if (!content) {
        const snapshot = await request<ContentSnapshot>("/api/admin/content");
        setContent(snapshot.content);
        setRevision(snapshot.revision);
      }
      setNotice(content ? "Te-ai autentificat din nou. Poți continua editarea." : "");
    } catch (cause) { setError(getError(cause)); }
    finally { lock.current = false; setBusy(null); }
  }

  async function logout() {
    if (lock.current || (dirty && !window.confirm("Ai modificări nepublicate. Te deconectezi și renunți la ele?"))) return;
    lock.current = true;
    setBusy("Deconectare…");
    try {
      await request("/api/admin/logout", { method: "POST" });
      setUser(null); setContent(null); setDirty(false); setError(""); setNotice(""); setConflict(false);
    } catch (cause) { reportError(cause); }
    finally { lock.current = false; setBusy(null); }
  }

  async function reloadContent() {
    if (lock.current || (dirty && !window.confirm("Încarci ultima versiune publicată? Modificările tale nesalvate din această pagină vor fi pierdute."))) return;
    lock.current = true;
    setBusy("Se încarcă ultima versiune…");
    setError("");
    try {
      const snapshot = await request<ContentSnapshot>("/api/admin/content");
      setContent(snapshot.content); setRevision(snapshot.revision); setDirty(false); setConflict(false);
      setNotice("Ai încărcat ultima versiune publicată.");
    } catch (cause) { reportError(cause); }
    finally { lock.current = false; setBusy(null); }
  }

  async function publish() {
    if (lock.current || !content || !dirty || !user) return;
    lock.current = true;
    setBusy("Se publică modificările…"); setError(""); setNotice("");
    try {
      const snapshot = await request<ContentSnapshot>("/api/admin/content", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ content, revision }) });
      setContent(snapshot.content); setRevision(snapshot.revision); setDirty(false); setConflict(false);
      setNotice("Modificările au fost publicate. Sunt vizibile pe site.");
    } catch (cause) {
      if (cause instanceof RequestError && cause.status === 409) {
        setConflict(true);
        setError("Conținutul a fost publicat din altă pagină. Modificările tale sunt păstrate aici. Copiază textele pe care vrei să le păstrezi, apoi încarcă ultima versiune.");
      } else reportError(cause);
    } finally { lock.current = false; setBusy(null); }
  }

  async function upload(files: File[], append: (image: GalleryImage) => void) {
    if (lock.current || !user) return;
    if (files.length > 8) { setError("Poți adăuga maximum 8 fotografii o dată. Alege un grup mai mic."); return; }
    lock.current = true;
    setError(""); setNotice("");
    let completed = 0;
    try {
      for (const [index, file] of files.entries()) {
        setBusy(`Se optimizează fotografia ${index + 1} din ${files.length}…`);
        const prepared = await prepareImage(file);
        const form = new FormData(); form.append("file", prepared);
        setBusy(`Se încarcă fotografia ${index + 1} din ${files.length}…`);
        const image = await request<GalleryImage>("/api/admin/upload", { method: "POST", body: form });
        append(image);
        completed++;
      }
      setNotice(`${completed === 1 ? "Fotografia a fost adăugată" : `${completed} fotografii au fost adăugate`}. Apasă „Publică modificările” pentru a actualiza site-ul.`);
    } catch (cause) {
      reportError(cause);
      if (completed) setNotice(`${completed} fotografii au fost încărcate și sunt păstrate în editor. Restul nu au fost adăugate.`);
    } finally { lock.current = false; setBusy(null); }
  }

  function updateComponent(id: string, changes: Partial<DroneComponent>) {
    edit((current) => ({ ...current, components: current.components.map((item) => item.id === id ? { ...item, ...changes } : item) }));
  }
  function updateStep(id: string, changes: Partial<ConstructionStep>) {
    edit((current) => ({ ...current, steps: current.steps.map((item) => item.id === id ? { ...item, ...changes } : item) }));
  }
  function updateCode(id: string, changes: Partial<CodeFile>) {
    edit((current) => ({ ...current, codeFiles: current.codeFiles.map((item) => item.id === id ? { ...item, ...changes } : item) }));
  }
  function removeItem(key: "components" | "steps" | "codeFiles" | "videos", id: string, noun: string) {
    if (window.confirm(`Elimini ${noun}? Schimbarea devine publică după salvare.`)) edit((current) => ({ ...current, [key]: current[key].filter((item) => item.id !== id) }));
  }

  function updateVideo(id: string, changes: Partial<DroneVideo>) {
    edit((current) => ({ ...current, videos: current.videos.map(item => item.id === id ? { ...item, ...changes } : item) }));
  }

  async function addVideo(file: File) {
    if (lock.current || !user || !content) return;
    if (content.videos.length >= MAX_VIDEOS) { setError(`Poți publica maximum ${MAX_VIDEOS} filmări.`); return; }
    lock.current = true;
    const controller = new AbortController();
    videoAbort.current = controller;
    setError(""); setNotice(""); setBusy("Se pregătește filmarea…"); setVideoProgress(0);
    try {
      await checkVideo(file);
      const ticket = await request<VideoUploadTicket>("/api/admin/video-upload", {
        method: "POST", headers: { "Content-Type": "application/json" }, signal: controller.signal,
        body: JSON.stringify({ name: file.name, type: file.type, size: file.size }),
      });
      setBusy("Se încarcă filmarea… Păstrează pagina deschisă.");
      await uploadVideo(file, ticket, controller.signal, setVideoProgress);
      const uploadedVideo = { ...ticket.video };
      let previewUrl: string | undefined;
      try {
        setBusy("Se pregătește imaginea de previzualizare…");
        previewUrl = URL.createObjectURL(file);
        const poster = await createVideoPoster(previewUrl, controller.signal);
        const form = new FormData();
        form.append("file", poster, `video-poster.${poster.type === "image/webp" ? "webp" : "png"}`);
        const image = await request<GalleryImage>("/api/admin/upload", { method: "POST", body: form, signal: controller.signal });
        uploadedVideo.posterSrc = image.src;
      } catch {
        // A missing preview must not discard a successfully uploaded film.
        // Older/unsupported clips still use the public player's preview fallback.
      } finally { if (previewUrl) URL.revokeObjectURL(previewUrl); }
      if (controller.signal.aborted) throw new DOMException("Încărcare anulată", "AbortError");
      edit(current => ({ ...current, videos: [...current.videos, uploadedVideo] }));
      setNotice("Filmarea a fost încărcată. Completează titlul și descrierea, apoi apasă „Publică modificările”.");
    } catch (cause) {
      if (controller.signal.aborted) setNotice("Încărcarea a fost anulată. Filmarea nu a fost adăugată în pagină.");
      else reportError(cause);
    } finally { lock.current = false; videoAbort.current = null; setBusy(null); setVideoProgress(null); }
  }

  async function importCode(id: string, file: File) {
    if (lock.current) return;
    if (!/\.(ino|cpp|h|hpp|c|py|txt)$/i.test(file.name)) { setError("Alege un fișier .ino, .cpp, .c, .h, .hpp, .py sau .txt."); return; }
    if (file.size > 100 * 1024) { setError("Fișierul de cod poate avea maximum 100 KB. Împarte fișierele mai mari în secțiuni."); return; }
    const existing = content?.codeFiles.find((item) => item.id === id);
    if (existing?.content && !window.confirm("Înlocuiești codul din acest card cu fișierul selectat?")) return;
    lock.current = true; setBusy("Se citește fișierul de cod…"); setError("");
    try {
      const text = await file.text();
      if (text.includes("\0")) throw new Error("Fișierul pare să fie binar. Alege un fișier de cod în format text.");
      updateCode(id, { filename: file.name, content: text, language: /\.py$/i.test(file.name) ? "python" : /\.txt$/i.test(file.name) ? "text" : /\.c$/i.test(file.name) ? "c" : "cpp" });
    } catch (cause) { setError(getError(cause)); }
    finally { lock.current = false; setBusy(null); }
  }

  if (loading) return <section className="admin-entry" aria-live="polite"><span className="admin-kicker">ESP32_DRONE / ADMIN</span><h1>Se deschide atelierul…</h1><p className="admin-intro">Verificăm sesiunea ta.</p></section>;

  const disabled = !!busy || !user;
  return (
    <>
      <div className="admin-feedback" aria-live="polite" aria-atomic="true">
        {error && <div className="admin-message admin-message-error" role="alert">{error}</div>}
        {notice && <div className="admin-message admin-message-success">{notice}</div>}
        {busy && <div className="admin-message admin-message-progress" role="status"><span className="admin-progress-mark" aria-hidden="true" />{busy}</div>}
      </div>
      {videoProgress !== null && <div className="admin-video-progress"><label>Încărcare video: {videoProgress}%<progress max={100} value={videoProgress} /></label><button type="button" className="admin-button" onClick={() => videoAbort.current?.abort()}>Anulează încărcarea</button></div>}
      {!user && <LoginForm pending={!!busy} onLogin={login} reauth={!!content} />}
      {user && !content && <section className="admin-entry"><h1>Conținutul nu a fost încărcat.</h1><p className="admin-intro">Ești autentificat ca {user}. Poți reîncerca fără să pierzi sesiunea.</p><button className="admin-button admin-button-primary" disabled={disabled} onClick={() => void reloadContent()}>Reîncearcă</button><button className="admin-button admin-button-quiet" disabled={disabled} onClick={() => void logout()}>Deconectare</button></section>}
      {content && <div className="admin-workspace">
        <div className="admin-title-row">
          <div><span className="admin-kicker">JURNAL DE CONSTRUCȚIE / ADMIN</span><h1>Din atelier, pe site.</h1><p className="admin-intro">Adaugă ce ai construit. Documentează ce ai învățat.</p></div>
          <div className="admin-account"><span>{user || "Sesiune expirată"}</span><button className="admin-button admin-button-quiet" disabled={disabled} onClick={() => void logout()}>Deconectare</button></div>
        </div>
        <div className="admin-toolbar">
          <div className="admin-save-state"><span className={dirty ? "admin-dirty-dot" : "admin-saved-dot"} aria-hidden="true" /><strong>{dirty ? "Ai modificări nepublicate" : "Conținut sincronizat"}</strong><small>{dirty ? "Se păstrează în această pagină până publici." : `Versiunea ${revision} · fotografii și documentație`}</small></div>
          <button className="admin-button admin-button-primary" disabled={disabled || !dirty || conflict} onClick={() => void publish()}>{busy ? "Operațiune în curs…" : "Publică modificările"}<span aria-hidden="true">↗</span></button>
        </div>
        {conflict && <div className="admin-conflict"><p>O versiune mai nouă este deja publicată. Încărcarea ei va înlocui modificările locale după confirmare.</p><button className="admin-button" disabled={disabled} onClick={() => void reloadContent()}>Încarcă ultima versiune</button></div>}
        <div className="admin-nav" aria-label="Secțiuni de administrare">
          {TABS.map((item) => <button type="button" className={tab === item.id ? "is-active" : ""} key={item.id} aria-current={tab === item.id ? "page" : undefined} onClick={() => setTab(item.id)}><span>{item.number}</span>{item.label}<small>{content[item.id].length}</small></button>)}
        </div>
        <fieldset disabled={disabled} className="admin-editor" aria-busy={!!busy}>
          <legend className="admin-visually-hidden">Editează {TABS.find((item) => item.id === tab)?.label}</legend>
          {tab === "gallery" && <div>
            <SectionIntro title="Drona, din toate unghiurile." description="Galeria proiectului și fotografia principală care întâmpină vizitatorii." />
            <ImagesEditor label="Fotografii ale dronei" images={content.gallery} disabled={disabled} heroImageId={content.heroImageId}
              onHeroChange={(id) => edit((current) => ({ ...current, heroImageId: id }))}
              onChange={(images) => edit((current) => ({ ...current, gallery: images, heroImageId: images.some((image) => image.id === current.heroImageId) ? current.heroImageId : null }))}
              onUpload={(files) => void upload(files, (image) => edit((current) => ({ ...current, gallery: [...current.gallery, image] })))} />
          </div>}
          {tab === "components" && <div>
            <SectionIntro title="Fiecare piesă are un rol." description="Documentează componentele folosite, specificațiile și fotografiile montajului." />
            <div className="admin-card-list">{content.components.map((component, index) => <details className="admin-item-card" key={component.id} open={undefined}>
              <summary><span className="admin-item-number">{String(index + 1).padStart(2, "0")}</span><span><strong>{component.name || "Componentă nouă"}</strong><small>{component.value || "Completează modelul și specificațiile"}</small></span><span className="admin-expand" aria-hidden="true">＋</span></summary>
              <div className="admin-card-body"><div className="admin-field-grid"><Field label="Denumirea componentei" value={component.name} maxLength={120} onChange={(name) => updateComponent(component.id, { name })} /><Field label="Model / specificație" value={component.value} maxLength={250} onChange={(value) => updateComponent(component.id, { value })} /></div>
                <Field label="Detalii și rol în proiect" value={component.detail} maxLength={2000} multiline onChange={(detail) => updateComponent(component.id, { detail })} />
                <label className="admin-check"><input type="checkbox" checked={component.confirmed} onChange={(event) => updateComponent(component.id, { confirmed: event.target.checked })} /><span>Componentă confirmată în montaj</span></label>
                <ImagesEditor label={`Fotografii: ${component.name || "componentă"}`} images={component.images} disabled={disabled} onChange={(images) => updateComponent(component.id, { images })} onUpload={(files) => void upload(files, (image) => edit((current) => ({ ...current, components: current.components.map((item) => item.id === component.id ? { ...item, images: [...item.images, image] } : item) })))} />
                <button className="admin-button admin-button-danger" onClick={() => removeItem("components", component.id, "componenta și fotografiile ei din listă")}>Elimină componenta</button>
              </div>
            </details>)}</div>
            <button className="admin-button admin-add-button" onClick={() => edit((current) => ({ ...current, components: [...current.components, { id: newId("component"), name: "Componentă nouă", value: "De completat", detail: "", confirmed: false, images: [] }] }))}><span aria-hidden="true">＋</span> Adaugă o componentă</button>
          </div>}
          {tab === "steps" && <div>
            <SectionIntro title="Construcția, pas cu pas." description="Fotografii, documentație și provocări, în ordinea în care ai construit drona." />
            <div className="admin-card-list">{content.steps.map((step, index) => <details className="admin-item-card" key={step.id}>
              <summary><span className="admin-item-number">{String(index + 1).padStart(2, "0")}</span><span><strong>{step.title || "Etapă nouă"}</strong><small>{step.category || "Documentație în lucru"}</small></span><span className="admin-expand" aria-hidden="true">＋</span></summary>
              <div className="admin-card-body"><div className="admin-field-grid"><Field label="Titlul etapei" value={step.title} maxLength={200} onChange={(title) => updateStep(step.id, { title })} /><Field label="Categorie" value={step.category} maxLength={120} onChange={(category) => updateStep(step.id, { category })} /></div>
                <label className="admin-field"><span>Stadiu</span><select value={step.status} onChange={(event) => updateStep(step.id, { status: event.target.value as ConstructionStep["status"] })}><option value="documented">Documentat</option><option value="testing">În testare</option><option value="planned">Planificat</option></select></label>
                <Field label="Rezumat" value={step.summary} maxLength={2000} multiline onChange={(summary) => updateStep(step.id, { summary })} />
                <div className="admin-paragraphs"><div className="admin-subheading"><h3>Documentație detaliată</h3><p>Fiecare câmp devine un paragraf pe site.</p></div>{step.documentation.map((paragraph, paragraphIndex) => <div className="admin-paragraph" key={paragraphIndex}><Field label={`Paragraful ${paragraphIndex + 1}`} multiline value={paragraph} maxLength={10000} onChange={(value) => updateStep(step.id, { documentation: step.documentation.map((item, i) => i === paragraphIndex ? value : item) })} /><button className="admin-button admin-button-quiet" aria-label={`Elimină paragraful ${paragraphIndex + 1}`} onClick={() => { if (!paragraph || window.confirm("Elimini acest paragraf?")) updateStep(step.id, { documentation: step.documentation.filter((_, i) => i !== paragraphIndex) }); }}>Elimină paragraful</button></div>)}<button className="admin-button" onClick={() => updateStep(step.id, { documentation: [...step.documentation, ""] })}>＋ Adaugă paragraf</button></div>
                <Field label="Provocarea întâmpinată" value={step.challenge} maxLength={3000} multiline onChange={(challenge) => updateStep(step.id, { challenge })} />
                <Field label="Ce urmează să documentezi" value={step.nextToDocument} maxLength={3000} multiline onChange={(nextToDocument) => updateStep(step.id, { nextToDocument })} />
                <Field label="Descrierea zonei de imagini" value={step.imageCaption} maxLength={500} onChange={(imageCaption) => updateStep(step.id, { imageCaption })} />
                <ImagesEditor label={`Fotografii pentru etapa ${index + 1}`} images={step.images} disabled={disabled} onChange={(images) => updateStep(step.id, { images })} onUpload={(files) => void upload(files, (image) => edit((current) => ({ ...current, steps: current.steps.map((item) => item.id === step.id ? { ...item, images: [...item.images, image] } : item) })))} />
                <div className="admin-item-actions"><button className="admin-button" disabled={disabled || index === 0} onClick={() => edit((current) => { const steps = [...current.steps]; [steps[index - 1], steps[index]] = [steps[index], steps[index - 1]]; return { ...current, steps }; })}>↑ Mută mai sus</button><button className="admin-button" disabled={disabled || index === content.steps.length - 1} onClick={() => edit((current) => { const steps = [...current.steps]; [steps[index], steps[index + 1]] = [steps[index + 1], steps[index]]; return { ...current, steps }; })}>↓ Mută mai jos</button><button className="admin-button admin-button-danger" onClick={() => removeItem("steps", step.id, "etapa și fotografiile ei din listă")}>Elimină etapa</button></div>
              </div>
            </details>)}</div>
            <button className="admin-button admin-add-button" onClick={() => edit((current) => ({ ...current, steps: [...current.steps, { id: newId("step"), title: "Etapă nouă", category: "CONSTRUCȚIE", summary: "", status: "planned", documentation: [""], imageCaption: "", challenge: "", nextToDocument: "", images: [] }] }))}><span aria-hidden="true">＋</span> Adaugă o etapă</button>
          </div>}
          {tab === "videos" && <div>
            <SectionIntro title="Filmările cu drona." description="Încarcă videoclipuri cu pilotarea și testele de zbor. Ele apar în pagina Video după publicare." />
            <label className="admin-field"><span>Adaugă o filmare</span><input type="file" accept="video/mp4,video/webm,.mp4,.webm" disabled={disabled || content.videos.length >= MAX_VIDEOS} onChange={event => { const file = event.currentTarget.files?.[0]; event.currentTarget.value = ""; if (file) void addVideo(file); }} /><small>MP4 sau WebM, maximum 50 MB per filmare. Recomandat: MP4, H.264/AAC, 1080p. Maximum {MAX_VIDEOS} filmări.</small></label>
            {!content.videos.length && <div className="admin-empty-state"><h3>Prima filmare cu drona.</h3><p>Alege un fișier de pe telefon sau calculator, apoi adaugă titlul și explicațiile.</p></div>}
            <div className="admin-card-list">{content.videos.map((video, index) => <details className="admin-item-card" key={video.id}>
              <summary><span className="admin-item-number">{String(index + 1).padStart(2, "0")}</span><span><strong>{video.title}</strong><small>{video.mimeType === "video/mp4" ? "MP4" : "WebM"}</small></span><span className="admin-expand" aria-hidden="true">＋</span></summary>
              <div className="admin-card-body"><VideoPlayer video={video} />
                <Field label="Titlul filmării" value={video.title} maxLength={200} onChange={title => updateVideo(video.id, { title })} />
                <Field label="Descrierea filmării" value={video.description} maxLength={6000} multiline onChange={description => updateVideo(video.id, { description })}><small>Descrie testul și ce se vede în filmare. Dacă vorbești în video, poți adăuga aici și transcrierea explicațiilor.</small></Field>
                <div className="admin-item-actions"><button className="admin-button" disabled={disabled || index === 0} onClick={() => edit(current => { const videos = [...current.videos]; [videos[index - 1], videos[index]] = [videos[index], videos[index - 1]]; return { ...current, videos }; })}>↑ Mută mai sus</button><button className="admin-button" disabled={disabled || index === content.videos.length - 1} onClick={() => edit(current => { const videos = [...current.videos]; [videos[index], videos[index + 1]] = [videos[index + 1], videos[index]]; return { ...current, videos }; })}>↓ Mută mai jos</button><button className="admin-button admin-button-danger" onClick={() => removeItem("videos", video.id, "filmarea din pagină")}>Elimină filmarea</button></div>
              </div>
            </details>)}</div>
          </div>}
          {tab === "codeFiles" && <div>
            <SectionIntro title="Codul din spatele zborului." description="Publică fișiere și explicații. Codul este afișat ca text și nu este executat de site." />
            <Field label="Link extern către firmware (opțional, https://…)" value={content.firmwareUrl || ""} maxLength={2048} onChange={(firmwareUrl) => edit(current => ({...current, firmwareUrl: firmwareUrl || null}))}><small>Poți trimite vizitatorii către un repository separat sau o pagină cu firmware-ul dronei. Repository-ul acestui site rămâne separat.</small></Field>
            {content.codeFiles.length === 0 && <div className="admin-empty-state"><span className="admin-code-symbol" aria-hidden="true">&lt;/&gt;</span><h3>Primul fișier începe aici.</h3><p>Adaugă firmware-ul, configurarea senzorilor sau un exemplu de algoritm, împreună cu explicațiile tale.</p></div>}
            <div className="admin-card-list">{content.codeFiles.map((file, index) => <details className="admin-item-card" key={file.id}>
              <summary><span className="admin-item-number">{String(index + 1).padStart(2, "0")}</span><span><strong>{file.title || "Fișier nou"}</strong><small>{file.filename}</small></span><span className="admin-expand" aria-hidden="true">＋</span></summary>
              <div className="admin-card-body"><div className="admin-field-grid"><Field label="Titlu" value={file.title} maxLength={200} onChange={(title) => updateCode(file.id, { title })} /><Field label="Numele fișierului" value={file.filename} maxLength={120} onChange={(filename) => updateCode(file.id, { filename })} /></div>
                <label className="admin-field"><span>Limbaj</span><select value={file.language} onChange={(event) => updateCode(file.id, { language: event.target.value as CodeFile["language"] })}><option value="cpp">C++ / Arduino</option><option value="c">C</option><option value="python">Python</option><option value="text">Text simplu</option></select></label>
                <Field label="Ce face acest cod" value={file.description} maxLength={3000} multiline onChange={(description) => updateCode(file.id, { description })} />
                <label className="admin-field admin-code-input"><span>Cod sursă</span><textarea value={file.content} rows={18} maxLength={100000} autoCapitalize="off" autoCorrect="off" spellCheck={false} onChange={(event) => updateCode(file.id, { content: event.target.value })} /><small>{file.content.length.toLocaleString("ro-RO")} / 100.000 caractere</small></label>
                <label className="admin-field"><span>Importă dintr-un fișier local</span><input type="file" accept=".ino,.cpp,.c,.h,.hpp,.py,.txt" onChange={(event) => { const selected = event.currentTarget.files?.[0]; event.currentTarget.value = ""; if (selected) void importCode(file.id, selected); }} /><small>Maximum 100 KB. Fișierul completează câmpul de cod; publicarea se face când salvezi.</small></label>
                <button className="admin-button admin-button-danger" onClick={() => removeItem("codeFiles", file.id, "fișierul de cod din listă")}>Elimină fișierul</button>
              </div>
            </details>)}</div>
            <button className="admin-button admin-add-button" onClick={() => edit((current) => ({ ...current, codeFiles: [...current.codeFiles, { id: newId("code"), title: "Fișier nou", filename: "firmware.ino", language: "cpp", description: "", content: "" }] }))}><span aria-hidden="true">＋</span> Adaugă un fișier de cod</button>
          </div>}
        </fieldset>
        <p className="admin-footer-note">Publicarea actualizează site-ul. Fotografiile sunt optimizate înainte de încărcare; textele și codul rămân editabile.</p>
      </div>}
    </>
  );
}

function LoginForm({ pending, onLogin, reauth }: { pending: boolean; onLogin: (email: string, password: string) => Promise<void>; reauth: boolean }) {
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const data = new FormData(form);
    await onLogin(String(data.get("email") || "").trim(), String(data.get("password") || ""));
    const passwordInput = form.elements.namedItem("password");
    if (passwordInput instanceof HTMLInputElement) passwordInput.value = "";
  }
  return <section className={`admin-entry admin-login${reauth ? " admin-reauth" : ""}`} aria-labelledby="login-title"><span className="admin-kicker">ACCES RESTRICȚIONAT / AUTOR</span><h1 id="login-title">{reauth ? "Continuă de unde ai rămas." : "Bine ai revenit în atelier."}</h1><p className="admin-intro">Autentifică-te pentru a adăuga fotografii și a actualiza documentația proiectului.</p><form onSubmit={(event) => void submit(event)}><fieldset disabled={pending}><legend className="admin-visually-hidden">Date de autentificare</legend><label className="admin-field"><span>Adresă de e-mail</span><input name="email" type="email" autoComplete="username" required placeholder="Adresa contului de administrator" /></label><label className="admin-field"><span>Parolă</span><input name="password" type="password" autoComplete="current-password" required minLength={6} /></label><button className="admin-button admin-button-primary" type="submit">{pending ? "Autentificare…" : "Intră în administrare"}<span aria-hidden="true">↗</span></button></fieldset></form><p className="admin-login-note">Acces disponibil doar pentru contul de administrator configurat.</p></section>;
}

function SectionIntro({ title, description }: { title: string; description: string }) {
  return <div className="admin-section-intro"><h2>{title}</h2><p>{description}</p></div>;
}

function Field({ label, value, onChange, multiline, maxLength, children }: { label: string; value: string; onChange: (value: string) => void; multiline?: boolean; maxLength?: number; children?: ReactNode }) {
  return <label className="admin-field"><span>{label}</span>{multiline ? <textarea rows={4} value={value} maxLength={maxLength} onChange={(event) => onChange(event.target.value)} /> : <input value={value} maxLength={maxLength} onChange={(event) => onChange(event.target.value)} />}{children}</label>;
}
