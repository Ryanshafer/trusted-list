import * as React from "react";
import { Input } from "@/components/ui/input";
import { Popover, PopoverAnchor, PopoverContent } from "@/components/ui/popover";
import { ContactRound } from "lucide-react";
import type { AskContact } from "@/features/requests/components/HelpRequestDialog";
import { ContactOption } from "./ContactOption";

export function ContactSearchInput({
  placeholder,
  autoFocus,
  inputClassName,
  searchTerm,
  filteredContacts,
  onSearchChange,
  onSelect,
}: {
  placeholder: string;
  autoFocus?: boolean;
  inputClassName?: string;
  searchTerm: string;
  filteredContacts: AskContact[];
  onSearchChange: (value: string) => void;
  onSelect: (contact: AskContact) => void;
}) {
  const inputRef = React.useRef<HTMLInputElement | null>(null);

  React.useEffect(() => {
    if (autoFocus) inputRef.current?.focus({ preventScroll: true });
  }, [autoFocus]);

  return (
    <Popover open={Boolean(searchTerm && filteredContacts.length > 0)} modal={false}>
      <PopoverAnchor asChild>
        <div className="relative">
          <ContactRound className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            ref={inputRef}
            placeholder={placeholder}
            className={`rounded-full bg-background pl-9 shadow-none ${inputClassName ?? "border-border"}`}
            value={searchTerm}
            onChange={(e) => onSearchChange(e.target.value)}
          />
        </div>
      </PopoverAnchor>
      <PopoverContent
        className="w-[--radix-popover-trigger-width] p-3"
        align="start"
        side="bottom"
        onOpenAutoFocus={(e) => e.preventDefault()}
      >
        <div className="flex flex-col gap-4">
          {filteredContacts.slice(0, 5).map((contact) => (
            <ContactOption key={contact.id} contact={contact} onSelect={() => onSelect(contact)} />
          ))}
        </div>
      </PopoverContent>
    </Popover>
  );
}
