import React, { useContext, useState, useEffect } from 'react';
import { AppContext } from '../../Context/AppContext';

const BlogsPage = () => {
    const { token } = useContext(AppContext);
    const [blogs, setBlogs] = useState([]);
    const [newBlog, setNewBlog] = useState({ title: '', content: '', imageUrl: '' });

    useEffect(() => {
        fetchBlogs();
    }, []);

    const fetchBlogs = async () => {
        const res = await fetch('api/blogs', {
            headers: { Authorization: `Bearer ${token}` },
        });
        const data = await res.json();
        setBlogs(data);
    };

    const addBlog = async () => {
        const res = await fetch('api/blogs', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify(newBlog),
        });
        const data = await res.json();
        setBlogs([...blogs, data]);
        setNewBlog({ title: '', content: '', imageUrl: '' });
    };

    const deleteBlog = async (id) => {
        await fetch(`api/blogs/${id}`, {
            method: 'DELETE',
            headers: { Authorization: `Bearer ${token}` },
        });
        setBlogs(blogs.filter((blog) => blog.id !== id));
    };

    const updateBlog = async (id) => {
        const res = await fetch(`api/blogs/${id}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${token}`,
            },
            Body : JSON.stringify(newBlog),
        });
        const data = await res.json();
        setBlogs(blogs.map((blog) => (blog.id === id ? data : blog)));
    };

    return (
        <div>
            <h2>Blogs</h2>
            <form onSubmit={(e) => { e.preventDefault(); addBlog(); }}>
                <input type="text" placeholder="Title" value={newBlog.title} onChange={(e) => setNewBlog({ ...newBlog, title: e.target.value })} />
                <textarea placeholder="Content" value={newBlog.content} onChange={(e) => setNewBlog({ ...newBlog, content: e.target.value })}></textarea>
                <input type="text" placeholder="Image URL" value={newBlog.imageUrl} onChange={(e) => setNewBlog({ ...newBlog, imageUrl: e.target.value })} />
                <button type="submit">Add Blog</button>
            </form>
            <ul>
                {blogs.map((blog) => (
                    <li key={blog.id}>
                        {blog.title}
                        <button onClick={() => deleteBlog(blog.id)}>Delete</button>
                        <button onClick={() => updateBlog(blog.id)}>Edit</button>
                    </li>
                ))}
            </ul>
        </div>
    );
};

export default BlogsPage;
