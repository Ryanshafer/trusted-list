"use client";
import { TrustParticleField } from "@/features/dashboard/components/TrustParticleField";

interface ProfileParticleAvatarProps {
  tierIndex: number;
  avatarUrl: string;
  contentScale?: number;
}

export const ProfileParticleAvatar = ({
  tierIndex,
  avatarUrl,
  contentScale,
}: ProfileParticleAvatarProps) => {
  return (
    <div className="relative w-full h-full overflow-hidden">
      <TrustParticleField tierIndex={tierIndex} avatarUrl={avatarUrl} circular contentScale={contentScale} />
    </div>
  );
};
