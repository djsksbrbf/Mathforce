import { useEffect, useState } from "react"

import { api } from "@/api"
import { Alert } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"

interface Topic {
  id: number
  name: string
}

export function ProposalPage() {
  const [topics, setTopics] = useState<Topic[]>([])
  const [topicId, setTopicId] = useState<number | "">("")
  const [statement, setStatement] = useState("")
  const [answerKey, setAnswerKey] = useState("")
  const [message, setMessage] = useState<string | null>(null)

  useEffect(() => {
    api.getTopics().then(setTopics).catch(() => undefined)
  }, [])

  const submit = async (event: React.FormEvent) => {
    event.preventDefault()
    setMessage(null)
    if (topicId === "") {
      setMessage("Please select a topic")
      return
    }
    try {
      await api.submitProposal({
        topic_id: Number(topicId),
        statement,
        answer_key: answerKey,
      })
      setMessage("Proposal sent for approval")
      setStatement("")
      setAnswerKey("")
    } catch (err) {
      setMessage((err as Error).message)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Propose a problem</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {message && <Alert>{message}</Alert>}
        <form className="space-y-3" onSubmit={submit}>
          <div className="space-y-1">
            <label className="text-sm font-medium">Topic</label>
            <select
              className="h-10 w-full rounded-md border border-input bg-transparent px-3 text-sm"
              value={topicId}
              onChange={(event) => setTopicId(event.target.value ? Number(event.target.value) : "")}
              required
            >
              <option value="">Select a topic</option>
              {topics.map((topic) => (
                <option key={topic.id} value={topic.id}>
                  {topic.name}
                </option>
              ))}
            </select>
          </div>
          <div className="space-y-1">
            <label className="text-sm font-medium">Problem statement</label>
            <Textarea value={statement} onChange={(event) => setStatement(event.target.value)} required />
          </div>
          <div className="space-y-1">
            <label className="text-sm font-medium">Answer key</label>
            <Input value={answerKey} onChange={(event) => setAnswerKey(event.target.value)} required />
          </div>
          <Button type="submit">Send for approval</Button>
        </form>
      </CardContent>
    </Card>
  )
}
