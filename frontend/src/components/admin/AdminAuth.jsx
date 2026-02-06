import React, { useState } from 'react';
import { verifyPassword } from '../../api/admin';

const AdminAuth = ({ onLogin }) => {
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleLogin = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        try {
            await verifyPassword(password);
            onLogin();
        } catch (err) {
            setError(err.message || 'Ошибка авторизации');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="flex items-center justify-center min-h-[calc(100vh-64px)] bg-gray-50">
            <div className="bg-white p-8 rounded-xl shadow-lg w-96 border border-gray-100">
                <div className="text-center mb-8">
                    <div className="bg-gray-900 text-white w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-4 text-xl">
                        🔒
                    </div>
                    <h2 className="text-2xl font-bold text-gray-800">Администратор</h2>
                    <p className="text-gray-500 text-sm mt-1">Введите пароль для доступа</p>
                </div>

                <form onSubmit={handleLogin} className="space-y-4">
                    <div>
                        <input
                            type="password"
                            placeholder="Пароль"
                            className="w-full border border-gray-200 p-3 rounded-lg focus:ring-2 focus:ring-gray-800 focus:border-transparent outline-none transition-all"
                            value={password}
                            onChange={e => setPassword(e.target.value)}
                            autoFocus
                        />
                    </div>

                    {error && (
                        <div className="bg-red-50 text-red-600 text-sm p-3 rounded-lg flex items-center gap-2">
                            <span className="font-bold">!</span> {error}
                        </div>
                    )}

                    <button
                        disabled={loading}
                        className="w-full bg-gray-900 text-white py-3 rounded-lg hover:bg-black font-bold transition-all disabled:opacity-70 disabled:cursor-not-allowed"
                    >
                        {loading ? 'Проверка...' : 'Войти'}
                    </button>
                </form>
            </div>
        </div>
    );
};

export default AdminAuth;
