"use client";

import { useAuth } from "@/contexts/AuthContext";
import { useRouter } from "next/navigation";
import AuthForm from "@/components/auth/AuthForm";

export default function LoginPage() {
    const { login } = useAuth();
    const router = useRouter();

    const handleLogin = async (data: { email: string; password: string }) => {
        await login(data.email, data.password);
        router.push("/dashboard");
    };

    return (
        <div className="flex min-h-screen items-center justify-center bg-gray-100">
            <div className="w-full max-w-md rounded-lg bg-white p-8 shadow-md">
                <h1 className="mb-6 text-2xl font-bold text-center">
                    Login to Your Crypto Wallet
                </h1>
                <AuthForm mode="login" onSubmit={handleLogin} />
                <div className="mt-4 text-center">
                    <p className="text-sm">
                        Don't have an account?{" "}
                        <a
                            href="/register"
                            className="text-indigo-600 hover:text-indigo-800"
                        >
                            Register
                        </a>
                    </p>
                </div>
            </div>
        </div>
    );
}
