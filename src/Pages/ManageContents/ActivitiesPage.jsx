import React, { useContext, useState, useEffect } from 'react';
import { AppContext } from '../../Context/AppContext';
import axios from 'axios';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css'; // import styles

const apiUrl = import.meta.env.VITE_API_URL; 
const ActivitiesPage = () => {
    const { token } = useContext(AppContext);
    const [activities, setActivities] = useState([]);
    const [types, setTypes] = useState([]);
    const [editingActivity, setEditingActivity] = useState(null);
    const [selectedFiles, setSelectedFiles] = useState([]);
    const [currentActivityId, setCurrentActivityId] = useState(null);


    // console.log(apiUrl);
    const [newActivity, setNewActivity] = useState({
        title_en: '',
        title_ar: '',
        description_en: '',
        description_ar: '',
        type_id: '',
        date: '',
    });

    useEffect(() => {
        fetchActivities();
        fetchTypes();
    }, []);

    const fetchActivities = async () => {
        const res = await fetch(`${apiUrl}/api/activities`, {
            headers: { Authorization: `Bearer ${token}` },
        });
        const data = await res.json();
        setActivities(data);
    };

    const fetchTypes = async () => {
        const res = await fetch(`${apiUrl}/api/types`, {
            headers: { Authorization: `Bearer ${token}` },
        });
        const data = await res.json();
        setTypes(data);
    };

    const addActivity = async () => {
        const activityRes = await fetch(`${apiUrl}/api/activities`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify(newActivity),
        });

        const activityData = await activityRes.json();
        setActivities([...activities, activityData.activity]);
        setNewActivity({ title_en: '', title_ar: '', description_en: '', description_ar: '', type_id: '', date: '' });
    };

    const uploadImage = async (e) => {
        e.preventDefault();
        const formData = new FormData();
        Array.from(selectedFiles).forEach(file => formData.append('images[]', file));
        formData.append('activityId', currentActivityId);

        try {
            const response = await fetch(`${apiUrl}/api/mediaStore`, {
                method: 'POST',
                headers: {
                    Authorization: `Bearer ${token}`,
                },
                body: formData,
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Error uploading image');
            }

            await response.json();
            fetchActivities(); // Refresh activities to include new images
        } catch (error) {
            console.error('Error uploading image:', error.message);
        }
    };

    function handlePicInput(event) {
        setSelectedFiles(event.target.files);
        setCurrentActivityId(event.target.getAttribute('data-activity-id'));
    }

    const handleEdit = (activity) => {
        setEditingActivity(activity);
    };

    async function deleteImage(mediaId) {
        try {
            const res = await fetch(`${apiUrl}/api/media/${mediaId}`, {
                method: 'DELETE',
                headers: {
                    Authorization: `Bearer ${token}`
                }
            });

            if (res.ok) {
                const data = await res.json();
            } else {
                const errorData = await res.json();
                throw new Error(errorData.message || 'Error deleting image');
            }
        } catch (error) {
            console.error('Error deleting image:', error.message);
        }
        fetchActivities();

    }


    const deleteActivity = async (id) => {
        await fetch(`${apiUrl}/api/activities/${id}`, {
            method: 'DELETE',
            headers: { Authorization: `Bearer ${token}` },
        });
        const data = await res.json();
        // console.log(data);
    };

    const makeSpecial = async (id) => {
        try {
            const res = await fetch(`${apiUrl}/api/activities/makeSpecial/${id}`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json' // Ensure this is included if you're sending JSON data
                }
            });

            if (!res.ok) {
                throw new Error('Network response was not ok');
            }

            const data = await res.json();
            // console.log(data);
            fetchActivities();

        } catch (error) {
            console.error('There was a problem with the fetch operation:', error);
        }
    };
    return (
        <div className='container mx-auto px-4 py-6'>
            <h2 className='text-2xl font-bold mb-6'>Manage Activities</h2>

            {/* Add New Activity Form */}
            <form onSubmit={(e) => { e.preventDefault(); addActivity(); }} className="bg-white p-6 rounded-lg shadow-lg mb-8">
                <h3 className='text-xl font-semibold mb-4'>Add New Activity</h3>
                <div className="grid grid-cols-1 gap-4">
                    <input className='p-2 border rounded' type="text" placeholder="Title (English)" value={newActivity.title_en} onChange={(e) => setNewActivity({ ...newActivity, title_en: e.target.value })} />
                    <input className='p-2 border rounded' type="text" placeholder="Title (Arabic)" value={newActivity.title_ar} onChange={(e) => setNewActivity({ ...newActivity, title_ar: e.target.value })} />
                    <ReactQuill
                        className='mt-4 w-full h-[250px] pb-4'
                        theme="snow"
                        value={newActivity.description_en}
                        onChange={(content) => setNewActivity({ ...newActivity, description_en: content })}
                        placeholder="Description (English)"
                    />
                    <ReactQuill
                        className='mt-4 w-full h-[250px] pb-4 mb-6'
                        theme="snow"
                        value={newActivity.description_ar}
                        onChange={(content) => setNewActivity({ ...newActivity, description_ar: content })}
                        placeholder="Description (Arabic)"
                    />
                    <select name='type_id mt-5'
                        className="p-2 border rounded w-full"
                        value={newActivity.type_id} onChange={(e) => setNewActivity({ ...newActivity, type_id: e.target.value })}>
                        <option value="">Select Type</option>
                        {types.map(type => (
                            <option key={type.id} value={type.id}>{type.name_ar}</option>
                        ))}
                    </select>
                    <input
                        required
                        type="date"
                        value={newActivity.date}
                        onChange={(e) => setNewActivity({ ...newActivity, date: e.target.value })}
                        name="date"
                        className="p-2 border rounded w-full"
                    />
                    <button
                        className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500"
                        type="submit">Add Activity</button>
                </div>
            </form>

            {/* Edit Activity Form */}
            {editingActivity && (
                <form onSubmit={(e) => { e.preventDefault(); updateActivity(); }} className="bg-white p-6 rounded-lg shadow-lg mb-8">
                    <h3 className='text-xl font-semibold mb-4'>Edit Activity</h3>
                    <div className="grid grid-cols-1 gap-4">
                        <input className='p-2 border rounded' type="text" placeholder="Title (English)" value={editingActivity.title_en} onChange={(e) => setEditingActivity({ ...editingActivity, title_en: e.target.value })} />
                        <input className='p-2 border rounded' type="text" placeholder="Title (Arabic)" value={editingActivity.title_ar} onChange={(e) => setEditingActivity({ ...editingActivity, title_ar: e.target.value })} />
                        <ReactQuill
                            className='w-full border rounded'
                            theme="snow"
                            value={editingActivity.description_en}
                            onChange={(content) => setEditingActivity({ ...editingActivity, description_en: content })}
                            placeholder="Description (English)"
                        />
                        <ReactQuill
                            className='w-full border rounded'
                            theme="snow"
                            value={editingActivity.description_ar}
                            onChange={(content) => setEditingActivity({ ...editingActivity, description_ar: content })}
                            placeholder="Description (Arabic)"
                        />
                        <select name='type_id'
                            className="p-2 border rounded w-full"
                            value={editingActivity.type_id} onChange={(e) => setEditingActivity({ ...editingActivity, type_id: e.target.value })}>
                            <option value="">Select Type</option>
                            {types.map(type => (
                                <option key={type.id} value={type.id}>{type.name_ar}</option>
                            ))}
                        </select>
                        <input
                            required
                            type="date"
                            value={editingActivity.date}
                            onChange={(e) => setEditingActivity({ ...editingActivity, date: e.target.value })}
                            name="date"
                            className="p-2 border rounded w-full"
                        />
                        <button
                            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                            type="submit">Update Activity</button>
                    </div>
                </form>
            )}

            {/* Activities List */}
            {activities.map((activity) => (
                <div key={activity.id} className="bg-white p-4 mb-4 rounded-lg shadow-lg">
                    <h4 className='text-lg font-bold'>{activity.title_en}</h4>
                    <h4 className='text-lg font-bold'>{activity.title_ar}</h4>

                    <p className="text-gray-700 leading-relaxed my-4 font-droid-arabic-kufi">
                        <div
                            className="my-4 pb-4"
                            dangerouslySetInnerHTML={{
                                __html: activity.description_en,
                            }}
                        />
                    </p>
                    <p className="text-gray-700 leading-relaxed my-4 font-droid-arabic-kufi">
                        <div
                            className="my-4 pb-4"
                            dangerouslySetInnerHTML={{
                                __html: activity.description_ar,
                            }}
                        />
                    </p>
                    <p className='text-gray-600'>Type: {activity.type_name_ar}</p>
                    <p className='text-gray-600'>Date: {new Date(activity.date).toLocaleDateString()}</p>
                    <button
            className='font-droid-arabic-kufi my-7'
            onClick={() => makeSpecial(activity.id)}
        >
            {!activity.featured ? <span                         className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 ml-2"
>إضافة إلى الأعمال المميزة</span>: <span                                     className="text-red-700 mt-2 p-2 rounded-full bg-red-200 border border-red-700 px-4"
>حذف من قائمة الأعمال المميزة</span>}
        </button>
                    <form onSubmit={uploadImage}>
                        <input
                            onChange={handlePicInput}
                            type="file"
                            name="images"
                            multiple
                            data-activity-id={activity.id}
                            id=""
                        />
                        <button type="submit"
                        className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 ml-2"

                        >Upload Images</button>
                    </form>
                    <div className="mt-4 flex flex-wrap gap-4 my-4">
                        {activity.media && activity.media.map((media) => (
                            <div
                                className='flex flex-col items-center text-center w-full sm:w-1/2 md:w-1/3 lg:w-1/4'
                                key={media.id}
                            >
                                <img
                                    src={`${apiUrl}/${media.url}`}
                                    alt=""
                                    className="w-full h-32 object-contain rounded mb-2"
                                />
                                <button
                                    className="text-red-700 mt-2 p-2 rounded-full bg-red-200 border border-red-700 px-4"
                                    onClick={() => deleteImage(media.id)}
                                >
                                    Delete Image
                                </button>
                            </div>
                        ))}
                    </div>

                    <button
                        onClick={() => deleteActivity(activity.id)}
                        className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500"
                    >Delete</button>
                    <button
                        onClick={() => handleEdit(activity)}
                        className="bg-yellow-600 text-white px-4 py-2 rounded hover:bg-yellow-700 focus:outline-none focus:ring-2 focus:ring-yellow-500 ml-2"
                    >Edit</button>
                </div>
            ))}
        </div>
    );
};

export default ActivitiesPage;
