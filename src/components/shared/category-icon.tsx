import {
  Banknote,
  Bus,
  Cat,
  Clapperboard,
  CreditCard,
  Gift,
  HeartPulse,
  Home,
  Landmark,
  PiggyBank,
  PlugZap,
  ShoppingCart,
  Tag,
  User,
  Utensils,
  type LucideIcon,
} from "lucide-react";

const ICONS: Record<string, LucideIcon> = {
  home: Home,
  "shopping-cart": ShoppingCart,
  cat: Cat,
  user: User,
  clapperboard: Clapperboard,
  "plug-zap": PlugZap,
  landmark: Landmark,
  "piggy-bank": PiggyBank,
  "credit-card": CreditCard,
  banknote: Banknote,
  tag: Tag,
  utensils: Utensils,
  bus: Bus,
  "heart-pulse": HeartPulse,
  gift: Gift,
};

export function CategoryIcon({ icon, className }: { icon: string | null; className?: string }) {
  const Icon = ICONS[icon ?? "tag"] ?? Tag;
  return <Icon className={className ?? "h-4 w-4"} />;
}
