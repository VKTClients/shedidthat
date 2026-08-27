export type SiteMediaKey =
  | "brand.logo"
  | "homepage.hero"
  | "homepage.about"
  | "product.ocean-curls.blondie"
  | "product.ocean-curls.brownie"
  | "product.ocean-curls.goldie"
  | "product.ocean-curls.black"
  | "product.ocean-curls.ginger"
  | "product.ocean-curls.snowflake"
  | "product.crochet-afro.brownie"
  | "product.crochet-afro.black"
  | "product.crochet-afro.goldie"
  | "booking.cluster-lashes-1"
  | "booking.cluster-lashes-2";

export interface SiteMediaDefinition {
  key: SiteMediaKey;
  label: string;
  description: string;
  defaultUrl: string;
}

export const SITE_MEDIA_DEFINITIONS: SiteMediaDefinition[] = [
  { key: "brand.logo", label: "Website logo", description: "Header, footer, and browser preview", defaultUrl: "/images/logo.png" },
  { key: "homepage.hero", label: "Homepage hero", description: "Large image at the top of the homepage", defaultUrl: "/images/hero.jpg" },
  { key: "homepage.about", label: "Homepage about image", description: "Image in the About Us section", defaultUrl: "/images/blondehomepage.jpeg" },
  { key: "product.ocean-curls.blondie", label: "Ocean Curls Blondie", description: "Product card and colour gallery", defaultUrl: "/images/Ocean Curls Blondie.jpeg" },
  { key: "product.ocean-curls.brownie", label: "Ocean Curls Brownie", description: "Product card and colour gallery", defaultUrl: "/images/Ocean Curls Brownie.jpeg" },
  { key: "product.ocean-curls.goldie", label: "Ocean Curls Goldie", description: "Product card and colour gallery", defaultUrl: "/images/Ocean Curls Goldie.jpeg" },
  { key: "product.ocean-curls.black", label: "Ocean Curls Black", description: "Product card and colour gallery", defaultUrl: "/images/Ocean Curls Black.jpeg" },
  { key: "product.ocean-curls.ginger", label: "Ocean Curls Ginger", description: "Product card and colour gallery", defaultUrl: "/images/Ocean Curls Ginger.jpeg" },
  { key: "product.ocean-curls.snowflake", label: "Ocean Curls Snowflake", description: "Product card and colour gallery", defaultUrl: "/images/Ocean Curls Snowflake.png" },
  { key: "product.crochet-afro.brownie", label: "Brownie Afro", description: "Crochet Afro gallery image", defaultUrl: "/images/brownie.jpg" },
  { key: "product.crochet-afro.black", label: "Black Afro", description: "Crochet Afro gallery image", defaultUrl: "/images/black afro.jpg" },
  { key: "product.crochet-afro.goldie", label: "Goldie Afro", description: "Crochet Afro gallery image", defaultUrl: "/images/goldie.jpg" },
  { key: "booking.cluster-lashes-1", label: "Cluster lashes example 1", description: "Booking add-on image", defaultUrl: "/images/cluster-lashes-1.png" },
  { key: "booking.cluster-lashes-2", label: "Cluster lashes example 2", description: "Booking add-on image", defaultUrl: "/images/cluster-lashes-2.png" },
];

export const DEFAULT_SITE_MEDIA = Object.fromEntries(
  SITE_MEDIA_DEFINITIONS.map((item) => [item.key, item.defaultUrl])
) as Record<SiteMediaKey, string>;

