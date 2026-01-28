import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar';
import HomePage from './pages/HomePage';
import RecipesPage from './pages/RecipesPage';

function App() {
  return (
    <BrowserRouter>
      <div className="min-h-screen bg-gray-100 font-sans text-gray-900">
        <Navbar />
        
        <main className="container mx-auto px-4 py-2">
          <Routes>
            {/* Главная страница: Сетка меню */}
            <Route path="/" element={<HomePage />} />
            
            {/* Страница редактирования: Конструктор */}
            <Route path="/recipes" element={<RecipesPage />} />
          </Routes>
        </main>
      </div>
    </BrowserRouter>
  );
}

export default App;