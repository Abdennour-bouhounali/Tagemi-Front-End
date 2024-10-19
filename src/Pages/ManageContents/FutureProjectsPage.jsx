import React, { useContext, useState, useEffect } from 'react';
import { AppContext } from '../../Context/AppContext';
import axios from 'axios';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css'; // import styles
const apiUrl = import.meta.env.VITE_API_URL; 

const ProjectsPage = () => {
    const { token } = useContext(AppContext);
    const [projects, setProjects] = useState([]);
    const [types, setTypes] = useState([]);
    const [editingProject, setEditingProject] = useState(null);
    const [selectedFiles, setSelectedFiles] = useState([]);
    const [currentProjectId, setCurrentProjectId] = useState(null);``

    const [newproject, setNewproject] = useState({
        title_en: '',
        title_ar: '',
        description_en: '',
        description_ar: '',

    });

    useEffect(() => {
        fetchProjects();
    }, []);

    const fetchProjects = async () => {
        const res = await fetch(`${apiUrl}/api/projects`, {
            headers: { Authorization: `Bearer ${token}` },
        });
        const data = await res.json();
        setProjects(data);
        // console.log(data)
    };


    const addproject = async () => {
        const projectRes = await fetch(`${apiUrl}/api/projects`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify(newproject),
        });

        const projectData = await projectRes.json();
        setProjects([...projects, projectData.project]);
        setNewproject({ title_en: '', title_ar: '', description_en: '', description_ar: ''});
    };

    const uploadImage = async (e) => {
        e.preventDefault();
        const formData = new FormData();
        Array.from(selectedFiles).forEach(file => formData.append('images[]', file));
        formData.append('projectId', currentProjectId);

        try {
            const response = await fetch(`/api/projects/storeProjectImages`, {
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
            fetchProjects(); // Refresh projects to include new images
        } catch (error) {
            console.error('Error uploading image:', error.message);
        }
    };

    function handlePicInput(event) {
        setSelectedFiles(event.target.files);
        setCurrentProjectId(event.target.getAttribute('data-project-id'));
    }

    const handleEdit = (project) => {
        setEditingProject(project);
    };

    async function deleteImage(ProjectImageId) {
        try {
            const res = await fetch(`${apiUrl}/api/projects/delete/${ProjectImageId}`, {
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
        fetchProjects();

    }


    const deleteProject = async (id) => {
        const res = await fetch(`${apiUrl}/api/projects/${id}`, {
            method: 'DELETE',
            headers: { Authorization: `Bearer ${token}` },
        });
        const data = await res.json();
        // console.log(data);
    };


    return (
        <div className='container mx-auto px-4 py-6'>
            <h2 className='text-2xl font-bold mb-6'>Manage Projects</h2>

            {/* Add New project Form */}
            <form onSubmit={(e) => { e.preventDefault(); addproject(); }} className="bg-white p-6 rounded-lg shadow-lg mb-8">
                <h3 className='text-xl font-semibold mb-4'>Add New project</h3>
                <div className="grid grid-cols-1 gap-4">
                    <input className='p-2 border rounded' type="text" placeholder="Title (English)" value={newproject.title_en} onChange={(e) => setNewproject({ ...newproject, title_en: e.target.value })} />
                    <input className='p-2 border rounded' type="text" placeholder="Title (Arabic)" value={newproject.title_ar} onChange={(e) => setNewproject({ ...newproject, title_ar: e.target.value })} />
                    <ReactQuill
                        className='mt-4 w-full h-[250px] pb-4'
                        theme="snow"
                        value={newproject.description_en}
                        onChange={(content) => setNewproject({ ...newproject, description_en: content })}
                        placeholder="Description (English)"
                    />
                    <ReactQuill
                        className='mt-4 w-full h-[250px] pb-4 mb-6'
                        theme="snow"
                        value={newproject.description_ar}
                        onChange={(content) => setNewproject({ ...newproject, description_ar: content })}
                        placeholder="Description (Arabic)"
                    />
                    <button
                        className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500"
                        type="submit">Add project</button>
                </div>
            </form>

            {/* Edit project Form */}
            {editingProject && (
                <form onSubmit={(e) => { e.preventDefault(); updateproject(); }} className="bg-white p-6 rounded-lg shadow-lg mb-8">
                    <h3 className='text-xl font-semibold mb-4'>Edit project</h3>
                    <div className="grid grid-cols-1 gap-4">
                        <input className='p-2 border rounded' type="text" placeholder="Title (English)" value={editingProject.title_en} onChange={(e) => setEditingProject({ ...editingProject, title_en: e.target.value })} />
                        <input className='p-2 border rounded' type="text" placeholder="Title (Arabic)" value={editingProject.title_ar} onChange={(e) => setEditingProject({ ...editingProject, title_ar: e.target.value })} />
                        <ReactQuill
                            className='w-full border rounded'
                            theme="snow"
                            value={editingProject.description_en}
                            onChange={(content) => setEditingProject({ ...editingProject, description_en: content })}
                            placeholder="Description (English)"
                        />
                        <ReactQuill
                            className='w-full border rounded'
                            theme="snow"
                            value={editingProject.description_ar}
                            onChange={(content) => setEditingProject({ ...editingProject, description_ar: content })}
                            placeholder="Description (Arabic)"
                        />
    
                        <button
                            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                            type="submit">Update project</button>
                    </div>
                </form>
            )}

            {/* Projects List */}
            {projects.length > 0 && (
            projects.map((project) => (
                <div key={project.id} className="bg-white p-4 mb-4 rounded-lg shadow-lg">
                    <h4 className='text-lg font-bold'>{project.title_en}</h4>
                    <h4 className='text-lg font-bold'>{project.title_ar}</h4>

                    <p className="text-gray-700 leading-relaxed my-4 font-droid-arabic-kufi">
                        <div
                            className="my-4 pb-4"
                            dangerouslySetInnerHTML={{
                                __html: project.description_en,
                            }}
                        />
                    </p>
                    <p className="text-gray-700 leading-relaxed my-4 font-droid-arabic-kufi">
                        <div
                            className="my-4 pb-4"
                            dangerouslySetInnerHTML={{
                                __html: project.description_ar,
                            }}
                        />
                    </p>
                    <form onSubmit={uploadImage}>
                        <input
                            onChange={handlePicInput}
                            type="file"
                            name="images"
                            multiple
                            data-project-id={project.id}
                            id=""
                        />
                        <button type="submit"
                        className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 ml-2"

                        >Upload Images</button>
                    </form>
                    <div className="mt-4 flex flex-wrap gap-4 my-4">
                        {project.project_images && project.project_images.map((ProjectImage) => (
                            <div
                                className='flex flex-col items-center text-center w-full sm:w-1/2 md:w-1/3 lg:w-1/4'
                                key={ProjectImage.id}
                            >
                                <img
                                    src={`${apiUrl}/${ProjectImage.imageUrl}`}
                                    alt=""
                                    className="w-full h-32 object-contain rounded mb-2"
                                />
                                <button
                                    className="text-red-700 mt-2 p-2 rounded-full bg-red-200 border border-red-700 px-4"
                                    onClick={() => deleteImage(ProjectImage.id)}
                                >
                                    Delete Image
                                </button>
                            </div>
                        ))}
                    </div>

                    <button
                        onClick={() => deleteProject(project.id)}
                        className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500"
                    >Delete</button>
                    <button
                        onClick={() => handleEdit(project)}
                        className="bg-yellow-600 text-white px-4 py-2 rounded hover:bg-yellow-700 focus:outline-none focus:ring-2 focus:ring-yellow-500 ml-2"
                    >Edit</button>
                </div>
            )))}
        </div>
    );
};

export default ProjectsPage;
