import '@testing-library/jest-dom'
import {act, fireEvent, render, screen, waitFor} from '@testing-library/react'
import {UserNav} from './user-nav'
import {RootStoreProvider} from '@/src/adapters/ui/react/stores'
import {NotificationProvider} from '@/contexts/notification-context'

function renderWithUser(ui: React.ReactElement) {
    return render(
        <RootStoreProvider>
            <NotificationProvider>{ui}</NotificationProvider>
        </RootStoreProvider>,
    )
}

const CUSTOMER_EMAIL = 'ivan@test.com'
const CUSTOMER_FULL_NAME = 'Иван Иванов'
const API_USERS_ME = '/api/users/me'
const LOGIN_DIALOG_TITLE = 'Вход в систему'
const EMAIL_PLACEHOLDER = 'your.email@example.com'

// ─── Mocks ──────────────────────────────────────────────────────────────────

const pushMock = jest.fn()
const refreshMock = jest.fn()

jest.mock('next/navigation', () => ({
    useRouter: () => ({push: pushMock, refresh: refreshMock}),
}))

// Mock Radix DropdownMenu so that it renders its content immediately
// (without pointer-events workaround in jsdom)
jest.mock('@/components/ui/dropdown-menu', () => {
    const React = require('react') // eslint-disable-line
    const DropdownMenu = ({children}: { children: React.ReactNode }) => <div>{children}</div>
    const DropdownMenuTrigger = ({children, asChild}: { children: React.ReactElement; asChild?: boolean }) => {
        if (asChild) return React.cloneElement(children, {'data-testid': 'dropdown-trigger'})
        return <div data-testid='dropdown-trigger'>{children}</div>
    }
    const DropdownMenuContent = ({children}: { children: React.ReactNode }) => (
        <div data-testid='dropdown-content'>{children}</div>
    )
    const DropdownMenuLabel = ({children}: { children: React.ReactNode }) => <div>{children}</div>
    const DropdownMenuGroup = ({children}: { children: React.ReactNode }) => <div>{children}</div>
    const DropdownMenuItem = ({children, onClick}: { children: React.ReactNode; onClick?: () => void }) => (
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

// ─── Helpers ─────────────────────────────────────────────────────────────────

const CUSTOMER_USER = {
    user_id: 1,
    first_name: 'Иван',
    last_name: 'Иванов',
    email: CUSTOMER_EMAIL,
    user_role: 'customer',
}

const SELLER_USER = {
    user_id: 2,
    first_name: 'Мария',
    last_name: 'Петрова',
    email: 'maria@test.com',
    user_role: 'seller',
}

/** Mock /api/users/me to return a logged-in user (simulates valid HttpOnly cookie). */
function mockFetchUserInfo(user: typeof CUSTOMER_USER | typeof SELLER_USER) {
    global.fetch = jest.fn().mockImplementation((url: string) => {
        if (url === API_USERS_ME) {
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

/** Mock unauthenticated state: /api/users/me returns 401. */
function mockFetchUnauthenticated() {
    global.fetch = jest.fn().mockImplementation((url: string) => {
        if (url === API_USERS_ME) {
            return Promise.resolve({ok: false, status: 401, json: () => Promise.resolve({error: 'Unauthorized'})})
        }
        return Promise.reject(new Error(`Unexpected fetch: ${url}`))
    }) as jest.Mock
}

/** Mock for login: initial /api/users/me returns 401, then after /api/auth returns user. */
function mockFetchLoginSuccess(user: typeof CUSTOMER_USER) {
    let meCallCount = 0
    global.fetch = jest.fn().mockImplementation((url: string) => {
        if (url === '/api/auth') {
            return Promise.resolve({
                status: 200,
                json: () => Promise.resolve({success: true}),
            })
        }
        if (url === API_USERS_ME) {
            meCallCount++
            if (meCallCount === 1) {
                // Initial mount — not logged in yet
                return Promise.resolve({ok: false, status: 401, json: () => Promise.resolve({error: 'Unauthorized'})})
            }
            return Promise.resolve({ok: true, json: () => Promise.resolve(user)})
        }
        if (url.startsWith('/api/sellers')) {
            return Promise.resolve({ok: true, json: () => Promise.resolve([])})
        }
        return Promise.reject(new Error(`Unexpected fetch: ${url}`))
    }) as jest.Mock
}

/** Mock for register: initial /api/users/me returns 401, then after /api/users POST returns user. */
function mockFetchRegisterSuccess(user: typeof CUSTOMER_USER) {
    let meCallCount = 0
    global.fetch = jest.fn().mockImplementation((url: string) => {
        if (url === '/api/users') {
            return Promise.resolve({
                status: 200,
                json: () => Promise.resolve({success: true}),
            })
        }
        if (url === API_USERS_ME) {
            meCallCount++
            if (meCallCount === 1) {
                return Promise.resolve({ok: false, status: 401, json: () => Promise.resolve({error: 'Unauthorized'})})
            }
            return Promise.resolve({ok: true, json: () => Promise.resolve(user)})
        }
        if (url.startsWith('/api/sellers')) {
            return Promise.resolve({ok: true, json: () => Promise.resolve([])})
        }
        return Promise.reject(new Error(`Unexpected fetch: ${url}`))
    }) as jest.Mock
}

beforeEach(() => {
    pushMock.mockClear()
    refreshMock.mockClear()
    jest.clearAllMocks()
})

// ── 1. Unauthenticated state ──────────────────────────────────────────────────

describe('Неавторизованный пользователь', () => {
    beforeEach(() => {
        mockFetchUnauthenticated()
    })

    it('показывает кнопку "Войти" вместо аватара', async () => {
        renderWithUser(<UserNav/>)
        await act(async () => {
        })
        expect(screen.getByText('Войти')).toBeInTheDocument()
    })

    it('НЕ показывает пункты меню Профиль, Мои заказы, Избранное', async () => {
        renderWithUser(<UserNav/>)
        await act(async () => {
        })
        expect(screen.queryByText('Профиль')).not.toBeInTheDocument()
        expect(screen.queryByText('Мои заказы')).not.toBeInTheDocument()
        expect(screen.queryByText('Избранное')).not.toBeInTheDocument()
    })

    it('НЕ показывает "Панель продавца"', async () => {
        renderWithUser(<UserNav/>)
        await act(async () => {
        })
        expect(screen.queryByText('Панель продавца')).not.toBeInTheDocument()
    })

    it('проверяет сессию через /api/users/me при монтировании', async () => {
        renderWithUser(<UserNav/>)
        await act(async () => {
        })
        const calls = (global.fetch as jest.Mock).mock.calls
        const meCall = calls.find(([url]: [string]) => url === API_USERS_ME)
        expect(meCall).toBeDefined()
    })
})

// ── 2. Authenticated customer ─────────────────────────────────────────────────

describe('Авторизованный пользователь (customer)', () => {
    beforeEach(() => {
        mockFetchUserInfo(CUSTOMER_USER)
    })

    it('показывает имя и email пользователя', async () => {
        renderWithUser(<UserNav/>)
        await waitFor(() => {
            expect(screen.getByText(CUSTOMER_FULL_NAME)).toBeInTheDocument()
        })
        expect(screen.getByText(CUSTOMER_EMAIL)).toBeInTheDocument()
    })

    it('показывает инициалы в аватаре', async () => {
        renderWithUser(<UserNav/>)
        await waitFor(() => {
            expect(screen.getByText('ИИ')).toBeInTheDocument()
        })
    })

    it('показывает пункты меню Профиль, Мои заказы, Избранное', async () => {
        renderWithUser(<UserNav/>)
        await waitFor(() => screen.getByText(CUSTOMER_FULL_NAME))
        expect(screen.getByText('Профиль')).toBeInTheDocument()
        expect(screen.getByText('Мои заказы')).toBeInTheDocument()
        expect(screen.getByText('Согласования')).toBeInTheDocument()
        expect(screen.getByText('Избранное')).toBeInTheDocument()
    })

    it('НЕ показывает "Панель продавца" для customer', async () => {
        renderWithUser(<UserNav/>)
        await waitFor(() => screen.getByText(CUSTOMER_FULL_NAME))
        expect(screen.queryByText('Панель продавца')).not.toBeInTheDocument()
    })

    it('показывает кнопку "Выйти"', async () => {
        renderWithUser(<UserNav/>)
        await waitFor(() => screen.getByText(CUSTOMER_FULL_NAME))
        expect(screen.getByText('Выйти')).toBeInTheDocument()
    })

    it('выход вызывает POST /api/auth/logout и убирает данные пользователя', async () => {
        // After logout, /api/users/me returns 401
        global.fetch = jest.fn().mockImplementation((url: string, opts?: RequestInit) => {
            if (url === API_USERS_ME) {
                return Promise.resolve({ok: true, json: () => Promise.resolve(CUSTOMER_USER)})
            }
            if (url === '/api/auth/logout' && opts?.method === 'POST') {
                return Promise.resolve({ok: true, json: () => Promise.resolve({success: true})})
            }
            if (url.startsWith('/api/sellers')) {
                return Promise.resolve({ok: true, json: () => Promise.resolve([])})
            }
            return Promise.reject(new Error(`Unexpected fetch: ${url}`))
        }) as jest.Mock

        renderWithUser(<UserNav/>)
        await waitFor(() => screen.getByText(CUSTOMER_FULL_NAME))

        await act(async () => {
            fireEvent.click(screen.getByText('Выйти'))
        })

        expect(pushMock).toHaveBeenCalledWith('/')
        const logoutCall = (global.fetch as jest.Mock).mock.calls.find(
            ([url]: [string]) => url === '/api/auth/logout'
        )
        expect(logoutCall).toBeDefined()
        await waitFor(() => {
            expect(screen.queryByText(CUSTOMER_FULL_NAME)).not.toBeInTheDocument()
        })
    })

    it('переход по "Профиль" вызывает router.push("/profile")', async () => {
        renderWithUser(<UserNav/>)
        await waitFor(() => screen.getByText(CUSTOMER_FULL_NAME))
        fireEvent.click(screen.getByText('Профиль'))
        expect(pushMock).toHaveBeenCalledWith('/profile')
    })

    it('переход по "Мои заказы" вызывает router.push("/orders-v2")', async () => {
        renderWithUser(<UserNav/>)
        await waitFor(() => screen.getByText(CUSTOMER_FULL_NAME))
        fireEvent.click(screen.getByText('Мои заказы'))
        expect(pushMock).toHaveBeenCalledWith('/orders-v2')
    })

    it('переход по "Согласования" вызывает router.push("/chats")', async () => {
        renderWithUser(<UserNav/>)
        await waitFor(() => screen.getByText(CUSTOMER_FULL_NAME))
        fireEvent.click(screen.getByText('Согласования'))
        expect(pushMock).toHaveBeenCalledWith('/chats')
    })
})

// ── 3. Authenticated seller ───────────────────────────────────────────────────

describe('Авторизованный пользователь (seller)', () => {
    beforeEach(() => {
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
    it('после успешного логина отображает данные пользователя', async () => {
        mockFetchLoginSuccess(CUSTOMER_USER)

        renderWithUser(<UserNav/>)
        await act(async () => {
        }) // flush initial /api/users/me (returns user after login)

        fireEvent.click(screen.getByText('Войти'))
        await waitFor(() => screen.getByText(LOGIN_DIALOG_TITLE))

        fireEvent.change(screen.getByPlaceholderText(EMAIL_PLACEHOLDER), {
            target: {value: CUSTOMER_EMAIL},
        })
        fireEvent.change(screen.getByPlaceholderText('••••••••'), {
            target: {value: 'password123'},
        })

        await act(async () => {
            fireEvent.click(screen.getByRole('button', {name: 'Войти'}))
        })

        await waitFor(() => {
            expect(screen.getByText(CUSTOMER_FULL_NAME)).toBeInTheDocument()
        })
    })

    it('вызывает POST /api/auth с корректными данными формы', async () => {
        mockFetchLoginSuccess(CUSTOMER_USER)

        renderWithUser(<UserNav/>)
        await act(async () => {
        })

        fireEvent.click(screen.getByText('Войти'))
        await waitFor(() => screen.getByText(LOGIN_DIALOG_TITLE))

        fireEvent.change(screen.getByPlaceholderText(EMAIL_PLACEHOLDER), {
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
        mockFetchLoginSuccess(CUSTOMER_USER)

        renderWithUser(<UserNav/>)
        await act(async () => {
        })

        fireEvent.click(screen.getByText('Войти'))
        await waitFor(() => screen.getByText(LOGIN_DIALOG_TITLE))

        fireEvent.change(screen.getByPlaceholderText(EMAIL_PLACEHOLDER), {
            target: {value: CUSTOMER_EMAIL},
        })
        fireEvent.change(screen.getByPlaceholderText('••••••••'), {
            target: {value: 'pass'},
        })

        await act(async () => {
            fireEvent.click(screen.getByRole('button', {name: 'Войти'}))
        })

        await waitFor(() => {
            const calls = (global.fetch as jest.Mock).mock.calls
            const meCalls = calls.filter(([url]: [string]) => url === API_USERS_ME)
            expect(meCalls.length).toBeGreaterThanOrEqual(1)
            // Should use credentials: 'include' (cookie-based auth), not Authorization header
            const lastMeCall = meCalls[meCalls.length - 1]
            expect(lastMeCall[1]?.credentials).toBe('include')
            expect(lastMeCall[1]?.headers?.Authorization).toBeUndefined()
        })
    })

    it('токен НЕ сохраняется в localStorage после логина', async () => {
        mockFetchLoginSuccess(CUSTOMER_USER)

        renderWithUser(<UserNav/>)
        await act(async () => {
        })

        fireEvent.click(screen.getByText('Войти'))
        await waitFor(() => screen.getByText(LOGIN_DIALOG_TITLE))

        fireEvent.change(screen.getByPlaceholderText(EMAIL_PLACEHOLDER), {
            target: {value: CUSTOMER_EMAIL},
        })
        fireEvent.change(screen.getByPlaceholderText('••••••••'), {
            target: {value: 'password123'},
        })

        await act(async () => {
            fireEvent.click(screen.getByRole('button', {name: 'Войти'}))
        })

        await waitFor(() => screen.getByText(CUSTOMER_FULL_NAME))
        expect(localStorage.getItem('auth')).toBeNull()
    })
})

// ── 5. Register flow ──────────────────────────────────────────────────────────

/** Switch Radix Tabs by simulating mousedown (Radix activates on mousedown) */
async function switchToRegisterTab() {
    const registerTabTrigger = screen.getByRole('tab', {name: 'Зарегистрироваться'})
    fireEvent.mouseDown(registerTabTrigger)
    fireEvent.click(registerTabTrigger)
    await waitFor(() => screen.getByPlaceholderText(CUSTOMER_FULL_NAME))
}

describe('Форма регистрации', () => {
    it('после успешной регистрации отображает данные пользователя', async () => {
        mockFetchRegisterSuccess(CUSTOMER_USER)

        renderWithUser(<UserNav/>)
        await act(async () => {
        })

        fireEvent.click(screen.getByText('Войти'))
        await waitFor(() => screen.getByText(LOGIN_DIALOG_TITLE))

        await switchToRegisterTab()

        fireEvent.change(screen.getByPlaceholderText(CUSTOMER_FULL_NAME), {
            target: {value: CUSTOMER_FULL_NAME},
        })
        const emailInputs = screen.getAllByPlaceholderText(EMAIL_PLACEHOLDER)
        fireEvent.change(emailInputs[emailInputs.length - 1], {
            target: {value: CUSTOMER_EMAIL},
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
            expect(screen.getByText(CUSTOMER_FULL_NAME)).toBeInTheDocument()
        })
    })

    it('токен НЕ сохраняется в localStorage после регистрации', async () => {
        mockFetchRegisterSuccess(CUSTOMER_USER)

        renderWithUser(<UserNav/>)
        await act(async () => {
        })

        fireEvent.click(screen.getByText('Войти'))
        await waitFor(() => screen.getByText(LOGIN_DIALOG_TITLE))

        await switchToRegisterTab()

        fireEvent.change(screen.getByPlaceholderText(CUSTOMER_FULL_NAME), {
            target: {value: CUSTOMER_FULL_NAME},
        })
        const emailInputs = screen.getAllByPlaceholderText(EMAIL_PLACEHOLDER)
        fireEvent.change(emailInputs[emailInputs.length - 1], {
            target: {value: CUSTOMER_EMAIL},
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

        await waitFor(() => screen.getByText(CUSTOMER_FULL_NAME))
        expect(localStorage.getItem('auth')).toBeNull()
    })

    it('вызывает POST /api/users с корректными данными формы', async () => {
        mockFetchRegisterSuccess(CUSTOMER_USER)

        renderWithUser(<UserNav/>)
        await act(async () => {
        })

        fireEvent.click(screen.getByText('Войти'))
        await waitFor(() => screen.getByText(LOGIN_DIALOG_TITLE))

        await switchToRegisterTab()

        fireEvent.change(screen.getByPlaceholderText(CUSTOMER_FULL_NAME), {
            target: {value: 'Новый Пользователь'},
        })
        const emailInputs = screen.getAllByPlaceholderText(EMAIL_PLACEHOLDER)
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
