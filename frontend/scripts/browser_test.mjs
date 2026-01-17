const API_URL = process.env.VITE_API_URL || 'http://host.docker.internal:8000'

async function run() {
  try {
    console.log('1) Logging in...')
    const loginRes = await fetch(`${API_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: 'abcd', password: 'password' }),
    })
    if (!loginRes.ok) throw new Error(`Login failed: ${loginRes.status}`)
    const loginJson = await loginRes.json()
    const token = loginJson.access_token
    console.log('  token:', token ? token.slice(0, 8) + '...' : 'none')

    console.log('2) Fetching topics...')
    const topicsRes = await fetch(`${API_URL}/topics`, { headers: { 'Content-Type': 'application/json' } })
    const topics = await topicsRes.json()
    console.log('  topics count:', Array.isArray(topics) ? topics.length : typeof topics)

    console.log('3) Submitting proposal as browser would...')
    const payload = { topic_id: topics[0]?.id || 1, statement: '3x+2x=25', answer_key: '5' }
    const propRes = await fetch(`${API_URL}/proposals`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify(payload),
    })
    console.log('  status:', propRes.status)
    const propJson = await propRes.json().catch(() => null)
    console.log('  body:', propJson)

    if (propRes.ok) console.log('Proposal submitted successfully')
    else console.error('Proposal submission failed')
  } catch (err) {
    console.error('Error during browser test:', err)
    process.exitCode = 2
  }
}

run()
