import React, { useEffect, useState } from 'react';
import { DatabaseService } from '../services/database';

export const DatabaseDemo: React.FC = () => {
    const [dbStatus, setDbStatus] = useState<string>('未初始化');
    const [users, setUsers] = useState<any[]>([]);
    const [newUser, setNewUser] = useState({ username: '', email: '' });

    useEffect(() => {
        initializeDatabase();
    }, []);

    const initializeDatabase = async () => {
        try {
            const db = DatabaseService.getInstance();
            await db.initialize();
            await db.load();
            setDbStatus('已初始化');
            loadUsers();
        } catch (error) {
            console.error('数据库初始化失败:', error);
            setDbStatus('初始化失败');
        }
    };

    const loadUsers = async () => {
        try {
            const db = DatabaseService.getInstance();
            const result = await db.query('SELECT * FROM users');
            if (result && result[0]) {
                setUsers(result[0].values.map((row: any[]) => ({
                    id: row[0],
                    username: row[1],
                    email: row[2],
                    created_at: row[3],
                })));
            }
        } catch (error) {
            console.error('加载用户失败:', error);
        }
    };

    const addUser = async () => {
        try {
            const db = DatabaseService.getInstance();
            await db.run(
                'INSERT INTO users (username, email) VALUES (?, ?)',
                [newUser.username, newUser.email]
            );
            await db.save();
            setNewUser({ username: '', email: '' });
            loadUsers();
        } catch (error) {
            console.error('添加用户失败:', error);
        }
    };

    return (
        <div className="p-4">
            <h2 className="text-xl font-bold mb-4">数据库演示</h2>
            <div className="mb-4">
                <p>数据库状态: {dbStatus}</p>
            </div>

            <div className="mb-4">
                <h3 className="text-lg font-semibold mb-2">添加新用户</h3>
                <div className="flex gap-2">
                    <input
                        type="text"
                        placeholder="用户名"
                        value={newUser.username}
                        onChange={(e) => setNewUser({ ...newUser, username: e.target.value })}
                        className="border p-2 rounded"
                    />
                    <input
                        type="email"
                        placeholder="邮箱"
                        value={newUser.email}
                        onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
                        className="border p-2 rounded"
                    />
                    <button
                        onClick={addUser}
                        className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
                    >
                        添加
                    </button>
                </div>
            </div>

            <div>
                <h3 className="text-lg font-semibold mb-2">用户列表</h3>
                <div className="border rounded">
                    <table className="min-w-full">
                        <thead>
                            <tr className="bg-gray-100">
                                <th className="px-4 py-2">ID</th>
                                <th className="px-4 py-2">用户名</th>
                                <th className="px-4 py-2">邮箱</th>
                                <th className="px-4 py-2">创建时间</th>
                            </tr>
                        </thead>
                        <tbody>
                            {users.map((user) => (
                                <tr key={user.id} className="border-t">
                                    <td className="px-4 py-2">{user.id}</td>
                                    <td className="px-4 py-2">{user.username}</td>
                                    <td className="px-4 py-2">{user.email}</td>
                                    <td className="px-4 py-2">{user.created_at}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}; 