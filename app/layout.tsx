import {SiteHeader} from '@/components/site-header'
import {CartProvider} from '@/src/adapters/ui/react/providers/cart-provider'
import {AuthDialogProvider} from '@/src/adapters/ui/react/providers/auth-dialog-provider'
import {UserProvider} from '@/contexts/user-context'
import {NotificationProvider} from '@/contexts/notification-context'
import {NotificationContainer} from '@/components/notifications/notification-container'
import './globals.css'
import {Footer} from '@/components/footer'
import {Toaster} from '@/components/ui/toaster'

interface Props {
    children?: React.ReactNode
}
export default function RootLayout({ children } : Props) {
	return (
		<html lang='ru'>
		<body>
		<UserProvider>
			<NotificationProvider>
				<CartProvider>
					<AuthDialogProvider>
						<div className='relative flex min-h-screen flex-col'>
							<SiteHeader/>
							<div className='flex-1'>{children}</div>
						</div>
					</AuthDialogProvider>
				</CartProvider>
				<Footer/>
				<Toaster/>
				<NotificationContainer/>
			</NotificationProvider>
		</UserProvider>
		</body>
		</html>
	)
}


