"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { registerAction } from "@/lib/actions/auth";
import { cn } from "@/lib/utils";
import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import { useRouter } from "next/navigation";
import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";

// Define the form validation schema
const registerSchema = z.object({
  name: z.object({
    firstName: z.string().min(2, "First name must be at least 2 characters"),
    lastName: z.string().min(2, "Last name must be at least 2 characters"),
  }),
  email: z.string().email("Please enter a valid email address"),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
    .regex(/[a-z]/, "Password must contain at least one lowercase letter")
    .regex(/[0-9]/, "Password must contain at least one number")
    .regex(/[^A-Za-z0-9]/, "Password must contain at least one special character"),
  confirmPassword: z.string(),
  role: z.enum(["entrepreneur", "investor"])
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"]
});

type RegisterFormValues = z.infer<typeof registerSchema>;

export function RegisterForm({
  className,
  ...props
}: React.ComponentPropsWithoutRef<"form">) {
  const router = useRouter();
  const [apiError, setApiError] = useState<string | null>(null);

  // Following the official React Hook Form example with Zod
  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
    reset
  } = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      name: {
        firstName: "",
        lastName: ""
      },
      email: "",
      password: "",
      confirmPassword: "",
      role: "entrepreneur" as const
    }
  });

  // Handle form submission
  const onSubmit = async (data: RegisterFormValues) => {
    try {
      setApiError(null);
      
      // Construct full name from first and last name
      const fullName = `${data.name.firstName} ${data.name.lastName}`;
      
      // Call the registration server action
      const result = await registerAction({
        name: fullName,
        email: data.email,
        password: data.password,
        role: data.role
      });
      
      if (!result.success) {
        setApiError(result.error || "Registration failed");
        return;
      }
      
      // Reset the form
      reset();
      
      // Registration successful, redirect to login page
      router.push("/login?registered=true");
      router.refresh();
    } catch (error) {
      console.error("Registration error:", error);
      setApiError("An unexpected error occurred. Please try again.");
    }
  };

  // Password strength indicator
  const password = watch("password");
  const getPasswordStrength = (password: string) => {
    if (!password) return 0;
    
    let strength = 0;
    
    // Length check
    if (password.length >= 8) strength += 1;
    // Uppercase check
    if (/[A-Z]/.test(password)) strength += 1;
    // Lowercase check
    if (/[a-z]/.test(password)) strength += 1;
    // Number check
    if (/[0-9]/.test(password)) strength += 1;
    // Special character check
    if (/[^A-Za-z0-9]/.test(password)) strength += 1;
    
    return strength;
  };

  const passwordStrength = getPasswordStrength(password || "");
  
  const getPasswordStrengthText = () => {
    if (passwordStrength === 0) return "";
    if (passwordStrength <= 2) return "Weak";
    if (passwordStrength <= 4) return "Medium";
    return "Strong";
  };

  const getPasswordStrengthColor = () => {
    if (passwordStrength <= 2) return "bg-red-500";
    if (passwordStrength <= 4) return "bg-yellow-500";
    return "bg-green-500";
  };

  return (
    <form 
      className={cn("flex flex-col gap-6", className)} 
      onSubmit={handleSubmit(onSubmit)}
      {...props}
    >
      <div className="flex flex-col items-center gap-2 text-center">
        <h1 className="text-2xl font-bold">Create an account</h1>
        <p className="text-balance text-sm text-muted-foreground">
          Enter your details below to create your account
        </p>
      </div>
      
      {apiError && (
        <div className="p-3 bg-red-100 border border-red-300 text-red-500 rounded-md text-sm">
          {apiError}
        </div>
      )}
      
      <div className="grid gap-6">
        <div className="grid grid-cols-2 gap-4">
          <div className="grid gap-2">
            <Label htmlFor="firstName">First name</Label>
            <Input 
              id="firstName" 
              {...register("name.firstName")}
              aria-invalid={errors.name?.firstName ? "true" : "false"}
            />
            {errors.name?.firstName && (
              <p className="text-sm text-red-500">{errors.name.firstName.message}</p>
            )}
          </div>
          <div className="grid gap-2">
            <Label htmlFor="lastName">Last name</Label>
            <Input 
              id="lastName" 
              {...register("name.lastName")}
              aria-invalid={errors.name?.lastName ? "true" : "false"}
            />
            {errors.name?.lastName && (
              <p className="text-sm text-red-500">{errors.name.lastName.message}</p>
            )}
          </div>
        </div>
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
          <Label htmlFor="password">Password</Label>
          <Input 
            id="password" 
            type="password" 
            {...register("password")}
            aria-invalid={errors.password ? "true" : "false"}
          />
          {password && (
            <div className="mt-2">
              <div className="flex items-center gap-2 mb-1">
                <div className="h-2 flex-1 bg-gray-200 rounded-full overflow-hidden">
                  <div 
                    className={`h-full ${getPasswordStrengthColor()}`}
                    style={{ width: `${(passwordStrength / 5) * 100}%` }}
                  ></div>
                </div>
                <span className="text-xs">{getPasswordStrengthText()}</span>
              </div>
            </div>
          )}
          {errors.password && (
            <p className="text-sm text-red-500">{errors.password.message}</p>
          )}
        </div>
        <div className="grid gap-2">
          <Label htmlFor="confirmPassword">Confirm Password</Label>
          <Input 
            id="confirmPassword" 
            type="password" 
            {...register("confirmPassword")}
            aria-invalid={errors.confirmPassword ? "true" : "false"}
          />
          {errors.confirmPassword && (
            <p className="text-sm text-red-500">{errors.confirmPassword.message}</p>
          )}
        </div>
        <div className="grid gap-2">
          <Label htmlFor="role">Account Type</Label>
          <div className="flex gap-4">
            <div className="flex items-center gap-2">
              <input
                type="radio"
                id="entrepreneur"
                value="entrepreneur"
                className="h-4 w-4"
                {...register("role")}
                defaultChecked
              />
              <label htmlFor="entrepreneur" className="text-sm hover:cursor-pointer">
                Entrepreneur
              </label>
            </div>
            <div className="flex items-center gap-2">
              <input
                type="radio"
                id="investor"
                value="investor"
                className="h-4 w-4"
                {...register("role")}
              />
              <label htmlFor="investor" className="text-sm hover:cursor-pointer">
                Investor
              </label>
            </div>
          </div>
        </div>
        <Button 
          type="submit" 
          className="w-full hover:cursor-pointer"
          disabled={isSubmitting}
        >
          {isSubmitting ? "Registering..." : "Register"}
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
            // Handle Google sign-in (to be implemented later)
            console.log("Google sign-in");
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
          Register with Google
        </Button>
      </div>
      <div className="text-center text-sm">
        Already have an account?{" "}
        <Link href="/login" className="underline underline-offset-4">
          Login
        </Link>
      </div>
    </form>
  );
}