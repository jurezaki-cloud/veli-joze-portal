import { pageMetadata } from "../../lib/seo";

export const metadata = pageMetadata("/galerija");

export default function SeoLayout({ children }: { children: React.ReactNode }) {
  return children;
}
