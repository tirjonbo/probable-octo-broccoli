import type { Product } from "@/lib/catalog";

const svgStyle = { maxWidth: "100%", height: "auto" };

/** Иллюстрация продукта на SVG — без внешних картинок. */
export function ProductArt({ product, size = 220 }: { product: Pick<Product, "kind" | "color">; size?: number }) {
  const c = product.color;
  const w = size;
  const h = size * 0.75;
  if (product.kind === "calendar")
    return (
      <svg width={w} height={h} viewBox="0 0 200 150" style={svgStyle} aria-hidden>
        <rect x="60" y="18" width="80" height="120" rx="3" fill="#fff" stroke="#d8cfc4" />
        {Array.from({ length: 9 }, (_, i) => (
          <circle key={i} cx={68 + i * 8} cy="18" r="2.2" fill="#6b625b" />
        ))}
        <rect x="66" y="26" width="68" height="56" rx="2" fill={c} />
        <path d="M66 82 l22-24 16 14 12-10 18 20z" fill="#fff" opacity=".5" />
        {Array.from({ length: 20 }, (_, i) => (
          <rect key={i} x={68 + (i % 7) * 9.5} y={92 + Math.floor(i / 7) * 12} width="6" height="6" rx="1" fill="#e9e2d9" />
        ))}
      </svg>
    );
  if (product.kind === "cards")
    return (
      <svg width={w} height={h} viewBox="0 0 200 150" style={svgStyle} aria-hidden>
        <rect x="46" y="34" width="66" height="94" rx="6" fill="#fff" stroke="#d8cfc4" transform="rotate(-10 79 81)" />
        <rect x="70" y="26" width="66" height="94" rx="6" fill="#fff" stroke="#d8cfc4" transform="rotate(4 103 73)" />
        <rect x="76" y="32" width="54" height="60" rx="3" fill={c} transform="rotate(4 103 73)" />
        <rect x="90" y="30" width="66" height="94" rx="6" fill="#fff" stroke="#d8cfc4" transform="rotate(14 123 77)" />
        <rect x="96" y="36" width="54" height="60" rx="3" fill={c} opacity=".8" transform="rotate(14 123 77)" />
      </svg>
    );
  if (product.kind === "certificate")
    return (
      <svg width={w} height={h} viewBox="0 0 200 150" style={svgStyle} aria-hidden>
        <rect x="30" y="35" width="140" height="84" rx="8" fill={c} />
        <rect x="92" y="35" width="16" height="84" fill="#fff" opacity=".6" />
        <rect x="30" y="69" width="140" height="16" fill="#fff" opacity=".6" />
        <text x="100" y="108" textAnchor="middle" fontFamily="Georgia" fontSize="11" fill="#3b2723">подарок</text>
      </svg>
    );
  return (
    <svg width={w} height={h} viewBox="0 0 200 150" style={svgStyle} aria-hidden>
      <path d="M100 30 C80 22 45 22 22 28 V124 C45 118 80 118 100 126z" fill="#fff" stroke="#d8cfc4" />
      <path d="M100 30 C120 22 155 22 178 28 V124 C155 118 120 118 100 126z" fill="#fff" stroke="#d8cfc4" />
      <rect x="32" y="38" width="58" height="70" rx="2" fill={c} />
      <rect x="110" y="38" width="58" height="32" rx="2" fill={c} opacity=".75" />
      <rect x="110" y="75" width="27" height="33" rx="2" fill={c} opacity=".55" />
      <rect x="141" y="75" width="27" height="33" rx="2" fill={c} opacity=".9" />
      <line x1="100" y1="30" x2="100" y2="126" stroke="#d8cfc4" />
    </svg>
  );
}
