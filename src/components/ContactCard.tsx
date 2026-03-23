import { motion } from "framer-motion";
import { User } from "lucide-react";

interface ContactCardProps {
  name: string;
  title?: string | null;
  imageUrl?: string | null;
  brandColor?: string;
  label?: string;
}

export function ContactCard({
  name,
  title,
  imageUrl,
  brandColor = "#3B82F6",
  label = "Ihr Ansprechpartner",
}: ContactCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.3 }}
      className="bg-white/80 backdrop-blur-sm rounded-2xl border-0 shadow-xl overflow-hidden mb-6"
    >
      <div
        className="h-1.5"
        style={{ background: `linear-gradient(135deg, ${brandColor}, ${brandColor}99)` }}
      />
      <div className="p-5 flex items-center gap-4">
        <div
          className="h-14 w-14 rounded-xl shrink-0 flex items-center justify-center overflow-hidden"
          style={{ backgroundColor: `${brandColor}12` }}
        >
          {imageUrl ? (
            <img
              src={imageUrl}
              alt={name}
              className="h-full w-full object-cover"
            />
          ) : (
            <User className="h-6 w-6" style={{ color: brandColor }} />
          )}
        </div>
        <div className="min-w-0">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-0.5">
            {label}
          </p>
          <p className="font-semibold text-sm truncate">{name}</p>
          {title && (
            <p className="text-xs text-muted-foreground truncate">{title}</p>
          )}
        </div>
      </div>
    </motion.div>
  );
}
