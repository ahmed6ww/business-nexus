"use client";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { signIn } from "next-auth/react";

// Define the login form validation schema
const loginSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
  password: z.string().min(1, "Password is required"),
});

type LoginFormValues = z.infer<typeof loginSchema>;

export function LoginForm({
  className,
  ...props
}: React.ComponentPropsWithoutRef<"form">) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [apiError, setApiError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(
    searchParams.get("registered") === "true" 
      ? "Registration successful! Please log in with your new account."
      : null
  );

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const onSubmit = async (data: LoginFormValues) => {
    try {
      setApiError(null);
      setSuccessMessage(null);

      // Get the callback URL (where to redirect after login)
      const callbackUrl = searchParams.get("callbackUrl") || "/dashboard";

      // Use NextAuth.js signIn function
      const result = await signIn("credentials", {
        redirect: false,
        email: data.email,
        password: data.password,
        callbackUrl,
      });

      if (!result?.ok) {
        setApiError(result?.error || "Failed to login");
        return;
      }

      // Reset form
      reset();
      
      // Redirect based on user role (we'll fetch this after we're redirected)
      router.push(callbackUrl);
      router.refresh();
    } catch (error) {
      console.error("Login error:", error);
      setApiError("An unexpected error occurred. Please try again.");
    }
  };

  return (
    <form 
      className={cn("flex flex-col gap-6", className)} 
      onSubmit={handleSubmit(onSubmit)}
      {...props}
    >
      <div className="flex flex-col items-center gap-2 text-center">
        <h1 className="text-2xl font-bold">Login to your account</h1>
        <p className="text-balance text-sm text-muted-foreground">
          Enter your email below to login to your account
        </p>
      </div>

      {successMessage && (
        <div className="p-3 bg-green-100 border border-green-300 text-green-700 rounded-md text-sm">
          {successMessage}
        </div>
      )}

      {apiError && (
        <div className="p-3 bg-red-100 border border-red-300 text-red-500 rounded-md text-sm">
          {apiError}
        </div>
      )}

      <div className="grid gap-6">
        <div className="grid gap-2">
          <Label htmlFor="email">Email</Label>
          <Input 
            id="email" 
            type="email" 
            placeholder="m@example.com" 
            {...register("email")}
            aria-invalid={errors.email ? "true" : "false"}
          />
          {errors.email && (
            <p className="text-sm text-red-500">{errors.email.message}</p>
          )}
        </div>
        <div className="grid gap-2">
          <div className="flex items-center">
            <Label htmlFor="password">Password</Label>
            <a
              href="#"
              className="ml-auto text-sm underline-offset-4 hover:underline"
            >
              Forgot your password?
            </a>
          </div>
          <Input 
            id="password" 
            type="password" 
            {...register("password")}
            aria-invalid={errors.password ? "true" : "false"}
          />
          {errors.password && (
            <p className="text-sm text-red-500">{errors.password.message}</p>
          )}
        </div>
        <Button 
          type="submit" 
          className="w-full hover:cursor-pointer"
          disabled={isSubmitting}
        >
          {isSubmitting ? "Logging in..." : "Login"}
        </Button>
        <div className="relative text-center text-sm after:absolute after:inset-0 after:top-1/2 after:z-0 after:flex after:items-center after:border-t after:border-border">
          <span className="relative z-10 bg-background px-2 text-muted-foreground">
            Or continue with
          </span>
        </div>
        <Button 
          type="button"
          variant="outline" 
          className="w-full hover:cursor-pointer hover:shadow-stone-400"
          onClick={() => {
            signIn("google", { callbackUrl: "/dashboard" });
          }}
        >
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 533.5 544.3">
            <path
              fill="#4285F4"
              d="M533.5 278.4c0-18.4-1.5-36-4.4-53.1H272v100.7h146.9c-6.3 34-25 62.8-53.2 82.1v68.2h85.9c50.3-46.4 81.9-114.8 81.9-197.9z"
            />
            <path
              fill="#34A853"
              d="M272 544.3c72.6 0 133.6-24.1 178.1-65.4l-85.9-68.2c-23.9 16-54.5 25.4-92.2 25.4-70.9 0-131-47.9-152.5-112.1H30.2v70.6C74.2 475.7 166.2 544.3 272 544.3z"
            />
            <path
              fill="#FBBC05"
              d="M119.5 323.9c-10-30-10-62.2 0-92.2V161.1H30.2c-39.6 79.2-39.6 172.9 0 252.1l89.3-70.6z"
            />
            <path
              fill="#EA4335"
              d="M272 107.7c39.5-.6 77.6 14.5 106.6 41.8l79.6-79.6C410.3 24.8 343.8-0.5 272 0 166.2 0 74.2 68.5 30.2 161.1l89.3 70.6c21.5-64.2 81.6-112.1 152.5-112.1z"
            />
          </svg>
          Login with Google
        </Button>
      </div>
      <div className="text-center text-sm">
        Don&apos;t have an account?{" "}
        <Link href="/register" className="underline underline-offset-4">
          Sign up
        </Link>
      </div>
    </form>
  );
}
