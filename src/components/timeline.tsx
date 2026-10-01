import type { ProjectStep } from "@/data/project";
import type { GalleryImage } from "@/lib/content-types";
import { Icon } from "./icons";
import { ProjectMedia } from "./project-media";
import { PhotoGrid } from "./photo-grid";

const statusLabels: Record<ProjectStep["status"], string> = { documented: "În documentație", testing: "În testare", planned: "Planificat" };

export function Timeline({ steps }: { steps: (ProjectStep & { images?: GalleryImage[] })[] }) {
  return <ol className="timeline">
    {steps.map((step, index) => <li key={step.id} className="timeline-item" id={`pas-${step.id}`}>
      <span className="timeline-number mono" aria-hidden="true">{String(index + 1).padStart(2, "0")}</span>
      <article className="step-card">
        <div className="step-heading"><span className="eyebrow">{step.category}</span><span className={`status status-${step.status}`}><span />{statusLabels[step.status]}</span></div>
        <div className="step-content">
          <div className="step-photos"><ProjectMedia media={step.images?.[0] ?? step.media} caption={step.images?.[0]?.caption || step.imageCaption} index={index} />{step.images && step.images.length > 1 && <PhotoGrid images={step.images.slice(1)} compact />}</div>
          <div className="step-copy">
            <h3>{step.title}</h3>
            <p className="step-summary">{step.summary}</p>
            <details className="step-details" open={index === 0}>
              <summary>Documentație & provocări <Icon name="plus" /></summary>
              <div className="step-detail-body">
                {step.documentation.map((paragraph, i) => <p key={i}>{paragraph}</p>)}
                <div className="challenge"><h4>Provocarea etapei</h4><p>{step.challenge}</p></div>
                <div className="to-document"><h4>De adăugat în jurnal</h4><p>{step.nextToDocument}</p></div>
                {step.resources && <ul className="resource-links">{step.resources.map((resource) => <li key={resource.href}><a href={resource.href}>{resource.label}<Icon name="diagonal" /></a></li>)}</ul>}
              </div>
            </details>
          </div>
        </div>
      </article>
    </li>)}
  </ol>;
}
