import { pageMetadata } from "../../lib/seo";

export const metadata = pageMetadata("/tezave");

export default function SeoLayout({ children }: { children: React.ReactNode }) {
  return children;
}
