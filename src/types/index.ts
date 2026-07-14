export type NavLink = {
  label: string;
  href: string;
};

export type HeroFeatureCard = {
  id: string;
  variant: "lavender" | "black" | "red";
  title: string;
  description: string;
  showAvatars?: boolean;
};
