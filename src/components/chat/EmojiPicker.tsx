import { useState } from "react";
import { Smile, Search } from "lucide-react";
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";

interface EmojiCategory {
  name: string;
  icon: string;
  emojis: string[];
}

const EMOJI_CATEGORIES: EmojiCategory[] = [
  {
    name: "Smileys",
    icon: "😀",
    emojis: [
      "😀","😃","😄","😁","😆","😅","🤣","😂","🙂","😊","😇","🥰","😍","🤩","😘","😗","😚","😙","🥲","😋","😛","😜","🤪","😝","🤑","🤗","🤭","🤫","🤔","🫡","🤐","🤨","😐","😑","😶","🫥","😏","😒","🙄","😬","🤥","😌","😔","😪","🤤","😴","😷","🤒","🤕","🤢","🤮","🥴","😵","🤯","🥳","🤠","🥸","😎","🤓","🧐","😕","🫤","😟","🙁","😮","😯","😲","😳","🥺","🥹","😦","😧","😨","😰","😥","😢","😭","😱","😖","😣","😞","😓","😩","😫","🥱","😤","😡","😠","🤬","😈","👿","💀","☠","💩","🤡","👹","👺","👻","👽","👾","🤖",
    ],
  },
  {
    name: "Gesten",
    icon: "👍",
    emojis: [
      "👍","👎","👋","🤚","✋","🖐","🤏","✌","🤞","🫰","🤟","🤘","🤙","👈","👉","👆","👇","☝","👏","🙌","🫶","🤝","🙏","💪","🦾","🖕","✍","🤳","💅","🫵","👊","✊","🤛","🤜","🤌",
    ],
  },
  {
    name: "Herzen",
    icon: "❤️",
    emojis: [
      "❤️","🧡","💛","💚","💙","💜","🖤","🤍","🤎","💔","❤️‍🔥","❤️‍🩹","💕","💞","💓","💗","💖","💘","💝","💟","♥️","🫶",
    ],
  },
  {
    name: "Tiere",
    icon: "🐶",
    emojis: [
      "🐶","🐱","🐭","🐹","🐰","🦊","🐻","🐼","🐨","🐯","🦁","🐮","🐷","🐸","🐵","🐔","🐧","🐦","🐤","🦆","🦅","🦉","🦇","🐺","🐗","🐴","🦄","🐝","🐛","🦋","🐌","🐞","🐜","🪲","🐢","🐍","🦎","🦂","🐙","🦑","🦐","🦀","🐡","🐠","🐟","🐬","🐳","🐋","🦈","🐊",
    ],
  },
  {
    name: "Essen",
    icon: "🍕",
    emojis: [
      "🍏","🍎","🍐","🍊","🍋","🍌","🍉","🍇","🍓","🫐","🍈","🍒","🍑","🥭","🍍","🥥","🥝","🍅","🍆","🥑","🥦","🥬","🥒","🌶","🫑","🌽","🥕","🫒","🧄","🧅","🥔","🍠","🍕","🍔","🍟","🌭","🍿","🧂","🥚","🍳","🧈","🥞","🧇","🥓","🥩","🍗","🍖","🌮","🌯","🥗","🍝","🍜","🍲","🍛","🍣","🍱","🥟","🍤","🍙","🍚","🍘","🍥","🥮","🍢","🍡","🍧","🍨","🍦","🥧","🧁","🍰","🎂","🍮","🍭","🍬","🍫","🍿","🍩","🍪","☕","🍵","🧃","🥤","🍶","🍺","🍻","🥂","🍷","🍸","🍹","🧉",
    ],
  },
  {
    name: "Reisen",
    icon: "✈️",
    emojis: [
      "🚗","🚕","🚙","🚌","🚎","🏎","🚓","🚑","🚒","🚐","🛻","🚚","🚛","🚜","🏍","🛵","🚲","🛴","🚏","🛣","🛤","🛞","⛽","🚨","🚥","🚦","🛑","🚧","⚓","🛟","⛵","🚤","🛥","🛳","⛴","🚢","✈","🛩","🛫","🛬","🪂","💺","🚁","🚀","🛸","🏠","🏡","🏢","🏣","🏤","🏥","🏦","🏨","🏩","🏪","🏫","🏬","🏭","🏯","🏰","💒","🗼","🗽","⛪","🕌","🛕","🕍","⛩","🕋",
    ],
  },
  {
    name: "Objekte",
    icon: "💡",
    emojis: [
      "📱","💻","⌨","🖥","🖨","🖱","🖲","💽","💾","💿","📀","📷","📸","📹","🎥","📽","🎬","📺","📻","🎙","🎚","🎛","⏱","⏲","⏰","🕰","⌛","⏳","📡","🔋","🔌","💡","🔦","🕯","🧯","🛢","💸","💵","💴","💶","💷","🪙","💰","💳","🧮","⚖","🔧","🪛","🔨","⛏","🪚","🔩","⚙","🧱","⛓","🧲","🔫","💣","🧨","🪓","🔪","🗡","⚔","🛡","🔑","🗝","🚪","🪑","🛋","🛏","🪴","🧸","📦","📫","📬","📭","📮","📯","📜","📃","📄","📰","🗞","📑","🔖","🏷","✉","📧","📨","📩",
    ],
  },
  {
    name: "Symbole",
    icon: "⭐",
    emojis: [
      "❗","❓","❕","❔","‼","⁉","💯","🔥","⭐","💫","✨","🎉","🎊","🎈","🎁","🏆","🏅","🥇","🥈","🥉","⚽","🏀","🏈","⚾","🥎","🎾","🏐","🏉","🎱","🪀","🏓","🏸","🥅","⛳","🪁","🎯","🎣","🎽","🎿","🛷","🥌","🎮","🕹","🎲","🧩","♟","🎭","🎨","🎼","🎵","🎶","🎹","🥁","🪘","🎷","🎺","🪗","🎸","🎻","🪕","✅","❌","⭕","🚫","♻","✔","☑","➕","➖","➗","✖","💲","💱","©","®","™","🔴","🟠","🟡","🟢","🔵","🟣","⚫","⚪","🟤",
    ],
  },
];

interface EmojiPickerProps {
  onSelect: (emoji: string) => void;
}

export function EmojiPicker({ onSelect }: EmojiPickerProps) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [activeCategory, setActiveCategory] = useState(0);

  const filteredCategories = search.trim()
    ? EMOJI_CATEGORIES.map((cat) => ({
        ...cat,
        emojis: cat.emojis.filter((e) => e.includes(search)),
      })).filter((cat) => cat.emojis.length > 0)
    : [EMOJI_CATEGORIES[activeCategory]];

  const handleSelect = (emoji: string) => {
    onSelect(emoji);
    setOpen(false);
    setSearch("");
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          className="shrink-0 h-10 w-10 rounded-xl flex items-center justify-center bg-muted text-muted-foreground hover:text-foreground transition-colors"
          title="Emoji"
        >
          <Smile className="h-5 w-5" />
        </button>
      </PopoverTrigger>
      <PopoverContent
        side="top"
        align="start"
        className="w-80 p-0"
        onOpenAutoFocus={(e) => e.preventDefault()}
      >
        {/* Search */}
        <div className="flex items-center gap-2 px-3 pt-3 pb-2">
          <Search className="h-4 w-4 text-muted-foreground shrink-0" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Emoji suchen..."
            className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
          />
        </div>

        {/* Category tabs */}
        {!search.trim() && (
          <div className="flex gap-0.5 px-2 pb-1 border-b border-border">
            {EMOJI_CATEGORIES.map((cat, i) => (
              <button
                key={cat.name}
                onClick={() => setActiveCategory(i)}
                className={cn(
                  "flex-1 py-1.5 text-center text-base rounded-md transition-colors",
                  activeCategory === i
                    ? "bg-accent text-accent-foreground"
                    : "hover:bg-muted"
                )}
                title={cat.name}
              >
                {cat.icon}
              </button>
            ))}
          </div>
        )}

        {/* Emoji grid */}
        <ScrollArea className="h-52">
          <div className="p-2">
            {filteredCategories.map((cat) => (
              <div key={cat.name}>
                {search.trim() && (
                  <p className="text-xs text-muted-foreground mb-1 px-1">{cat.name}</p>
                )}
                <div className="grid grid-cols-8 gap-0.5">
                  {cat.emojis.map((emoji, j) => (
                    <button
                      key={`${emoji}-${j}`}
                      onClick={() => handleSelect(emoji)}
                      className="h-8 w-8 flex items-center justify-center rounded hover:bg-accent text-lg transition-colors"
                    >
                      {emoji}
                    </button>
                  ))}
                </div>
              </div>
            ))}
            {filteredCategories.length === 0 && (
              <p className="text-sm text-muted-foreground text-center py-6">Keine Emojis gefunden</p>
            )}
          </div>
        </ScrollArea>
      </PopoverContent>
    </Popover>
  );
}
