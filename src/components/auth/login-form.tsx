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

const LoginSchema = z.object({
  password: z.string().min(1, { message: "Password is required." }),
});

export function LoginForm() {
  const router = useRouter();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<z.infer<typeof LoginSchema>>({
    resolver: zodResolver(LoginSchema),
    defaultValues: { password: "" },
  });

  const handleSubmit = async (values: z.infer<typeof LoginSchema>) => {
    setIsSubmitting(true);
    
    // Simulate a delay
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Hardcoded password check
    if (values.password === "1999") {
      toast({
        title: "Success!",
        description: "You have been logged in successfully.",
      });
      router.push("/dashboard");
    } else {
      toast({
        variant: "destructive",
        title: "Invalid Credentials",
        description: "The password you entered is incorrect. Please try again.",
      });
      form.setError("password", {
        type: "manual",
        message: "Incorrect password. Please try again.",
      });
    }

    setIsSubmitting(false);
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
        <FormField
          control={form.control}
          name="password"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Password</FormLabel>
              <FormControl>
                <Input type="password" placeholder="••••••••" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button type="submit" className="w-full font-bold" disabled={isSubmitting}>
          {isSubmitting ? <Loader2 className="animate-spin" /> : "Login"}
        </Button>
      </form>
    </Form>
  );
}
