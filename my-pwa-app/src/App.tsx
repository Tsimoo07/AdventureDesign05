import { BrowserRouter, Link, Route, Routes } from 'react-router-dom'
import CategoryPage from './pages/CategoryPage'
import HomePage from './pages/HomePage'

export default function App() {
  return (
    <BrowserRouter>
      <main>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/category/:id" element={<CategoryPage />} />
          <Route
            path="*"
            element={
              <p>
                페이지를 찾을 수 없습니다. <Link to="/">처음으로</Link>
              </p>
            }
          />
        </Routes>
      </main>
    </BrowserRouter>
  )
}