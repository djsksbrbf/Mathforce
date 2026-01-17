import { useState } from "react"
import { useNavigate } from "react-router-dom"

import { api } from "@/api"
import { useAuth } from "@/context/auth"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"

export function AuthPage() {
  const [mode, setMode] = useState<"login" | "signup">("login")
  const [error, setError] = useState<string | null>(null)
  const [form, setForm] = useState({ username: "", email: "", password: "" })
  const { setToken } = useAuth()
  const navigate = useNavigate()

  const onSubmit = async (event: React.FormEvent) => {
    event.preventDefault()
    setError(null)

    try {
      if (mode === "signup") {
        const data = await api.signup({
          username: form.username,
          email: form.email,
          password: form.password,
        })
        setToken(data.access_token)
      } else {
        const data = await api.login({ username: form.username, password: form.password })
        setToken(data.access_token)
      }
      navigate("/")
    } catch (err) {
      setError((err as Error).message)
    }
  }

  return (
    <div className="flex min-h-[70vh] items-center justify-center">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>{mode === "login" ? "Welcome back" : "Create your account"}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="mb-4 flex gap-2">
            <Button
              type="button"
              variant={mode === "login" ? "default" : "outline"}
              onClick={() => setMode("login")}
            >
              Login
            </Button>
            <Button
              type="button"
              variant={mode === "signup" ? "default" : "outline"}
              onClick={() => setMode("signup")}
            >
              Sign up
            </Button>
          </div>
          <form className="space-y-3" onSubmit={onSubmit}>
            <Input
              placeholder="Username"
              value={form.username}
              onChange={(event) => setForm({ ...form, username: event.target.value })}
              required
            />
            {mode === "signup" && (
              <Input
                placeholder="Email"
                type="email"
                value={form.email}
                onChange={(event) => setForm({ ...form, email: event.target.value })}
                required
              />
            )}
            <Input
              placeholder="Password"
              type="password"
              value={form.password}
              onChange={(event) => setForm({ ...form, password: event.target.value })}
              required
            />
            {error && <p className="text-sm text-destructive">{error}</p>}
            <Button className="w-full" type="submit">
              {mode === "login" ? "Login" : "Create account"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
