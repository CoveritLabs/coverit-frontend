// Copyright (c) 2026 CoverIt Labs. All Rights Reserved.
// Proprietary and confidential. Unauthorized use is strictly prohibited.
// See LICENSE file in the project root for full license information.

import React from 'react'
import type { ErrorInfo, ReactNode } from 'react'

interface Props {
    children: ReactNode
    fallback?: ReactNode
}

interface State {
    hasError: boolean
    error: Error | null
}

export class ErrorBoundary extends React.Component<Props, State> {
    constructor(props: Props) {
        super(props)
        this.state = { hasError: false, error: null }
    }

    static getDerivedStateFromError(error: Error): State {
        return { hasError: true, error }
    }

    componentDidCatch(error: Error, info: ErrorInfo): void {
        console.error('[ErrorBoundary]', error, info)
    }

    render(): ReactNode {
        if (this.state.hasError) {
            return (
                this.props.fallback ?? (
                    <div style={{ padding: '2rem', textAlign: 'center' }}>
                        <h2>Something went wrong</h2>
                        <p>{this.state.error?.message}</p>
                        <button onClick={() => this.setState({ hasError: false, error: null })}>
                            Try again
                        </button>
                    </div>
                )
            )
        }
        return this.props.children
    }
}
