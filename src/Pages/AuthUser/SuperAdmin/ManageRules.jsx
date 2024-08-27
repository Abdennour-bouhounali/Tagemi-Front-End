import { useContext, useEffect, useState } from "react";
import { AppContext } from "../../../Context/AppContext"
import { useNavigate } from "react-router-dom";

export default function ManageRules() {
    const navigate = useNavigate();
    const { token } = useContext(AppContext);
    const [rules, setRules] = useState([]);
    const [formData, setFormData] = useState({ rule: '' });
    const [errors, setErrors] = useState({});
    const [editId, setEditId] = useState(null);

    useEffect(() => {
        fetchRules();
    }, []);

    const fetchRules = async () => {
        const res = await fetch('/api/rules', {
            headers: {
                Authorization: `Bearer ${token}`,
            },
        });

        const data = await res.json();
        if (res.ok) {
            setRules(data); // Adjust based on API response structure
        }
    };

    const handleAddRule = async (e) => {
        e.preventDefault();
        const res = await fetch('/api/rules', {
            method: 'POST',
            body: JSON.stringify(formData),
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${token}`,
            },
        });

        const data = await res.json();
        if (res.ok) {
            fetchRules();
            setFormData({ rule: '' });
        } else {
            setErrors(data.errors || {});
        }
    };

    const handleUpdateRule = async (e) => {
        e.preventDefault();
        const res = await fetch(`/api/rules/${editId}`, {
            method: 'PUT',
            body: JSON.stringify(formData),
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${token}`,
            },
        });

        const data = await res.json();
        if (res.ok) {
            fetchRules();
            setEditId(null);
            setFormData({ rule: '' });
        } else {
            setErrors(data.errors || {});
        }
    };

    const handleDeleteRule = async (id) => {
        const res = await fetch(`/api/rules/${id}`, {
            method: 'DELETE',
            headers: {
                Authorization: `Bearer ${token}`,
            },
        });

        if (res.ok) {
            fetchRules();
        }
    };

    const handleEditClick = (rule) => {
        setFormData({ rule: rule.rule });
        setEditId(rule.id);
    };

    return (
        <div className="flex-grow container min-h-screen">
            <h1 className="text-2xl font-bold mb-4">Manage Rules</h1>

            <form onSubmit={editId ? handleUpdateRule : handleAddRule} className="max-w-md mx-auto my-4 p-4 bg-white shadow-md rounded-lg">
                <input
                    value={formData.rule}
                    onChange={(e) => setFormData({ ...formData, rule: e.target.value })}
                    type="text"
                    name="rule"
                    placeholder="Rule Description"
                    className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:border-blue-500 mt-2"
                />
                {errors.rule && <p className="text-red-500 text-xs italic">{errors.rule[0]}</p>}
                
                <button
                    type="submit"
                    className="w-full bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-lg mt-4 focus:outline-none focus:shadow-outline"
                >
                    {editId ? 'Update Rule' : 'Add Rule'}
                </button>
            </form>

            <div className="max-w-md mx-auto p-4 bg-white shadow-md rounded-lg">
                <h2 className="text-xl font-semibold mb-4">Existing Rules</h2>
                <ul>
                    {rules && rules.map((rule) => (
                        <li key={rule.id} className="flex items-center justify-between border-b py-2">
                            <span>{rule.rule}</span>
                            <div>
                                <button
                                    onClick={() => handleEditClick(rule)}
                                    className="bg-yellow-500 hover:bg-yellow-700 text-white font-bold py-1 px-3 rounded-lg mx-1"
                                >
                                    Edit
                                </button>
                                <button
                                    onClick={() => handleDeleteRule(rule.id)}
                                    className="bg-red-500 hover:bg-red-700 text-white font-bold py-1 px-3 rounded-lg mx-1"
                                >
                                    Delete
                                </button>
                            </div>
                        </li>
                    ))}
                </ul>
            </div>
        </div>
    );
}
