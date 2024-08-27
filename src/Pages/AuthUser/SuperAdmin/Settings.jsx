import { useContext, useEffect, useState } from "react"
import { AppContext } from "../../../Context/AppContext"
import { useTranslation } from "react-i18next";


export default function Settings() {

  const { t } = useTranslation();
  const { token, startDay, setStartDay, displayAuth, setDisplayAuth } = useContext(AppContext);
  const [message, setMessage] = useState(null);
  const [formData, setFormData] = useState({
    link: '',
  });

  async function handleDelete(e) {
    e.preventDefault();
    const res = await fetch('/api/waitinglist/deleteAppointmentsAndAdmins', {
      method: 'post',
      headers: {
        Authorization: `Bearer ${token}`
      }
    })
    const data = await res.json();
    console.log(data);
    if (res.ok) {
      setMessage(data['message']);
    }
    setTimeout(() => {
      setMessage(null);
    }, 2000);
  }


  async function handleStart(e) {
    e.preventDefault();

    const res = await fetch('/api/startVisitDay',

      { method: 'POST' });
    const data = await res.json();
    setStartDay(data);
  }

  async function handleDisplayHideAuth(e) {
    e.preventDefault();

    const res = await fetch('/api/DisplayHideAuth',

      { method: 'POST' });
    const data = await res.json();
    setDisplayAuth(data);
  }

  //   Route::post('/startVisitDay',[UsefulController::class,'startVisitDay']);
  // Route::post('/DisplayHideAuth',[UsefulController::class,'DisplayHideAuth']);

  async function handleDownload(e) {
    e.preventDefault();
    try {
      const res = await fetch('/api/exportData', {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        }
      });

      if (!res.ok) {
        throw new Error('Failed to download appointments');
      }

      // Trigger file download
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.style.display = 'none';
      a.href = url;
      a.download = 'appointments.xlsx'; // Specify the filename here
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      setMessage('Appointments downloaded successfully');
    } catch (error) {
      console.error('Download error:', error.message);
      setMessage('Failed to download appointments');
    }
  }

  const changeStatisticsLink = async (e) => {
    e.preventDefault();
    
    try {
      const res = await fetch('/api/changeStatisticsLink', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      const data = await res.json();
      console.log(data);

      if (!res.ok) {
        throw new Error(setMessage(data.message) || setMessage('Something went wrong'));
      }

      setMessage(data.message); // Notify the user of the success

    } catch (error) {
      console.error('Error:', error);
      alert('Error changing link: ' + error.message); // Notify the user of the error
    }
  };


  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  return (
    <div className="container min-h-screen" >
      <h4 className="mb-6 text-xl font-bold text-black">
        Settings
      </h4>
      <div className="px-8  mb-4 text-sm text-green-800 rounded-lg bg-green-5 dark:text-green-400" role="alert">
        <span className="font-medium"></span>
      </div>
      {/* Success Message */}
      {message && (
        <div className="flex items-center p-4 mb-4 text-sm text-[#2F3645] border border-green-300 rounded-lg bg-[#EEEDEB]" role="alert">
          <svg className="flex-shrink-0 inline w-4 h-4 me-3" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="currentColor" viewBox="0 0 20 20">
            <path d="M10 .5a9.5 9.5 0 1 0 9.5 9.5A9.51 9.51 0 0 0 10 .5ZM9.5 4a1.5 1.5 0 1 1 0 3 1.5 1.5 0 0 1 0-3ZM12 15H8a1 1 0 0 1 0-2h1v-3H8a1 1 0 0 1 0-2h2a1 1 0 0 1 1 1v4h1a1 1 0 0 1 0 2Z" />
          </svg>
          <span className="sr-only">Info</span>
          <div>
            <span className="font-medium">{message}</span>
          </div>
        </div>
      )}

      <table className="table-auto max-w-6xl m-auto ">
        <thead>
          <tr>
            <th>Functionality</th>
            <th>Button</th>

          </tr>
        </thead>
        <tbody>
          <tr>
            <th> Delete all appiotments & Witing lists </th>
            <th>
              <button
                onClick={(e) => handleDelete(e)}
                type="button"
                className="text-red-700 mx-3 hover:text-white border border-red-700 hover:bg-red-800 focus:ring-4 focus:outline-none focus:ring-red-300 font-medium rounded-lg text-sm px-4 py-2"
              >Delete</button>
            </th>
          </tr>

          <tr>
            <th> Download Appoitments In Excel </th>
            <th>
              <button
                onClick={(e) => handleDownload(e)}
                type="button"
                className="text-green-700 mx-3 hover:text-white border border-green-700 hover:bg-green-800 focus:ring-4 focus:outline-none focus:ring-red-300 font-medium rounded-lg text-sm px-4 py-2"
              >Download</button>
            </th>
          </tr>
          <tr>
            <th>  تحكم في إنطلاق و بدأ يوم الفحوصات  </th>
            <th>
              {/* {startDay && <button
                onClick={(e) => handleStart(e)}
                type="button"
                className="text-red-700 mx-3 hover:text-white border border-red-700 hover:bg-red-800 focus:ring-4 focus:outline-none focus:ring-red-300 font-medium rounded-lg text-sm px-4 py-2"
              >إنتهى يوم الفحوصات  </button>} */}

              {!startDay ?

                <button
                  onClick={(e) => handleStart(e)}
                  type="button"
                  className="text-green-700 mx-3 hover:text-white border border-green-700 hover:bg-green-800 focus:ring-4 focus:outline-none focus:ring-red-300 font-medium rounded-lg text-sm px-4 py-2"
                >إبدأ يوم الفحوصات  </button>
                :
                <button
                  onClick={(e) => handleStart(e)}
                  type="button"
                  className="text-red-700 mx-3 hover:text-white border border-red-700 hover:bg-red-800 focus:ring-4 focus:outline-none focus:ring-red-300 font-medium rounded-lg text-sm px-4 py-2"
                >إنتهى يوم الفحوصات  </button>
              }

            </th>
          </tr>

          <tr>
            <th>  تحكم في ظهور إنشاء و دخول حساب  </th>
            <th>
              {displayAuth ? <button
                onClick={(e) => handleDisplayHideAuth(e)}
                type="button"
                className="text-red-700 mx-3 hover:text-white border border-red-700 hover:bg-red-800 focus:ring-4 focus:outline-none focus:ring-red-300 font-medium rounded-lg text-sm px-4 py-2"
              >إخفاء</button>
                :
                <button
                  onClick={(e) => handleDisplayHideAuth(e)}
                  type="button"
                  className="text-green-700 mx-3 hover:text-white border border-green-700 hover:bg-green-800 focus:ring-4 focus:outline-none focus:ring-red-300 font-medium rounded-lg text-sm px-4 py-2"
                > إظهار   </button>
              }
              {/* {!displayAuth && <button
                onClick={(e) => handleDisplayHideAuth(e)}
                type="button"
                className="text-green-700 mx-3 hover:text-white border border-green-700 hover:bg-green-800 focus:ring-4 focus:outline-none focus:ring-red-300 font-medium rounded-lg text-sm px-4 py-2"
              > إظهار   </button>} */}
            </th>
          </tr>
          <tr>
            <th> أضف رابط  "المزيد من الإحصائيات" </th>
            <th>
              <form onSubmit={changeStatisticsLink} className="flex"> 
                <input
                  type="text"
                  name="link"
                  value={formData.link}
                  className=""
                  onChange={handleChange}
                />
                <button type="submit" 
                className="text-green-700 mx-3 text-nowrap hover:text-white border border-green-700 hover:bg-green-800 focus:ring-4 focus:outline-none focus:ring-red-300 font-medium rounded-lg text-sm px-4 py-2"

                >أضف الرابط</button>
              </form>
            </th>
          </tr>
        </tbody>
      </table>
    </div>
  )
}