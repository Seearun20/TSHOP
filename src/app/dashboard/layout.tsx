"use client"
import Link from "next/link";
import {
  LayoutDashboard,
  Users,
  Package,
  Scissors,
  User,
  LogOut,
  Shirt,
  HandPlatter,
  DollarSign,
} from "lucide-react";
import {
  SidebarProvider,
  Sidebar,
  SidebarHeader,
  SidebarContent,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarFooter,
  SidebarTrigger,
  SidebarInset,
} from "@/components/ui/sidebar";
import { AppLogo } from "@/components/app-logo";
import { Button } from "@/components/ui/button";
import { usePathname } from "next/navigation";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { useEffect, useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { errorEmitter } from "@/firebase/error-emitter";
import { FirestorePermissionError } from "@/firebase/errors";
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuLabel, DropdownMenuItem, DropdownMenuSeparator } from "@/components/ui/dropdown-menu";
import { Dialog, DialogTrigger, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";

function ChangePasswordDialog() {
    const [open, setOpen] = useState(false);
    const { toast } = useToast();

    const handleChangePassword = (e: React.FormEvent) => {
        e.preventDefault();
        // This is a placeholder. In a real app, you would have logic
        // to securely change the password on the backend.
        toast({
            title: "Password Updated (Simulated)",
            description: "In a real app, your password would now be changed.",
        });
        setOpen(false);
    }
    
    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <DropdownMenuItem onSelect={(e) => e.preventDefault()}>Change Password</DropdownMenuItem>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
                <form onSubmit={handleChangePassword}>
                    <DialogHeader>
                        <DialogTitle>Change Password</DialogTitle>
                        <DialogDescription>
                            Enter your old and new passwords below.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="old-password" className="text-right">
                                Old Password
                            </Label>
                            <Input id="old-password" type="password" className="col-span-3" />
                        </div>
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="new-password" className="text-right">
                                New Password
                            </Label>
                            <Input id="new-password" type="password" className="col-span-3" />
                        </div>
                         <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="confirm-password" className="text-right">
                                Confirm New
                            </Label>
                            <Input id="confirm-password" type="password" className="col-span-3" />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button type="submit">Save changes</Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const { toast } = useToast();

  useEffect(() => {
    const handlePermissionError = (error: FirestorePermissionError) => {
      console.error("Caught Firestore Permission Error:", error.toObject());
      toast({
        variant: "destructive",
        title: "Permission Denied",
        description: error.message,
      });
    };

    errorEmitter.on("permission-error", handlePermissionError);

    return () => {
      errorEmitter.off("permission-error", handlePermissionError);
    };
  }, [toast]);

  const isActive = (path: string) => pathname === path;
  const isParentActive = (path: string) => pathname.startsWith(path);

  return (
    <SidebarProvider>
      <Sidebar>
        <SidebarHeader>
          <div className="flex items-center gap-2">
            <AppLogo className="w-8 h-8" />
            <span className="text-lg font-semibold font-headline text-sidebar-foreground">
              Raghav Tailors
            </span>
          </div>
        </SidebarHeader>
        <SidebarContent>
          <SidebarMenu>
            <SidebarMenuItem>
              <Link href="/dashboard" passHref>
                <SidebarMenuButton isActive={isActive('/dashboard')} tooltip="Dashboard">
                  <LayoutDashboard />
                  <span>Dashboard</span>
                </SidebarMenuButton>
              </Link>
            </SidebarMenuItem>

             <Accordion type="multiple" className="w-full" defaultValue={isParentActive('/dashboard/stock') ? ['stock'] : []}>
              <AccordionItem value="stock" className="border-none">
                <AccordionTrigger className="hover:no-underline [&[data-state=open]>svg]:text-sidebar-accent-foreground p-2 text-sm rounded-md text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground data-[active=true]:bg-sidebar-accent data-[active=true]:font-medium data-[active=true]:text-sidebar-accent-foreground">
                  <div className="flex items-center gap-2">
                    <Package />
                    <span>Stock</span>
                  </div>
                </AccordionTrigger>
                <AccordionContent className="p-0 pl-4">
                   <SidebarMenu className="py-2">
                      <SidebarMenuItem>
                        <Link href="/dashboard/stock/readymade" passHref>
                          <SidebarMenuButton isActive={isActive('/dashboard/stock/readymade')} variant="ghost" size="sm">
                            <Shirt/>
                            <span>Ready-Made</span>
                          </SidebarMenuButton>
                        </Link>
                      </SidebarMenuItem>
                      <SidebarMenuItem>
                        <Link href="/dashboard/stock/fabric" passHref>
                          <SidebarMenuButton isActive={isActive('/dashboard/stock/fabric')} variant="ghost" size="sm">
                            <HandPlatter />
                            <span>Fabric</span>
                          </SidebarMenuButton>
                        </Link>
                      </SidebarMenuItem>
                    </SidebarMenu>
                </AccordionContent>
              </AccordionItem>
            </Accordion>
            
            <Accordion type="multiple" className="w-full" defaultValue={isParentActive('/dashboard/orders') || isParentActive('/dashboard/outstanding-payments') ? ['orders'] : []}>
              <AccordionItem value="orders" className="border-none">
                <AccordionTrigger className="hover:no-underline [&[data-state=open]>svg]:text-sidebar-accent-foreground p-2 text-sm rounded-md text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground data-[active=true]:bg-sidebar-accent data-[active=true]:font-medium data-[active=true]:text-sidebar-accent-foreground">
                   <div className="flex items-center gap-2">
                    <Scissors />
                    <span>Orders</span>
                  </div>
                </AccordionTrigger>
                <AccordionContent className="p-0 pl-4">
                   <SidebarMenu className="py-2">
                      <SidebarMenuItem>
                        <Link href="/dashboard/orders/new" passHref>
                          <SidebarMenuButton isActive={isActive('/dashboard/orders/new')} variant="ghost" size="sm">
                            <span>New Order</span>
                          </SidebarMenuButton>
                        </Link>
                      </SidebarMenuItem>
                      <SidebarMenuItem>
                        <Link href="/dashboard/orders" passHref>
                          <SidebarMenuButton isActive={isActive('/dashboard/orders')} variant="ghost" size="sm">
                            <span>All Orders</span>
                          </SidebarMenuButton>
                        </Link>
                      </SidebarMenuItem>
                       <SidebarMenuItem>
                        <Link href="/dashboard/outstanding-payments" passHref>
                          <SidebarMenuButton isActive={isActive('/dashboard/outstanding-payments')} variant="ghost" size="sm">
                            <span>Outstanding</span>
                          </SidebarMenuButton>
                        </Link>
                      </SidebarMenuItem>
                    </SidebarMenu>
                </AccordionContent>
              </AccordionItem>
            </Accordion>
            
            <SidebarMenuItem>
              <Link href="/dashboard/customers" passHref>
                <SidebarMenuButton isActive={isActive('/dashboard/customers')} tooltip="Customers">
                  <Users />
                  <span>Customers</span>
                </SidebarMenuButton>
              </Link>
            </SidebarMenuItem>

            <SidebarMenuItem>
              <Link href="/dashboard/employees" passHref>
                <SidebarMenuButton isActive={isActive('/dashboard/employees')} tooltip="Employees">
                  <User />
                  <span>Employees</span>
                </SidebarMenuButton>
              </Link>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarContent>
        <SidebarFooter>
          <Link href="/" passHref>
            <SidebarMenuButton>
              <LogOut />
              <span>Logout</span>
            </SidebarMenuButton>
          </Link>
        </SidebarFooter>
      </Sidebar>
      <SidebarInset>
        <header className="flex items-center justify-between p-4 bg-background border-b">
           <SidebarTrigger className="md:hidden"/>
           <div className="flex-1"></div>
            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon">
                        <User />
                    </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                    <DropdownMenuLabel>My Account</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <ChangePasswordDialog />
                    <Link href="/" passHref>
                      <DropdownMenuItem>Logout</DropdownMenuItem>
                    </Link>
                </DropdownMenuContent>
            </DropdownMenu>
        </header>
        <main className="p-4 sm:p-6 lg:p-8 bg-background">
            {children}
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
}
