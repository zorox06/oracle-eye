import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { CheckCircle } from "lucide-react";

export default function OAuthConsent() {
    const navigate = useNavigate();

    useEffect(() => {
        // Auto-redirect after showing consent
        const timer = setTimeout(() => {
            navigate("/");
        }, 2000);

        return () => clearTimeout(timer);
    }, [navigate]);

    return (
        <div className="min-h-screen flex items-center justify-center bg-background p-4">
            <Card className="unified-card p-8 max-w-md text-center">
                <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
                <h2 className="text-2xl font-bold mb-2">Authorization Successful</h2>
                <p className="text-muted-foreground">
                    Redirecting you back to the application...
                </p>
            </Card>
        </div>
    );
}
