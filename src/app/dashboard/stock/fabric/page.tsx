
"use client";

import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { MoreHorizontal, PlusCircle, Loader2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
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
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { useState, useEffect } from "react";
import { db } from "@/lib/firebase";
import { collection, addDoc, onSnapshot, doc, deleteDoc, DocumentData } from "firebase/firestore";

export interface FabricStockItem {
    id: string;
    type: string;
    length: number;
    costPerMtr: number;
    supplier: string;
    supplierPhone: string;
}

const addFabricSchema = z.object({
  type: z.string().min(1, { message: "Fabric type is required" }),
  length: z.coerce.number().min(1, { message: "Length must be at least 1" }),
  costPerMtr: z.coerce.number().min(1, { message: "Cost is required" }),
  supplier: z.string().min(1, { message: "Supplier name is required" }),
  supplierPhone: z.string().min(10, { message: "Supplier phone must be at least 10 digits" }),
});

function AddFabricForm({ setOpen }: { setOpen: (open: boolean) => void }) {
  const { toast } = useToast();
  
  const form = useForm<z.infer<typeof addFabricSchema>>({
    resolver: zodResolver(addFabricSchema),
    defaultValues: {
      type: "",
      length: 1,
      costPerMtr: 0,
      supplier: "",
      supplierPhone: "",
    },
  });

  const { formState: { isSubmitting } } = form;

  const onSubmit = async (values: z.infer<typeof addFabricSchema>) => {
    try {
        await addDoc(collection(db, "fabricStock"), values);
        toast({
            title: "Success!",
            description: `Successfully added ${values.length} meters of ${values.type} to stock.`,
        });
        setOpen(false);
        form.reset();
    } catch (error) {
        console.error("Error adding fabric: ", error);
        toast({
            variant: "destructive",
            title: "Error",
            description: "There was a problem adding the fabric.",
        });
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="type"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Fabric Type</FormLabel>
                <FormControl>
                  <Input placeholder="e.g., Italian Wool" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
              control={form.control}
              name="length"
              render={({ field }) => (
              <FormItem>
                  <FormLabel>Length (mtrs)</FormLabel>
                  <FormControl>
                  <Input type="number" {...field} />
                  </FormControl>
                  <FormMessage />
              </FormItem>
              )}
          />
          <FormField
              control={form.control}
              name="costPerMtr"
              render={({ field }) => (
              <FormItem>
                  <FormLabel>Cost per Meter</FormLabel>
                  <FormControl>
                  <Input type="number" placeholder="Cost per meter" {...field} />
                  </FormControl>
                  <FormMessage />
              </FormItem>
              )}
          />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="supplier"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Supplier</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g., Fabric Mart" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="supplierPhone"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Supplier Phone</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g., 9876543210" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
        </div>
        <DialogFooter>
          <Button
            type="submit"
            className="w-full sm:w-auto"
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <Loader2 className="animate-spin" />
            ) : (
              "Add to Inventory"
            )}
          </Button>
        </DialogFooter>
      </form>
    </Form>
  );
}


export default function FabricStockPage() {
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [fabricStock, setFabricStock] = useState<FabricStockItem[]>([]);
  const [currentItem, setCurrentItem] = useState<FabricStockItem | null>(null);

  useEffect(() => {
    const unsubscribe = onSnapshot(collection(db, "fabricStock"), (snapshot) => {
        const stockData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as FabricStockItem));
        setFabricStock(stockData);
    });
    return () => unsubscribe();
  }, []);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
    }).format(amount);
  };

   const handleDelete = async () => {
    if (!currentItem) return;
    try {
        await deleteDoc(doc(db, "fabricStock", currentItem.id));
        toast({
            variant: "destructive",
            title: "Fabric Deleted",
            description: `${currentItem.type} has been removed from your inventory.`
        });
    } catch (error) {
        toast({
            variant: "destructive",
            title: "Error",
            description: "Could not delete fabric."
        })
    }
  }

  return (
    <div className="space-y-8">
      <PageHeader title="Fabric Stock" subtitle="Manage your fabric inventory.">
         <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button>
                    <PlusCircle className="mr-2 h-4 w-4" /> Add Fabric
                </Button>
            </DialogTrigger>
            <DialogContent>
                <DialogHeader>
                <DialogTitle>Add New Fabric Stock</DialogTitle>
                <DialogDescription>
                    Fill in the details below to add new fabric to your inventory.
                </DialogDescription>
                </DialogHeader>
                <AddFabricForm setOpen={setOpen}/>
            </DialogContent>
        </Dialog>
      </PageHeader>
      <Card>
        <CardHeader>
          <CardTitle>Fabric List</CardTitle>
          <CardDescription>
            A list of all fabrics available in your store.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Fabric Type</TableHead>
                <TableHead>Length (mtrs)</TableHead>
                <TableHead>Cost/mtr</TableHead>
                <TableHead>Supplier</TableHead>
                <TableHead>
                  <span className="sr-only">Actions</span>
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {fabricStock.map((item) => (
                <TableRow key={item.id}>
                  <TableCell className="font-medium">{item.type}</TableCell>
                  <TableCell>{item.length}</TableCell>
                  <TableCell>{formatCurrency(item.costPerMtr)}</TableCell>
                  <TableCell>{item.supplier}</TableCell>
                  <TableCell>
                    <AlertDialog>
                        <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="ghost" className="h-8 w-8 p-0">
                            <span className="sr-only">Open menu</span>
                            <MoreHorizontal className="h-4 w-4" />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                            <DropdownMenuLabel>Actions</DropdownMenuLabel>
                            <DropdownMenuItem>Edit</DropdownMenuItem>
                            <DropdownMenuItem>View Details</DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <AlertDialogTrigger asChild>
                                <DropdownMenuItem className="text-destructive" onSelect={() => setCurrentItem(item)}>
                                Delete
                                </DropdownMenuItem>
                            </AlertDialogTrigger>
                        </DropdownMenuContent>
                        </DropdownMenu>
                         <AlertDialogContent>
                            <AlertDialogHeader>
                                <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                                <AlertDialogDescription>
                                This action cannot be undone. This will permanently delete the fabric.
                                </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                                <AlertDialogCancel>Back</AlertDialogCancel>
                                <AlertDialogAction onClick={handleDelete}>
                                Yes, Delete Fabric
                                </AlertDialogAction>
                            </AlertDialogFooter>
                        </AlertDialogContent>
                    </AlertDialog>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
