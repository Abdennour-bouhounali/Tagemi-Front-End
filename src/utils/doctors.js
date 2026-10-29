import algeriaLocations from '../data/algeria_locations.json';

/** Where a doctor works (doctors.sector). */
export const SECTOR_LABELS = { public: 'قطاع عام', private: 'قطاع خاص', both: 'عام وخاص' };

export const WILAYAS = algeriaLocations.algeria_locations.map((w) => ({ code: w.code, name: w.name_ar || w.name }));

export const wilayaName = (code) => WILAYAS.find((w) => w.code === code)?.name || '';
