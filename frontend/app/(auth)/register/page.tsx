"use client";

import { useAuth } from "@/contexts/AuthContext";
import { useRouter } from "next/navigation";
import AuthForm from "@/components/auth/AuthForm";

export default function RegisterPage() {
    const { register: registerUser } = useAuth();
    const router = useRouter();

    const handleRegister = async (data: {
        email: string;
        password: string;
        firstName: string;
        lastName: string;
    }) => {
        await registerUser(
            data.email,
            data.password,
            data.firstName,
            data.lastName
        );
        router.push("/dashboard");
    };


    // @ts-nocheck
    return (
        <div className="flex min-h-screen items-center justify-center bg-gray-100">
            <div className="w-full max-w-md rounded-lg bg-white p-8 shadow-md">
                <h1 className="mb-6 text-2xl font-bold text-center">
                    Create Your Crypto Wallet
                </h1>
                {/* // @ts-ignore */}
                <AuthForm mode="register" onSubmit={handleRegister} />
                <div className="mt-4 text-center">
                    <p className="text-sm">
                        Already have an account?{" "}
                        <a
                            href="/login"
                            className="text-indigo-600 hover:text-indigo-800"
                        >
                            Login
                        </a>
                    </p>
                </div>
            </div>
        </div>
    );
}
