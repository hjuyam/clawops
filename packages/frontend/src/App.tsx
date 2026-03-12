import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Layout from './components/Layout'
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
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<Home />} />
          <Route path="connect" element={<Connect />} />
          <Route path="tasks" element={<Tasks />} />
          <Route path="ops" element={<Ops />} />
          <Route path="config" element={<Config />} />
          <Route path="memory" element={<Memory />} />
          <Route path="security" element={<Security />} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}

export default App
