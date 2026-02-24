"use client";

import * as React from "react";
import { useState, useCallback } from "react";
import { cn } from "@/lib/utils";
import {
  Mail,
  Lock,
  User,
  Eye,
  EyeOff,
  Shield,
  AlertTriangle,
  KeyRound,
  Phone,
  Loader2,
} from "lucide-react";

type AuthMode = "login" | "signup" | "reset";
type RegistrationStep = "details" | "verification" | "complete";

interface AuthFormProps {
  onSuccess?: (userData: { email: string; name?: string }) => void;
  onClose?: () => void;
  initialMode?: AuthMode;
  className?: string;
}

interface FormData {
  name: string;
  email: string;
  password: string;
  confirmPassword: string;
  phone: string;
  agreeToTerms: boolean;
  rememberMe: boolean;
  verificationCode: string;
}

interface FormErrors {
  name?: string;
  email?: string;
  password?: string;
  confirmPassword?: string;
  phone?: string;
  agreeToTerms?: string;
  general?: string;
  verificationCode?: string;
}

interface PasswordStrength {
  score: number;
  feedback: string[];
  requirements: {
    length: boolean;
    uppercase: boolean;
    lowercase: boolean;
    number: boolean;
    special: boolean;
  };
}

const calculatePasswordStrength = (password: string): PasswordStrength => {
  const requirements = {
    length:    password.length >= 8,
    uppercase: /[A-Z]/.test(password),
    lowercase: /[a-z]/.test(password),
    number:    /\d/.test(password),
    special:   /[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/.test(password),
  };

  const score = Object.values(requirements).filter(Boolean).length;
  const feedback: string[] = [];
  if (!requirements.length)    feedback.push("At least 8 characters");
  if (!requirements.uppercase) feedback.push("One uppercase letter");
  if (!requirements.lowercase) feedback.push("One lowercase letter");
  if (!requirements.number)    feedback.push("One number");
  if (!requirements.special)   feedback.push("One special character");

  return { score, feedback, requirements };
};

const PasswordStrengthIndicator: React.FC<{ password: string }> = ({ password }) => {
  const strength = calculatePasswordStrength(password);

  const getColor = (score: number) => {
    if (score <= 1) return "text-destructive";
    if (score <= 2) return "text-orange-500";
    if (score <= 3) return "text-yellow-500";
    if (score <= 4) return "text-blue-500";
    return "text-primary";
  };

  const getLabel = (score: number) => {
    if (score <= 1) return "Very Weak";
    if (score <= 2) return "Weak";
    if (score <= 3) return "Fair";
    if (score <= 4) return "Good";
    return "Strong";
  };

  if (!password) return null;

  return (
    <div className="mt-2 space-y-2 animate-in fade-in-50 slide-in-from-bottom-1">
      <div className="flex items-center gap-2">
        <div className="flex-1 bg-muted rounded-full h-2 overflow-hidden">
          <div
            className={`h-full ${getColor(strength.score)} bg-current rounded-full transition-all duration-300`}
            style={{ width: `${(strength.score / 5) * 100}%` }}
          />
        </div>
        <span className="text-xs text-muted-foreground min-w-[60px]">
          {getLabel(strength.score)}
        </span>
      </div>
      {strength.feedback.length > 0 && (
        <div className="grid grid-cols-2 gap-1">
          {strength.feedback.map((item, i) => (
            <div key={i} className="flex items-center gap-1 text-xs text-amber-500 dark:text-amber-400">
              <AlertTriangle className="h-3 w-3" />
              <span>{item}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export function AuthForm({
  onSuccess,
  onClose,
  initialMode = "login",
  className,
}: AuthFormProps) {
  const [authMode, setAuthMode]             = useState<AuthMode>(initialMode);
  const [registrationStep, setStep]         = useState<RegistrationStep>("details");
  const [showPassword, setShowPw]           = useState(false);
  const [showConfirmPassword, setShowCPw]   = useState(false);
  const [isLoading, setIsLoading]           = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [errors, setErrors]                 = useState<FormErrors>({});
  const [fieldTouched, setFieldTouched]     = useState<Record<string, boolean>>({});

  const [formData, setFormData] = useState<FormData>({
    name: "", email: "", password: "", confirmPassword: "",
    phone: "", agreeToTerms: false, rememberMe: false, verificationCode: "",
  });

  React.useEffect(() => {
    if (authMode !== "login") return;
    const saved = localStorage.getItem("userEmail");
    const rem   = localStorage.getItem("rememberMe") === "true";
    if (saved) setFormData((p) => ({ ...p, email: saved, rememberMe: rem }));
  }, [authMode]);

  const validateField = useCallback(
    (field: keyof FormData, value: string | boolean) => {
      switch (field) {
        case "name":
          if (authMode === "signup" && typeof value === "string" && !value.trim())
            return "Name is required";
          break;
        case "email":
          if (!value || (typeof value === "string" && !value.trim()))
            return "Email is required";
          if (typeof value === "string" && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value))
            return "Please enter a valid email address";
          break;
        case "password":
          if (!value) return "Password is required";
          if (typeof value === "string") {
            if (value.length < 8) return "Password must be at least 8 characters";
            if (authMode === "signup" && calculatePasswordStrength(value).score < 3)
              return "Password is too weak";
          }
          break;
        case "confirmPassword":
          if (authMode === "signup" && value !== formData.password)
            return "Passwords do not match";
          break;
        case "phone":
          if (typeof value === "string" && value && !/^\+?[\d\s\-()]+$/.test(value))
            return "Please enter a valid phone number";
          break;
        case "verificationCode":
          if (authMode === "signup" && registrationStep === "verification" &&
              typeof value === "string" && !/^\d{6}$/.test(value))
            return "Verification code must be 6 digits";
          break;
        case "agreeToTerms":
          if (authMode === "signup" && !value)
            return "You must agree to the terms and conditions";
          break;
      }
      return "";
    },
    [formData.password, authMode, registrationStep]
  );

  const handleChange = useCallback(
    (field: keyof FormData, value: string | boolean) => {
      setFormData((p) => ({ ...p, [field]: value }));
      if (fieldTouched[field]) {
        const err = validateField(field, value);
        setErrors((p) => ({ ...p, [field]: err || undefined }));
      }
    },
    [fieldTouched, validateField]
  );

  const handleBlur = useCallback(
    (field: keyof FormData) => {
      setFieldTouched((p) => ({ ...p, [field]: true }));
      const err = validateField(field, formData[field]);
      setErrors((p) => ({ ...p, [field]: err || undefined }));
    },
    [formData, validateField]
  );

  const validateForm = useCallback(() => {
    const newErrors: FormErrors = {};
    const fields: (keyof FormData)[] = ["email", "password"];
    if (authMode === "signup") fields.push("name", "confirmPassword", "agreeToTerms");
    if (registrationStep === "verification") fields.push("verificationCode");
    fields.forEach((f) => {
      const err = validateField(f, formData[f]);
      if (err) newErrors[f] = err;
    });
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [authMode, registrationStep, formData, validateField]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;
    setIsLoading(true);
    setErrors({});
    try {
      await new Promise((res) => setTimeout(res, 1000));

      if (authMode === "login") {
        if (formData.rememberMe) {
          localStorage.setItem("userEmail", formData.email);
          localStorage.setItem("rememberMe", "true");
        }
        setSuccessMessage("Login successful");
        onSuccess?.({ email: formData.email });
      } else if (authMode === "signup") {
        if (registrationStep === "details") {
          setStep("verification");
          setSuccessMessage("Account created! Please verify your email.");
        } else if (registrationStep === "verification") {
          setStep("complete");
          setSuccessMessage("Email verified successfully!");
          onSuccess?.({ email: formData.email, name: formData.name });
        }
      } else if (authMode === "reset") {
        setSuccessMessage("Password reset email sent!");
        setTimeout(() => setAuthMode("login"), 2000);
      }
    } catch {
      setErrors({ general: "Authentication failed. Please try again." });
    } finally {
      setIsLoading(false);
    }
  };

  const inputCls = (err?: string) =>
    cn(
      "w-full py-3 bg-muted/50 border rounded-xl placeholder:text-muted-foreground",
      "focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all",
      err ? "border-destructive" : "border-input"
    );

  const fieldErr = (id: string, msg?: string) =>
    msg ? (
      <p id={id} className="text-destructive text-xs mt-1 flex items-center gap-1">
        <AlertTriangle className="h-3 w-3" /> {msg}
      </p>
    ) : null;

  const submitBtn = (label: string, icon?: React.ReactNode) => (
    <button
      type="submit"
      disabled={isLoading}
      className={cn(
        "w-full bg-primary text-primary-foreground font-medium py-3 px-6 rounded-xl transition-all",
        "hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-primary/20 disabled:opacity-50"
      )}
    >
      <span className="flex items-center justify-center gap-2">
        {isLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : <>{icon}{label}</>}
      </span>
    </button>
  );

  const renderContent = () => {
    if (authMode === "reset") {
      return (
        <div className="space-y-4 animate-in fade-in-50 slide-in-from-right-5">
          <div className="text-center mb-6">
            <KeyRound className="h-12 w-12 text-primary mx-auto mb-3" />
            <h3 className="text-xl font-semibold mb-2">Password Recovery</h3>
            <p className="text-muted-foreground text-sm">
              Enter your email and we'll send you a reset link.
            </p>
          </div>
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
            <input type="email" placeholder="Email Address" value={formData.email}
              onChange={(e) => handleChange("email", e.target.value)}
              onBlur={() => handleBlur("email")}
              className={cn(inputCls(errors.email), "pl-10 pr-4")} />
            {fieldErr("email-error", errors.email)}
          </div>
          {submitBtn("Send Reset Link", <KeyRound className="h-5 w-5" />)}
          <div className="text-center">
            <button type="button" onClick={() => setAuthMode("login")}
              className="text-primary hover:text-primary/80 text-sm transition-colors">
              Back to Login
            </button>
          </div>
        </div>
      );
    }

    if (authMode === "signup" && registrationStep === "verification") {
      return (
        <div className="space-y-4 animate-in fade-in-50 slide-in-from-right-5">
          <div className="text-center mb-6">
            <Mail className="h-12 w-12 text-primary mx-auto mb-3" />
            <h3 className="text-xl font-semibold mb-2">Verify Your Email</h3>
            <p className="text-muted-foreground text-sm">
              We've sent a 6-digit code to <span className="font-medium">{formData.email}</span>
            </p>
          </div>
          <input type="text" placeholder="Enter 6-digit code"
            value={formData.verificationCode}
            onChange={(e) => handleChange("verificationCode", e.target.value.replace(/\D/g, "").slice(0, 6))}
            onBlur={() => handleBlur("verificationCode")}
            maxLength={6}
            className={cn(inputCls(errors.verificationCode), "text-center text-2xl font-mono tracking-widest px-4")} />
          {fieldErr("code-error", errors.verificationCode)}
          {submitBtn("Verify Email")}
          <div className="text-center">
            <button type="button" onClick={() => setStep("details")}
              className="text-primary hover:text-primary/80 text-sm transition-colors">
              Back to Details
            </button>
          </div>
        </div>
      );
    }

    if (authMode === "signup" && registrationStep === "complete") {
      return (
        <div className="text-center space-y-6 animate-in fade-in-50">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-green-100 dark:bg-green-900 text-green-600 dark:text-green-400">
            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <div>
            <h3 className="text-2xl font-bold mb-2">Welcome Aboard!</h3>
            <p className="text-muted-foreground">Your account has been created successfully.</p>
          </div>
          <button onClick={onClose}
            className="w-full bg-primary text-primary-foreground font-medium py-3 px-6 rounded-xl hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-primary/20">
            Get Started
          </button>
        </div>
      );
    }

    return (
      <div className="space-y-4 animate-in fade-in-50 slide-in-from-right-5">
        {authMode === "signup" && (
          <div>
            <div className="relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
              <input type="text" placeholder="Full Name" value={formData.name}
                onChange={(e) => handleChange("name", e.target.value)}
                onBlur={() => handleBlur("name")}
                className={cn(inputCls(errors.name), "pl-10 pr-4")} />
            </div>
            {fieldErr("name-error", errors.name)}
          </div>
        )}

        <div>
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
            <input type="email" placeholder="Email Address" value={formData.email}
              onChange={(e) => handleChange("email", e.target.value)}
              onBlur={() => handleBlur("email")}
              className={cn(inputCls(errors.email), "pl-10 pr-4")} />
          </div>
          {fieldErr("email-error", errors.email)}
        </div>

        <div>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
            <input type={showPassword ? "text" : "password"} placeholder="Password" value={formData.password}
              onChange={(e) => handleChange("password", e.target.value)}
              onBlur={() => handleBlur("password")}
              className={cn(inputCls(errors.password), "pl-10 pr-12")} />
            <button type="button" onClick={() => setShowPw(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
              aria-label={showPassword ? "Hide password" : "Show password"}>
              {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
            </button>
          </div>
          {fieldErr("password-error", errors.password)}
          {authMode === "signup" && <PasswordStrengthIndicator password={formData.password} />}
        </div>

        {authMode === "signup" && (
          <>
            <div>
              <div className="relative">
                <Shield className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                <input type={showConfirmPassword ? "text" : "password"} placeholder="Confirm Password"
                  value={formData.confirmPassword}
                  onChange={(e) => handleChange("confirmPassword", e.target.value)}
                  onBlur={() => handleBlur("confirmPassword")}
                  className={cn(inputCls(errors.confirmPassword), "pl-10 pr-12")} />
                <button type="button" onClick={() => setShowCPw(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                  aria-label={showConfirmPassword ? "Hide" : "Show"}>
                  {showConfirmPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
              {fieldErr("confirm-password-error", errors.confirmPassword)}
            </div>
            <div>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                <input type="tel" placeholder="Phone Number (Optional)" value={formData.phone}
                  onChange={(e) => handleChange("phone", e.target.value)}
                  onBlur={() => handleBlur("phone")}
                  className={cn(inputCls(errors.phone), "pl-10 pr-4")} />
              </div>
              {fieldErr("phone-error", errors.phone)}
            </div>
          </>
        )}

        <div className="flex items-center justify-between">
          {authMode === "login" ? (
            <>
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={formData.rememberMe}
                  onChange={(e) => handleChange("rememberMe", e.target.checked)}
                  className="w-4 h-4 rounded border-input bg-muted text-primary focus:ring-primary focus:ring-offset-0" />
                <span className="text-sm text-muted-foreground">Remember me</span>
              </label>
              <button type="button" onClick={() => setAuthMode("reset")}
                className="text-sm text-primary hover:text-primary/80 transition-colors">
                Forgot password?
              </button>
            </>
          ) : (
            <label className="flex items-start gap-2 cursor-pointer">
              <input type="checkbox" checked={formData.agreeToTerms}
                onChange={(e) => handleChange("agreeToTerms", e.target.checked)}
                className="w-4 h-4 mt-0.5 rounded border-input bg-muted text-primary focus:ring-primary focus:ring-offset-0" />
              <span className="text-sm text-muted-foreground">
                I agree to the{" "}
                <a href="#" className="text-primary hover:underline">Terms of Service</a>
                {" "}and{" "}
                <a href="#" className="text-primary hover:underline">Privacy Policy</a>
              </span>
            </label>
          )}
        </div>
        {fieldErr("terms-error", errors.agreeToTerms)}

        {submitBtn(authMode === "login" ? "Sign In" : "Create Account")}
      </div>
    );
  };

  return (
    <div className={cn("p-6", className)} role="dialog" aria-modal="true">
      {successMessage && (
        <div className="mb-4 p-3 bg-green-500/20 border border-green-400/30 rounded-xl flex items-center gap-2 animate-in fade-in-0 slide-in-from-top-5">
          <svg className="h-4 w-4 text-green-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
          <span className="text-green-700 dark:text-green-300 text-sm">{successMessage}</span>
        </div>
      )}
      {errors.general && (
        <div className="mb-4 p-3 bg-destructive/20 border border-destructive/30 rounded-xl flex items-center gap-2 animate-in fade-in-0 slide-in-from-top-5">
          <AlertTriangle className="h-4 w-4 text-destructive flex-shrink-0" />
          <span className="text-destructive text-sm">{errors.general}</span>
        </div>
      )}

      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold mb-2">
          {authMode === "login" ? "Welcome Back" : authMode === "reset" ? "Reset Password" : "Create Account"}
        </h2>
        <p className="text-muted-foreground">
          {authMode === "login" ? "Sign in to your account" :
           authMode === "reset" ? "Recover your account access" : "Create a new account"}
        </p>
      </div>

      {authMode !== "reset" && (
        <div className="flex bg-muted rounded-xl p-1 mb-6">
          {(["login", "signup"] as const).map((mode) => (
            <button key={mode} type="button"
              onClick={() => { setAuthMode(mode); setStep("details"); }}
              className={cn(
                "flex-1 py-2 px-4 rounded-lg text-sm font-medium transition-all capitalize",
                authMode === mode
                  ? "bg-background text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              )}>
              {mode === "login" ? "Login" : "Sign Up"}
            </button>
          ))}
        </div>
      )}

      <form onSubmit={handleSubmit}>{renderContent()}</form>

      {authMode !== "reset" && registrationStep === "details" && (
        <div className="text-center mt-6">
          <p className="text-muted-foreground text-sm">
            {authMode === "login" ? "Don't have an account? " : "Already have an account? "}
            <button type="button"
              onClick={() => setAuthMode(authMode === "login" ? "signup" : "login")}
              className="text-primary hover:text-primary/80 font-medium transition-colors">
              {authMode === "login" ? "Sign up" : "Sign in"}
            </button>
          </p>
        </div>
      )}
    </div>
  );
}
