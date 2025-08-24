
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";

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
    .min(10, { message: "Phone number must be at least 10 digits." }),
});

function PhoneStep({
  onPhoneSubmit,
}: {
  onPhoneSubmit: (phoneNumber: string) => void;
}) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  const form = useForm<z.infer<typeof PhoneSchema>>({
    resolver: zodResolver(PhoneSchema),
    defaultValues: { phone: "" },
  });

  const handleSubmit = (values: z.infer<typeof PhoneSchema>) => {
    setIsSubmitting(true);
    // Simulate API call to send OTP
    setTimeout(() => {
      toast({
        title: "OTP Sent!",
        description: `An OTP has been sent to ${values.phone}. (Hint: Use 123456)`,
      });
      setIsSubmitting(false);
      onPhoneSubmit(values.phone);
    }, 1000);
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
                <Input placeholder="Your 10-digit phone number" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button type="submit" className="w-full font-bold" disabled={isSubmitting}>
          {isSubmitting ? <Loader2 className="animate-spin" /> : "Send OTP"}
        </Button>
      </form>
    </Form>
  );
}

function OtpStep({
  onBack,
}: {
  onBack: () => void;
}) {
  const router = useRouter();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<z.infer<typeof OTPSchema>>({
    resolver: zodResolver(OTPSchema),
    defaultValues: { otp: "" },
  });

  const handleSubmit = (values: z.infer<typeof OTPSchema>) => {
    setIsSubmitting(true);
    // Simulate API call to verify OTP
    setTimeout(() => {
      if (values.otp === "123456") {
        toast({
          title: "Success!",
          description: "You have been logged in successfully.",
        });
        router.push("/dashboard");
      } else {
        toast({
          variant: "destructive",
          title: "Invalid OTP",
          description: "The OTP you entered is incorrect. Please try again.",
        });
        form.setError("otp", {
          type: "manual",
          message: "Incorrect OTP. Please try again.",
        });
        setIsSubmitting(false);
      }
    }, 1000);
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
                <Input placeholder="123456" {...field} />
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

  const handlePhoneSubmit = (phoneNumber: string) => {
    setStep("otp");
  };

  const handleBack = () => {
    setStep("phone");
  };

  return step === "phone" ? (
    <PhoneStep onPhoneSubmit={handlePhoneSubmit} />
  ) : (
    <OtpStep onBack={handleBack} />
  );
}
