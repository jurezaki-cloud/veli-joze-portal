import { pageMetadata } from "../../lib/seo";

export const metadata = pageMetadata("/admin");

export default function SeoLayout({ children }: { children: React.ReactNode }) {
  return children;
}
