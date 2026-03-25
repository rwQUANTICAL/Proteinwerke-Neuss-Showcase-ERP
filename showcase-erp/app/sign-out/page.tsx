"use client";

import { useRouter } from "next/navigation";
import { authClient } from "@/app/lib/auth-client";
import HeroBackground from "@/app/components/HeroBackground";
import { useState } from "react";

export default function SignOutPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function handleSignOut() {
    setLoading(true);
    await authClient.signOut();
    router.push("/sign-in");
    router.refresh();
  }

  return (
    <HeroBackground>
      <h1 className="mb-5 text-3xl font-bold text-primary">Abmelden</h1>
      <p className="mb-5 text-base-content">
        Möchten Sie sich wirklich abmelden?
      </p>
      <div className="flex gap-3 justify-center">
        <button
          className="btn btn-primary"
          onClick={handleSignOut}
          disabled={loading}
        >
          {loading && (
            <span className="loading loading-spinner loading-sm"></span>
          )}
          Abmelden
        </button>
        <button className="btn btn-ghost" onClick={() => router.back()}>
          Abbrechen
        </button>
      </div>
    </HeroBackground>
  );
}
