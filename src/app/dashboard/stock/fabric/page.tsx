
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
import { useState, useEffect, memo } from "react";
import { db } from "@/lib/firebase";
import { collection, addDoc, onSnapshot, doc, deleteDoc, updateDoc, DocumentData } from "firebase/firestore";
import { errorEmitter } from "@/firebase/error-emitter";
import { FirestorePermissionError } from "@/firebase/errors";
import { Separator } from "@/components/ui/separator";

export interface FabricStockItem {
    id: string;
    type: string;
    length: number;
    costPerMtr: number;
    supplier: string;
    supplierPhone: string;
}

const fabricSchema = z.object({
  type: z.string().min(1, { message: "Fabric type is required" }),
  length: z.coerce.number().min(0, { message: "Length must be a positive number" }),
  costPerMtr: z.coerce.number().min(0, { message: "Cost must be a positive number" }),
  supplier: z.string().min(1, { message: "Supplier name is required" }),
  supplierPhone: z.string().min(10, { message: "Supplier phone must be at least 10 digits" }),
});

type FabricFormValues = z.infer<typeof fabricSchema>;


const FabricForm = memo(function FabricForm({ setOpen, fabricItem }: { setOpen: (open: boolean) => void; fabricItem?: FabricStockItem | null }) {
  const { toast } = useToast();
  const isEditMode = !!fabricItem;
  
  const form = useForm<FabricFormValues>({
    resolver: zodResolver(fabricSchema),
    defaultValues: fabricItem || {
      type: "",
      length: 0,
      costPerMtr: 0,
      supplier: "",
      supplierPhone: "",
    },
  });

  const { formState: { isSubmitting } } = form;

  const onSubmit = async (values: FabricFormValues) => {
    try {
        if (isEditMode && fabricItem) {
            const fabricDoc = doc(db, "fabricStock", fabricItem.id);
            await updateDoc(fabricDoc, values);
            toast({
                title: "Fabric Updated!",
                description: `Successfully updated ${values.type}.`,
            });
        } else {
            await addDoc(collection(db, "fabricStock"), values);
            toast({
                title: "Fabric Added!",
                description: `Successfully added ${values.length} meters of ${values.type}.`,
            });
        }
        setOpen(false);
        form.reset();
    } catch (error) {
        const path = isEditMode && fabricItem ? doc(db, "fabricStock", fabricItem.id).path : collection(db, "fabricStock").path;
        const permissionError = new FirestorePermissionError({
            path,
            operation: isEditMode ? "update" : "create",
            requestResourceData: values,
        });
        errorEmitter.emit("permission-error", permissionError);
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
                  <Input type="number" step="0.01" {...field} />
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
                  <Input type="number" step="0.01" placeholder="Cost per meter" {...field} />
                  </FormControl>
                  <FormMessage />
              </FormItem>
              )}
          />
        </div>
        <Separator />
        <h3 className="text-sm font-medium text-muted-foreground">Supplier Details</h3>
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
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
            <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? <Loader2 className="animate-spin" /> : (isEditMode ? "Save Changes" : "Add to Inventory")}
            </Button>
        </DialogFooter>
      </form>
    </Form>
  );
});

const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
    }).format(amount);
};

function ViewFabricDetailsDialog({ fabricItem, setOpen }: { fabricItem: FabricStockItem, setOpen: (open: boolean) => void }) {
    return (
        <DialogContent>
            <DialogHeader>
                <DialogTitle>{fabricItem.type}</DialogTitle>
                <DialogDescription>Details for the selected fabric.</DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
                <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                        <p className="text-muted-foreground">Length</p>
                        <p className="font-medium">{fabricItem.length} meters</p>
                    </div>
                    <div>
                        <p className="text-muted-foreground">Cost per Meter</p>
                        <p className="font-medium">{formatCurrency(fabricItem.costPerMtr)}</p>
                    </div>
                    <div>
                        <p className="text-muted-foreground">Total Cost Value</p>
                        <p className="font-medium">{formatCurrency(fabricItem.length * fabricItem.costPerMtr)}</p>
                    </div>
                </div>
                <Separator />
                <h4 className="font-medium text-muted-foreground">Supplier Information</h4>
                <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                        <p className="text-muted-foreground">Supplier Name</p>
                        <p className="font-medium">{fabricItem.supplier}</p>
                    </div>
                    <div>
                        <p className="text-muted-foreground">Supplier Phone</p>
                        <p className="font-medium">{fabricItem.supplierPhone}</p>
                    </div>
                </div>
            </div>
            <DialogFooter>
                <Button variant="outline" onClick={() => setOpen(false)}>Close</Button>
            </DialogFooter>
        </DialogContent>
    )
}

export default function FabricStockPage() {
  const { toast } = useToast();
  const [fabricStock, setFabricStock] = useState<FabricStockItem[]>([]);
  const [currentItem, setCurrentItem] = useState<FabricStockItem | null>(null);
  const [dialogs, setDialogs] = useState({
      add: false,
      edit: false,
      view: false,
      delete: false,
  });

  useEffect(() => {
    const fabricStockCollection = collection(db, "fabricStock");
    const unsubscribe = onSnapshot(fabricStockCollection, (snapshot) => {
        const stockData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as FabricStockItem));
        setFabricStock(stockData);
    },
    (error) => {
        const permissionError = new FirestorePermissionError({
          path: fabricStockCollection.path,
          operation: "list",
        });
        errorEmitter.emit("permission-error", permissionError);
    });
    return () => unsubscribe();
  }, []);

  const handleActionClick = (item: FabricStockItem, dialog: keyof typeof dialogs) => {
    setCurrentItem(item);
    setDialogs(prev => ({ ...prev, [dialog]: true }));
  };

  const handleDelete = async () => {
    if (!currentItem) return;
    const fabricDoc = doc(db, "fabricStock", currentItem.id);
    deleteDoc(fabricDoc)
        .then(() => {
            toast({
                variant: "destructive",
                title: "Fabric Deleted",
                description: `${currentItem.type} has been removed from your inventory.`
            });
        })
        .catch((error) => {
            const permissionError = new FirestorePermissionError({
                path: fabricDoc.path,
                operation: "delete",
            });
            errorEmitter.emit("permission-error", permissionError);
        });
    setDialogs(prev => ({ ...prev, delete: false }));
  }

  return (
    <div className="space-y-8">
      <PageHeader title="Fabric Stock" subtitle="Manage your fabric inventory.">
         <Dialog open={dialogs.add} onOpenChange={(open) => setDialogs(p => ({...p, add: open}))}>
            <DialogTrigger asChild>
                <Button onClick={() => { setCurrentItem(null); setDialogs(p => ({...p, add: true})) }}>
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
                <FabricForm setOpen={(open) => setDialogs(p => ({...p, add: open}))}/>
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
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                          <Button variant="ghost" className="h-8 w-8 p-0">
                          <span className="sr-only">Open menu</span>
                          <MoreHorizontal className="h-4 w-4" />
                          </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                          <DropdownMenuLabel>Actions</DropdownMenuLabel>
                          <DropdownMenuItem onSelect={() => handleActionClick(item, 'edit')}>Edit</DropdownMenuItem>
                          <DropdownMenuItem onSelect={() => handleActionClick(item, 'view')}>View Details</DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem className="text-destructive" onSelect={() => handleActionClick(item, 'delete')}>
                              Delete
                          </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {currentItem && (
        <>
            <Dialog open={dialogs.edit} onOpenChange={(open) => setDialogs(p => ({...p, edit: open}))}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Edit Fabric Details</DialogTitle>
                        <DialogDescription>Update the details for {currentItem.type}.</DialogDescription>
                    </DialogHeader>
                    <FabricForm setOpen={(open) => setDialogs(p => ({...p, edit: open}))} fabricItem={currentItem} />
                </DialogContent>
            </Dialog>

            <Dialog open={dialogs.view} onOpenChange={(open) => setDialogs(p => ({...p, view: open}))}>
                <ViewFabricDetailsDialog fabricItem={currentItem} setOpen={(open) => setDialogs(p => ({...p, view: open}))}/>
            </Dialog>

            <AlertDialog open={dialogs.delete} onOpenChange={(open) => setDialogs(p => ({...p, delete: open}))}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                        <AlertDialogDescription>
                        This action cannot be undone. This will permanently delete the {currentItem.type} fabric.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Back</AlertDialogCancel>
                        <AlertDialogAction onClick={handleDelete} className="bg-destructive hover:bg-destructive/90">
                        Yes, Delete Fabric
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </>
      )}

    </div>
  );
}

    