"use client";
import Image from "next/image";
import { LoginForm, LoginMessage } from "@/components/auth/login-form";
import Link from "next/link";
import { Suspense } from "react";
import { useSearchParams } from "next/navigation";

// Client component that gets the callback URL

function LoginCallbackHandler({ 
  children 
}: { 
  children: (props: { callbackUrl: string | null }) => React.ReactNode 
}) {
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl");
  
  return children({ callbackUrl });
}

export default function LoginPage() {
  return (
    <div className="grid min-h-svh lg:grid-cols-2">
      <div className="flex flex-col gap-4 p-6 md:p-10">
        <div className="flex justify-center gap-2 md:justify-start">
          <Link href="#" className="flex items-center gap-2 font-medium">
            <div className="flex items-center justify-center ">
              <Image
                src="/logo.png"
                alt="logo"
                width={54}
                height={54}
                className=""
              />
            </div>
            Business Nexus
          </Link>
        </div>
        <div className="flex flex-1 items-center justify-center">
          <div className="w-full max-w-xs space-y-6">
            {/* Suspense boundary for components that use useSearchParams */}
            <Suspense fallback={null}>
              <LoginMessage />
            </Suspense>
            
            {/* Handle callback URL with Suspense */}
            <Suspense fallback={<LoginForm />}>
              <LoginCallbackHandler>
                {({ callbackUrl }) => <LoginForm callbackUrl={callbackUrl || undefined} />}
              </LoginCallbackHandler>
            </Suspense>
          </div>
        </div>
      </div>
      <div className="relative hidden bg-muted lg:block">
        <img
          src="/auth/auth.webp"
          alt="auth-image"
          className="absolute inset-0 h-full w-full object-cover dark:brightness-[0.2] dark:grayscale"
        />
      </div>
    </div>
  );
}
