import { useState, useRef, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ClipboardList, ChevronDown } from 'lucide-react';

// Dropdown Component
const SpecialtyDropdown = ({ eventId, specialties, language = 'ar' }) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);
  const navigate = useNavigate();

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSpecialtySelect = (specialtyId) => {
    navigate(`/event-waiting-lists/${eventId}/${specialtyId}`);
    setIsOpen(false);
  };

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Dropdown Trigger Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-full transition-colors font-droid-arabic-kufi whitespace-nowrap flex items-center gap-2"
      >
        {language === 'en' ? 'Waiting List' : 'قائمة الانتظار'}
        <ChevronDown 
          className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} 
        />
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute top-full mt-2 w-64 bg-white rounded-lg shadow-lg border border-gray-200 overflow-hidden z-50 right-0">
          <div className="max-h-96 overflow-y-auto">
            {specialties
              .filter((specialty) => specialty.id !== 6)
              .map((specialty) => (
                <button
                  key={specialty.id}
                  onClick={() => handleSpecialtySelect(specialty.id)}
                  className="w-full group flex items-center gap-3 p-3 hover:bg-indigo-50 transition-colors border-b border-gray-100 last:border-b-0"
                >
                  <div className="bg-indigo-100 w-9 h-9 rounded-lg flex items-center justify-center group-hover:bg-indigo-200 transition-colors flex-shrink-0">
                    <ClipboardList className="w-4 h-4 text-indigo-600" />
                  </div>
                  <div className="flex-1 text-right">
                    <h4 className="text-sm font-semibold text-gray-900 font-droid-arabic-kufi group-hover:text-indigo-600 transition-colors">
                      {specialty.name}
                    </h4>
                    <p className="text-xs text-gray-500 font-droid-arabic-kufi">
                      قائمة الانتظار
                    </p>
                  </div>
                </button>
              ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default SpecialtyDropdown;