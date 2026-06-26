"use client";

import React, { Component, ReactNode } from "react";
import { Button } from "@/components/ui/button";

interface ErrorBoundaryProps {
    children: ReactNode;
    fallback?: ReactNode;
}

interface ErrorBoundaryState {
    hasError: boolean;
    error: Error | null;
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
    constructor(props: ErrorBoundaryProps) {
        super(props);
        this.state = { hasError: false, error: null };
    }

    static getDerivedStateFromError(error: Error): ErrorBoundaryState {
        return { hasError: true, error };
    }

    componentDidCatch(error: Error, info: React.ErrorInfo) {
        console.error("ErrorBoundary caught:", error, info.componentStack);
    }

    handleReset = () => {
        this.setState({ hasError: false, error: null });
    };

    render() {
        if (this.state.hasError) {
            if (this.props.fallback) {
                return this.props.fallback;
            }

            return (
                <div className="min-h-[200px] flex flex-col items-center justify-center gap-4 p-8 text-center rounded-2xl border bg-destructive/5">
                    <div className="text-destructive text-4xl">⚠️</div>
                    <div>
                        <p className="font-bold text-lg">Something went wrong</p>
                        <p className="text-sm text-muted-foreground mt-1">
                            {this.state.error?.message ?? "An unexpected error occurred."}
                        </p>
                    </div>
                    <Button variant="outline" onClick={this.handleReset} className="rounded-xl">
                        Try again
                    </Button>
                </div>
            );
        }

        return this.props.children;
    }
}
