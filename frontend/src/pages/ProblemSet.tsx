import { useEffect, useState } from "react"

import { api } from "@/api"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

interface Problem {
  id: number
  number: number
  topic_id: number
  rating: number
  statement: string
}

interface Topic {
  id: number
  name: string
}

export function ProblemSetPage() {
  const [problems, setProblems] = useState<Problem[]>([])
  const [topics, setTopics] = useState<Topic[]>([])
  const [topicId, setTopicId] = useState<number | "">("")

  useEffect(() => {
    api.getTopics().then(setTopics).catch(() => undefined)
  }, [])

  useEffect(() => {
    api.getProblems(topicId === "" ? undefined : Number(topicId))
      .then(setProblems)
      .catch(() => undefined)
  }, [topicId])

  return (
    <Card>
      <CardHeader>
        <CardTitle>Problem set</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center gap-3">
          <label className="text-sm font-medium">Topic filter</label>
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
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-border">
              <tr>
                <th className="py-2">#</th>
                <th className="py-2">Statement</th>
                <th className="py-2">Rating</th>
              </tr>
            </thead>
            <tbody>
              {problems.map((problem) => (
                <tr key={problem.id} className="border-b border-border last:border-0">
                  <td className="py-2 font-medium">{problem.number}</td>
                  <td className="py-2">{problem.statement}</td>
                  <td className="py-2">{problem.rating}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  )
}
