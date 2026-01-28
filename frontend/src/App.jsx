import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar';
import HomePage from './pages/HomePage';
import RecipesPage from './pages/RecipesPage';
import ProductsPage from './pages/ProductsPage'; // Импорт

function App() {
  return (
    <BrowserRouter>
      <div className="min-h-screen bg-gray-100 font-sans text-gray-900">
        <Navbar />
        <main className="container mx-auto px-4 py-4 pb-20">
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/recipes" element={<RecipesPage />} />
            <Route path="/products" element={<ProductsPage />} /> {/* Новый роут */}
          </Routes>
        </main>
      </div>
    </BrowserRouter>
  );
}

export default App;