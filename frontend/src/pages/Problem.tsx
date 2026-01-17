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

interface Problem {
  id: number
  number: number
  topic_id: number
  rating: number
  statement: string
}

export function ProblemPage() {
  const [topics, setTopics] = useState<Topic[]>([])
  const [topicId, setTopicId] = useState<number | "">("")
  const [problem, setProblem] = useState<Problem | null>(null)
  const [answer, setAnswer] = useState("")
  const [message, setMessage] = useState<string | null>(null)

  useEffect(() => {
    api.getTopics().then(setTopics).catch(() => undefined)
    api.getCurrentProblem()
      .then((data) => setProblem(data))
      .catch(() => undefined)
  }, [])

  const randomize = async () => {
    setMessage(null)
    try {
      const data = await api.getRandomProblem(topicId === "" ? undefined : Number(topicId))
      setProblem(data)
      setAnswer("")
    } catch (err) {
      setMessage((err as Error).message)
    }
  }

  const checkAnswer = async () => {
    if (!problem) return
    setMessage(null)
    try {
      const result = await api.submitAnswer(problem.id, answer)
      setMessage(result.is_correct ? "Correct!" : "Wrong answer. Try again.")
    } catch (err) {
      setMessage((err as Error).message)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-semibold">Your next problem</h1>
          <p className="text-muted-foreground">Focus mode with adaptive randomization.</p>
        </div>
        <div className="flex items-center gap-3">
          <label className="text-sm font-medium">Topic</label>
          <select
            className="h-10 rounded-md border border-input bg-transparent px-3 text-sm"
            value={topicId}
            onChange={(event) => setTopicId(event.target.value ? Number(event.target.value) : "")}
          >
            <option value="">All</option>
            {topics.map((topic) => (
              <option key={topic.id} value={topic.id}>
                {topic.name}
              </option>
            ))}
          </select>
          <Button onClick={randomize}>Randomize</Button>
        </div>
      </div>

      {message && <Alert>{message}</Alert>}

      <Card>
        <CardHeader>
          <CardTitle>Problem</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {problem ? (
            <>
              <p className="text-lg">{problem.statement}</p>
              <Textarea
                placeholder="Type your answer"
                value={answer}
                onChange={(event) => setAnswer(event.target.value)}
              />
              <Button onClick={checkAnswer}>Check</Button>
            </>
          ) : (
            <div className="space-y-3">
              <p>No current problem. Pick a topic and randomize to start.</p>
              <Button onClick={randomize}>Get a problem</Button>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Quick tools</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-3 md:grid-cols-2">
          <Button variant="secondary" onClick={randomize}>
            Continue with another random problem
          </Button>
          <Input placeholder="Paste scratch work or hints" />
        </CardContent>
      </Card>
    </div>
  )
}
