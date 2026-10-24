import { API_BASE_URL } from '../../../config/environment';
import { useCallback, useContext, useEffect, useState } from "react";
import { Plus } from "lucide-react";
import { AppContext } from "../../../Context/AppContext";
import SpecialityTable from "./Components/SpecialityTable";
import AddSpeciality from "./Components/AddSpeciality";
import { Button, PageHeader, LoadingState, useToast } from "../../../Components/ui";

const apiUrl = API_BASE_URL;

// Catalogue of medical specialties that events can offer.
export default function ManageSpeciality() {
  const { token } = useContext(AppContext);
  const toast = useToast();
  const [specialities, setSpecialities] = useState(null);
  const [adding, setAdding] = useState(false);

  const getSpecialites = useCallback(async () => {
    try {
      const res = await fetch(`${apiUrl}/api/specialty`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (res.ok) setSpecialities(data["specialties"] || []);
      else {
        setSpecialities((prev) => prev || []);
        toast(data.message || "تعذر تحميل التخصصات", "error");
      }
    } catch {
      setSpecialities((prev) => prev || []);
      toast("تعذر الاتصال بالخادم، تحقق من الشبكة ثم أعد المحاولة", "error");
    }
  }, [token, toast]);

  useEffect(() => { getSpecialites(); }, [getSpecialites]);

  const visibleCount = (specialities || []).filter((s) => s.name !== "NoSpeciality").length;

  return (
    <div className="max-w-2xl lg:max-w-none mx-auto">
      <PageHeader
        title="التخصصات الطبية"
        subtitle={specialities ? `${visibleCount} تخصص متاح لإضافته إلى الأحداث` : undefined}
        actions={<Button icon={Plus} onClick={() => setAdding(true)}>أضف تخصصاً</Button>}
      />

      {specialities === null ? (
        <LoadingState />
      ) : (
        <SpecialityTable specialities={specialities} getSpecialites={getSpecialites} onAdd={() => setAdding(true)} />
      )}

      <AddSpeciality open={adding} onClose={() => setAdding(false)} getSpecialites={getSpecialites} />
    </div>
  );
}
