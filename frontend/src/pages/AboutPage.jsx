import React from 'react';

const AboutPage = () => {
  return (
    <div className="container mx-auto max-w-4xl p-8 flex items-center justify-center min-h-[calc(100vh-64px)]">
      <div className="bg-white rounded-2xl shadow-xl overflow-hidden border border-gray-100 w-full">

        {/* Header Section */}
        <div className="bg-gray-800 text-white p-10 text-center relative overflow-hidden">
          <div className="relative z-10">
            <h1 className="text-4xl font-extrabold tracking-tight mb-2">FoodPlanner</h1>
            <p className="text-gray-400 font-medium">Ваш умный помощник в планировании питания</p>
            <div className="mt-4 inline-block bg-gray-700 rounded-full px-4 py-1 text-xs font-mono text-blue-300 border border-gray-600">
              v1.1.0
            </div>
          </div>

          {/* Decorative background circle */}
          <div className="absolute top-0 left-0 w-full h-full opacity-10 pointer-events-none">
            <div className="absolute -top-24 -right-24 w-64 h-64 bg-indigo-500 rounded-full blur-3xl"></div>
            <div className="absolute -bottom-24 -left-24 w-64 h-64 bg-blue-500 rounded-full blur-3xl"></div>
          </div>
        </div>

        <div className="p-10 space-y-10">

          {/* Section: Mission */}
          <div>
            <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
              <span className="text-2xl">🎯</span> Наша Миссия
            </h2>
            <p className="text-gray-600 leading-relaxed text-lg">
              FoodPlanner создан, чтобы упростить вашу еженедельную рутину.
              Мы помогаем <b>экономить время</b> за счет организации рецептов,
              <b>контролировать бюджет</b> благодаря автоматическому расчету стоимости и
              <b>питаться здоровее</b>, отслеживая нутриенты (БЖУ) и калории.
              От планирования меню до списка покупок в Telegram — всё уже готово.
            </p>
          </div>

          <hr className="border-gray-100" />

          {/* Section: Features */}
          <div>
            <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
              <span className="text-2xl">🚀</span> Что нового
            </h2>
            <ul className="space-y-2 text-gray-600">
              <li className="flex items-start gap-2">
                <span className="text-green-500 font-bold">✓</span>
                <span><b>Авто-планирование:</b> Умное заполнение недели с учетом размера семьи и "доедания"</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-green-500 font-bold">✓</span>
                <span><b>Нутриенты:</b> Полный расчет БЖУ (Белки, Жиры, Углеводы) для каждого блюда</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-green-500 font-bold">✓</span>
                <span><b>Telegram Бот:</b> Список покупок теперь приходит с ценами и итоговой суммой</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-green-500 font-bold">✓</span>
                <span><b>Навигация:</b> Календарь для просмотра планов на любую дату</span>
              </li>
            </ul>
          </div>

          <hr className="border-gray-100" />

          {/* Section: Developer */}
          <div>
            <h2 className="text-xl font-bold text-gray-800 mb-6 flex items-center gap-2">
              <span className="text-2xl">👨‍💻</span> Разработчик
            </h2>

            <div className="flex items-center gap-6 bg-gray-50 p-6 rounded-xl border border-gray-100 transition-transform hover:scale-[1.01]">
              <div className="w-20 h-20 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-full flex items-center justify-center text-white text-2xl font-bold shadow-lg">
                SS
              </div>
              <div>
                <h3 className="text-2xl font-bold text-gray-800">Sergei Svalov</h3>
                <p className="text-indigo-600 font-medium">Lead Developer & Creator</p>
                <p className="text-gray-500 text-sm mt-2 max-w-md">
                  Увлечен созданием интуитивно понятных инструментов, которые улучшают качество повседневной жизни через технологии и чистый код.
                </p>
              </div>
            </div>
          </div>

          <hr className="border-gray-100" />

          {/* Section: Tech Stack (Optional but looks professional) */}
          <div>
            <h2 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-4">
              Технологии
            </h2>
            <div className="flex flex-wrap gap-3">
              <span className="px-3 py-1 bg-blue-50 text-blue-700 rounded-full text-sm font-medium border border-blue-100">React</span>
              <span className="px-3 py-1 bg-green-50 text-green-700 rounded-full text-sm font-medium border border-green-100">FastAPI</span>
              <span className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-sm font-medium border border-gray-200">SQLite</span>
              <span className="px-3 py-1 bg-cyan-50 text-cyan-700 rounded-full text-sm font-medium border border-cyan-100">Tailwind CSS</span>
              <span className="px-3 py-1 bg-blue-50 text-blue-600 rounded-full text-sm font-medium border border-blue-100">Telegram API</span>
            </div>
          </div>

        </div>

        {/* Footer */}
        <div className="bg-gray-50 p-6 text-center text-gray-400 text-sm border-t border-gray-100">
          © {new Date().getFullYear()} Sergei Svalov. Все права защищены.
        </div>

      </div>
    </div>
  );
};

export default AboutPage;