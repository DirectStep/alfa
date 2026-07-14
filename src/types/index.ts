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

export type SegmentOption = {
  id: string;
  label: string;
};

export type ScenarioStage = SegmentOption & {
  recommendation: string;
};

export type BenefitCard = {
  id: string;
  variant: "red" | "lavender" | "light-green";
  title: string;
  description: string;
  image: string;
};

export type ProcessStep = {
  id: string;
  label: string;
};
