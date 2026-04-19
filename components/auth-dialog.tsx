'use client'

import {useState} from 'react'
import {flushSync} from 'react-dom'
import {useForm} from 'react-hook-form'
import {zodResolver} from '@hookform/resolvers/zod'
import {z} from 'zod'
import {Eye, EyeOff} from 'lucide-react'
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogOverlay,
	DialogPortal,
	DialogTitle,
} from '@/components/ui/dialog'
import {Tabs, TabsContent, TabsList, TabsTrigger} from '@/components/ui/tabs'
import {Form, FormControl, FormField, FormItem, FormLabel, FormMessage} from '@/components/ui/form'
import {Input} from '@/components/ui/input'
import {Button} from '@/components/ui/button'
import {useToast} from '@/hooks/use-toast'

const registerSchema = z.object({
    name: z
        .string()
        .min(1, 'Введите имя и фамилию')
        .refine((val) => val.trim().split(/\s+/).length >= 2, 'Введите имя и фамилию через пробел'),
    email: z.string().min(1, 'Введите email').email('Некорректный email'),
    password: z.string().min(6, 'Пароль должен содержать минимум 6 символов'),
    confirmPassword: z.string().min(1, 'Подтвердите пароль'),
}).refine((data) => data.password === data.confirmPassword, {
    message: 'Пароли не совпадают',
    path: ['confirmPassword'],
})

type RegisterFormValues = z.infer<typeof registerSchema>

export interface AuthDialogProps {
    isOpen: boolean
    setIsOpen: (isOpen: boolean) => void
    onAuthSuccess: () => Promise<void> | void
}

export function AuthDialog({isOpen, setIsOpen, onAuthSuccess}: AuthDialogProps) {
    const [mode, setMode] = useState('login')
    const [showPassword, setShowPassword] = useState(false)
    const [isLoading, setIsLoading] = useState(false)
    const {toast} = useToast()

    const handleTabChange = (value: string) => {
        document.documentElement.dataset.tabDirection = value === 'register' ? 'forward' : 'backward'
        if ('startViewTransition' in document) {
            (document as Document & { startViewTransition: (cb: () => void) => void }).startViewTransition(() => {
                flushSync(() => setMode(value))
            })
        } else {
            setMode(value)
        }
    }

    const loginForm = useForm({defaultValues: {email: '', password: ''}})

    const registerForm = useForm<RegisterFormValues>({
        resolver: zodResolver(registerSchema),
        defaultValues: {name: '', email: '', password: '', confirmPassword: ''},
    })

    async function onLoginSubmit() {
        setIsLoading(true)
        try {
            const resp = await fetch('/api/auth', {
                method: 'POST',
                body: JSON.stringify(loginForm.getValues()),
            })
            if (resp.status !== 200) {
                toast({title: 'Ошибка входа', description: 'Неверный email или пароль.', variant: 'destructive'})
                return
            }
            await onAuthSuccess()
            toast({title: 'Добро пожаловать!', description: 'Вы успешно вошли в аккаунт.'})
        } finally {
            setIsLoading(false)
        }
    }

    async function onRegisterSubmit(data: RegisterFormValues) {
        setIsLoading(true)
        try {
            const resp = await fetch('/api/users', {
                method: 'POST',
                body: JSON.stringify(data),
            })
            if (resp.status !== 200) {
                toast({
                    title: 'Ошибка регистрации',
                    description: 'Не удалось создать аккаунт. Попробуйте ещё раз.',
                    variant: 'destructive',
                })
                return
            }
            await onAuthSuccess()
            toast({title: 'Аккаунт создан!', description: 'Добро пожаловать в BakeBay.'})
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogPortal>
                <DialogOverlay className='fixed inset-0 bg-black/30'/>
                <DialogContent
                    className='fixed top-1/2 left-1/2 w-full max-w-md p-6 -translate-x-1/2 -translate-y-1/2 bg-white rounded-lg shadow-lg'>
                    <DialogTitle className='text-lg font-semibold'>Вход в систему</DialogTitle>
                    <DialogDescription className='mt-2 text-sm text-gray-600'>
                        Пожалуйста, введите свои учетные данные для входа.
                    </DialogDescription>
                    <Tabs value={mode} onValueChange={handleTabChange}>
                        <TabsList className='grid w-full grid-cols-2'>
                            <TabsTrigger value='login' className='w-full'>Войти</TabsTrigger>
                            <TabsTrigger value='register' className='w-full'>Зарегистрироваться</TabsTrigger>
                        </TabsList>
                        <div style={{viewTransitionName: 'auth-tab-content', overflow: 'hidden'}}>
                            <TabsContent value='login' className='mt-4 p-1'>
                                <Form {...loginForm}>
                                    <form onSubmit={loginForm.handleSubmit(onLoginSubmit)} className='space-y-4'>
                                        <FormField
                                            control={loginForm.control}
                                            name='email'
                                            render={({field}) => (
                                                <FormItem>
                                                    <FormLabel>Email</FormLabel>
                                                    <FormControl>
                                                        <Input placeholder='your.email@example.com' {...field}/>
                                                    </FormControl>
                                                    <FormMessage/>
                                                </FormItem>
                                            )}
                                        />
                                        <FormField
                                            control={loginForm.control}
                                            name='password'
                                            render={({field}) => (
                                                <FormItem>
                                                    <FormLabel>Пароль</FormLabel>
                                                    <FormControl>
                                                        <div className='relative'>
                                                            <Input
                                                                type={showPassword ? 'text' : 'password'}
                                                                placeholder='••••••••'
                                                                {...field}
                                                            />
                                                            <Button
                                                                type='button'
                                                                variant='ghost'
                                                                size='icon'
                                                                className='absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent'
                                                                onClick={() => setShowPassword(!showPassword)}
                                                            >
                                                                {showPassword
                                                                    ?
                                                                    <EyeOff className='h-4 w-4 text-muted-foreground'/>
                                                                    : <Eye className='h-4 w-4 text-muted-foreground'/>}
                                                                <span className='sr-only'>
																	{showPassword ? 'Скрыть пароль' : 'Показать пароль'}
																</span>
                                                            </Button>
                                                        </div>
                                                    </FormControl>
                                                    <FormMessage/>
                                                </FormItem>
                                            )}
                                        />
                                        <Button type='submit' className='w-full' disabled={isLoading}>
                                            {isLoading ? 'Вход...' : 'Войти'}
                                        </Button>
                                    </form>
                                </Form>
                            </TabsContent>
                            <TabsContent value='register' className='mt-4 p-1'>
                                <DialogDescription className='mb-4 text-sm text-gray-600'>
                                    Заполните все поля чтобы продолжить
                                </DialogDescription>
                                <Form {...registerForm}>
                                    <form
                                        onSubmit={registerForm.handleSubmit((data) => onRegisterSubmit(data))}
                                        className='space-y-4'
                                    >
                                        <FormField
                                            control={registerForm.control}
                                            name='name'
                                            render={({field}) => (
                                                <FormItem>
                                                    <FormLabel>Имя и Фамилия</FormLabel>
                                                    <FormControl>
                                                        <Input placeholder='Иван Иванов' {...field}/>
                                                    </FormControl>
                                                    <FormMessage/>
                                                </FormItem>
                                            )}
                                        />
                                        <FormField
                                            control={registerForm.control}
                                            name='email'
                                            render={({field}) => (
                                                <FormItem>
                                                    <FormLabel>Email</FormLabel>
                                                    <FormControl>
                                                        <Input placeholder='your.email@example.com' {...field}/>
                                                    </FormControl>
                                                    <FormMessage/>
                                                </FormItem>
                                            )}
                                        />
                                        <FormField
                                            control={registerForm.control}
                                            name='password'
                                            render={({field}) => (
                                                <FormItem>
                                                    <FormLabel>Пароль</FormLabel>
                                                    <FormControl>
                                                        <div className='relative'>
                                                            <Input
                                                                type={showPassword ? 'text' : 'password'}
                                                                placeholder='••••••••'
                                                                {...field}
                                                            />
                                                            <Button
                                                                type='button'
                                                                variant='ghost'
                                                                size='icon'
                                                                className='absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent'
                                                                onClick={() => setShowPassword(!showPassword)}
                                                            >
                                                                {showPassword
                                                                    ?
                                                                    <EyeOff className='h-4 w-4 text-muted-foreground'/>
                                                                    : <Eye className='h-4 w-4 text-muted-foreground'/>}
                                                                <span className='sr-only'>
																	{showPassword ? 'Скрыть пароль' : 'Показать пароль'}
																</span>
                                                            </Button>
                                                        </div>
                                                    </FormControl>
                                                    <FormMessage/>
                                                </FormItem>
                                            )}
                                        />
                                        <FormField
                                            control={registerForm.control}
                                            name='confirmPassword'
                                            render={({field}) => (
                                                <FormItem>
                                                    <FormLabel>Подтвердить пароль</FormLabel>
                                                    <FormControl>
                                                        <Input
                                                            type={showPassword ? 'text' : 'password'}
                                                            placeholder='••••••••'
                                                            {...field}
                                                        />
                                                    </FormControl>
                                                    <FormMessage/>
                                                </FormItem>
                                            )}
                                        />
                                        <Button type='submit' className='w-full' disabled={isLoading}>
                                            {isLoading ? 'Создание...' : 'Создать аккаунт'}
                                        </Button>
                                    </form>
                                </Form>
                            </TabsContent>
                        </div>
                    </Tabs>
                </DialogContent>
            </DialogPortal>
        </Dialog>
    )
}
