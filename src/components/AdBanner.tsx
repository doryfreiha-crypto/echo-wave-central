import { useTranslation } from "react-i18next";

type AdSize = "leaderboard" | "banner" | "rectangle" | "skyscraper";

interface AdBannerProps {
  size?: AdSize;
  className?: string;
  slot?: string;
}

const sizeStyles: Record<AdSize, { width: string; height: string; label: string }> = {
  leaderboard: { width: "w-full max-w-[728px]", height: "h-[90px]", label: "728x90" },
  banner: { width: "w-full max-w-[468px]", height: "h-[60px]", label: "468x60" },
  rectangle: { width: "w-full max-w-[300px]", height: "h-[250px]", label: "300x250" },
  skyscraper: { width: "w-[160px]", height: "h-[600px]", label: "160x600" },
};

const AdBanner = ({ size = "banner", className = "", slot }: AdBannerProps) => {
  const { t } = useTranslation();
  const { width, height, label } = sizeStyles[size];

  // For production, replace this with actual ad network code (e.g., Google AdSense)
  // Example for Google AdSense:
  // <ins className="adsbygoogle"
  //      style={{ display: "block" }}
  //      data-ad-client="ca-pub-XXXXXXXXXXXXXXXX"
  //      data-ad-slot={slot}
  //      data-ad-format="auto"
  //      data-full-width-responsive="true"></ins>

  return (
    <div 
      className={`${width} ${height} ${className} bg-gradient-to-r from-muted/50 to-muted border border-dashed border-border rounded-lg flex items-center justify-center overflow-hidden`}
      data-ad-slot={slot}
    >
      <div className="text-center p-4">
        <div className="text-xs text-muted-foreground mb-1">{t("ads.advertisement", "Advertisement")}</div>
        <div className="text-lg font-semibold text-primary">{t("ads.yourAdHere", "Your Ad Here")}</div>
        <div className="text-xs text-muted-foreground mt-1">{label}</div>
      </div>
    </div>
  );
};

export default AdBanner;
