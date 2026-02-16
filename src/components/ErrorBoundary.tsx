import { Component, ErrorInfo, ReactNode } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

interface Props {
    children?: ReactNode;
}

interface State {
    hasError: boolean;
    error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
    public state: State = {
        hasError: false,
        error: null,
    };

    public static getDerivedStateFromError(error: Error): State {
        return { hasError: true, error };
    }

    public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
        console.error("Uncaught error:", error, errorInfo);
    }

    public render() {
        if (this.state.hasError) {
            return (
                <div className="flex min-h-screen items-center justify-center bg-background p-4">
                    <Card className="max-w-md p-6 border-destructive/50 bg-destructive/10">
                        <h2 className="mb-2 text-lg font-bold text-destructive">Something went wrong</h2>
                        <p className="mb-4 text-sm text-foreground/80">
                            {this.state.error?.message || "Unknown error occurred"}
                        </p>
                        <pre className="mb-4 overflow-auto rounded bg-card p-2 text-xs font-mono">
                            {this.state.error?.stack}
                        </pre>
                        <Button onClick={() => window.location.reload()}>Reload Application</Button>
                    </Card>
                </div>
            );
        }

        return this.props.children;
    }
}
