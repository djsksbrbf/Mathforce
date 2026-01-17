const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8000"

async function request<T>(path: string, options: RequestInit = {}) {
  // normalize body: handle objects and strings; avoid double-encoding JSON
  let bodyToSend: any = options.body
  if (bodyToSend !== undefined) {
    if (typeof bodyToSend !== "string") {
      try {
        bodyToSend = JSON.stringify(bodyToSend)
      } catch (e) {
        bodyToSend = String(bodyToSend)
      }
    }
  }

  const response = await fetch(`${API_URL}${path}`, {
    headers: {
      "Content-Type": "application/json",
      ...(options.headers || {}),
    },
    ...(options || {}),
    body: bodyToSend,
  })

  if (!response.ok) {
    let errorBody: any
    try {
      errorBody = await response.json()
    } catch {
      throw new Error("Request failed")
    }
    const detail = (errorBody && (errorBody as any).detail) || errorBody
    const message =
      typeof detail === "string" ? detail : typeof errorBody === "string" ? errorBody : JSON.stringify(detail)
    throw new Error(message || "Request failed")
  }

  if (response.status === 204) {
    return null as T
  }

  return (await response.json()) as T
}

function authHeaders() {
  const token = localStorage.getItem("token")
  return token ? { Authorization: `Bearer ${token}` } : {}
}

export const api = {
  signup: (payload: { username: string; email: string; password: string }) =>
    request<{ access_token: string }>("/auth/signup", {
      method: "POST",
      body: payload,
    }),
  login: (payload: { username: string; password: string }) =>
    request<{ access_token: string }>("/auth/login", {
      method: "POST",
      body: payload,
    }),
  getTopics: () => request<Array<{ id: number; name: string }>>("/topics"),
  getProblems: (topicId?: number) =>
    request<Array<{ id: number; number: number; topic_id: number; rating: number; statement: string }>>(
      topicId ? `/problems?topic_id=${topicId}` : "/problems"
    ),
  getRandomProblem: (topicId?: number) =>
    request<{ id: number; number: number; topic_id: number; rating: number; statement: string }>(
      topicId ? `/problems/random?topic_id=${topicId}` : "/problems/random",
      {
        headers: authHeaders(),
      }
    ),
  getCurrentProblem: () =>
    request<{ id: number; number: number; topic_id: number; rating: number; statement: string }>(
      "/me/current-problem",
      {
        headers: authHeaders(),
      }
    ),
  submitAnswer: (problemId: number, answer: string) =>
    request<{ is_correct: boolean }>(`/problems/${problemId}/submit`, {
      method: "POST",
      headers: authHeaders(),
      body: { answer },
    }),
  getProfile: () =>
    request<{
      username: string
      rating: number
      total_solved: number
      per_topic: Record<string, number>
      history: Array<{ problem_id: number; is_correct: boolean; created_at: string }>
    }>("/me", { headers: authHeaders() }),
  submitProposal: (payload: { topic_id: number; statement: string; answer_key: string }) =>
    request<{ id: number; status: string }>("/proposals", {
      method: "POST",
      headers: authHeaders(),
      body: payload,
    }),
  getAdminProposals: () =>
    request<Array<{ id: number; status: string; created_at: string }>>("/admin/proposals", {
      headers: authHeaders(),
    }),
  approveProposal: (id: number) =>
    request<{ id: number; number: number; topic_id: number; rating: number; statement: string }>(
      `/admin/proposals/${id}/approve`,
      {
        method: "POST",
        headers: authHeaders(),
      }
    ),
}
