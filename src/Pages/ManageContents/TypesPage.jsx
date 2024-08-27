import React, { useContext, useState, useEffect } from 'react';
import { AppContext } from '../../Context/AppContext';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';
const env = import.meta.env;
export const apiUrl = env.VITE_API_URL;

const TypesPage = () => {
    const { token } = useContext(AppContext);
    const [types, setTypes] = useState([]);
    const [typeNameEn, setTypeNameEn] = useState('');
    const [typeNameAr, setTypeNameAr] = useState('');
    const [typeDescriptionEn, setTypeDescriptionEn] = useState('');
    const [typeDescriptionAr, setTypeDescriptionAr] = useState('');
    const [image, setImage] = useState(null);
    const [editingTypeId, setEditingTypeId] = useState(null);

    useEffect(() => {
        fetchTypes();
    }, []);

    const fetchTypes = async () => {
        const res = await fetch('api/types', {
            headers: { Authorization: `Bearer ${token}` },
        });
        const data = await res.json();
        setTypes(data);
    };

    const addType = async (e) => {
        e.preventDefault();
        const formData = new FormData();
        formData.append('name_en', typeNameEn);
        formData.append('name_ar', typeNameAr);
        formData.append('description_en', typeDescriptionEn);
        formData.append('description_ar', typeDescriptionAr);
        if (image) {
            formData.append('image', image);
        }

        const res = await fetch('http://127.0.0.1:8000/api/types', {
            method: 'POST',
            headers: {
                Authorization: `Bearer ${token}`,
            },
            body: formData,
        });

        const data = await res.json();

        if (res.ok) {
            setTypes([...types, data]);
            setTypeNameEn('');
            setTypeNameAr('');
            setTypeDescriptionEn('');
            setTypeDescriptionAr('');
            setImage(null);
        } else {
            console.error(data);
        }
    };

    const deleteType = async (id) => {
        await fetch(`http://127.0.0.1:8000/api/types/${id}`, {
            method: 'DELETE',
            headers: { Authorization: `Bearer ${token}` },
        });
        setTypes(types.filter((type) => type.id !== id));
    };

    const editType = (type) => {
        setEditingTypeId(type.id);
        setTypeNameEn(type.name_en);
        setTypeNameAr(type.name_ar);
        setTypeDescriptionEn(type.description_en);
        setTypeDescriptionAr(type.description_ar);
        setImage(null);
    };

    const updateType = async (e) => {
        e.preventDefault();
        const formData = new FormData();
        formData.append('name_en', typeNameEn);
        formData.append('name_ar', typeNameAr);
        formData.append('description_en', typeDescriptionEn);
        formData.append('description_ar', typeDescriptionAr);
        if (image) {
            formData.append('image', image);
        }

        const res = await fetch(`http://127.0.0.1:8000/api/Updatetype/${editingTypeId}`, {
            method: 'POST',
            headers: {
                Authorization: `Bearer ${token}`,
            },
            body: formData,
        });

        const data = await res.json();

        if (res.ok) {
            setTypes(types.map((type) => (type.id === editingTypeId ? data : type)));
            setEditingTypeId(null);
            setTypeNameEn('');
            setTypeNameAr('');
            setTypeDescriptionEn('');
            setTypeDescriptionAr('');
            setImage(null);
        } else {
            console.error(data);
        }
    };

    return (
        <div className='flex-grow min-h-screen max-w-6xl mx-auto'>
            <h2 className='my-4'>Manage Types</h2>
            <form onSubmit={editingTypeId ? updateType : addType} className="max-w-lg block mx-auto my-4 p-4 text-center bg-white shadow-md rounded-lg">
                <input
                    className='mt-4'
                    type="text"
                    placeholder="Name (English)"
                    value={typeNameEn}
                    onChange={(e) => setTypeNameEn(e.target.value)}
                    required
                />
                <input
                    className='mt-4'
                    type="text"
                    placeholder="Name (Arabic)"
                    value={typeNameAr}
                    onChange={(e) => setTypeNameAr(e.target.value)}
                    required
                />
                <ReactQuill
                    className='mt-4 w-full h-[250px] pb-4 '
                    theme="snow"
                    value={typeDescriptionEn}
                    onChange={(content) => setTypeDescriptionEn(content)}
                    placeholder="Description (English)"
                />
                <ReactQuill
                    className='mt-4 w-full h-[250px] pb-4'
                    theme="snow"
                    value={typeDescriptionAr}
                    onChange={(content) => setTypeDescriptionAr(content)}
                    placeholder="Description (Arabic)"
                />
                <input
                    className='mt-8'
                    type="file"
                    accept="image/*"
                    onChange={(e) => setImage(e.target.files[0])}
                    required={!editingTypeId}
                />
                <button
                    className="text-green-700 mt-8 p-2 rounded-full bg-green-200 border border-green-700 px-6"
                    type="submit"
                >
                    {editingTypeId ? 'Update Type' : 'Add Type'}
                </button>
            </form>
            <ul>
                {types.map((type) => (
                    <li key={type.id} className='bg-white shadow-lg rounded-lg p-4 my-4 flex flex-wrap'>
                        <div className='w-full md:w-1/3 p-4'>
                            <img src={`${apiUrl}/${type.image_url}`} alt="Type" />
                        </div>
                        <div className='w-full md:w-2/3 p-4'>
                            <h3>{type.name_en} / {type.name_ar}</h3>
                            <div dangerouslySetInnerHTML={{ __html: type.description_en }} />
                            <div dangerouslySetInnerHTML={{ __html: type.description_ar }} />
                            <button
                                className="text-yellow-700 mt-8 p-2 rounded-full bg-yellow-200 border border-yellow-700 px-6"
                                onClick={() => editType(type)}
                            >
                                Edit
                            </button>
                            <button
                                className="text-red-700 mt-8 p-2 rounded-full bg-red-200 border border-red-700 px-6"
                                onClick={() => deleteType(type.id)}
                            >
                                Delete
                            </button>
                        </div>
                    </li>
                ))}
            </ul>
        </div>
    );
};

export default TypesPage;
