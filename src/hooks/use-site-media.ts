"use client";

import { useEffect, useState } from "react";
import { DEFAULT_SITE_MEDIA, type SiteMediaKey } from "@/lib/site-media";

export function useSiteMedia() {
  const [media, setMedia] = useState<Record<SiteMediaKey, string>>(DEFAULT_SITE_MEDIA);

  useEffect(() => {
    fetch("/api/media", { cache: "no-store" })
      .then((response) => response.ok ? response.json() : null)
      .then((result) => {
        if (result?.media) setMedia((current) => ({ ...current, ...result.media }));
      })
      .catch(() => undefined);
  }, []);

  return media;
}

