type AlfaLogoProps = {
  height?: number;
  className?: string;
};

/**
 * Фирменный знак Альфа-Банка: буква «А» с короткой нижней линией.
 * Оригинальный вектор, цвет наследуется через currentColor.
 */
export function AlfaLogo({ height = 30, className }: AlfaLogoProps) {
  const width = Math.round(height * (162 / 236));
  return (
    <svg
      height={height}
      width={width}
      viewBox="104 62 162 236"
      fill="currentColor"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden="true"
      focusable="false"
    >
      <rect x="114.28" y="258.75" width="141.44" height="29.39" />
      <path d="M210.89,94.41c-4.03-12.03-8.68-21.53-24.61-21.53s-20.87,9.46-25.12,21.53l-43.76,124.41h29.02l10.1-29.58h55.84l9.37,29.58h30.86l-41.71-124.41Zm-45.91,69.85l19.84-58.96h.73l18.74,58.96h-39.31Z" />
    </svg>
  );
}
