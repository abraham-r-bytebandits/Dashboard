import { useState } from "react"
import LoginForm from "./login-form"
import { useAuth } from "../../context/AuthContext"

export default function AuthModal() {
    const { login } = useAuth()

    // Login: { identifier, password, remember? }
    const [identifier, setIdentifier] = useState("")
    const [password, setPassword] = useState("")
    const [remember, setRemember] = useState(false)

    // POST /auth/login — body: { email/phone, password, remember? }
    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault()
        try {
            await login(identifier, password, remember)
        } catch (err: any) {
            console.error("[Login Error]", err)
            console.error("[Login Error] Response:", err?.response?.status, err?.response?.data)
            console.error("[Login Error] Message:", err?.message)
            alert("Login failed. Please check your credentials.")
        }
    }

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
            <div className="w-full px-4">
                <LoginForm
                    identifier={identifier}
                    setIdentifier={setIdentifier}
                    password={password}
                    setPassword={setPassword}
                    remember={remember}
                    setRemember={setRemember}
                    handleLogin={handleLogin}
                />
            </div>
        </div>
    )
}
