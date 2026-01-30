import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar';
import HomePage from './pages/HomePage';
import ProductsPage from './pages/ProductsPage';
import RecipesPage from './pages/RecipesPage';
import ShoppingListPage from './pages/ShoppingListPage';
import TodayPage from './pages/TodayPage';
import AdminPage from './pages/AdminPage';
import AboutPage from './pages/AboutPage';
import StatisticsPage from './pages/StatisticsPage';

function App() {
  return (
    <Router>
      {/* ИЗМЕНЕНИЕ: min-h-screen вместо h-screen, чтобы страница могла расти */}
      <div className="flex flex-col min-h-screen bg-gray-100">
        
        {/* Navbar sticky, чтобы он оставался сверху при скролле */}
        <div className="shrink-0 z-50 sticky top-0">
          <Navbar />
        </div>

        {/* ИЗМЕНЕНИЕ: Убрали overflow-hidden, теперь контент растягивает страницу */}
        <main className="flex-1 relative flex flex-col">
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/today" element={<TodayPage />} />
            <Route path="/products" element={<ProductsPage />} />
            <Route path="/recipes" element={<RecipesPage />} />
            <Route path="/shopping-list" element={<ShoppingListPage />} />
            <Route path="/stats" element={<StatisticsPage />} />
            <Route path="/admin" element={<AdminPage />} />
            <Route path="/about" element={<AboutPage />} />
          </Routes>
        </main>
      </div>
    </Router>
  );
}

export default App;