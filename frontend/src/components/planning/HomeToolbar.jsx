import React from 'react';

const HomeToolbar = ({ onAutoFillOne, onSave, onLoad }) => {
    return (
        <div className="flex gap-2">
            <button
                onClick={onAutoFillOne}
                className="px-3 py-1 bg-purple-100 text-purple-700 rounded hover:bg-purple-200 border border-purple-200 text-sm font-medium transition-colors flex items-center gap-1"
                title="Добавить случайный перекус"
            >
                🧟 Дожрать
            </button>
            <button
                onClick={onSave}
                className="px-3 py-1 bg-indigo-100 text-indigo-700 rounded hover:bg-indigo-200 border border-indigo-200 text-sm font-medium transition-colors"
            >
                💾 Сохранить план
            </button>
            <button
                onClick={onLoad}
                className="px-3 py-1 bg-green-100 text-green-700 rounded hover:bg-green-200 border border-green-200 text-sm font-medium transition-colors"
            >
                📂 Загрузить план
            </button>
        </div>
    );
};

export default HomeToolbar;
