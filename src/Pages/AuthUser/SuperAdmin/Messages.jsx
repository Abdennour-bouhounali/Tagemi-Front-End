import React, { useEffect, useState } from 'react';
import * as XLSX from 'xlsx';
const apiUrl = import.meta.env.VITE_API_URL; 


const Messages = () => {
  const [messages, setMessages] = useState([]);
  const [cityFilter, setCityFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [filteredMessages, setFilteredMessages] = useState([]);

  useEffect(() => {
    fetch(`${apiUrl}/api/contacts`)
      .then((response) => response.json())
      .then((data) => {
        setMessages(data);
        setFilteredMessages(data);
      })
      .catch((error) => console.error('Error fetching messages:', error));
  }, []);

  useEffect(() => {
    filterMessages();
  }, [cityFilter, typeFilter]);

  const filterMessages = () => {
    let filtered = messages;

    if (cityFilter) {
      filtered = filtered.filter((message) =>
        message.wilaya.toLowerCase().includes(cityFilter.toLowerCase())
      );
    }

    if (typeFilter) {
      filtered = filtered.filter((message) =>
        message.type_message.toLowerCase() === typeFilter.toLowerCase()
      );
    }

    setFilteredMessages(filtered);
  };

  const handleCityChange = (e) => {
    setCityFilter(e.target.value);
  };

  const handleTypeChange = (e) => {
    setTypeFilter(e.target.value);
  };

  const handleDownloadExcel = () => {
    const ws = XLSX.utils.json_to_sheet(filteredMessages);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'messages');
    XLSX.writeFile(wb, 'messages.xlsx');
  };


  const handleDelete = (id) => {
    fetch(`${apiUrl}/api/contacts/${id}`, {
      method: 'DELETE',
    })
    .then(() => {
      setMessages(messages.filter(message => message.id !== id));
      setFilteredMessages(filteredMessages.filter(message => message.id !== id));
    })
    .catch(error => console.error('Error deleting message:', error));
  };


  return (
    <div className="flex-grow container min-h-screen">
      <div className="flex my-4">
        <input
          type="text"
          placeholder="Filter by city..."
          value={cityFilter}
          onChange={handleCityChange}
          className="search-bar m-4 px-2 bg-[#EEEDEB]"
        />
        <select
          value={typeFilter}
          onChange={handleTypeChange}
          className="search-bar m-4 px-2 bg-[#EEEDEB]"
        >
          <option className='font-droid-arabic-kufi'  value="">كل الأنواع </option>
          <option  className='font-droid-arabic-kufi' value="help">مساعدة</option>
          <option className='font-droid-arabic-kufi'  value="aide">رغبة في  تقديم العون</option>
          <option className='font-droid-arabic-kufi'  value="project_aide">مساهمة في مشروع  </option>
          <option className='font-droid-arabic-kufi'  value="question">إستفسار</option>
          <option  className='font-droid-arabic-kufi' value="other">أخرى</option>
        </select>
        <button onClick={handleDownloadExcel} className="mx-4 px-4 py-0 bg-blue-500 text-sm text-nowrap text-white rounded">Download Excel</button>

      </div>
      <table className="table-auto my-7 text-center">
        <thead>
          <tr>
            <th>الإسم</th>
            <th>اللقب</th>
            <th>رقم الهاتف (الواتساب)</th>
            <th>الولاية</th>
            <th>نوع الرسالة</th>
            <th>الرسالة</th>
            <th>حذف</th>
          </tr>
        </thead>
        <tbody>
          {filteredMessages.map((message) => (
            <tr key={message.id}>
              <td className="border px-4 py-2">{message.first_name}</td>
              <td className="border px-4 py-2">{message.last_name}</td>
              <td className="border px-4 py-2">{message.phone}</td>
              <td className="border px-4 py-2">{message.wilaya}</td>
              <td className="border px-4 py-2">
                {message.type_message == 'help' ? 'مساعدة': ''}
                {message.type_message == 'aide' ? ' رغبة في  تقديم العون ': ''}
                {message.type_message == 'project_aide' ? 'مساهمة في مشروع': ''}
                {message.type_message == 'question' ? 'إستفسار': ''}
                {message.type_message == 'other' ? 'أخرى': ''}
                </td>
              <td className="border px-4 py-2">{message.message}</td>
              <td>
              <button
                    onClick={() => handleDelete(message.id)}
                    className="px-2 py-1 bg-red-500 text-white rounded"
                  >
                    Delete
                  </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default Messages;
