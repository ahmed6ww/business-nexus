import { UserRole } from '@/db/schema';

// Registration types
export interface RegistrationRequest {
  name: string;
  email: string;
  password: string;
  role: UserRole;
}

export interface RegistrationResponse {
  success: boolean;
  user?: {
    id: string;
    name: string;
    email: string;
    role: UserRole;
  };
  error?: string;
}

// Login types
export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  success: boolean;
  user?: {
    id: string;
    name: string;
    email: string;
    role: UserRole;
  };
  error?: string;
}