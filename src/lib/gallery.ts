export type GalleryKey = "reviews" | "client-cam";

export const GALLERY_DEFINITIONS: Array<{ key: GalleryKey; label: string; description: string }> = [
  { key: "reviews", label: "Reviews", description: "Client feedback screenshots" },
  { key: "client-cam", label: "Client Cam", description: "Photos of clients wearing their hairstyles" },
];

