import React from 'react';
import { Link, useLocation } from 'react-router-dom';

const Navbar = () => {
  const location = useLocation();

  const isActive = (path) => {
    return location.pathname === path ? "bg-gray-900 text-white" : "text-gray-300 hover:bg-gray-700 hover:text-white";
  };

  return (
    <nav className="bg-gray-800 shadow-lg sticky top-0 z-50">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center w-full">
            <Link to="/" className="text-white font-bold text-xl flex items-center gap-2 mr-8">
              📅 FoodPlanner
            </Link>

            <div className="flex items-baseline space-x-4 flex-1">
              <Link to="/today" className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${isActive('/today')}`}>
                ☀️ Сегодня
              </Link>

              <Link to="/" className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${isActive('/')}`}>
                Неделя
              </Link>

              <Link to="/view" className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${isActive('/view')}`}>
                🔎 Посмотреть
              </Link>

              <Link to="/shopping-list" className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${isActive('/shopping-list')}`}>
                🛒 Покупки
              </Link>

              <Link to="/planning" className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${isActive('/planning')}`}>
                📋 Планирование
              </Link>

              <Link to="/stats" className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${isActive('/stats')}`}>
                📊 Статистика
              </Link>

              <Link to="/products" className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${isActive('/products')}`}>
                📦 Продукты
              </Link>

              <Link to="/recipes" className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${isActive('/recipes')}`}>
                🍳 Рецепты
              </Link>
            </div>

            {/* Right side icons */}
            <div className="flex items-center space-x-2">
              {/* About Link */}
              <Link
                to="/about"
                className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${isActive('/about')}`}
                title="About"
              >
                ℹ️
              </Link>

              {/* Personal Link */}
              <Link
                to="/personal"
                className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${isActive('/personal')}`}
                title="Личное"
              >
                👤
              </Link>

              {/* Admin Link */}
              <Link
                to="/admin"
                className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${isActive('/admin')}`}
                title="Администрирование"
              >
                ⚙️
              </Link>
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;