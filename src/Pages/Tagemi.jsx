import React from "react";
import Introduction from "./GuestUser/HomePage/Components/Introduction";
import About from "./GuestUser/About";
export default function Tagemi() {
  return (
    <div className="bg-white text-[#131842] font-droid-arabic-kufi">
      {/* About Section */}

      {/* Fields of Activities */}
      <section className="p-8 bg-gray-100">
        {/* <h2 className="text-2xl font-bold mb-4 text-center">مجالات الأنشطة</h2> */}

            <About />
      </section>

      {/* Contacts Section */}
      <section className="p-8 bg-gray-200">
        <h2 className="text-2xl font-bold text-center mb-4">الاتصال</h2>
        <p className="text-center">
          <span>الهاتف: </span>029254300
        </p>
        <p className="text-center">
          <span>البريد الإلكتروني: </span>tagemifondation@gmail.com
        </p>
      </section>
    </div>
  );
};

// export default Tagemi;
{/* <table className="table-auto w-full border-collapse border border-gray-300 text-right">
            <thead className="bg-gray-200">
              <tr>
                <th className="border border-gray-300 px-4 py-2">التخصص</th>
                <th className="border border-gray-300 px-4 py-2">عدد الفحوصات</th>
                <th className="border border-gray-300 px-4 py-2">عدد العمليات</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td className="border border-gray-300 px-4 py-2">طب العيون</td>
                <td className="border border-gray-300 px-4 py-2">18046</td>
                <td className="border border-gray-300 px-4 py-2">3591</td>
              </tr>
              <tr>
                <td className="border border-gray-300 px-4 py-2">طب الأطفال</td>
                <td className="border border-gray-300 px-4 py-2">3382</td>
                <td className="border border-gray-300 px-4 py-2">1341</td>
              </tr>
              <tr>
                <td className="border border-gray-300 px-4 py-2">طب الأنف والأذن والحنجرة</td>
                <td className="border border-gray-300 px-4 py-2">5859</td>
                <td className="border border-gray-300 px-4 py-2">1346</td>
              </tr>
            </tbody>
          </table> */}