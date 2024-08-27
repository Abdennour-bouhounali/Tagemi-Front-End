import React, { useContext, useState, useEffect } from 'react';
import { AppContext } from '../../Context/AppContext';
// import { AppContext } from './AppContext';

const SponsorsPage = () => {
    const { token } = useContext(AppContext);
    const [sponsors, setSponsors] = useState([]);
    const [newSponsor, setNewSponsor] = useState({ name: '', description: '', imageUrl: '' });

    useEffect(() => {
        fetchSponsors();
    }, []);

    const fetchSponsors = async () => {
        const res = await fetch('api/sponsors', {
            headers: { Authorization: `Bearer ${token}` },
        });
        const data = await res.json();
        setSponsors(data);
    };

    const addSponsor = async () => {
        const res = await fetch('api/sponsors', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify(newSponsor),
        });
        const data = await res.json();
        setSponsors([...sponsors, data]);
        setNewSponsor({ name: '', description: '', imageUrl: '' });
    };

    const deleteSponsor = async (id) => {
        await fetch(`api/sponsors/${id}`, {
            method: 'DELETE',
            headers: { Authorization: `Bearer ${token}` },
        });
        setSponsors(sponsors.filter((sponsor) => sponsor.id !== id));
    };

    const updateSponsor = async (id) => {
        const res = await fetch(`api/sponsors/${id}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify(newSponsor),
        });
        const data = await res.json();
        setSponsors(sponsors.map((sponsor) => (sponsor.id === id ? data : sponsor)));
    };

    return (
        <div>
            <h2>Sponsors</h2>
            <form onSubmit={(e) => { e.preventDefault(); addSponsor(); }}>
                <input type="text" placeholder="Name" value={newSponsor.name} onChange={(e) => setNewSponsor({ ...newSponsor, name: e.target.value })} />
                <textarea placeholder="Description" value={newSponsor.description} onChange={(e) => setNewSponsor({ ...newSponsor, description: e.target.value })}></textarea>
                <input type="text" placeholder="Image URL" value={newSponsor.imageUrl} onChange={(e) => setNewSponsor({ ...newSponsor, imageUrl: e.target.value })} />
                <button type="submit">Add Sponsor</button>
            </form>
            <ul>
                {sponsors.map((sponsor) => (
                    <li key={sponsor.id}>
                        {sponsor.name}
                        <button onClick={() => deleteSponsor(sponsor.id)}>Delete</button>
                        <button onClick={() => updateSponsor(sponsor.id)}>Edit</button>
                    </li>
                ))}
            </ul>
        </div>
    );
};

export default SponsorsPage;
