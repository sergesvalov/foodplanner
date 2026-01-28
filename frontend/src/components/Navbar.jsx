import React from 'react';
import { Link, useLocation } from 'react-router-dom';

const Navbar = () => {
  const location = useLocation();

  const linkClass = (path) => 
    `px-4 py-2 rounded-md font-medium transition-colors ${
      location.pathname === path 
        ? 'bg-indigo-600 text-white' 
        : 'text-gray-600 hover:bg-gray-100'
    }`;

  return (
    <nav className="bg-white shadow mb-4 sticky top-0 z-50">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between">
        <div className="text-xl font-bold text-indigo-600 flex items-center gap-2">
          🍽️ FoodPlanner
        </div>
        <div className="flex gap-2">
          <Link to="/" className={linkClass('/')}>
            📅 Меню
          </Link>
          <Link to="/recipes" className={linkClass('/recipes')}>
            🍳 Рецепты
          </Link>
          <Link to="/products" className={linkClass('/products')}>
            📦 Каталог
          </Link>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;