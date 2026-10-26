import { pageMetadata } from "../../lib/seo";

export const metadata = pageMetadata("/informacije");

export default function SeoLayout({ children }: { children: React.ReactNode }) {
  return children;
}
