import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import Layout from './components/Layout'
import CommandPalette from './components/CommandPalette'
import Login from './pages/Login'
import Home from './pages/Home'
import Connect from './pages/Connect'
import Tasks from './pages/Tasks'
import Ops from './pages/Ops'
import Config from './pages/Config'
import Memory from './pages/Memory'
import Security from './pages/Security'

function App() {
  return (
    <BrowserRouter>
      <CommandPalette />
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/" element={<Layout />}>
          <Route index element={<Home />} />
          <Route path="connect" element={<Connect />} />
          <Route path="tasks" element={<Tasks />} />
          <Route path="ops" element={<Ops />} />
          <Route path="config" element={<Config />} />
          <Route path="memory" element={<Memory />} />
          <Route path="security" element={<Security />} />
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App
