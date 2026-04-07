"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { authClient } from "@/app/lib/auth-client";
import HeroBackground from "@/app/components/HeroBackground";
import {
  MdPerson,
  MdLock,
  MdVisibility,
  MdVisibilityOff,
} from "react-icons/md";

export default function SignInPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    setLoading(true);

    const { error: signInError } = await authClient.signIn.email({
      email,
      password,
    });

    setLoading(false);

    if (signInError) {
      setError(signInError.message ?? "Anmeldung fehlgeschlagen.");
      return;
    }

    router.push("/schichtplan");
    router.refresh();
  }

  return (
    <HeroBackground fullScreen>
      <h1 className="mb-5 text-3xl font-bold text-primary">Anmelden</h1>

      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <label className="input input-bordered flex items-center gap-2">
          <MdPerson className="size-5 text-base-content/50" />
          <input
            type="email"
            className="grow"
            placeholder="E-Mail"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </label>

        <label className="input input-bordered flex items-center gap-2">
          <MdLock className="size-5 text-base-content/50" />
          <input
            type={showPassword ? "text" : "password"}
            className="grow"
            placeholder="Passwort"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
          <button
            type="button"
            className="btn btn-ghost btn-xs btn-circle"
            onClick={() => setShowPassword((v) => !v)}
            tabIndex={-1}
          >
            {showPassword ? (
              <MdVisibilityOff className="size-4" />
            ) : (
              <MdVisibility className="size-4" />
            )}
          </button>
        </label>

        {error && (
          <div className="alert alert-error">
            <span>{error}</span>
          </div>
        )}

        <button type="submit" className="btn btn-primary" disabled={loading}>
          {loading && (
            <span className="loading loading-spinner loading-sm"></span>
          )}
          Anmelden
        </button>
      </form>

      <div className="mt-4">
        <a href="#" className="link link-primary text-sm">
          Passwort vergessen?
        </a>
      </div>
    </HeroBackground>
  );
}
