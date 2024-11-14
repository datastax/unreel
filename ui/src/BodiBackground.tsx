export function BodiBackground() {
  return (
    <picture className="absolute bottom-0 right-0 opacity-100 sm:opacity-10 pointer-events-none">
      <source srcSet="/bodi/home.avif" type="image/avif" />
      <source srcSet="/bodi/home.webp" type="image/webp" />
      <img alt="Bodi" src="/bodi/home.png" />
    </picture>
  );
}
