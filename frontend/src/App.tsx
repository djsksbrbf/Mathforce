import { useMemo, useState } from "react"
import { Navigate, Route, Routes, useNavigate } from "react-router-dom"

import { Layout } from "@/components/Layout"
import { AuthProvider } from "@/context/auth"
import { AuthPage } from "@/pages/Auth"
import { ProblemPage } from "@/pages/Problem"
import { ProblemSetPage } from "@/pages/ProblemSet"
import { ProfilePage } from "@/pages/Profile"
import { ProposalPage } from "@/pages/Proposal"
import { AdminProposalsPage } from "@/pages/AdminProposals"

export default function App() {
  const [token, setTokenState] = useState<string | null>(() => localStorage.getItem("token"))
  const navigate = useNavigate()

  const setToken = (value: string | null) => {
    if (value) {
      localStorage.setItem("token", value)
    } else {
      localStorage.removeItem("token")
    }
    setTokenState(value)
  }

  const providerValue = useMemo(() => ({ token, setToken }), [token])

  return (
    <AuthProvider value={providerValue}>
      <Layout
        isAuthed={Boolean(token)}
        onSignOut={() => {
          setToken(null)
          navigate("/auth")
        }}
      >
        <Routes>
          <Route path="/auth" element={token ? <Navigate to="/" replace /> : <AuthPage />} />
          <Route path="/" element={token ? <ProblemPage /> : <Navigate to="/auth" replace />} />
          <Route path="/problems" element={token ? <ProblemSetPage /> : <Navigate to="/auth" replace />} />
          <Route path="/profile" element={token ? <ProfilePage /> : <Navigate to="/auth" replace />} />
          <Route path="/proposals" element={token ? <ProposalPage /> : <Navigate to="/auth" replace />} />
          <Route path="/admin/proposals" element={token ? <AdminProposalsPage /> : <Navigate to="/auth" replace />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Layout>
    </AuthProvider>
  )
}
