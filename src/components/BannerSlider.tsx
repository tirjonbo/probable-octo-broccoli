"use client";
import Link from "next/link";
import { useEffect, useState } from "react";

export type SlideBanner = { id: string; title: string; text: string; button_label: string; link: string; image: string | null; color: string };

export function BannerSlider({ banners }: { banners: SlideBanner[] }) {
  const [i, setI] = useState(0);
  const [paused, setPaused] = useState(false);
  useEffect(() => {
    if (banners.length < 2 || paused) return;
    const t = setInterval(() => setI((x) => (x + 1) % banners.length), 6000);
    return () => clearInterval(t);
  }, [banners.length, paused]);
  if (banners.length === 0) return null;
  const b = banners[i];
  return (
    <section className="container" style={{ marginTop: 24 }} onMouseEnter={() => setPaused(true)} onMouseLeave={() => setPaused(false)}>
      <div className="banner" style={{ background: b.color }}>
        <div className="banner-text">
          <h2 style={{ margin: 0 }}>{b.title}</h2>
          {b.text && <p className="muted" style={{ margin: "8px 0 0" }}>{b.text}</p>}
          {b.button_label && b.link && (
            <Link href={b.link} className="btn" style={{ marginTop: 16 }}>
              {b.button_label}
            </Link>
          )}
        </div>
        {b.image && (
          // eslint-disable-next-line @next/next/no-img-element
          <img className="banner-img" src={`/api/media/${b.image}`} alt="" />
        )}
      </div>
      {banners.length > 1 && (
        <div className="banner-dots" role="tablist" aria-label="Баннеры">
          {banners.map((x, k) => (
            <button key={x.id} role="tab" aria-selected={k === i} aria-label={`Баннер ${k + 1}`} onClick={() => setI(k)} />
          ))}
        </div>
      )}
    </section>
  );
}
