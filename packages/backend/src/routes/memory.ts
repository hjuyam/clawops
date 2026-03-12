import { Router } from 'express'

const router = Router()

interface Memory {
  id: string
  title: string
  content: string
  source: 'conversation' | 'task' | 'web' | 'file'
  created_at: string
  pinned: boolean
}

const memories: Memory[] = [
  {
    id: 'mem_001',
    title: 'API Integration Notes',
    content: 'Details about API integration patterns...',
    source: 'conversation',
    created_at: new Date(Date.now() - 600000).toISOString(),
    pinned: true,
  },
  {
    id: 'mem_002',
    title: 'Debug Session - Auth Issue',
    content: 'Resolved authentication token issue...',
    source: 'task',
    created_at: new Date(Date.now() - 3600000).toISOString(),
    pinned: false,
  },
]

router.get('/', (req, res) => {
  const { source, search, pinned } = req.query
  
  let filtered = [...memories]
  
  if (source && source !== 'all') {
    filtered = filtered.filter(m => m.source === source)
  }
  
  if (search) {
    const searchLower = String(search).toLowerCase()
    filtered = filtered.filter(m => 
      m.title.toLowerCase().includes(searchLower) ||
      m.content.toLowerCase().includes(searchLower)
    )
  }
  
  if (pinned === 'true') {
    filtered = filtered.filter(m => m.pinned)
  }
  
  res.json({ success: true, data: filtered })
})

router.post('/', (req, res) => {
  const { title, content, source } = req.body
  
  const memory: Memory = {
    id: `mem_${Date.now()}`,
    title,
    content,
    source: source || 'conversation',
    created_at: new Date().toISOString(),
    pinned: false,
  }
  
  memories.unshift(memory)
  res.status(201).json({ success: true, data: memory })
})

router.delete('/:id', (req, res) => {
  const index = memories.findIndex(m => m.id === req.params.id)
  if (index === -1) {
    return res.status(404).json({ success: false, error: 'Memory not found' })
  }
  
  memories.splice(index, 1)
  res.json({ success: true, data: { message: 'Memory deleted' } })
})

router.post('/:id/pin', (req, res) => {
  const memory = memories.find(m => m.id === req.params.id)
  if (!memory) {
    return res.status(404).json({ success: false, error: 'Memory not found' })
  }
  
  memory.pinned = !memory.pinned
  res.json({ success: true, data: memory })
})

router.get('/stats', (_req, res) => {
  res.json({
    success: true,
    data: {
      total: memories.length,
      pinned: memories.filter(m => m.pinned).length,
      by_source: {
        conversation: memories.filter(m => m.source === 'conversation').length,
        task: memories.filter(m => m.source === 'task').length,
        web: memories.filter(m => m.source === 'web').length,
        file: memories.filter(m => m.source === 'file').length,
      },
    },
  })
})

export { router as memoryRouter }
