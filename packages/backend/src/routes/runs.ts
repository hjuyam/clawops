import { Router } from 'express'
import { v4 as uuidv4 } from 'uuid'

const router = Router()

interface Run {
  id: string
  task_id?: string
  workflow_id?: string
  status: 'pending' | 'running' | 'completed' | 'failed' | 'stopped'
  created_at: string
  updated_at: string
  parameters?: Record<string, unknown>
}

const runs: Map<string, Run> = new Map()

router.get('/', (_req, res) => {
  const runList = Array.from(runs.values()).sort(
    (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  )
  res.json({ success: true, data: runList })
})

router.get('/:id', (req, res) => {
  const run = runs.get(req.params.id)
  if (!run) {
    return res.status(404).json({ success: false, error: 'Run not found' })
  }
  res.json({ success: true, data: run })
})

router.post('/', (req, res) => {
  const { task_id, workflow_id, parameters } = req.body
  
  const run: Run = {
    id: `run_${uuidv4().slice(0, 8)}`,
    task_id,
    workflow_id,
    status: 'pending',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    parameters,
  }
  
  runs.set(run.id, run)
  res.status(201).json({ success: true, data: run })
})

router.post('/:id/stop', (req, res) => {
  const run = runs.get(req.params.id)
  if (!run) {
    return res.status(404).json({ success: false, error: 'Run not found' })
  }
  
  run.status = 'stopped'
  run.updated_at = new Date().toISOString()
  runs.set(run.id, run)
  
  res.json({ success: true, data: run })
})

router.get('/:id/events', (req, res) => {
  const run = runs.get(req.params.id)
  if (!run) {
    return res.status(404).json({ success: false, error: 'Run not found' })
  }

  res.setHeader('Content-Type', 'text/event-stream')
  res.setHeader('Cache-Control', 'no-cache')
  res.setHeader('Connection', 'keep-alive')

  const sendEvent = (event: string, data: unknown) => {
    res.write(`event: ${event}\n`)
    res.write(`data: ${JSON.stringify(data)}\n\n`)
  }

  sendEvent('start', { run_id: run.id })

  const interval = setInterval(() => {
    sendEvent('progress', { 
      run_id: run.id, 
      status: 'running',
      timestamp: new Date().toISOString()
    })
  }, 1000)

  setTimeout(() => {
    clearInterval(interval)
    sendEvent('complete', { run_id: run.id, status: 'completed' })
    res.end()
  }, 5000)

  req.on('close', () => {
    clearInterval(interval)
  })
})

export { router as runsRouter }
