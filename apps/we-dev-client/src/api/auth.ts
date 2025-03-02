import type { User } from "@/stores/userSlice"
export const authService = {
  async login(email: string, password: string) {
    const res = await fetch(`${process.env.APP_BASE_URL}/api/auth/login`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    })

    const data = await res.json()
    if (!res.ok) throw data
    return data
  },
  async getUserInfo(token: string): Promise<User> {
    const res = await fetch(`${process.env.APP_BASE_URL}/api/user`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
    })
    const response = await res.json()
    return response
  },

  async register(username: string, email: string, password: string) {
    const res = await fetch(`${process.env.APP_BASE_URL}/api/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, email, password }),
    })

    const data = await res.json()
    if (!res.ok) throw data
    return data
  },
}
