"use client";

import { useState, FormEvent, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { register } from "@/lib/api";
import AuthLayout from "@/components/AuthLayout";
import FormInput from "@/components/FormInput";
import Button from "@/components/atomic/Button";
import Alert from "@/components/Alert";
import { useAuth } from "@/hooks/useAuth";

export default function SignupPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const router = useRouter();
  const { isAuthenticated } = useAuth();

  useEffect(() => {
    if (isAuthenticated) {
      router.push("/documents");
    }
  }, [isAuthenticated, router]);

  const validateForm = () => {
    // Reset error
    setError("");

    // Check if email is valid
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setError("Please enter a valid email address");
      return false;
    }

    // Check if password is strong enough
    if (password.length < 8) {
      setError("Password must be at least 8 characters long");
      return false;
    }

    // Check if passwords match
    if (password !== confirmPassword) {
      setError("Passwords don't match");
      return false;
    }

    return true;
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    if (!validateForm()) return;

    setLoading(true);
    setError("");

    try {
      // Call the register API function
      await register(email, password);

      // Set success message
      setSuccessMessage(
        "Account created successfully! Redirecting to login..."
      );

      // Clear form
      setEmail("");
      setPassword("");
      setConfirmPassword("");

      // Redirect to login page after 2 seconds
      setTimeout(() => {
        router.push("/login?registered=true");
      }, 2000);
    } catch (err) {
      if (err instanceof Error) {
        console.log("This is very important", err);
        setError(err.message);
      } else {
        setError("Registration failed. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout
      title="Create an Account"
      subtitle="Join CollabEditor to create and share documents"
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
          disabled={loading}
        />

        <FormInput
          label="Password"
          id="password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="••••••••"
          required
          disabled={loading}
          helperText="Must be at least 8 characters long"
        />

        <FormInput
          label="Confirm Password"
          id="confirmPassword"
          type="password"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          placeholder="••••••••"
          required
          disabled={loading}
        />

        <Button
          type="submit"
          variant="primary"
          isLoading={loading}
          disabled={loading}
          fullWidth
        >
          {loading ? "Creating Account..." : "Create Account"}
        </Button>
      </form>

      <div className="mt-6 text-center">
        <p className="text-gray-600">
          Already have an account?{" "}
          <Link
            href="/login"
            className="text-blue-600 hover:text-blue-800 font-medium"
          >
            Log in
          </Link>
        </p>
      </div>
    </AuthLayout>
  );
}