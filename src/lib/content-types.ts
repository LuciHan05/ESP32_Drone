import type { ProjectStep } from "@/data/project";

export type GalleryImage = {
  id: string;
  src: string;
  alt: string;
  caption: string;
};

export type DroneComponent = {
  id: string;
  name: string;
  value: string;
  detail: string;
  confirmed: boolean;
  images: GalleryImage[];
};

export type ConstructionStep = ProjectStep & { images: GalleryImage[] };

export type CodeFile = {
  id: string;
  title: string;
  filename: string;
  language: "cpp" | "c" | "python" | "text";
  description: string;
  content: string;
};

export type SiteContent = {
  videos: DroneVideo[];
  gallery: GalleryImage[];
  heroImageId: string | null;
  components: DroneComponent[];
  steps: ConstructionStep[];
  codeFiles: CodeFile[];
  firmwareUrl: string | null;
};

export type ContentSnapshot = { content: SiteContent; revision: number };

export type DroneVideo = {
  id: string;
  src: string;
  title: string;
  description: string;
  mimeType: "video/mp4" | "video/webm";
};

export type VideoUploadTicket = {
  endpoint: string;
  token: string;
  path: string;
  video: DroneVideo;
};
