'use client'

import {Component, ErrorInfo, ReactNode} from 'react'

interface Props {
    children: ReactNode
    fallback?: ReactNode
    label?: string
}

interface State {
    hasError: boolean
    error: Error | null
}

export class ErrorBoundary extends Component<Props, State> {
    state: State = {hasError: false, error: null}

    static getDerivedStateFromError(error: Error): State {
        return {hasError: true, error}
    }

    componentDidCatch(error: Error, info: ErrorInfo) {
        console.error(`[ErrorBoundary${this.props.label ? `:${this.props.label}` : ''}]`, error, info)
    }

    reset = () => this.setState({hasError: false, error: null})

    render() {
        if (this.state.hasError) {
            if (this.props.fallback) return this.props.fallback
            return (
                <div className='rounded-md border border-destructive/50 bg-destructive/5 p-6 text-center'>
                    <h3 className='font-medium text-destructive'>Что-то пошло не так</h3>
                    <p className='text-sm text-muted-foreground mt-1'>
                        {this.state.error?.message ?? 'Неизвестная ошибка'}
                    </p>
                    <button
                        onClick={this.reset}
                        className='mt-3 text-sm underline text-muted-foreground hover:text-foreground'
                    >
                        Попробовать снова
                    </button>
                </div>
            )
        }
        return this.props.children
    }
}
