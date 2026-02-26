import { BrowserRouter, Routes, Route } from 'react-router-dom';
import DocsPage from './pages/DocsPage';
import './App.css';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/docs" element={<DocsPage />} />
        <Route path="/docs/:slug" element={<DocsPage />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;