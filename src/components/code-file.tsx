"use client";

import { useState } from "react";
import type { CodeFile as Code } from "@/lib/content-types";

export function CodeFile({ file }: { file: Code }) {
  const [feedback, setFeedback] = useState("");
  async function copy() {
    try { await navigator.clipboard.writeText(file.content); setFeedback("Cod copiat."); }
    catch { setFeedback("Copierea nu este disponibilă. Poți selecta codul sau descărca fișierul."); }
  }
  function download() {
    const url = URL.createObjectURL(new Blob([file.content], { type: "text/plain;charset=utf-8" }));
    const link = document.createElement("a"); link.href = url; link.download = file.filename; link.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }
  return <article className="code-file" id={`cod-${file.id}`}>
    <div className="code-file-heading"><div><span className="eyebrow">{file.language.toUpperCase()}</span><h2>{file.title}</h2><p>{file.description}</p></div><div className="code-actions"><button type="button" onClick={copy}>Copiază codul</button><button type="button" onClick={download}>Descarcă fișierul ↓</button></div></div>
    <details className="code-disclosure" open><summary><span className="mono">{file.filename}</span><span>{file.content.split("\n").length} linii · Deschide / închide</span></summary><pre tabIndex={0} aria-label={`Cod sursă ${file.filename}`}><code>{file.content}</code></pre></details>
    <p className="copy-feedback" role="status">{feedback}</p>
  </article>;
}
