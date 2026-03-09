import '@testing-library/jest-dom'
import {render, screen, fireEvent, waitFor, act} from '@testing-library/react'
import {UserNav} from './user-nav'
import {UserProvider} from '@/contexts/user-context'

function renderWithUser(ui: React.ReactElement) {
    return render(<UserProvider>{ui}</UserProvider>)
}

// ─── Mocks ──────────────────────────────────────────────────────────────────

const pushMock = jest.fn()
const refreshMock = jest.fn()

jest.mock('next/navigation', () => ({
    useRouter: () => ({push: pushMock, refresh: refreshMock}),
}))

// Mock Radix DropdownMenu so that it renders its content immediately
// (without pointer-events workaround in jsdom)
jest.mock('@/components/ui/dropdown-menu', () => {
    const React = require('react')
    const DropdownMenu = ({children}: any) => <div>{children}</div>
    const DropdownMenuTrigger = ({children, asChild}: any) => {
        if (asChild) return React.cloneElement(children, {'data-testid': 'dropdown-trigger'})
        return <div data-testid="dropdown-trigger">{children}</div>
    }
    const DropdownMenuContent = ({children}: any) => (
        <div data-testid="dropdown-content">{children}</div>
    )
    const DropdownMenuLabel = ({children}: any) => <div>{children}</div>
    const DropdownMenuGroup = ({children}: any) => <div>{children}</div>
    const DropdownMenuItem = ({children, onClick}: any) => (
        <button onClick={onClick}>{children}</button>
    )
    const DropdownMenuSeparator = () => <hr/>
    return {
        DropdownMenu,
        DropdownMenuTrigger,
        DropdownMenuContent,
        DropdownMenuLabel,
        DropdownMenuGroup,
        DropdownMenuItem,
        DropdownMenuSeparator,
    }
})

// localStorage mock
const localStorageMock = (() => {
    let store: Record<string, string> = {}
    return {
        getItem: (key: string) => store[key] ?? null,
        setItem: (key: string, value: string) => {
            store[key] = value
        },
        removeItem: (key: string) => {
            delete store[key]
        },
        clear: () => {
            store = {}
        },
    }
})()

Object.defineProperty(window, 'localStorage', {value: localStorageMock, writable: true})

// ─── Helpers ─────────────────────────────────────────────────────────────────

const CUSTOMER_USER = {
    user_id: 1,
    first_name: 'Иван',
    last_name: 'Иванов',
    email: 'ivan@test.com',
    user_role: 'customer',
}

const SELLER_USER = {
    user_id: 2,
    first_name: 'Мария',
    last_name: 'Петрова',
    email: 'maria@test.com',
    user_role: 'seller',
}

function mockFetchUserInfo(user: typeof CUSTOMER_USER | typeof SELLER_USER) {
    global.fetch = jest.fn().mockImplementation((url: string) => {
        if (url === '/api/users/me') {
            return Promise.resolve({
                ok: true,
                json: () => Promise.resolve(user),
            })
        }
        if (url.startsWith('/api/sellers')) {
            return Promise.resolve({
                ok: true,
                json: () => Promise.resolve([{seller_id: 1}]),
            })
        }
        return Promise.reject(new Error(`Unexpected fetch: ${url}`))
    }) as jest.Mock
}

function mockFetchLoginSuccess(token: string, user: typeof CUSTOMER_USER) {
    global.fetch = jest.fn().mockImplementation((url: string) => {
        if (url === '/api/auth') {
            return Promise.resolve({
                status: 200,
                json: () => Promise.resolve({token}),
            })
        }
        if (url === '/api/users/me') {
            return Promise.resolve({
                ok: true,
                json: () => Promise.resolve(user),
            })
        }
        if (url.startsWith('/api/sellers')) {
            return Promise.resolve({
                ok: true,
                json: () => Promise.resolve([]),
            })
        }
        return Promise.reject(new Error(`Unexpected fetch: ${url}`))
    }) as jest.Mock
}

function mockFetchRegisterSuccess(token: string, user: typeof CUSTOMER_USER) {
    global.fetch = jest.fn().mockImplementation((url: string) => {
        if (url === '/api/users') {
            return Promise.resolve({
                status: 200,
                json: () => Promise.resolve({token}),
            })
        }
        if (url === '/api/users/me') {
            return Promise.resolve({
                ok: true,
                json: () => Promise.resolve(user),
            })
        }
        if (url.startsWith('/api/sellers')) {
            return Promise.resolve({
                ok: true,
                json: () => Promise.resolve([]),
            })
        }
        return Promise.reject(new Error(`Unexpected fetch: ${url}`))
    }) as jest.Mock
}

beforeEach(() => {
    localStorageMock.clear()
    pushMock.mockClear()
    refreshMock.mockClear()
    jest.clearAllMocks()
})

// ── 1. Unauthenticated state ──────────────────────────────────────────────────

describe('Неавторизованный пользователь', () => {
    beforeEach(() => {
        global.fetch = jest.fn() as jest.Mock
    })

    it('показывает "Вы вошли как гость" в заголовке дропдауна', () => {
        renderWithUser(<UserNav/>)
        expect(screen.getByText('Вы вошли как гость')).toBeInTheDocument()
    })

    it('показывает кнопку "Войти"', () => {
        renderWithUser(<UserNav/>)
        expect(screen.getByText('Войти')).toBeInTheDocument()
    })

    it('НЕ показывает пункты меню Профиль, Заказы, Избранное', () => {
        renderWithUser(<UserNav/>)
        expect(screen.queryByText('Профиль')).not.toBeInTheDocument()
        expect(screen.queryByText('Заказы')).not.toBeInTheDocument()
        expect(screen.queryByText('Избранное')).not.toBeInTheDocument()
    })

    it('НЕ показывает "Панель продавца"', () => {
        renderWithUser(<UserNav/>)
        expect(screen.queryByText('Панель продавца')).not.toBeInTheDocument()
    })

    it('НЕ вызывает fetch при отсутствии токена', async () => {
        renderWithUser(<UserNav/>)
        await act(async () => {
        }) // flush effects
        expect(global.fetch).not.toHaveBeenCalled()
    })
})

// ── 2. Authenticated customer ─────────────────────────────────────────────────

describe('Авторизованный пользователь (customer)', () => {
    beforeEach(() => {
        localStorageMock.setItem('auth', 'mock-customer-token')
        mockFetchUserInfo(CUSTOMER_USER)
    })

    it('показывает имя и email пользователя', async () => {
        renderWithUser(<UserNav/>)
        await waitFor(() => {
            expect(screen.getByText('Иван Иванов')).toBeInTheDocument()
        })
        expect(screen.getByText('ivan@test.com')).toBeInTheDocument()
    })

    it('показывает инициалы в аватаре', async () => {
        renderWithUser(<UserNav/>)
        await waitFor(() => {
            expect(screen.getByText('ИИ')).toBeInTheDocument()
        })
    })

    it('показывает пункты меню Профиль, Заказы, Избранное', async () => {
        renderWithUser(<UserNav/>)
        await waitFor(() => screen.getByText('Иван Иванов'))
        expect(screen.getByText('Профиль')).toBeInTheDocument()
        expect(screen.getByText('Заказы')).toBeInTheDocument()
        expect(screen.getByText('Избранное')).toBeInTheDocument()
    })

    it('НЕ показывает "Панель продавца" для customer', async () => {
        renderWithUser(<UserNav/>)
        await waitFor(() => screen.getByText('Иван Иванов'))
        expect(screen.queryByText('Панель продавца')).not.toBeInTheDocument()
    })

    it('показывает кнопку "Выйти"', async () => {
        renderWithUser(<UserNav/>)
        await waitFor(() => screen.getByText('Иван Иванов'))
        expect(screen.getByText('Выйти')).toBeInTheDocument()
    })

    it('выход очищает данные, убирает меню и переходит на главную', async () => {
        renderWithUser(<UserNav/>)
        await waitFor(() => screen.getByText('Иван Иванов'))

        fireEvent.click(screen.getByText('Выйти'))

        expect(localStorageMock.getItem('auth')).toBeNull()
        expect(pushMock).toHaveBeenCalledWith('/')
        await waitFor(() => {
            expect(screen.queryByText('Иван Иванов')).not.toBeInTheDocument()
        })
    })

    it('переход по "Профиль" вызывает router.push("/profile")', async () => {
        renderWithUser(<UserNav/>)
        await waitFor(() => screen.getByText('Иван Иванов'))
        fireEvent.click(screen.getByText('Профиль'))
        expect(pushMock).toHaveBeenCalledWith('/profile')
    })

    it('переход по "Заказы" вызывает router.push("/orders")', async () => {
        renderWithUser(<UserNav/>)
        await waitFor(() => screen.getByText('Иван Иванов'))
        fireEvent.click(screen.getByText('Заказы'))
        expect(pushMock).toHaveBeenCalledWith('/orders')
    })
})

// ── 3. Authenticated seller ───────────────────────────────────────────────────

describe('Авторизованный пользователь (seller)', () => {
    beforeEach(() => {
        localStorageMock.setItem('auth', 'mock-seller-token')
        mockFetchUserInfo(SELLER_USER)
    })

    it('показывает "Панель продавца" для seller', async () => {
        renderWithUser(<UserNav/>)
        await waitFor(() => screen.getByText('Мария Петрова'))
        expect(screen.getByText('Панель продавца')).toBeInTheDocument()
    })

    it('переход по "Панель продавца" вызывает router.push("/seller-dashboard")', async () => {
        renderWithUser(<UserNav/>)
        await waitFor(() => screen.getByText('Мария Петрова'))
        fireEvent.click(screen.getByText('Панель продавца'))
        expect(pushMock).toHaveBeenCalledWith('/seller-dashboard')
    })

    it('показывает правильные инициалы продавца', async () => {
        renderWithUser(<UserNav/>)
        await waitFor(() => {
            expect(screen.getByText('МП')).toBeInTheDocument()
        })
    })

    it('показывает имя и email продавца', async () => {
        renderWithUser(<UserNav/>)
        await waitFor(() => {
            expect(screen.getByText('Мария Петрова')).toBeInTheDocument()
        })
        expect(screen.getByText('maria@test.com')).toBeInTheDocument()
    })
})

// ── 4. Login flow ─────────────────────────────────────────────────────────────

describe('Форма входа', () => {
    it('после успешного логина сохраняет токен в localStorage', async () => {
        mockFetchLoginSuccess('new-token-123', CUSTOMER_USER)

        renderWithUser(<UserNav/>)

        // Click "Войти" to open dialog
        fireEvent.click(screen.getByText('Войти'))

        await waitFor(() => {
            expect(screen.getByText('Вход в систему')).toBeInTheDocument()
        })

        // Fill and submit login form
        fireEvent.change(screen.getByPlaceholderText('your.email@example.com'), {
            target: {value: 'ivan@test.com'},
        })
        fireEvent.change(screen.getByPlaceholderText('••••••••'), {
            target: {value: 'password123'},
        })

        await act(async () => {
            fireEvent.click(screen.getByRole('button', {name: 'Войти'}))
        })

        await waitFor(() => {
            expect(localStorageMock.getItem('auth')).toBe('new-token-123')
        })
    })

    it('после успешного логина отображает данные пользователя', async () => {
        mockFetchLoginSuccess('new-token-123', CUSTOMER_USER)

        renderWithUser(<UserNav/>)
        fireEvent.click(screen.getByText('Войти'))
        await waitFor(() => screen.getByText('Вход в систему'))

        fireEvent.change(screen.getByPlaceholderText('your.email@example.com'), {
            target: {value: 'ivan@test.com'},
        })
        fireEvent.change(screen.getByPlaceholderText('••••••••'), {
            target: {value: 'password123'},
        })

        await act(async () => {
            fireEvent.click(screen.getByRole('button', {name: 'Войти'}))
        })

        await waitFor(() => {
            expect(screen.getByText('Иван Иванов')).toBeInTheDocument()
        })
    })

    it('вызывает POST /api/auth с корректными данными формы', async () => {
        mockFetchLoginSuccess('new-token', CUSTOMER_USER)

        renderWithUser(<UserNav/>)
        fireEvent.click(screen.getByText('Войти'))
        await waitFor(() => screen.getByText('Вход в систему'))

        fireEvent.change(screen.getByPlaceholderText('your.email@example.com'), {
            target: {value: 'test@test.com'},
        })
        fireEvent.change(screen.getByPlaceholderText('••••••••'), {
            target: {value: 'mypassword'},
        })

        await act(async () => {
            fireEvent.click(screen.getByRole('button', {name: 'Войти'}))
        })

        await waitFor(() => {
            const calls = (global.fetch as jest.Mock).mock.calls
            const authCall = calls.find(([url]: [string]) => url === '/api/auth')
            expect(authCall).toBeDefined()
            const body = JSON.parse(authCall[1].body)
            expect(body.email).toBe('test@test.com')
            expect(body.password).toBe('mypassword')
        })
    })

    it('после логина вызывает /api/users/me для получения профиля', async () => {
        mockFetchLoginSuccess('new-token', CUSTOMER_USER)

        renderWithUser(<UserNav/>)
        fireEvent.click(screen.getByText('Войти'))
        await waitFor(() => screen.getByText('Вход в систему'))

        fireEvent.change(screen.getByPlaceholderText('your.email@example.com'), {
            target: {value: 'ivan@test.com'},
        })
        fireEvent.change(screen.getByPlaceholderText('••••••••'), {
            target: {value: 'pass'},
        })

        await act(async () => {
            fireEvent.click(screen.getByRole('button', {name: 'Войти'}))
        })

        await waitFor(() => {
            const calls = (global.fetch as jest.Mock).mock.calls
            const meCall = calls.find(([url]: [string]) => url === '/api/users/me')
            expect(meCall).toBeDefined()
            expect(meCall[1].headers.Authorization).toBe('Bearer new-token')
        })
    })
})

// ── 5. Register flow ──────────────────────────────────────────────────────────

/** Switch Radix Tabs by simulating mousedown (Radix activates on mousedown) */
async function switchToRegisterTab() {
    // Radix Tabs activates on mousedown on the trigger button
    const registerTabTrigger = screen.getByRole('tab', {name: 'Зарегистрироваться'})
    fireEvent.mouseDown(registerTabTrigger)
    fireEvent.click(registerTabTrigger)
    await waitFor(() => screen.getByPlaceholderText('Иван Иванов'))
}

describe('Форма регистрации', () => {
    it('после успешной регистрации сохраняет токен в localStorage', async () => {
        mockFetchRegisterSuccess('register-token-456', CUSTOMER_USER)

        renderWithUser(<UserNav/>)
        fireEvent.click(screen.getByText('Войти'))
        await waitFor(() => screen.getByText('Вход в систему'))

        await switchToRegisterTab()

        fireEvent.change(screen.getByPlaceholderText('Иван Иванов'), {
            target: {value: 'Иван Иванов'},
        })
        const emailInputs = screen.getAllByPlaceholderText('your.email@example.com')
        fireEvent.change(emailInputs[emailInputs.length - 1], {
            target: {value: 'ivan@test.com'},
        })
        // password + confirmPassword (login form also has one placeholder ••••••••, so take last 2)
        const passwordInputs = screen.getAllByPlaceholderText('••••••••')
        fireEvent.change(passwordInputs[passwordInputs.length - 2], {
            target: {value: 'password123'},
        })
        fireEvent.change(passwordInputs[passwordInputs.length - 1], {
            target: {value: 'password123'},
        })

        await act(async () => {
            fireEvent.click(screen.getByRole('button', {name: 'Создать аккаунт'}))
        })

        await waitFor(() => {
            expect(localStorageMock.getItem('auth')).toBe('register-token-456')
        })
    })

    it('после успешной регистрации отображает данные пользователя', async () => {
        mockFetchRegisterSuccess('register-token-456', CUSTOMER_USER)

        renderWithUser(<UserNav/>)
        fireEvent.click(screen.getByText('Войти'))
        await waitFor(() => screen.getByText('Вход в систему'))

        await switchToRegisterTab()

        fireEvent.change(screen.getByPlaceholderText('Иван Иванов'), {
            target: {value: 'Иван Иванов'},
        })
        const emailInputs = screen.getAllByPlaceholderText('your.email@example.com')
        fireEvent.change(emailInputs[emailInputs.length - 1], {
            target: {value: 'ivan@test.com'},
        })
        const passwordInputs = screen.getAllByPlaceholderText('••••••••')
        fireEvent.change(passwordInputs[passwordInputs.length - 2], {
            target: {value: 'password123'},
        })
        fireEvent.change(passwordInputs[passwordInputs.length - 1], {
            target: {value: 'password123'},
        })

        await act(async () => {
            fireEvent.click(screen.getByRole('button', {name: 'Создать аккаунт'}))
        })

        await waitFor(() => {
            expect(screen.getByText('Иван Иванов')).toBeInTheDocument()
        })
    })

    it('вызывает POST /api/users с корректными данными формы', async () => {
        mockFetchRegisterSuccess('register-token', CUSTOMER_USER)

        renderWithUser(<UserNav/>)
        fireEvent.click(screen.getByText('Войти'))
        await waitFor(() => screen.getByText('Вход в систему'))

        await switchToRegisterTab()

        fireEvent.change(screen.getByPlaceholderText('Иван Иванов'), {
            target: {value: 'Новый Пользователь'},
        })
        const emailInputs = screen.getAllByPlaceholderText('your.email@example.com')
        fireEvent.change(emailInputs[emailInputs.length - 1], {
            target: {value: 'new@test.com'},
        })
        const passwordInputs = screen.getAllByPlaceholderText('••••••••')
        fireEvent.change(passwordInputs[passwordInputs.length - 2], {
            target: {value: 'pass123'},
        })
        fireEvent.change(passwordInputs[passwordInputs.length - 1], {
            target: {value: 'pass123'},
        })

        await act(async () => {
            fireEvent.click(screen.getByRole('button', {name: 'Создать аккаунт'}))
        })

        await waitFor(() => {
            const calls = (global.fetch as jest.Mock).mock.calls
            const registerCall = calls.find(([url]: [string]) => url === '/api/users')
            expect(registerCall).toBeDefined()
            const body = JSON.parse(registerCall[1].body)
            expect(body.name).toBe('Новый Пользователь')
            expect(body.email).toBe('new@test.com')
        })
    })
})
