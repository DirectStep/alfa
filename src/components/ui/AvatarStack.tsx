import Image from "next/image";

export function AvatarStack({
  avatars,
  size = 36,
}: {
  avatars: string[];
  size?: number;
}) {
  return (
    <div className="flex -space-x-3">
      {avatars.map((src) => (
        <span
          key={src}
          className="relative overflow-hidden rounded-full ring-2 ring-white"
          style={{ width: size, height: size }}
        >
          <Image src={src} alt="" fill className="object-cover" sizes={`${size}px`} />
        </span>
      ))}
    </div>
  );
}
