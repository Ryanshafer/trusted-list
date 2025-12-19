
import React, { useState } from "react";
import {
    MoreHorizontal,
    Bell,
    Flag,
    Clock,
    X,
    User,
    Briefcase,
    Users,
    Globe,
    BellPlus,
    Check,
    BellRing,
    EyeOff,
} from "lucide-react";

// Shadcn UI Imports
import {
    Card,
    CardHeader,
    CardTitle,
    CardDescription,
    CardContent,
    CardFooter,
} from "@/components/ui/card";
import {
    Avatar,
    AvatarImage,
    AvatarFallback,
} from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
    DropdownMenu,
    DropdownMenuTrigger,
    DropdownMenuContent,
    DropdownMenuItem,
} from "@/components/ui/dropdown-menu";
import {
    Dialog,
    DialogTrigger,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
} from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type RelationshipType = "direct" | "through-contact" | "skills-match";

export type HelpRequestCardProps = {
    name: string;
    avatarUrl?: string;
    relationshipType: RelationshipType;
    relationshipLabel: string; // e.g. "Direct connection", "Connected through Bryan"
    shortSummary: string;
    longDescription: string;
    reminderLabel?: string; // e.g. "Reminding you in 3 days"

    // Callbacks
    onHelp?: () => void;
    onOpenReminder?: () => void;
    onDismiss?: () => void;
    onFlag?: () => void;

    // Variant control
    variant?: "A" | "B" | "C" | "D" | "E" | "F" | "G";
};

// ---------------------------------------------------------------------------
// Sub-components & Helpers
// ---------------------------------------------------------------------------

/**
 * Returns a color/style class for the relationship badge/text based on type.
 */
function getRelationshipColor(type: RelationshipType): string {
    switch (type) {
        case "direct":
            return "bg-blue-100 text-blue-700 hover:bg-blue-100/80 dark:bg-blue-900/30 dark:text-blue-300";
        case "through-contact":
            return "bg-purple-100 text-purple-700 hover:bg-purple-100/80 dark:bg-purple-900/30 dark:text-purple-300";
        case "skills-match":
            return "bg-green-100 text-green-700 hover:bg-green-100/80 dark:bg-green-900/30 dark:text-green-300";
        default:
            return "bg-secondary text-secondary-foreground";
    }
}

function getInitials(name: string) {
    return name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .substring(0, 2)
        .toUpperCase();
}

// ---------------------------------------------------------------------------
// Main Component: HelpRequestCard
// ---------------------------------------------------------------------------

export function HelpRequestCard({
    name,
    avatarUrl,
    relationshipType,
    relationshipLabel,
    shortSummary,
    longDescription,
    reminderLabel,
    onHelp,
    onOpenReminder,
    onDismiss,
    onFlag,
    variant = "A",
}: HelpRequestCardProps) {
    const [isDialogOpen, setIsDialogOpen] = useState(false);

    // Common Elements to reuse across layouts

    const AvatarComponent = (
        <Avatar className="h-10 w-10 shrink-0 border border-border">
            <AvatarImage src={avatarUrl} alt={name} />
            <AvatarFallback>{getInitials(name)}</AvatarFallback>
        </Avatar>
    );

    const RelationshipBadge = (
        <Badge
            variant="secondary"
            className={`px-2 py-0.5 text-xs font-medium shadow-sm transition-colors ${getRelationshipColor(
                relationshipType
            )}`}
        >
            {relationshipLabel}
        </Badge>
    );

    const RelationshipText = (
        <span className="text-xs text-muted-foreground flex items-center gap-1">
            {relationshipType === "direct" && <User className="h-3 w-3" />}
            {relationshipType === "through-contact" && <Users className="h-3 w-3" />}
            {relationshipType === "skills-match" && <Briefcase className="h-3 w-3" />}
            {relationshipLabel}
        </span>
    );

    const MenuAction = (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground">
                    <MoreHorizontal className="h-4 w-4" />
                    <span className="sr-only">Open menu</span>
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={onDismiss}>
                    <EyeOff className="mr-2 h-4 w-4" /> Can't help with this
                </DropdownMenuItem>
                <DropdownMenuItem onClick={onFlag} className="text-destructive focus:text-destructive">
                    <Flag className="mr-2 h-4 w-4" /> Flag as inappropriate
                </DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>
    );

    const DialogTriggerButton = (
        <Button
            variant="ghost"
            size="sm"
            className="h-auto py-1 px-3 text-xs text-primary/80 hover:text-primary hover:bg-primary/10 rounded-full transition-colors"
            onClick={() => setIsDialogOpen(true)}
        >
            View details
        </Button>
    );

    const FullDetailsDialog = (
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <div className="flex items-center gap-3 mb-2">
                        <Avatar className="h-12 w-12">
                            <AvatarImage src={avatarUrl} />
                            <AvatarFallback>{getInitials(name)}</AvatarFallback>
                        </Avatar>
                        <div>
                            <DialogTitle className="text-xl">{name}</DialogTitle>
                            <div className="mt-1 flex flex-wrap gap-2">
                                {RelationshipBadge}
                            </div>
                        </div>
                    </div>
                    <DialogDescription className="text-base pt-2">
                        <span className="font-semibold text-foreground/80 block mb-2">{shortSummary}</span>
                        <span className="opacity-90 leading-relaxed">{longDescription}</span>
                    </DialogDescription>
                </DialogHeader>
                <div className="flex gap-2 justify-end mt-4">
                    <Button variant="outline" onClick={() => setIsDialogOpen(false)}>Close</Button>
                    <Button onClick={() => { onHelp?.(); setIsDialogOpen(false); }}>Help {name.split(" ")[0]}</Button>
                </div>
            </DialogContent>
        </Dialog>
    );

    const ReminderState = reminderLabel ? (
        <div className="flex items-center gap-1 text-xs font-medium text-amber-600 bg-amber-50 dark:bg-amber-900/20 dark:text-amber-400 px-2 py-1 rounded-sm">
            <Clock className="h-3 w-3" />
            {reminderLabel}
        </div>
    ) : null;

    // -------------------------------------------------------------------------
    // VARIANT A: Classic Vertical Stack
    // -------------------------------------------------------------------------
    if (variant === "A") {
        return (
            <>
                {FullDetailsDialog}
                <Card className="flex flex-col h-full overflow-hidden transition-all hover:shadow-md border-border/80">
                    <CardHeader className="flex flex-row items-center gap-3 pb-2 pt-5">
                        {AvatarComponent}
                        <div className="flex flex-col gap-0.5 flex-1 min-w-0">
                            <span className="font-semibold text-base truncate">{name}</span>
                            {RelationshipText}
                        </div>
                        <div className="-mt-2 -mr-2">{MenuAction}</div>
                    </CardHeader>

                    <CardContent className="flex-1 pb-2">
                        <p className="text-sm leading-relaxed text-muted-foreground">
                            {shortSummary} <span className="inline-block mx-1 text-muted-foreground/40">•</span> {DialogTriggerButton}
                        </p>
                    </CardContent>

                    <CardFooter className="flex flex-col gap-3 pt-2 pb-5">
                        {reminderLabel && <div className="w-full">{ReminderState}</div>}
                        <div className="flex w-full gap-2">
                            <Button onClick={onHelp} className="flex-1 font-semibold" size="sm">
                                Help {name.split(" ")[0]}
                            </Button>
                            <Button onClick={onOpenReminder} variant="secondary" size="sm" className="px-3">
                                Remind me
                            </Button>
                        </div>
                    </CardFooter>
                </Card>
            </>
        );
    }

    // -------------------------------------------------------------------------
    // VARIANT B: Emphasis on key "Ask" text
    // -------------------------------------------------------------------------
    if (variant === "B") {
        return (
            <>
                {FullDetailsDialog}
                <Card className="flex flex-col h-full border-border/60 hover:border-primary/20 transition-all hover:bg-accent/5">
                    <div className="p-4 flex flex-col gap-4 h-full">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                {AvatarComponent}
                                <div className="flex flex-col">
                                    <span className="font-semibold text-sm">{name}</span>
                                    <span className="text-[11px] text-muted-foreground">{relationshipLabel}</span>
                                </div>
                            </div>
                            {MenuAction}
                        </div>

                        <div className="flex-1">
                            <h4 className="text-md font-medium leading-snug text-foreground/90 mb-1">
                                {shortSummary}
                            </h4>
                            {DialogTriggerButton}
                        </div>

                        <div className="mt-auto space-y-3">
                            {ReminderState}
                            <div className="grid grid-cols-[1fr_auto] gap-2">
                                <Button onClick={onHelp} className="w-full">
                                    Help {name.split(" ")[0]}
                                </Button>
                                <Button onClick={onOpenReminder} variant="outline" size="icon" title="Remind me later" className="shrink-0">
                                    <Clock className="w-4 h-4" />
                                </Button>
                            </div>
                        </div>
                    </div>
                </Card>
            </>
        );
    }

    // -------------------------------------------------------------------------
    // VARIANT C: Emphasis on Relationship
    // -------------------------------------------------------------------------
    if (variant === "C") {
        return (
            <>
                {FullDetailsDialog}
                <Card className="flex flex-col h-full relative group">
                    <CardHeader className="pb-2">
                        <div className="flex items-start justify-between">
                            <div className="flex gap-3">
                                {AvatarComponent}
                                <div>
                                    <CardTitle className="text-base">{name}</CardTitle>
                                    <div className="mt-1">{RelationshipBadge}</div>
                                </div>
                            </div>
                            {MenuAction}
                        </div>
                    </CardHeader>
                    <CardContent className="pb-2 flex-1">
                        <div className="bg-muted/30 p-3 rounded-md text-sm text-foreground/80">
                            "{shortSummary}"
                            <div className="mt-1 text-right">
                                {DialogTriggerButton}
                            </div>
                        </div>
                    </CardContent>
                    <CardFooter className="pt-2 flex justify-between items-center">
                        {ReminderState ? ReminderState : <div className="text-xs text-muted-foreground">Ends in 2 days</div>}
                        <div className="flex gap-2">
                            <Button variant="ghost" size="sm" onClick={onOpenReminder} className="text-muted-foreground hover:text-foreground">Later</Button>
                            <Button size="sm" onClick={onHelp} className="px-5 shadow-sm">Help</Button>
                        </div>
                    </CardFooter>
                </Card>
            </>
        );
    }

    // -------------------------------------------------------------------------
    // VARIANT D: Compact
    // -------------------------------------------------------------------------
    if (variant === "D") {
        return (
            <>
                {FullDetailsDialog}
                <Card className="flex flex-col h-full bg-card/50">
                    <div className="px-4 pt-4 flex justify-between items-start">
                        <div className="flex items-center gap-2 mb-2">
                            <Avatar className="h-8 w-8">
                                <AvatarImage src={avatarUrl} />
                                <AvatarFallback className="text-xs">{getInitials(name)}</AvatarFallback>
                            </Avatar>
                            <span className="text-sm font-semibold">{name}</span>
                        </div>
                        {MenuAction}
                    </div>

                    <div className="px-4 pb-0 flex-1">
                        <p className="text-sm text-muted-foreground line-clamp-3 mb-1">
                            {shortSummary}
                        </p>
                        {DialogTriggerButton}
                    </div>

                    <div className="p-4 mt-auto">
                        {ReminderState && <div className="mb-2">{ReminderState}</div>}
                        <div className="flex flex-col gap-2">
                            <Button size="sm" className="w-full" onClick={onHelp}>Help {name}</Button>
                            <Button size="sm" variant="ghost" className="w-full h-7 text-muted-foreground" onClick={onOpenReminder}>Remind me later</Button>
                        </div>
                    </div>
                </Card>
            </>
        );
    }

    // -------------------------------------------------------------------------
    // VARIANT E: Minimal / Clean
    // -------------------------------------------------------------------------
    if (variant === "E") {
        return (
            <>
                {FullDetailsDialog}
                <Card className="flex flex-col h-full border-none shadow-sm bg-muted/20">
                    <CardHeader className="flex-row items-center gap-3 pb-3 space-y-0">
                        {AvatarComponent}
                        <div className="flex flex-col flex-1">
                            <span className="font-semibold text-sm text-foreground">{name}</span>
                            <span className="text-xs text-muted-foreground">{relationshipLabel}</span>
                        </div>
                        {MenuAction}
                    </CardHeader>
                    <Separator className="opacity-50" />
                    <CardContent className="pt-4 flex-1">
                        <p className="text-sm font-medium leading-relaxed">
                            {shortSummary}
                        </p>
                        <div className="mt-2">
                            {DialogTriggerButton}
                        </div>
                    </CardContent>
                    <CardFooter className="pt-0 flex items-center justify-between">
                        <Button variant="outline" size="sm" onClick={onOpenReminder} className="h-8 border-dashed text-muted-foreground">
                            Later
                        </Button>
                        <Button size="sm" onClick={onHelp} className="h-8">
                            Okay, sure
                        </Button>
                    </CardFooter>
                </Card>
            </>
        );
    }

    // -------------------------------------------------------------------------
    // VARIANT F: Quick Triage (Dismiss Upfront)
    // -------------------------------------------------------------------------
    if (variant === "F") {
        return (
            <>
                {FullDetailsDialog}
                <Card className="flex flex-col h-full border-border/60 shadow-sm relative group">
                    {/* Dismiss Button Upfront */}
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={onDismiss}
                        className="absolute top-2 right-2 h-7 w-7 text-muted-foreground/60 hover:text-foreground hover:bg-muted z-10"
                        title="Can’t help with this"
                    >
                        <X className="h-4 w-4" />
                        <span className="sr-only">Can’t help with this</span>
                    </Button>

                    <CardHeader className="pt-6 pb-2">
                        <div className="flex items-center gap-3">
                            {AvatarComponent}
                            <div className="flex flex-col">
                                <span className="font-semibold text-base">{name}</span>
                                {RelationshipText}
                            </div>
                        </div>
                    </CardHeader>

                    <CardContent className="pb-2 flex-1">
                        <p className="text-sm text-foreground/80 pr-6"> {/* pr-6 to avoid overlap if close button was inline, though here it's absolute */}
                            {shortSummary}
                        </p>
                        <div className="mt-2">
                            {DialogTriggerButton}
                        </div>
                    </CardContent>

                    <CardFooter className="pt-2 flex flex-col items-start gap-4">
                        {reminderLabel && <div className="w-full text-xs">{ReminderState}</div>}
                        <div className="flex w-full gap-3">
                            <Button onClick={onHelp} className="flex-1" size="sm">
                                Help {name.split(" ")[0]}
                            </Button>
                            <Button onClick={onOpenReminder} variant="secondary" size="sm" className="px-4">
                                Remind me
                            </Button>
                        </div>
                    </CardFooter>
                </Card>
            </>
        );
    }

    // -------------------------------------------------------------------------
    // VARIANT G: Hybrid (User Request)
    // -------------------------------------------------------------------------
    if (variant === "G") {
        // Custom Relationship Text for G
        const RelationshipTextG = (
            <span className="text-xs text-muted-foreground flex items-center gap-1">
                {/* Logic: Single person -> User, Circle -> Users, Skill -> Globe */}
                {relationshipType === "direct" && <Users className="h-3 w-3" />}
                {relationshipType === "through-contact" && <User className="h-3 w-3" />}
                {relationshipType === "skills-match" && <Globe className="h-3 w-3" />}
                {relationshipLabel}
            </span>
        );

        return (
            <>
                {FullDetailsDialog}
                <Card className="flex flex-col h-full overflow-hidden transition-all hover:shadow-md border-border/80">
                    <CardHeader className="flex flex-row items-center gap-3 pb-2 pt-5">
                        {AvatarComponent}
                        <div className="flex flex-col gap-0.5 flex-1 min-w-0">
                            <span className="font-semibold text-base truncate">{name}</span>
                            {RelationshipTextG}
                        </div>
                        <div className="-mt-2 -mr-2">{MenuAction}</div>
                    </CardHeader>

                    <CardContent className="flex-1 pb-2">
                        <div
                            className="bg-muted/30 p-4 rounded-md font-medium text-foreground cursor-pointer hover:bg-muted/50 transition-colors group/bubble relative"
                            onClick={() => setIsDialogOpen(true)}
                        >
                            {shortSummary}

                            {/* Overlay for View Details */}
                            <div className="absolute inset-0 flex items-center justify-center rounded-md bg-background/60 backdrop-blur-[1px] opacity-0 transition-opacity duration-200 group-hover/bubble:opacity-100">
                                <div className="inline-flex h-8 items-center justify-center rounded-full bg-primary px-4 text-xs font-medium text-primary-foreground shadow-sm">
                                    View details
                                </div>
                            </div>
                        </div>
                    </CardContent>

                    <CardFooter className="pt-4 pb-5 flex justify-end items-center">
                        <div className="flex gap-2 w-full justify-end">
                            {reminderLabel ? (
                                <Button
                                    onClick={onOpenReminder}
                                    variant="outline"
                                    size="sm"
                                    className="shrink-0 transition-all border-amber-200 bg-amber-50 text-amber-700 hover:bg-amber-100 hover:text-amber-800 hover:border-amber-300 group/remind"
                                    title="Cancel reminder"
                                >
                                    <BellRing className="w-3.5 h-3.5 mr-2 group-hover/remind:hidden" />
                                    <X className="w-3.5 h-3.5 mr-2 hidden group-hover/remind:block" />
                                    <span className="text-xs font-medium">Reminder: 3 days</span>
                                </Button>
                            ) : (
                                <Button
                                    onClick={onOpenReminder}
                                    variant="outline"
                                    size="sm"
                                    className="shrink-0 w-9 p-0 transition-colors hover:border-primary/50 hover:bg-primary/5 hover:text-primary"
                                    title="Remind me later"
                                >
                                    <BellPlus className="w-4 h-4" />
                                </Button>
                            )}
                            <Button onClick={onHelp} className="font-semibold shadow-sm px-8" size="sm">
                                Help {name.split(" ")[0]}
                            </Button>
                        </div>
                    </CardFooter>
                </Card>
            </>
        );
    }

    return <div>Unknown Variant</div>;
}

// ---------------------------------------------------------------------------
// Demo/Page Component
// ---------------------------------------------------------------------------

const MOCK_DATA: Omit<HelpRequestCardProps, 'variant'> = {
    name: "Jen Morris",
    avatarUrl: "https://i.pravatar.cc/150?u=jen",
    relationshipType: "through-contact",
    relationshipLabel: "Connected through Bryan S.",
    shortSummary: "I'm looking for a warm intro to a hiring manager at Acme Corp for a Senior PM role.",
    longDescription: "I've been following Acme Corp's work in the renewable energy sector for years and I'm huge fan. I recently saw a Senior PM role open up that fits my background effectively perfectly. I'd love to get my resume in front of a human rather than just the ATS black hole. If you know anyone on the product team there, a 5-minute intro would mean the world!",
    // reminderLabel: "Reminding you in 3 days", // Uncomment to test reminder state
};

export default function HelpRequestLayoutsPage() {
    const [reminderActive, setReminderActive] = useState(false);

    const toggleReminder = () => {
        setReminderActive((prev) => !prev);
        console.log("Toggled reminder state");
    };

    const handleHelp = () => console.log("User clicked HELP");
    const handleDismiss = () => console.log("User clicked DISMISS");
    const handleFlag = () => console.log("User clicked FLAG");

    const commonProps = {
        ...MOCK_DATA,
        reminderLabel: reminderActive ? "Reminding you in 3 days" : undefined,
        onHelp: handleHelp,
        onOpenReminder: toggleReminder,
        onDismiss: handleDismiss,
        onFlag: handleFlag,
    };

    const variants = [
        {
            id: "A",
            title: "Variant A – Classic Vertical Stack",
            desc: [
                "Balanced hierarchy: Avatar -> Summary -> Actions.",
                "Standard footer actions (Help vs Remind).",
                "Best for: General purpose scanning where identity and content are equally important.",
                "Safe for carousels; content expands in modal only."
            ],
            props: { ...commonProps, variant: "A" as const },
        },
        {
            id: "B",
            title: "Variant B – Emphasis on the Ask",
            desc: [
                "Summary text is larger and more prominent.",
                "Actions are split: Primary is full width, Secondary is an icon.",
                "Best for: When the request content is the primary hook.",
            ],
            props: { ...commonProps, variant: "B" as const },
        },
        {
            id: "C",
            title: "Variant C – Relationship Highlight",
            desc: [
                "Relationship data uses a prominent Badge.",
                "Content is wrapped in a subtle box to differentiate from identity.",
                "Actions aligned right to follow 'reading' flow.",
                "Best for: Communities where 'who you know' is the strongest signal."
            ],
            props: { ...commonProps, variant: "C" as const },
        },
        {
            id: "D",
            title: "Variant D – Compact Mobile-First",
            desc: [
                "Tighter padding and spacing.",
                "Vertical stacked buttons for easier touch targets on mobile.",
                "Minimal visual noise.",
                "Best for: Dense lists or smaller mobile viewports."
            ],
            props: { ...commonProps, variant: "D" as const },
        },
        {
            id: "E",
            title: "Variant E – Minimal / Clean",
            desc: [
                "Removes heavy borders, uses internal dividers.",
                "Softer 'Okay, sure' copy for a friendlier tone.",
                "Very airy layout with lots of whitespace.",
                "Best for: A modern, premium aesthetic that feels less transactional."
            ],
            props: { ...commonProps, variant: "E" as const },
        },
        {
            id: "F",
            title: "Variant F – Quick Triage (Dismiss Upfront)",
            desc: [
                "Dismiss action is exposed as an 'X' in the top-right corner.",
                "Allows for much faster 'No, thanks' processing.",
                "Reduces clicks for users who want to clear their feed quickly.",
                "Best for: High-volume feeds or when 'ignoring' is a common action."
            ],
            props: { ...commonProps, variant: "F" as const },
        },
        {
            id: "G",
            title: "Variant G – Hybrid Connected",
            desc: [
                "Combines Variant A's header/hover with Variant C's content box.",
                "Uses 'Globe' icon for skills and 'User' for single connections.",
                "Primary action is prominent; Secondary is minimized to an icon.",
                "Best for: A trusted, community-feel that emphasizes the connection path."
            ],
            props: { ...commonProps, variant: "G" as const },
        },
    ];

    return (
        <div className="min-h-screen bg-background p-8 font-sans">
            <div className="max-w-5xl mx-auto">
                <header className="mb-12">
                    <h1 className="text-3xl font-bold tracking-tight mb-2">Help Request Card Variants</h1>
                    <p className="text-muted-foreground text-lg">
                        Exploration of layout options for the single-card display.
                        Detailed content opens in a Dialog to preserve carousel height stability.
                    </p>
                    <div className="mt-4 p-4 bg-muted/50 rounded-lg text-sm border border-border/50">
                        <span className="font-semibold text-foreground">Interactive Demo:</span> Click "Remind me" on any card to toggle the reminder state across all cards.
                    </div>
                </header>

                <div className="space-y-16">
                    {variants.map((v) => (
                        <section key={v.id} className="grid grid-cols-1 lg:grid-cols-[400px_1fr] gap-8 items-start">

                            {/* Card Preview Container - Fixed width to simulate card/carousel constraint */}
                            <div className="w-full max-w-[400px] mx-auto lg:mx-0">
                                <div className="h-full">
                                    <HelpRequestCard {...v.props} />
                                </div>
                            </div>

                            {/* Explanation */}
                            <div className="space-y-4 pt-2">
                                <h2 className="text-xl font-semibold text-primary">{v.title}</h2>
                                <ul className="list-disc list-inside space-y-2 text-muted-foreground">
                                    {v.desc.map((d, i) => (
                                        <li key={i}>{d}</li>
                                    ))}
                                </ul>
                                <div className="pt-4 flex gap-2">
                                    <Badge variant="outline" className="text-xs text-muted-foreground">Mobile ready</Badge>
                                    <Badge variant="outline" className="text-xs text-muted-foreground">Stable height</Badge>
                                    <Badge variant="outline" className="text-xs text-muted-foreground">Dialog detail</Badge>
                                </div>
                            </div>

                        </section>
                    ))}
                </div>
            </div>
        </div>
    );
}
