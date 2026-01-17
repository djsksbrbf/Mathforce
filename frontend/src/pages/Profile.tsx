import { useEffect, useState } from "react"

import { api } from "@/api"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

interface Profile {
  username: string
  rating: number
  total_solved: number
  per_topic: Record<string, number>
  history: Array<{ problem_id: number; is_correct: boolean; created_at: string }>
}

export function ProfilePage() {
  const [profile, setProfile] = useState<Profile | null>(null)

  useEffect(() => {
    api.getProfile().then(setProfile).catch(() => undefined)
  }, [])

  if (!profile) {
    return <div>Loading profile...</div>
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[2fr_1fr]">
      <Card>
        <CardHeader>
          <CardTitle>Recent history</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {profile.history.length === 0 ? (
            <p className="text-sm text-muted-foreground">No submissions yet.</p>
          ) : (
            profile.history.map((item) => (
              <div key={`${item.problem_id}-${item.created_at}`} className="flex items-center justify-between">
                <span>Problem {item.problem_id}</span>
                <Badge variant={item.is_correct ? "accent" : "outline"}>
                  {item.is_correct ? "Correct" : "Wrong"}
                </Badge>
              </div>
            ))
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Stats</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <p className="text-sm text-muted-foreground">Username</p>
            <p className="text-lg font-semibold">{profile.username}</p>
          </div>
          <div className="flex items-center justify-between">
            <span>Rating</span>
            <Badge variant="accent">{profile.rating}</Badge>
          </div>
          <div className="flex items-center justify-between">
            <span>Total solved</span>
            <Badge>{profile.total_solved}</Badge>
          </div>
          <div>
            <p className="text-sm font-medium">Solved by topic</p>
            <div className="mt-2 space-y-2">
              {Object.entries(profile.per_topic).map(([topic, count]) => (
                <div key={topic} className="flex items-center justify-between text-sm">
                  <span>{topic}</span>
                  <span>{count}</span>
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
