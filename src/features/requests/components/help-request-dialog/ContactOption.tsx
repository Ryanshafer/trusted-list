import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import type { AskContact } from "@/features/requests/components/HelpRequestDialog";

export function ContactOption({
  contact,
  onSelect,
}: {
  contact: AskContact;
  onSelect: () => void;
}) {
  return (
    <button
      type="button"
      className="flex w-full items-center gap-2 rounded-lg px-2 py-1 text-left transition-colors hover:bg-accent"
      onClick={onSelect}
    >
      <Avatar className="h-10 w-10 shrink-0 border-2 border-primary-foreground shadow-md">
        <AvatarImage src={contact.avatarUrl} alt={contact.name} className="object-cover" />
        <AvatarFallback className="text-sm font-semibold">
          {contact.name[0]?.toUpperCase()}
        </AvatarFallback>
      </Avatar>
      <div className="flex flex-col">
        <p className="text-base font-semibold text-card-foreground">{contact.name}</p>
        <p className="text-xs text-muted-foreground">{contact.role}</p>
      </div>
    </button>
  );
}
