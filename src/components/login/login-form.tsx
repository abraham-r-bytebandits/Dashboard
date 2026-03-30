import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Eye, EyeOff } from "lucide-react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import GoogleLoginButton from "./GoogleLoginButton"
import { useState } from "react"

interface LoginFormProps {
    identifier: string
    setIdentifier: (val: string) => void
    password: string
    setPassword: (val: string) => void
    remember: boolean
    setRemember: (val: boolean) => void
    handleLogin: (e: React.FormEvent) => Promise<void> | void
}

export default function LoginForm({
    identifier,
    setIdentifier,
    password,
    setPassword,
    remember,
    setRemember,
    handleLogin,
}: LoginFormProps) {
    const [showPassword, setShowPassword] = useState(false)
    const [isLoading, setIsLoading] = useState(false)

    const onSubmit = async (e: React.FormEvent) => {
        setIsLoading(true)
        try {
            await handleLogin(e)
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <Card className="relative w-full max-w-md mx-auto bg-white shadow-xl border border-gray-100 rounded-2xl overflow-hidden">
            <CardContent className="p-6 pt-8">
                <form onSubmit={onSubmit} className="space-y-4">
                    <div className="text-center mb-6">
                        <h2 className="text-2xl font-bold tracking-tight">Welcome back</h2>
                        <p className="text-sm text-muted-foreground mt-1">Sign in to your account</p>
                    </div>

                    <Tabs defaultValue="email" className="w-full" onValueChange={() => setIdentifier("")}>
                        <TabsList className="grid w-full grid-cols-2 mb-4">
                            <TabsTrigger value="email">Email</TabsTrigger>
                            <TabsTrigger value="mobile">Mobile Number</TabsTrigger>
                        </TabsList>
                        <TabsContent value="email" className="space-y-1.5 mt-0">
                            <Label htmlFor="loginEmail">Email Address</Label>
                            <Input
                                id="loginEmail"
                                type="email"
                                placeholder="name@example.com"
                                value={identifier}
                                onChange={(e) => setIdentifier(e.target.value)}
                                className="h-10"
                                required
                            />
                        </TabsContent>
                        <TabsContent value="mobile" className="space-y-1.5 mt-0">
                            <Label htmlFor="loginMobile">Mobile Number</Label>
                            <Input
                                id="loginMobile"
                                type="tel"
                                placeholder="+91 9876543210"
                                value={identifier}
                                onChange={(e) => setIdentifier(e.target.value)}
                                className="h-10"
                                required
                            />
                        </TabsContent>
                    </Tabs>

                    <div className="space-y-1.5">
                        <Label htmlFor="loginPassword">Password</Label>
                        <div className="relative">
                            <Input
                                id="loginPassword"
                                type={showPassword ? "text" : "password"}
                                placeholder="Enter your password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="h-10 pr-10"
                                required
                            />
                            <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                            >
                                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                            </button>
                        </div>
                    </div>

                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <input
                                type="checkbox"
                                id="remember"
                                checked={remember}
                                onChange={(e) => setRemember(e.target.checked)}
                                className="h-4 w-4 rounded border-gray-300 accent-primary"
                            />
                            <label htmlFor="remember" className="text-sm text-gray-600 select-none">
                                Remember me
                            </label>
                        </div>
                    </div>

                    <Button type="submit" className="w-full h-10 font-semibold mt-4" disabled={isLoading}>
                        {isLoading ? "Signing In..." : "Sign In"}
                    </Button>

                    <div className="relative my-4">
                        <div className="absolute inset-0 flex items-center">
                            <div className="w-full border-t border-gray-200" />
                        </div>
                        <div className="relative flex justify-center">
                            <span className="bg-white px-3 text-xs text-muted-foreground uppercase tracking-wider">
                                Or continue with
                            </span>
                        </div>
                    </div>

                    <GoogleLoginButton />
                </form>
            </CardContent>
        </Card>
    )
}