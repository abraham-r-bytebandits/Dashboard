import { useState } from "react"
import LoginForm from "./login-form"
import { useAuth } from "../../context/AuthContext"

export default function AuthModal() {
    const { login } = useAuth()

    // Login: { email, password, remember? }
    const [email, setEmail] = useState("")
    const [password, setPassword] = useState("")
    const [remember, setRemember] = useState(false)

    // POST /auth/login — body: { email, password, remember? }
    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault()
        try {
            await login(email, password, remember)
        } catch {
            alert("Login failed. Please check your credentials.")
        }
    }

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
            <div className="w-full px-4">
                <LoginForm
                    email={email}
                    setEmail={setEmail}
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
