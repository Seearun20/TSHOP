
"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { 
  RecaptchaVerifier, 
  signInWithPhoneNumber,
  ConfirmationResult
} from "firebase/auth";
import { auth } from "@/lib/firebase";

import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";

const OTPSchema = z.object({
  otp: z.string().min(6, { message: "Your OTP must be 6 characters." }),
});

const PhoneSchema = z.object({
  phone: z
    .string()
    .min(10, { message: "Phone number must be at least 10 digits." })
    .transform(val => `+91${val}`), // Assuming Indian phone numbers
});

declare global {
    interface Window {
        recaptchaVerifier?: RecaptchaVerifier;
        confirmationResult?: ConfirmationResult;
    }
}

function PhoneStep({
  onPhoneSubmit,
}: {
  onPhoneSubmit: (confirmationResult: ConfirmationResult) => void;
}) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  const form = useForm<z.infer<typeof PhoneSchema>>({
    resolver: zodResolver(PhoneSchema),
    defaultValues: { phone: "" },
  });

  useEffect(() => {
    window.recaptchaVerifier = new RecaptchaVerifier(auth, "recaptcha-container", {
      'size': 'invisible',
      'callback': () => {
        // reCAPTCHA solved, allow signInWithPhoneNumber.
      }
    });
  }, []);


  const handleSubmit = async (values: z.infer<typeof PhoneSchema>) => {
    setIsSubmitting(true);
    try {
        const appVerifier = window.recaptchaVerifier!;
        const confirmationResult = await signInWithPhoneNumber(auth, values.phone, appVerifier);
        window.confirmationResult = confirmationResult;
        toast({
            title: "OTP Sent!",
            description: `An OTP has been sent to ${values.phone}.`,
        });
        onPhoneSubmit(confirmationResult);
    } catch (error: any) {
        console.error("Error sending OTP:", error);
        toast({
            variant: "destructive",
            title: "Failed to send OTP",
            description: error.message || "Please try again.",
        });
    } finally {
        setIsSubmitting(false);
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
        <FormField
          control={form.control}
          name="phone"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Phone Number</FormLabel>
              <FormControl>
                <div className="flex">
                    <span className="inline-flex items-center px-3 rounded-l-md border border-r-0 border-input bg-background text-sm text-muted-foreground">+91</span>
                    <Input placeholder="Your 10-digit phone number" {...field} onChange={e => field.onChange(e.target.value.replace(/[^0-9]/g, ''))} />
                </div>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <div id="recaptcha-container"></div>
        <Button type="submit" className="w-full font-bold" disabled={isSubmitting}>
          {isSubmitting ? <Loader2 className="animate-spin" /> : "Send OTP"}
        </Button>
      </form>
    </Form>
  );
}

function OtpStep({
  onBack,
  confirmationResult,
}: {
  onBack: () => void;
  confirmationResult: ConfirmationResult;
}) {
  const router = useRouter();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<z.infer<typeof OTPSchema>>({
    resolver: zodResolver(OTPSchema),
    defaultValues: { otp: "" },
  });

  const handleSubmit = async (values: z.infer<typeof OTPSchema>) => {
    setIsSubmitting(true);
    try {
        await confirmationResult.confirm(values.otp);
        toast({
            title: "Success!",
            description: "You have been logged in successfully.",
        });
        router.push("/dashboard");
    } catch (error: any) {
        console.error("Error verifying OTP:", error);
        toast({
            variant: "destructive",
            title: "Invalid OTP",
            description: "The OTP you entered is incorrect. Please try again.",
        });
         form.setError("otp", {
          type: "manual",
          message: "Incorrect OTP. Please try again.",
        });
    } finally {
        setIsSubmitting(false);
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
        <FormField
          control={form.control}
          name="otp"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Enter OTP</FormLabel>
              <FormControl>
                <Input placeholder="6-digit OTP" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button type="submit" className="w-full font-bold" disabled={isSubmitting}>
          {isSubmitting ? <Loader2 className="animate-spin" /> : "Verify & Login"}
        </Button>
        <Button variant="link" size="sm" className="w-full" onClick={onBack}>
          Back to phone number
        </Button>
      </form>
    </Form>
  );
}

export function LoginForm() {
  const [step, setStep] = useState<"phone" | "otp">("phone");
  const [confirmationResult, setConfirmationResult] = useState<ConfirmationResult | null>(null);

  const handlePhoneSubmit = (result: ConfirmationResult) => {
    setConfirmationResult(result);
    setStep("otp");
  };

  const handleBack = () => {
    setStep("phone");
    setConfirmationResult(null);
  };

  return step === "phone" || !confirmationResult ? (
    <PhoneStep onPhoneSubmit={handlePhoneSubmit} />
  ) : (
    <OtpStep onBack={handleBack} confirmationResult={confirmationResult} />
  );
}
