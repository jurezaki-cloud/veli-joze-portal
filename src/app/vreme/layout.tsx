import { pageMetadata } from "../../lib/seo";

export const metadata = pageMetadata("/vreme");

export default function SeoLayout({ children }: { children: React.ReactNode }) {
  return children;
}
