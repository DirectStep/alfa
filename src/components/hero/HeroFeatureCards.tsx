import { heroFeatureCards } from "@/data/heroFeatureCards";
import { AvatarStack } from "@/components/ui/AvatarStack";
import { RoundArrowButton } from "@/components/ui/RoundArrowButton";

const variantClasses = {
  lavender: "bg-lavender text-text-primary",
  black: "bg-black text-white",
  red: "bg-alfa-red text-white",
} as const;

const communityAvatars = [
  "/assets/community/avatar-01.png",
  "/assets/community/avatar-02.png",
  "/assets/community/avatar-03.png",
];

export function HeroFeatureCards() {
  return (
    <ul className="grid grid-cols-2 gap-4 laptop:flex laptop:w-[230px] laptop:shrink-0 laptop:flex-col">
      {heroFeatureCards.map((card) => (
        <li
          key={card.id}
          className={`col-span-1 flex flex-col justify-between gap-6 rounded-[24px] p-5 transition-transform duration-300 first:col-span-2 hover:-translate-y-1 laptop:first:col-span-1 ${variantClasses[card.variant]}`}
        >
          <div>
            <p className="text-[15px] font-semibold leading-snug">
              {card.title}
            </p>
            {card.description && (
              <p className="mt-2 text-[13px] opacity-70 leading-snug">
                {card.description}
              </p>
            )}
          </div>

          <div className="flex items-center justify-between">
            {card.showAvatars ? (
              <AvatarStack avatars={communityAvatars} size={32} />
            ) : (
              <span />
            )}
            <RoundArrowButton
              size={36}
              className={
                card.variant === "black"
                  ? "bg-white text-black"
                  : "bg-black/10 text-current"
              }
            />
          </div>
        </li>
      ))}
    </ul>
  );
}
