"use client";

import { FormEvent, useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { login } from "@/lib/api";
import AuthLayout from "@/components/AuthLayout";
import FormInput from "@/components/FormInput";
import LoadingButton from "@/components/LoadingButton";
import Alert from "@/components/Alert";
import { useAuthContext } from "@/context/AuthContext";



export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();
  const { isAuthenticated, loading, login: newLogIn } = useAuthContext();
  

  useEffect(() => {
    if (!loading && isAuthenticated) {
      console.log("User is authenticated, redirecting to documents");
      router.push("/documents");
    }
  }, [isAuthenticated, loading, router]);

  useEffect(() => {
    // Check if user just registered
    const justRegistered = searchParams.get("registered");
    if (justRegistered === "true") {
      setSuccessMessage("Account created successfully! Please log in.");
    }
  }, [searchParams]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccessMessage("");
    setIsLoading(true);

    try {
      // First, call the API to get the token
      const result = await login(email, password);
      
      // Then use our hook's login function to set the auth state
      const success = await newLogIn(result.token);
      
      if (success) {
        router.push("/documents");
      } else {
        setError("Failed to process login. Please try again.");
      }
    } catch (err) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("Failed to login. Please check your credentials and try again.");
      }
      console.error("Login error:", err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AuthLayout 
      title="Sign in to your account" 
      subtitle="Access your documents and collaborations"
    >
      {error && <Alert type="error">{error}</Alert>}
      {successMessage && <Alert type="success">{successMessage}</Alert>}
      
      <form onSubmit={handleSubmit} className="space-y-6">
        <FormInput
          label="Email Address"
          id="email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="you@example.com"
          required
          disabled={isLoading}
          autoComplete="email"
        />

        <FormInput
          label="Password"
          id="password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="••••••••"
          required
          disabled={isLoading}
          autoComplete="current-password"
        />

        <LoadingButton 
          type="submit" 
          loading={isLoading} 
          loadingText="Signing in..."
        >
          Sign in
        </LoadingButton>
      </form>

      <div className="mt-6 text-center">
        <p className="text-gray-600">
          Don't have an account?{" "}
          <Link href="/signup" className="text-blue-600 hover:text-blue-800 font-medium">
            Sign up
          </Link>
        </p>
      </div>
    </AuthLayout>
  );
}