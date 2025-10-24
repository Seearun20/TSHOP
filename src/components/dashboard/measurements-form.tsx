
"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
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
import { DialogFooter } from "../ui/dialog";
import { Customer } from "@/app/dashboard/customers/page";
import { Textarea } from "../ui/textarea";
import { Separator } from "../ui/separator";
import { doc, updateDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { errorEmitter } from "@/firebase/error-emitter";
import { FirestorePermissionError } from "@/firebase/errors";

const measurementSchema = z.object({
  shirtLength: z.string().optional(),
  pantLength: z.string().optional(),
  chest: z.string().optional(),
  sleeve: z.string().optional(),
  shoulder: z.string().optional(),
  waist: z.string().optional(),
  hip: z.string().optional(),
  notes: z.string().optional(),
});

type MeasurementFormValues = z.infer<typeof measurementSchema>;

interface MeasurementsFormProps {
  setOpen: (open: boolean) => void;
  customer: Customer;
  service: string;
}

export function MeasurementsForm({ setOpen, customer, service }: MeasurementsFormProps) {
  const { toast } = useToast();
  const form = useForm<MeasurementFormValues>({
    resolver: zodResolver(measurementSchema),
    defaultValues: customer.measurements || {},
  });

  const { formState: { isSubmitting } } = form;

  const showField = (fieldName: keyof MeasurementFormValues) => {
    if (service.toLowerCase().includes('shirt') || service.toLowerCase().includes('kurta')) {
        return ['shirtLength', 'chest', 'sleeve', 'shoulder', 'notes'].includes(fieldName);
    }
    if (service.toLowerCase().includes('pant') || service.toLowerCase().includes('pyjama')) {
        return ['pantLength', 'waist', 'hip', 'notes'].includes(fieldName);
    }
    if (service.toLowerCase().includes('suit') || service.toLowerCase().includes('sherwani') || service.toLowerCase().includes('blazer')) {
        return true; // Show all fields for suits/sherwanis
    }
    return false; // Default to not showing if service is not recognized
  }

  const onSubmit = async (values: MeasurementFormValues) => {
    const customerDoc = doc(db, "customers", customer.id);
    const updatedMeasurements = { ...customer.measurements, ...values };

    try {
        await updateDoc(customerDoc, { measurements: updatedMeasurements });
        toast({
            title: "Measurements Updated!",
            description: `Successfully updated measurements for ${customer.name}.`,
        });
        setOpen(false);
    } catch (error) {
        const permissionError = new FirestorePermissionError({
            path: customerDoc.path,
            operation: "update",
            requestResourceData: { measurements: updatedMeasurements },
        });
        errorEmitter.emit("permission-error", permissionError);
    }
  };

  const fields: {name: keyof MeasurementFormValues, label: string}[] = [
      { name: "shirtLength", label: "Shirt Length" },
      { name: "sleeve", label: "Sleeve" },
      { name: "shoulder", label: "Shoulder" },
      { name: "chest", label: "Chest" },
      { name: "pantLength", label: "Pant Length" },
      { name: "waist", label: "Waist" },
      { name: "hip", label: "Hip" },
  ];

  const visibleFields = fields.filter(f => showField(f.name));

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        {visibleFields.length > 0 ? (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {visibleFields.map(f => (
                    <FormField
                        key={f.name}
                        control={form.control}
                        name={f.name}
                        render={({ field }) => (
                        <FormItem>
                            <FormLabel>{f.label}</FormLabel>
                            <FormControl><Input placeholder="e.g. 42" {...field} /></FormControl>
                            <FormMessage />
                        </FormItem>
                        )}
                    />
                ))}
            </div>
        ) : <p className="text-sm text-muted-foreground">Select a service to see relevant measurement fields.</p>}
        
        {showField('notes') && (
            <>
                <Separator/>
                <FormField
                    control={form.control}
                    name="notes"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Notes</FormLabel>
                            <FormControl><Textarea placeholder="Any other specific instructions..." {...field} /></FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />
            </>
        )}

        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
          <Button type="submit" disabled={isSubmitting || visibleFields.length === 0}>
            {isSubmitting ? <Loader2 className="animate-spin" /> : "Save Measurements"}
          </Button>
        </DialogFooter>
      </form>
    </Form>
  );
}
