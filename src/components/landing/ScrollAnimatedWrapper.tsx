import type { ReactNode } from "react";

interface ScrollAnimatedWrapperProps {
    children: ReactNode;
}

export const ScrollAnimatedWrapper = ({ children }: ScrollAnimatedWrapperProps) => {
    return (
        <div className="w-full">
            {children}
        </div>
    );
};
