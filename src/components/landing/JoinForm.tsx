import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Check, Loader2, ArrowRight } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

type Referrer = { firstName: string; lastName: string; id: string };

const ReferrerBadge = ({ name }: { name: string }) => (
    <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="inline-flex items-center gap-2 rounded-full bg-[#00A3AD]/10 px-4 py-2 text-sm font-bold text-[#00A3AD] mb-6"
    >
        <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#00A3AD] opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-[#00A3AD]"></span>
        </span>
        {name} invited you to join The Trusted List
    </motion.div>
);

export const JoinForm = () => {
    const emptyForm = {
        firstName: "",
        lastName: "",
        email: "",
        linkedin: "",
    };
    const invitedPrefill = {
        firstName: "Jordan",
        lastName: "Rivera",
        email: "jordan.rivera@acme.com",
        linkedin: "https://linkedin.com/in/jordanrivera",
    };

    const [referrer, setReferrer] = useState<Referrer | null>(null);
    const [isWaitlist, setIsWaitlist] = useState(true);
    const [isExpanded, setIsExpanded] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isSuccess, setIsSuccess] = useState(false);
    const [formData, setFormData] = useState(emptyForm);
    const initialInviteRef = React.useRef<{ referrer: Referrer; formData: typeof emptyForm } | null>(null);

    useEffect(() => {
        const params = new URLSearchParams(window.location.search);
        const refId = params.get('ref');
        const firstName = params.get('first_name') || params.get('firstName');
        const lastName = params.get('last_name') || params.get('lastName');
        const fullName = params.get('name') || params.get('referrer_name');

        if (refId && (firstName || fullName)) {
            // Handle both specific first/last name params and the general name param
            const fName = firstName || fullName?.split(' ')[0] || '';
            const lName = lastName || fullName?.split(' ').slice(1).join(' ') || '';
            const invitedReferrer = { firstName: fName, lastName: lName, id: refId };

            initialInviteRef.current = { referrer: invitedReferrer, formData: invitedPrefill };
            setReferrer(invitedReferrer);
            setIsWaitlist(false);
            setIsExpanded(true); // Auto-expand for referrals
            setFormData(invitedPrefill);
        }
    }, []);

    useEffect(() => {
        const handleOpenWaitlist = (event?: Event) => {
            const preserveInvite = (event as CustomEvent<{ preserveInvite?: boolean }> | undefined)?.detail
                ?.preserveInvite;
            const initialInvite = initialInviteRef.current;

            if (preserveInvite && initialInvite) {
                setReferrer(initialInvite.referrer);
                setIsWaitlist(false);
                setIsExpanded(true);
                setIsSuccess(false);
                setFormData(initialInvite.formData);
                return;
            }

            setReferrer(null);
            setIsWaitlist(true);
            setIsExpanded(true);
            setIsSuccess(false);
            setFormData(emptyForm);
        };

        if (typeof window !== 'undefined') {
            window.addEventListener('open-waitlist', handleOpenWaitlist);

            if (window.location.hash === '#waitlist') {
                handleOpenWaitlist();
            }
        }

        return () => {
            if (typeof window !== 'undefined') {
                window.removeEventListener('open-waitlist', handleOpenWaitlist);
            }
        };
    }, []);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);

        // Simulate API call
        await new Promise(resolve => setTimeout(resolve, 1500));

        console.log("Form submitted", {
            referrer,
            formData,
            timestamp: new Date().toISOString()
        });

        setIsSubmitting(false);
        setIsSuccess(true);
    };

    const handleFieldChange = (field: keyof typeof emptyForm) => (event: React.ChangeEvent<HTMLInputElement>) => {
        setFormData((current) => ({
            ...current,
            [field]: event.target.value,
        }));
    };

    if (isSuccess) {
        return (
            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="flex flex-col items-center justify-center p-8 bg-white/80 backdrop-blur-sm rounded-3xl shadow-xl border border-white/20 text-center min-h-[400px]"
            >
                <div className="h-16 w-16 bg-[#00A3AD]/10 rounded-full flex items-center justify-center mb-6">
                    <Check className="h-8 w-8 text-[#00A3AD]" />
                </div>
                <h3 className="text-xl font-semibold text-slate-900 mb-2">Request Received</h3>
                <p className="text-slate-500 max-w-xs mx-auto">
                    We’ll review your details and get back to you within a few days.
                </p>
            </motion.div>
        );
    }

    return (
        <div
            className={cn("relative", !isExpanded && "lg:mt-20")}
            id="join-waitlist"
        >
            <motion.div
                layout
                transition={{
                    layout: {
                        type: "spring",
                        bounce: 0.2,
                        duration: 0.6
                    }
                }}
                className="bg-white/10 backdrop-blur-sm rounded-3xl shadow-2xl shadow-[#00A3AD]/10 border border-white/50 p-8 md:p-10 overflow-hidden"
            >
                <AnimatePresence mode="popLayout" initial={false}>
                    {!isExpanded ? (
                        <motion.div
                            key="collapsed"
                            layout
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            transition={{ duration: 0.3 }}
                            className="flex flex-col"
                        >
                            {referrer && <ReferrerBadge name={`${referrer.firstName} ${referrer.lastName}`.trim()} />}
                            <div className="mb-8">
                                <h2 className="text-2xl font-bold text-slate-900 mb-2">
                                    {referrer ? `${referrer.firstName} vouched for you.` : "Don’t have an invite?"}
                                </h2>
                                <p className="text-slate-500">
                                    {referrer
                                        ? "Your invitation is waiting — we just need to confirm `a few details."
                                        : (
                                            <>
                                                <span className="block">
                                                    If you know a member, ask them for an invite.
                                                </span>
                                                <span className="mt-3 block">
                                                    We grow by invitation to protect trust. Join the waitlist and we’ll let you in when space opens up.
                                                </span>
                                            </>
                                        )}
                                </p>
                            </div>
                            <Button
                                type="button"
                                onClick={() => setIsExpanded(true)}
                                className="w-full h-12 text-base font-bold bg-slate-900 hover:bg-slate-800 text-white rounded-xl"
                            >
                                {referrer ? "Join the list" : <>Join the waitlist <ArrowRight className="ml-2 h-4 w-4" /></>}
                            </Button>
                        </motion.div>
                    ) : (
                        <motion.div
                            key="expanded"
                            layout
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0 }}
                            transition={{ duration: 0.4 }}
                            className="space-y-6 flex flex-col"
                        >
                            {referrer && <ReferrerBadge name={`${referrer.firstName} ${referrer.lastName}`.trim()} />}
                            <div className="mb-6">
                                <h2 className="text-2xl font-bold text-slate-900 mb-2">
                                    {referrer ? `${referrer.firstName} vouched for you.` : "Join the waitlist"}
                                </h2>
                                <p className="text-slate-500">
                                    {referrer
                                        ? "Your invitation is waiting — we just need to confirm a few details."
                                        : "We’ll let you know when your invitation is ready."}
                                </p>
                            </div>

                            <form onSubmit={handleSubmit} className="space-y-4">
                                <div className="space-y-2">
                                    <Label>Full Name</Label>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                        <Input
                                            id="firstName"
                                            required
                                            placeholder="First name"
                                            className="h-12 rounded-xl bg-white/50"
                                            value={formData.firstName}
                                            onChange={handleFieldChange("firstName")}
                                        />
                                        <Input
                                            id="lastName"
                                            required
                                            placeholder="Last name"
                                            className="h-12 rounded-xl bg-white/50"
                                            value={formData.lastName}
                                            onChange={handleFieldChange("lastName")}
                                        />
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="email">Email</Label>
                                    <Input
                                        id="email"
                                        type="email"
                                        required
                                        placeholder="jane@company.com"
                                        className="h-12 rounded-xl bg-white/50"
                                        value={formData.email}
                                        onChange={handleFieldChange("email")}
                                    />
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="linkedin">LinkedIn URL</Label>
                                    <Input
                                        id="linkedin"
                                        required
                                        placeholder="linkedin.com/in/janedoe"
                                        className="h-12 rounded-xl bg-white/50"
                                        value={formData.linkedin}
                                        onChange={handleFieldChange("linkedin")}
                                    />
                                </div>

                                <Button
                                    type="submit"
                                    disabled={isSubmitting}
                                    className="w-full h-12 text-base font-bold bg-[#00A3AD] hover:bg-[#008A92] text-white rounded-xl shadow-lg shadow-[#00A3AD]/25 mt-2"
                                >
                                    {isSubmitting ? (
                                        <>
                                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                            Submitting...
                                        </>
                                    ) : (
                                        referrer ? "Join the list" : "Add my name"
                                    )}
                                </Button>
                            </form>
                        </motion.div>
                    )}
                </AnimatePresence>
            </motion.div>
        </div>
    );
};
