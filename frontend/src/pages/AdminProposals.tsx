import { useEffect, useState } from "react"

import { api } from "@/api"
import { Button } from "@/components/ui/button"

interface Proposal {
  id: number
  status: string
  created_at: string
}

export function AdminProposalsPage() {
  const [proposals, setProposals] = useState<Proposal[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    api.getAdminProposals().then(setProposals).catch(() => setProposals([]))
  }, [])

  const approve = async (id: number) => {
    setLoading(true)
    try {
      await api.approveProposal(id)
      setProposals((p) => p.filter((item) => item.id !== id))
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-medium">Pending Proposals</h2>
      {proposals.length === 0 ? (
        <div>No proposals</div>
      ) : (
        <div className="space-y-3">
          {proposals.map((p) => (
            <div key={p.id} className="flex items-center justify-between rounded border p-3">
              <div>
                <div className="text-sm font-medium">Proposal #{p.id}</div>
                <div className="text-xs text-muted-foreground">{new Date(p.created_at).toLocaleString()}</div>
              </div>
              <div>
                <Button disabled={loading} onClick={() => approve(p.id)}>
                  Approve
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
