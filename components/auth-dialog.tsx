// import {
//     Dialog,
//     DialogContent,
//     DialogDescription, DialogHeader,
//     DialogOverlay,
//     DialogPortal,
//     DialogTitle,
//     DialogTrigger
// } from "@/components/ui/dialog";
// import {Tabs, TabsContent, TabsList, TabsTrigger} from "@/components/ui/tabs";
// import { useState } from "react";
// import {Form, FormControl, FormField, FormItem, FormLabel, FormMessage} from "@/components/ui/form";
// import {useForm} from "react-hook-form";
// import {Input} from "@/components/ui/input";
// import { Button } from "./ui/button";
// import {Eye, EyeOff} from "lucide-react";
//
// interface AuthDialogProps {
//     isOpen: boolean;
//     setIsOpen: (isOpen: boolean) => void
// }
// export default function AuthDialog({isOpen, setIsOpen}: AuthDialogProps) {
//     const [mode, setMode] = useState("login");
//     const [showPassword, setShowPassword] = useState(false);
//     const [isLoading, setIsLoading] = useState(false);
//
//     const handleDialogOpenChange = (open: boolean) => {
//         console.log("Dialog onOpenChange called", open);
//         setIsOpen(open);
//     };
//
//     const loginForm = useForm({
//          defaultValues: {
//             email: "",
//             password: "",
//          }
//     });
//
//     const registerForm = useForm({
//         defaultValues: {
//             name: "",
//             email: "",
//             password: "",
//             confirmPassword: "",
//         }
//     });
//
//     function onLoginSubmit(){
//         setIsLoading(true);
//         console.log("Login form submitted", loginForm.getValues());
//     }
//
//     function onRegisterSubmit() {
//         setIsLoading(true);
//         console.log("Register form submitted", registerForm.getValues());
//     }
//
//     return (
//         <Dialog open={isOpen} onOpenChange={handleDialogOpenChange}>
//             <DialogTrigger className="btn btn-primary">Войти</DialogTrigger>
//             <DialogPortal>
//                 <DialogOverlay className="fixed inset-0 bg-black/30" />
//                 <DialogContent className="fixed top-1/2 left-1/2 w-full max-w-md p-6 -translate-x-1/2 -translate-y-1/2 bg-white rounded-lg shadow-lg">
//                     <DialogTitle className="text-lg font-semibold">Вход в систему</DialogTitle>
//                     <DialogDescription className="mt-2 text-sm text-gray-600">
//                         Пожалуйста, введите свои учетные данные для входа.
//                     </DialogDescription>
//                     <Tabs defaultValue={mode} onValueChange={(value) => setMode(value)}>
//                         <TabsList className="grid w-full grid-cols-2">
//                             <TabsTrigger value="login" className="w-full">
//                                 Войти
//                             </TabsTrigger>
//                             <TabsTrigger value="register" className="w-full">
//                                 Зарегистрироваться
//                             </TabsTrigger>
//                         </TabsList>
//                         <TabsContent value="login" className="mt-4">
//                             <Form {...loginForm}>
//                                 <form onSubmit={loginForm.handleSubmit(onLoginSubmit)} className="space-y-4">
//                                     <FormField
//                                         control={loginForm.control}
//                                         name="email"
//                                         render={({ field }) => (
//                                             <FormItem>
//                                                 <FormLabel>Email</FormLabel>
//                                                 <FormControl>
//                                                     <Input placeholder="your.email@example.com" {...field} />
//                                                 </FormControl>
//                                                 <FormMessage />
//                                             </FormItem>
//                                         )}
//                                     />
//                                     <FormField
//                                         control={loginForm.control}
//                                         name="password"
//                                         render={({ field }) => (
//                                             <FormItem>
//                                                 <FormLabel>Password</FormLabel>
//                                                 <FormControl>
//                                                     <div className="relative">
//                                                         <Input type={showPassword ? "text" : "password"} placeholder="••••••••" {...field} />
//                                                         <Button
//                                                             type="button"
//                                                             variant="ghost"
//                                                             size="icon"
//                                                             className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
//                                                             onClick={() => setShowPassword(!showPassword)}
//                                                         >
//                                                             {showPassword ? (
//                                                                 <EyeOff className="h-4 w-4 text-muted-foreground" />
//                                                             ) : (
//                                                                 <Eye className="h-4 w-4 text-muted-foreground" />
//                                                             )}
//                                                             <span className="sr-only">{showPassword ? "Hide password" : "Show password"}</span>
//                                                         </Button>
//                                                     </div>
//                                                 </FormControl>
//                                                 <div className="flex justify-end">
//                                                     <Button
//                                                         variant="link"
//                                                         className="px-0 text-xs"
//                                                         onClick={(e) => {
//                                                             e.preventDefault()
//                                                             setMode("reset")
//                                                         }}
//                                                     >
//                                                         Forgot password?
//                                                     </Button>
//                                                 </div>
//                                                 <FormMessage />
//                                             </FormItem>
//                                         )}
//                                     />
//
//                                     <Button type="submit" className="w-full" disabled={isLoading}>
//                                         {isLoading ? "Signing in..." : "Sign In"}
//                                     </Button>
//                                 </form>
//                             </Form>
//                         </TabsContent>
//                         <TabsContent value="register" className="mt-4">
//                             <DialogHeader>
//                                 <DialogTitle>Create an account</DialogTitle>
//                                 <DialogDescription>Fill in your details to get started</DialogDescription>
//                             </DialogHeader>
//
//                             <div className="py-4">
//                                 <Form {...registerForm}>
//                                     <form onSubmit={registerForm.handleSubmit(onRegisterSubmit)} className="space-y-4">
//                                         <FormField
//                                             control={registerForm.control}
//                                             name="name"
//                                             render={({ field }) => (
//                                                 <FormItem>
//                                                     <FormLabel>Name</FormLabel>
//                                                     <FormControl>
//                                                         <Input placeholder="John Doe" {...field} />
//                                                     </FormControl>
//                                                     <FormMessage />
//                                                 </FormItem>
//                                             )}
//                                         />
//
//                                         <FormField
//                                             control={registerForm.control}
//                                             name="email"
//                                             render={({ field }) => (
//                                                 <FormItem>
//                                                     <FormLabel>Email</FormLabel>
//                                                     <FormControl>
//                                                         <Input placeholder="your.email@example.com" {...field} />
//                                                     </FormControl>
//                                                     <FormMessage />
//                                                 </FormItem>
//                                             )}
//                                         />
//
//                                         <FormField
//                                             control={registerForm.control}
//                                             name="password"
//                                             render={({ field }) => (
//                                                 <FormItem>
//                                                     <FormLabel>Password</FormLabel>
//                                                     <FormControl>
//                                                         <div className="relative">
//                                                             <Input
//                                                                 type={showPassword ? "text" : "password"}
//                                                                 placeholder="••••••••"
//                                                                 {...field}
//                                                                 onChange={(e) => {
//                                                                     field.onChange(e)
//                                                                 }}
//                                                             />
//                                                             <Button
//                                                                 type="button"
//                                                                 variant="ghost"
//                                                                 size="icon"
//                                                                 className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
//                                                                 onClick={() => setShowPassword(!showPassword)}
//                                                             >
//                                                                 {showPassword ? (
//                                                                     <EyeOff className="h-4 w-4 text-muted-foreground" />
//                                                                 ) : (
//                                                                     <Eye className="h-4 w-4 text-muted-foreground" />
//                                                                 )}
//                                                                 <span className="sr-only">{showPassword ? "Скрыть пароль" : "Показать пароль"}</span>
//                                                             </Button>
//                                                         </div>
//                                                     </FormControl>
//                                                     <FormMessage />
//                                                 </FormItem>
//                                             )}
//                                         />
//
//                                         <FormField
//                                             control={registerForm.control}
//                                             name="confirmPassword"
//                                             render={({ field }) => (
//                                                 <FormItem>
//                                                     <FormLabel>Подтвердить пароль</FormLabel>
//                                                     <FormControl>
//                                                         <Input type={showPassword ? "text" : "password"} placeholder="••••••••" {...field} />
//                                                     </FormControl>
//                                                     <FormMessage />
//                                                 </FormItem>
//                                             )}
//                                         />
//
//                                         <Button type="submit" className="w-full" disabled={isLoading}>
//                                             {isLoading ? "Создание..." : "Создать аккаунт"}
//                                         </Button>
//                                     </form>
//                                 </Form>
//                             </div>
//                         </TabsContent>
//                     </Tabs>
//                 </DialogContent>
//             </DialogPortal>
//         </Dialog>
//     )
// }