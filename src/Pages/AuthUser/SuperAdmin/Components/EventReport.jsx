import { useState, useEffect, useContext } from "react";
import { API_BASE_URL } from '../../../../config/environment';
import { useParams, useNavigate } from "react-router-dom";
import { AppContext } from "../../../../Context/AppContext";
import {
  Save, Printer, ArrowLeft, Plus, Trash2, CheckCircle, X,
  FileText, TrendingUp, AlertTriangle, Users, DollarSign, Megaphone,
  Star, Award, Target, MessageSquare, Lightbulb,
  ThumbsUp, ThumbsDown, Info, Lock, Edit, Eye, Clock
} from "lucide-react";
import { generatePrintableHTML } from "./PrintableReport";

const apiUrl = API_BASE_URL;

export default function EventReport() {
  const { eventId } = useParams();
  const navigate = useNavigate();
  const { token } = useContext(AppContext);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [event, setEvent] = useState(null);
  const [statistics, setStatistics] = useState(null);
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState("info");
  const [activeTab, setActiveTab] = useState("overview");
  
  // NEW: Edit mode state
  const [isEditMode, setIsEditMode] = useState(false);
  const [reportExists, setReportExists] = useState(false);
  const [reportMetadata, setReportMetadata] = useState(null);

  const [formData, setFormData] = useState({
    // Executive Summary
    executive_summary: "",
    key_achievements: "",
    critical_issues: "",
    
    // Event Overview
    total_attendees: "",
    registered_attendees: "",
    actual_attendees: "",
    venue_name: "",
    venue_feedback: "",
    
    // Performance Metrics
    total_appointments: "",
    completed_appointments: "",
    cancelled_appointments: "",
    no_show_appointments: "",
    
    // Team Performance
    total_staff: "",
    total_volunteers: "",
    team_performance_notes: "",
    outstanding_team_members: "",
    
    // Logistics
    logistics_summary: "",
    transportation_notes: "",
    accommodation_notes: "",
    catering_notes: "",
    equipment_notes: "",
    
    // Financial
    planned_budget: "",
    actual_expenses: "",
    major_expenses: "",
    cost_saving_measures: "",
    
    // Marketing
    marketing_channels_used: "",
    social_media_reach: "",
    social_media_engagement: "",
    marketing_effectiveness: "",
    
    // Feedback
    overall_satisfaction_rating: "",
    positive_feedback_summary: "",
    negative_feedback_summary: "",
    attendee_suggestions: "",
    
    // Media
    media_mentions: "",
    media_outlets: "",
    media_highlights: "",
    
    // Sponsors
    sponsors_list: "",
    partnership_outcomes: "",
    sponsor_feedback: "",
    
    // Main Content
    positive_points: "",
    negative_points: "",
    challenges_faced: "",
    solutions_implemented: "",
    
    // Technical
    technical_issues: "",
    technical_solutions: "",
    infrastructure_notes: "",
    
    // Security
    security_measures: "",
    safety_incidents: "",
    health_protocols: "",
    
    // Program
    program_highlights: "",
    speaker_performance: "",
    session_feedback: "",
    
    // Lessons
    what_went_well: "",
    what_went_wrong: "",
    unexpected_outcomes: "",
    best_practices_identified: "",
    
    // Future
    future_tasks: "",
    recommendations: "",
    improvements_needed: "",
    
    // Additional
    general_notes: "",
    conclusion: "",
    acknowledgments: "",
    
    // Complex fields
    assignments: [],
    action_items: [],
    
    // Status
    report_status: "draft",
  });

  useEffect(() => {
    fetchReport();
  }, [eventId]);

  const fetchReport = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${apiUrl}/api/events/${eventId}/report`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      const data = await res.json();

      if (res.ok) {
        setEvent(data.event);
        setStatistics(data.statistics);
        
        if (data.report) {
          // Report exists - set to view mode
          setReportExists(true);
          setIsEditMode(false);
          setReportMetadata({
            created_at: data.report.created_at,
            updated_at: data.report.updated_at,
            created_by: data.report.creator,
            updated_by: data.report.updater,
            approved_by: data.report.approver,
            approved_at: data.report.approved_at,
          });
          
          setFormData({
            ...formData,
            ...data.report,
            assignments: data.report.assignments || [],
            action_items: data.report.action_items || [],
          });
        } else {
          // No report - set to edit mode for creation
          setReportExists(false);
          setIsEditMode(true);
          
          // Pre-fill with statistics if available
          if (data.statistics) {
            setFormData(prev => ({
              ...prev,
              total_appointments: data.statistics.total_appointments || "",
              completed_appointments: data.statistics.completed_appointments || "",
              cancelled_appointments: data.statistics.cancelled_appointments || "",
            }));
          }
        }
      } else {
        showMessage(data.message || "حدث خطأ", "error");
      }
    } catch (error) {
      console.error("Error fetching report:", error);
      showMessage("حدث خطأ في الاتصال", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);

    try {
      const res = await fetch(`${apiUrl}/api/events/${eventId}/report`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      const data = await res.json();

      if (res.ok) {
        showMessage(
          reportExists ? "تم تحديث التقرير بنجاح" : "تم حفظ التقرير بنجاح",
          "success"
        );
        setFormData(prev => ({ ...prev, ...data.report }));
        setReportExists(true);
        setIsEditMode(false);
        
        // Update metadata
        setReportMetadata({
          created_at: data.report.created_at,
          updated_at: data.report.updated_at,
          created_by: data.report.creator,
          updated_by: data.report.updater,
          approved_by: data.report.approver,
          approved_at: data.report.approved_at,
        });
      } else {
        showMessage(data.message || "حدث خطأ", "error");
      }
    } catch (error) {
      console.error("Error saving report:", error);
      showMessage("حدث خطأ في الاتصال", "error");
    } finally {
      setSaving(false);
    }
  };

  const handleApprove = async () => {
    if (!window.confirm("هل أنت متأكد من اعتماد هذا التقرير؟\n\nبعد الاعتماد لن يمكن التعديل على التقرير.")) return;

    try {
      const res = await fetch(`${apiUrl}/api/events/${eventId}/report/approve`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      const data = await res.json();

      if (res.ok) {
        showMessage("تم اعتماد التقرير بنجاح", "success");
        setFormData(prev => ({ ...prev, report_status: "approved" }));
        setIsEditMode(false);
        
        // Update metadata
        if (data.report) {
          setReportMetadata({
            ...reportMetadata,
            approved_by: data.report.approver,
            approved_at: data.report.approved_at,
          });
        }
      } else {
        showMessage(data.message || "حدث خطأ", "error");
      }
    } catch (error) {
      showMessage("حدث خطأ في الاتصال", "error");
    }
  };

  const handleDelete = async () => {
    if (!window.confirm("هل أنت متأكد من حذف هذا التقرير؟\n\nلا يمكن التراجع عن هذا الإجراء.")) return;

    try {
      const res = await fetch(`${apiUrl}/api/events/${eventId}/report`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await res.json();

      if (res.ok) {
        showMessage("تم حذف التقرير بنجاح", "success");
        setTimeout(() => {
          navigate(-1);
        }, 1500);
      } else {
        showMessage(data.message || "حدث خطأ", "error");
      }
    } catch (error) {
      showMessage("حدث خطأ في الاتصال", "error");
    }
  };

  const toggleEditMode = () => {
    if (formData.report_status === "approved") {
      showMessage("لا يمكن تعديل التقرير المعتمد", "error");
      return;
    }
    setIsEditMode(!isEditMode);
  };

  const handleCancelEdit = () => {
    if (window.confirm("هل تريد إلغاء التعديلات؟ سيتم فقدان التغييرات غير المحفوظة.")) {
      fetchReport(); // Reload original data
      setIsEditMode(false);
    }
  };


const handlePrintHTML = () => {
  const html = generatePrintableHTML(event, formData, reportMetadata);
  
  // Open in new window
  const printWindow = window.open("", "_blank");
  printWindow.document.write(html);
  printWindow.document.close();
  
  // Wait for content to load, then print
  printWindow.onload = function() {
    printWindow.focus();
    printWindow.print();
  };
};

const handleDownloadHTML = () => {
  const html = generatePrintableHTML(event, formData, reportMetadata);
  
  // Create blob and download
  const blob = new Blob([html], { type: "text/html" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `تقرير-${event?.name || "الحدث"}-${new Date().toISOString().split("T")[0]}.html`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};
  // Assignment Management
  const addAssignment = () => {
    setFormData({
      ...formData,
      assignments: [
        ...formData.assignments,
        { name: "", phone: "", role: "", task: "", performance_notes: "" }
      ],
    });
  };

  const removeAssignment = (index) => {
    const newAssignments = formData.assignments.filter((_, i) => i !== index);
    setFormData({ ...formData, assignments: newAssignments });
  };

  const updateAssignment = (index, field, value) => {
    const newAssignments = [...formData.assignments];
    newAssignments[index][field] = value;
    setFormData({ ...formData, assignments: newAssignments });
  };

  // Action Items Management
  const addActionItem = () => {
    setFormData({
      ...formData,
      action_items: [
        ...formData.action_items,
        { task: "", priority: "medium", deadline: "", assignee: "" }
      ],
    });
  };

  const removeActionItem = (index) => {
    const newItems = formData.action_items.filter((_, i) => i !== index);
    setFormData({ ...formData, action_items: newItems });
  };

  const updateActionItem = (index, field, value) => {
    const newItems = [...formData.action_items];
    newItems[index][field] = value;
    setFormData({ ...formData, action_items: newItems });
  };

  const showMessage = (text, type) => {
    setMessage(text);
    setMessageType(type);
    setTimeout(() => setMessage(""), 3000);
  };

  const updateField = (field, value) => {
    setFormData({ ...formData, [field]: value });
  };

  const formatDate = (dateString) => {
    if (!dateString) return "-";
    return new Date(dateString).toLocaleDateString("ar-DZ", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  // Tab configuration
  const tabs = [
    { id: "overview", label: "نظرة عامة", icon: Info },
    { id: "performance", label: "الأداء والمقاييس", icon: TrendingUp },
    { id: "team", label: "الفريق واللوجستيات", icon: Users },
    { id: "financial", label: "الميزانية والمالية", icon: DollarSign },
    { id: "marketing", label: "التسويق والإعلام", icon: Megaphone },
    { id: "feedback", label: "التقييم والملاحظات", icon: Star },
    { id: "analysis", label: "التحليل والدروس", icon: Lightbulb },
    { id: "future", label: "المستقبل والتوصيات", icon: Target },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-xl font-droid-arabic-kufi text-gray-600">جاري التحميل...</div>
      </div>
    );
  }

  const isApproved = formData.report_status === "approved";
  const canEdit = reportExists && !isApproved;

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="no-print mb-6 bg-white p-6 rounded-lg shadow-lg">
          <div className="flex items-center justify-between mb-4">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <h1 className="text-3xl font-bold text-gray-800 font-droid-arabic-kufi flex items-center gap-2">
                  <FileText className="w-8 h-8 text-blue-600" />
                  {reportExists ? (isEditMode ? "تعديل تقرير الحدث" : "تقرير الحدث") : "إنشاء تقرير جديد"}
                </h1>
                
                {/* Mode Badge */}
                {reportExists && (
                  <span className={`px-3 py-1 rounded-full text-sm font-bold font-droid-arabic-kufi ${
                    isEditMode 
                      ? "bg-orange-100 text-orange-800" 
                      : "bg-blue-100 text-blue-800"
                  }`}>
                    {isEditMode ? "وضع التعديل" : "وضع العرض"}
                  </span>
                )}
              </div>
              
              <h2 className="text-xl text-gray-700 font-droid-arabic-kufi">
                {event?.name}
              </h2>
              <p className="text-gray-600 font-droid-arabic-kufi mt-1">
                التاريخ: {new Date(event?.start_date || event?.date).toLocaleDateString("ar-DZ")}
              </p>
            </div>

            <div className="flex gap-2 flex-wrap justify-end">
              {/* Edit/View Toggle Button */}
              {canEdit && (
                <button
                  onClick={toggleEditMode}
                  className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-droid-arabic-kufi transition"
                >
                  {isEditMode ? (
                    <>
                      <Eye className="w-5 h-5" />
                      عرض
                    </>
                  ) : (
                    <>
                      <Edit className="w-5 h-5" />
                      تعديل
                    </>
                  )}
                </button>
              )}

              {/* Approve Button */}
              {reportExists && !isApproved && !isEditMode && (
                <button
                  onClick={handleApprove}
                  className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-droid-arabic-kufi transition"
                >
                  <Lock className="w-5 h-5" />
                  اعتماد التقرير
                </button>
              )}

              {/* Delete Button */}
              {reportExists && !isApproved && (
                <button
                  onClick={handleDelete}
                  className="flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-droid-arabic-kufi transition"
                >
                  <Trash2 className="w-5 h-5" />
                  حذف
                </button>
              )}

              {/* Print Button */}
              {/* Print Button with Dropdown */}
                {reportExists && !isEditMode && (
                <div className="relative group">
                    <button
                    onClick={handlePrintHTML}
                    className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-droid-arabic-kufi transition"
                    >
                    <Printer className="w-5 h-5" />
                    طباعة
                    </button>
                    
                    {/* Dropdown */}
                    <div className="absolute left-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-10">
                    <button
                        onClick={handlePrintHTML}
                        className="w-full text-right px-4 py-2 hover:bg-gray-100 rounded-t-lg font-droid-arabic-kufi text-gray-700 flex items-center gap-2"
                    >
                        <Printer className="w-4 h-4" />
                        طباعة مباشرة
                    </button>
                    <button
                        onClick={handleDownloadHTML}
                        className="w-full text-right px-4 py-2 hover:bg-gray-100 rounded-b-lg font-droid-arabic-kufi text-gray-700 flex items-center gap-2"
                    >
                        <FileText className="w-4 h-4" />
                        تحميل كملف HTML
                    </button>
                    </div>
                </div>
                )}

              {/* Back Button */}
              <button
                onClick={() => navigate(-1)}
                className="flex items-center gap-2 px-4 py-2 bg-gray-400 hover:bg-gray-500 text-white rounded-lg font-droid-arabic-kufi transition"
              >
                <ArrowLeft className="w-5 h-5" />
                رجوع
              </button>
            </div>
          </div>

          {/* Status Badges */}
          <div className="flex flex-wrap gap-3 items-center">
            {isApproved && (
              <div className="flex items-center gap-2 px-4 py-2 bg-green-100 border border-green-400 rounded-lg">
                <Lock className="w-5 h-5 text-green-700" />
                <span className="font-droid-arabic-kufi text-green-800 font-semibold">
                  تقرير معتمد
                </span>
              </div>
            )}

            {formData.report_status === "draft" && reportExists && (
              <div className="flex items-center gap-2 px-4 py-2 bg-yellow-100 border border-yellow-400 rounded-lg">
                <Edit className="w-5 h-5 text-yellow-700" />
                <span className="font-droid-arabic-kufi text-yellow-800 font-semibold">
                  مسودة
                </span>
              </div>
            )}
          </div>

          {/* Metadata */}
          {reportMetadata && (
            <div className="mt-4 pt-4 border-t border-gray-200">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 text-sm font-droid-arabic-kufi text-gray-600">
                {reportMetadata.created_by && (
                  <div className="flex items-center gap-2">
                    <Users className="w-4 h-4" />
                    <span>
                      أنشئ بواسطة: <strong>{reportMetadata.created_by.name}</strong>
                    </span>
                  </div>
                )}
                
                {reportMetadata.created_at && (
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4" />
                    <span>
                      تاريخ الإنشاء: <strong>{formatDate(reportMetadata.created_at)}</strong>
                    </span>
                  </div>
                )}
                
                {reportMetadata.updated_by && (
                  <div className="flex items-center gap-2">
                    <Edit className="w-4 h-4" />
                    <span>
                      آخر تعديل: <strong>{reportMetadata.updated_by.name}</strong>
                    </span>
                  </div>
                )}
                
                {reportMetadata.approved_by && (
                  <div className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-green-600" />
                    <span>
                      اعتمد بواسطة: <strong>{reportMetadata.approved_by.name}</strong>
                    </span>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Message */}
        {message && (
          <div
            className={`no-print mb-4 p-4 border rounded-lg font-droid-arabic-kufi shadow-md ${
              messageType === "success"
                ? "bg-green-50 border-green-400 text-green-800"
                : messageType === "error"
                ? "bg-red-50 border-red-400 text-red-800"
                : "bg-blue-50 border-blue-400 text-blue-800"
            }`}
          >
            <div className="flex items-center gap-2">
              {messageType === "success" && <CheckCircle className="w-5 h-5" />}
              {messageType === "error" && <X className="w-5 h-5" />}
              {message}
            </div>
          </div>
        )}

        {/* Tab Navigation */}
        <div className="no-print mb-6 bg-white rounded-lg shadow-lg overflow-x-auto">
          <div className="flex border-b">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 px-6 py-4 font-droid-arabic-kufi transition whitespace-nowrap ${
                    activeTab === tab.id
                      ? "border-b-2 border-blue-600 text-blue-600 bg-blue-50"
                      : "text-gray-600 hover:bg-gray-50"
                  }`}
                >
                  <Icon className="w-5 h-5" />
                  {tab.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Print Header */}
          <div className="print-only hidden print:block bg-white p-8 rounded-lg shadow-lg mb-6">
            <div className="text-center border-b-4 border-blue-600 pb-6">
              <h1 className="text-4xl font-bold text-gray-900 font-droid-arabic-kufi mb-3">
                تقرير شامل للحدث
              </h1>
              <h2 className="text-2xl font-semibold text-gray-700 font-droid-arabic-kufi mb-2">
                {event?.name}
              </h2>
              <p className="text-gray-600 font-droid-arabic-kufi text-lg">
                التاريخ: {new Date(event?.start_date || event?.date).toLocaleDateString("ar-DZ")}
              </p>
              {isApproved && (
                <div className="mt-4 inline-flex items-center gap-2 px-4 py-2 bg-green-100 text-green-800 rounded-full">
                  <CheckCircle className="w-5 h-5" />
                  <span className="font-semibold">تقرير معتمد</span>
                </div>
              )}
            </div>
          </div>

          {/* Tab Content */}
          {renderTabContent()}

          {/* Action Buttons */}
          {isEditMode && (
            <div className="no-print flex justify-end gap-3">
              <button
                type="button"
                onClick={handleCancelEdit}
                className="flex items-center gap-2 px-6 py-3 bg-gray-500 hover:bg-gray-600 text-white rounded-lg font-droid-arabic-kufi transition"
              >
                <X className="w-5 h-5" />
                إلغاء
              </button>
              <button
                type="submit"
                disabled={saving}
                className={`flex items-center gap-2 px-6 py-3 rounded-lg font-droid-arabic-kufi transition ${
                  saving
                    ? "bg-gray-400 cursor-not-allowed"
                    : "bg-green-600 hover:bg-green-700 text-white shadow-lg"
                }`}
              >
                <Save className="w-5 h-5" />
                {saving ? "جاري الحفظ..." : reportExists ? "حفظ التعديلات" : "حفظ التقرير"}
              </button>
            </div>
          )}
        </form>
      </div>

      {/* Print Styles */}
      <style>{`
        @media print {
          body { background: white; }
          .no-print { display: none !important; }
          .print-only { display: block !important; }
          textarea, input, select {
            border: none !important;
            outline: none !important;
            background: transparent !important;
            box-shadow: none !important;
          }
          .page-break { page-break-before: always; }
          h2 { page-break-after: avoid; }
        }
        
        ${!isEditMode ? `
          textarea, input, select {
            pointer-events: none;
            background-color: #f9fafb !important;
          }
        ` : ''}
      `}</style>
    </div>
  );

// Continue from Part 1 - Add this function inside the component

function renderTabContent() {
  switch (activeTab) {
    case "overview":
      return (
        <>
          {/* Executive Summary */}
          <div className="bg-white p-6 rounded-lg shadow-lg">
            <div className="flex items-center gap-2 mb-4">
              <FileText className="w-6 h-6 text-blue-600" />
              <h2 className="text-2xl font-bold text-gray-800 font-droid-arabic-kufi">
                الملخص التنفيذي
              </h2>
            </div>
            <textarea
              value={formData.executive_summary}
              onChange={(e) => updateField("executive_summary", e.target.value)}
              className="w-full p-4 border border-gray-300 rounded-lg font-droid-arabic-kufi resize-none focus:ring-2 focus:ring-blue-500 print:border-0"
              rows="6"
              placeholder="ملخص شامل عن الحدث، الأهداف المحققة، والنتائج الرئيسية..."
            />
          </div>

          {/* Key Achievements */}
          <div className="bg-white p-6 rounded-lg shadow-lg">
            <div className="flex items-center gap-2 mb-4">
              <Award className="w-6 h-6 text-yellow-600" />
              <h2 className="text-2xl font-bold text-gray-800 font-droid-arabic-kufi">
                الإنجازات الرئيسية
              </h2>
            </div>
            <textarea
              value={formData.key_achievements}
              onChange={(e) => updateField("key_achievements", e.target.value)}
              className="w-full p-4 border border-gray-300 rounded-lg font-droid-arabic-kufi resize-none focus:ring-2 focus:ring-yellow-500 print:border-0"
              rows="5"
              placeholder="أهم الإنجازات والنجاحات التي تحققت خلال الحدث..."
            />
          </div>

          {/* Critical Issues */}
          <div className="bg-white p-6 rounded-lg shadow-lg">
            <div className="flex items-center gap-2 mb-4">
              <AlertTriangle className="w-6 h-6 text-red-600" />
              <h2 className="text-2xl font-bold text-gray-800 font-droid-arabic-kufi">
                القضايا الحرجة
              </h2>
            </div>
            <textarea
              value={formData.critical_issues}
              onChange={(e) => updateField("critical_issues", e.target.value)}
              className="w-full p-4 border border-gray-300 rounded-lg font-droid-arabic-kufi resize-none focus:ring-2 focus:ring-red-500 print:border-0"
              rows="5"
              placeholder="المشاكل الحرجة أو العوائق الكبيرة التي حدثت..."
            />
          </div>

          {/* Event Overview Stats */}
          <div className="bg-white p-6 rounded-lg shadow-lg">
            <h2 className="text-2xl font-bold text-gray-800 font-droid-arabic-kufi mb-6">
              معلومات الحضور والمكان
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 font-droid-arabic-kufi mb-2">
                  إجمالي الحضور المتوقع
                </label>
                <input
                  type="number"
                  value={formData.total_attendees}
                  onChange={(e) => updateField("total_attendees", e.target.value)}
                  className="w-full p-3 border border-gray-300 rounded-lg font-droid-arabic-kufi focus:ring-2 focus:ring-blue-500 print:border-0"
                  placeholder="0"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 font-droid-arabic-kufi mb-2">
                  عدد المسجلين
                </label>
                <input
                  type="number"
                  value={formData.registered_attendees}
                  onChange={(e) => updateField("registered_attendees", e.target.value)}
                  className="w-full p-3 border border-gray-300 rounded-lg font-droid-arabic-kufi focus:ring-2 focus:ring-blue-500 print:border-0"
                  placeholder="0"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 font-droid-arabic-kufi mb-2">
                  الحضور الفعلي
                </label>
                <input
                  type="number"
                  value={formData.actual_attendees}
                  onChange={(e) => updateField("actual_attendees", e.target.value)}
                  className="w-full p-3 border border-gray-300 rounded-lg font-droid-arabic-kufi focus:ring-2 focus:ring-blue-500 print:border-0"
                  placeholder="0"
                />
              </div>
            </div>

            <div className="mt-6">
              <label className="block text-sm font-medium text-gray-700 font-droid-arabic-kufi mb-2">
                اسم المكان
              </label>
              <input
                type="text"
                value={formData.venue_name}
                onChange={(e) => updateField("venue_name", e.target.value)}
                className="w-full p-3 border border-gray-300 rounded-lg font-droid-arabic-kufi focus:ring-2 focus:ring-blue-500 print:border-0"
                placeholder="اسم القاعة أو المركز..."
              />
            </div>

            <div className="mt-4">
              <label className="block text-sm font-medium text-gray-700 font-droid-arabic-kufi mb-2">
                تقييم المكان
              </label>
              <textarea
                value={formData.venue_feedback}
                onChange={(e) => updateField("venue_feedback", e.target.value)}
                className="w-full p-3 border border-gray-300 rounded-lg font-droid-arabic-kufi resize-none focus:ring-2 focus:ring-blue-500 print:border-0"
                rows="3"
                placeholder="تقييم المكان من حيث المساحة، التجهيزات، الموقع..."
              />
            </div>
          </div>
        </>
      );

    case "performance":
      return (
        <>
          {/* Appointment Metrics */}
          <div className="bg-white p-6 rounded-lg shadow-lg">
            <div className="flex items-center gap-2 mb-6">
              <TrendingUp className="w-6 h-6 text-green-600" />
              <h2 className="text-2xl font-bold text-gray-800 font-droid-arabic-kufi">
                مقاييس المواعيد
              </h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <div className="p-4 bg-blue-50 rounded-lg">
                <label className="block text-sm font-medium text-gray-700 font-droid-arabic-kufi mb-2">
                  إجمالي المواعيد
                </label>
                <input
                  type="number"
                  value={formData.total_appointments}
                  onChange={(e) => updateField("total_appointments", e.target.value)}
                  className="w-full p-3 border border-gray-300 rounded-lg font-droid-arabic-kufi focus:ring-2 focus:ring-blue-500 print:border-0"
                  placeholder="0"
                />
              </div>
              <div className="p-4 bg-green-50 rounded-lg">
                <label className="block text-sm font-medium text-gray-700 font-droid-arabic-kufi mb-2">
                  المواعيد المكتملة
                </label>
                <input
                  type="number"
                  value={formData.completed_appointments}
                  onChange={(e) => updateField("completed_appointments", e.target.value)}
                  className="w-full p-3 border border-gray-300 rounded-lg font-droid-arabic-kufi focus:ring-2 focus:ring-green-500 print:border-0"
                  placeholder="0"
                />
              </div>
              <div className="p-4 bg-red-50 rounded-lg">
                <label className="block text-sm font-medium text-gray-700 font-droid-arabic-kufi mb-2">
                  المواعيد الملغاة
                </label>
                <input
                  type="number"
                  value={formData.cancelled_appointments}
                  onChange={(e) => updateField("cancelled_appointments", e.target.value)}
                  className="w-full p-3 border border-gray-300 rounded-lg font-droid-arabic-kufi focus:ring-2 focus:ring-red-500 print:border-0"
                  placeholder="0"
                />
              </div>
              <div className="p-4 bg-orange-50 rounded-lg">
                <label className="block text-sm font-medium text-gray-700 font-droid-arabic-kufi mb-2">
                  عدم الحضور
                </label>
                <input
                  type="number"
                  value={formData.no_show_appointments}
                  onChange={(e) => updateField("no_show_appointments", e.target.value)}
                  className="w-full p-3 border border-gray-300 rounded-lg font-droid-arabic-kufi focus:ring-2 focus:ring-orange-500 print:border-0"
                  placeholder="0"
                />
              </div>
            </div>
          </div>

          {/* Content Quality */}
          <div className="bg-white p-6 rounded-lg shadow-lg">
            <h2 className="text-2xl font-bold text-gray-800 font-droid-arabic-kufi mb-6">
              جودة المحتوى والبرنامج
            </h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 font-droid-arabic-kufi mb-2">
                  أبرز فقرات البرنامج
                </label>
                <textarea
                  value={formData.program_highlights}
                  onChange={(e) => updateField("program_highlights", e.target.value)}
                  className="w-full p-3 border border-gray-300 rounded-lg font-droid-arabic-kufi resize-none focus:ring-2 focus:ring-blue-500 print:border-0"
                  rows="4"
                  placeholder="الفقرات الأكثر نجاحاً وتفاعلاً من البرنامج..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 font-droid-arabic-kufi mb-2">
                  أداء المتحدثين/المقدمين
                </label>
                <textarea
                  value={formData.speaker_performance}
                  onChange={(e) => updateField("speaker_performance", e.target.value)}
                  className="w-full p-3 border border-gray-300 rounded-lg font-droid-arabic-kufi resize-none focus:ring-2 focus:ring-blue-500 print:border-0"
                  rows="4"
                  placeholder="تقييم أداء المتحدثين والمقدمين..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 font-droid-arabic-kufi mb-2">
                  تقييم الجلسات
                </label>
                <textarea
                  value={formData.session_feedback}
                  onChange={(e) => updateField("session_feedback", e.target.value)}
                  className="w-full p-3 border border-gray-300 rounded-lg font-droid-arabic-kufi resize-none focus:ring-2 focus:ring-blue-500 print:border-0"
                  rows="4"
                  placeholder="ملاحظات حول الجلسات والورش..."
                />
              </div>
            </div>
          </div>
        </>
      );

    case "team":
      return (
        <>
          {/* Team Stats */}
          <div className="bg-white p-6 rounded-lg shadow-lg">
            <div className="flex items-center gap-2 mb-6">
              <Users className="w-6 h-6 text-purple-600" />
              <h2 className="text-2xl font-bold text-gray-800 font-droid-arabic-kufi">
                إحصائيات الفريق
              </h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 font-droid-arabic-kufi mb-2">
                  عدد الموظفين
                </label>
                <input
                  type="number"
                  value={formData.total_staff}
                  onChange={(e) => updateField("total_staff", e.target.value)}
                  className="w-full p-3 border border-gray-300 rounded-lg font-droid-arabic-kufi focus:ring-2 focus:ring-purple-500 print:border-0"
                  placeholder="0"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 font-droid-arabic-kufi mb-2">
                  عدد المتطوعين
                </label>
                <input
                  type="number"
                  value={formData.total_volunteers}
                  onChange={(e) => updateField("total_volunteers", e.target.value)}
                  className="w-full p-3 border border-gray-300 rounded-lg font-droid-arabic-kufi focus:ring-2 focus:ring-purple-500 print:border-0"
                  placeholder="0"
                />
              </div>
            </div>

            <div className="mt-6">
              <label className="block text-sm font-medium text-gray-700 font-droid-arabic-kufi mb-2">
                ملاحظات أداء الفريق
              </label>
              <textarea
                value={formData.team_performance_notes}
                onChange={(e) => updateField("team_performance_notes", e.target.value)}
                className="w-full p-3 border border-gray-300 rounded-lg font-droid-arabic-kufi resize-none focus:ring-2 focus:ring-purple-500 print:border-0"
                rows="4"
                placeholder="تقييم عام لأداء الفريق، التنسيق، الالتزام..."
              />
            </div>

            <div className="mt-4">
              <label className="block text-sm font-medium text-gray-700 font-droid-arabic-kufi mb-2">
                أعضاء الفريق المتميزين
              </label>
              <textarea
                value={formData.outstanding_team_members}
                onChange={(e) => updateField("outstanding_team_members", e.target.value)}
                className="w-full p-3 border border-gray-300 rounded-lg font-droid-arabic-kufi resize-none focus:ring-2 focus:ring-purple-500 print:border-0"
                rows="3"
                placeholder="أسماء الأعضاء المتميزين وإنجازاتهم..."
              />
            </div>
          </div>

          {/* Assignments */}
          <div className="bg-white p-6 rounded-lg shadow-lg">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-gray-800 font-droid-arabic-kufi">
                التكليفات والمسؤوليات
              </h2>
              <button
                type="button"
                onClick={addAssignment}
                className="no-print flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-droid-arabic-kufi transition"
              >
                <Plus className="w-5 h-5" />
                إضافة تكليف
              </button>
            </div>

            {formData.assignments.length === 0 ? (
              <p className="text-gray-500 font-droid-arabic-kufi text-center py-8">
                لا توجد تكليفات. اضغط "إضافة تكليف" لإضافة مسؤولية جديدة.
              </p>
            ) : (
              <div className="space-y-4">
                {formData.assignments.map((assignment, index) => (
                  <div
                    key={index}
                    className="border-2 border-gray-200 rounded-lg p-4 print:border print:border-gray-400"
                  >
                    <div className="flex items-start justify-between mb-3">
                      <h3 className="font-semibold text-gray-700 font-droid-arabic-kufi text-lg">
                        تكليف {index + 1}
                      </h3>
                      <button
                        type="button"
                        onClick={() => removeAssignment(index)}
                        className="no-print text-red-600 hover:text-red-800 transition"
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 font-droid-arabic-kufi mb-1">
                          الاسم *
                        </label>
                        <input
                          type="text"
                          value={assignment.name}
                          onChange={(e) => updateAssignment(index, "name", e.target.value)}
                          className="w-full p-2 border border-gray-300 rounded-lg font-droid-arabic-kufi focus:ring-2 focus:ring-indigo-500 print:border-0"
                          placeholder="اسم المسؤول"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 font-droid-arabic-kufi mb-1">
                          رقم الهاتف *
                        </label>
                        <input
                          type="tel"
                          value={assignment.phone}
                          onChange={(e) => updateAssignment(index, "phone", e.target.value)}
                          className="w-full p-2 border border-gray-300 rounded-lg font-droid-arabic-kufi focus:ring-2 focus:ring-indigo-500 print:border-0"
                          placeholder="0123456789"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 font-droid-arabic-kufi mb-1">
                          الدور/المنصب
                        </label>
                        <input
                          type="text"
                          value={assignment.role}
                          onChange={(e) => updateAssignment(index, "role", e.target.value)}
                          className="w-full p-2 border border-gray-300 rounded-lg font-droid-arabic-kufi focus:ring-2 focus:ring-indigo-500 print:border-0"
                          placeholder="مثال: منسق، متطوع، مشرف..."
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 font-droid-arabic-kufi mb-1">
                          المهمة *
                        </label>
                        <input
                          type="text"
                          value={assignment.task}
                          onChange={(e) => updateAssignment(index, "task", e.target.value)}
                          className="w-full p-2 border border-gray-300 rounded-lg font-droid-arabic-kufi focus:ring-2 focus:ring-indigo-500 print:border-0"
                          placeholder="وصف المهمة"
                        />
                      </div>
                      <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-gray-700 font-droid-arabic-kufi mb-1">
                          ملاحظات الأداء
                        </label>
                        <textarea
                          value={assignment.performance_notes}
                          onChange={(e) => updateAssignment(index, "performance_notes", e.target.value)}
                          className="w-full p-2 border border-gray-300 rounded-lg font-droid-arabic-kufi resize-none focus:ring-2 focus:ring-indigo-500 print:border-0"
                          rows="2"
                          placeholder="تقييم الأداء وملاحظات إضافية..."
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Logistics */}
          <div className="bg-white p-6 rounded-lg shadow-lg">
            <h2 className="text-2xl font-bold text-gray-800 font-droid-arabic-kufi mb-6">
              اللوجستيات والعمليات
            </h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 font-droid-arabic-kufi mb-2">
                  ملخص اللوجستيات
                </label>
                <textarea
                  value={formData.logistics_summary}
                  onChange={(e) => updateField("logistics_summary", e.target.value)}
                  className="w-full p-3 border border-gray-300 rounded-lg font-droid-arabic-kufi resize-none focus:ring-2 focus:ring-blue-500 print:border-0"
                  rows="3"
                  placeholder="نظرة عامة على الترتيبات اللوجستية..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 font-droid-arabic-kufi mb-2">
                  ملاحظات النقل والمواصلات
                </label>
                <textarea
                  value={formData.transportation_notes}
                  onChange={(e) => updateField("transportation_notes", e.target.value)}
                  className="w-full p-3 border border-gray-300 rounded-lg font-droid-arabic-kufi resize-none focus:ring-2 focus:ring-blue-500 print:border-0"
                  rows="3"
                  placeholder="ترتيبات النقل، المواصلات، المواقف..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 font-droid-arabic-kufi mb-2">
                  ملاحظات الإقامة
                </label>
                <textarea
                  value={formData.accommodation_notes}
                  onChange={(e) => updateField("accommodation_notes", e.target.value)}
                  className="w-full p-3 border border-gray-300 rounded-lg font-droid-arabic-kufi resize-none focus:ring-2 focus:ring-blue-500 print:border-0"
                  rows="3"
                  placeholder="الفنادق، السكن، الترتيبات..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 font-droid-arabic-kufi mb-2">
                  ملاحظات الضيافة والطعام
                </label>
                <textarea
                  value={formData.catering_notes}
                  onChange={(e) => updateField("catering_notes", e.target.value)}
                  className="w-full p-3 border border-gray-300 rounded-lg font-droid-arabic-kufi resize-none focus:ring-2 focus:ring-blue-500 print:border-0"
                  rows="3"
                  placeholder="الوجبات، المشروبات، جودة الخدمة..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 font-droid-arabic-kufi mb-2">
                  ملاحظات المعدات والتجهيزات
                </label>
                <textarea
                  value={formData.equipment_notes}
                  onChange={(e) => updateField("equipment_notes", e.target.value)}
                  className="w-full p-3 border border-gray-300 rounded-lg font-droid-arabic-kufi resize-none focus:ring-2 focus:ring-blue-500 print:border-0"
                  rows="3"
                  placeholder="الأجهزة، الصوتيات، الإضاءة، التقنيات..."
                />
              </div>
            </div>
          </div>

          {/* Technical & Security */}
          <div className="bg-white p-6 rounded-lg shadow-lg">
            <h2 className="text-2xl font-bold text-gray-800 font-droid-arabic-kufi mb-6">
              التقنية والأمن
            </h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 font-droid-arabic-kufi mb-2">
                  المشاكل التقنية
                </label>
                <textarea
                  value={formData.technical_issues}
                  onChange={(e) => updateField("technical_issues", e.target.value)}
                  className="w-full p-3 border border-gray-300 rounded-lg font-droid-arabic-kufi resize-none focus:ring-2 focus:ring-blue-500 print:border-0"
                  rows="3"
                  placeholder="المشاكل التقنية التي حدثت..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 font-droid-arabic-kufi mb-2">
                  الحلول التقنية المطبقة
                </label>
                <textarea
                  value={formData.technical_solutions}
                  onChange={(e) => updateField("technical_solutions", e.target.value)}
                  className="w-full p-3 border border-gray-300 rounded-lg font-droid-arabic-kufi resize-none focus:ring-2 focus:ring-blue-500 print:border-0"
                  rows="3"
                  placeholder="كيف تم حل المشاكل التقنية..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 font-droid-arabic-kufi mb-2">
                  ملاحظات البنية التحتية
                </label>
                <textarea
                  value={formData.infrastructure_notes}
                  onChange={(e) => updateField("infrastructure_notes", e.target.value)}
                  className="w-full p-3 border border-gray-300 rounded-lg font-droid-arabic-kufi resize-none focus:ring-2 focus:ring-blue-500 print:border-0"
                  rows="3"
                  placeholder="الإنترنت، الكهرباء، المرافق..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 font-droid-arabic-kufi mb-2">
                  الإجراءات الأمنية
                </label>
                <textarea
                  value={formData.security_measures}
                  onChange={(e) => updateField("security_measures", e.target.value)}
                  className="w-full p-3 border border-gray-300 rounded-lg font-droid-arabic-kufi resize-none focus:ring-2 focus:ring-blue-500 print:border-0"
                  rows="3"
                  placeholder="الإجراءات الأمنية المطبقة..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 font-droid-arabic-kufi mb-2">
                  حوادث السلامة
                </label>
                <textarea
                  value={formData.safety_incidents}
                  onChange={(e) => updateField("safety_incidents", e.target.value)}
                  className="w-full p-3 border border-gray-300 rounded-lg font-droid-arabic-kufi resize-none focus:ring-2 focus:ring-blue-500 print:border-0"
                  rows="3"
                  placeholder="أي حوادث أو مشاكل تتعلق بالسلامة..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 font-droid-arabic-kufi mb-2">
                  البروتوكولات الصحية
                </label>
                <textarea
                  value={formData.health_protocols}
                  onChange={(e) => updateField("health_protocols", e.target.value)}
                  className="w-full p-3 border border-gray-300 rounded-lg font-droid-arabic-kufi resize-none focus:ring-2 focus:ring-blue-500 print:border-0"
                  rows="3"
                  placeholder="الإجراءات الصحية والوقائية المطبقة..."
                />
              </div>
            </div>
          </div>
        </>
      );

    case "financial":
      return (
        <>
          <div className="bg-white p-6 rounded-lg shadow-lg">
            <div className="flex items-center gap-2 mb-6">
              <DollarSign className="w-6 h-6 text-green-600" />
              <h2 className="text-2xl font-bold text-gray-800 font-droid-arabic-kufi">
                الملخص المالي
              </h2>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
              <div className="p-4 bg-blue-50 rounded-lg">
                <label className="block text-sm font-medium text-gray-700 font-droid-arabic-kufi mb-2">
                  الميزانية المخططة (دج)
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={formData.planned_budget}
                  onChange={(e) => updateField("planned_budget", e.target.value)}
                  className="w-full p-3 border border-gray-300 rounded-lg font-droid-arabic-kufi focus:ring-2 focus:ring-blue-500 print:border-0"
                  placeholder="0.00"
                />
              </div>
              <div className="p-4 bg-red-50 rounded-lg">
                <label className="block text-sm font-medium text-gray-700 font-droid-arabic-kufi mb-2">
                  النفقات الفعلية (دج)
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={formData.actual_expenses}
                  onChange={(e) => updateField("actual_expenses", e.target.value)}
                  className="w-full p-3 border border-gray-300 rounded-lg font-droid-arabic-kufi focus:ring-2 focus:ring-red-500 print:border-0"
                  placeholder="0.00"
                />
              </div>
              <div className="p-4 bg-yellow-50 rounded-lg">
                <label className="block text-sm font-medium text-gray-700 font-droid-arabic-kufi mb-2">
                  الفرق (دج)
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={
                    formData.planned_budget && formData.actual_expenses
                      ? (parseFloat(formData.actual_expenses) - parseFloat(formData.planned_budget)).toFixed(2)
                      : ""
                  }
                  readOnly
                  className="w-full p-3 border border-gray-300 rounded-lg font-droid-arabic-kufi bg-gray-100 print:border-0"
                  placeholder="0.00"
                />
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 font-droid-arabic-kufi mb-2">
                  النفقات الرئيسية
                </label>
                <textarea
                  value={formData.major_expenses}
                  onChange={(e) => updateField("major_expenses", e.target.value)}
                  className="w-full p-3 border border-gray-300 rounded-lg font-droid-arabic-kufi resize-none focus:ring-2 focus:ring-green-500 print:border-0"
                  rows="5"
                  placeholder="تفاصيل النفقات الرئيسية: الإيجار، الضيافة، النقل، المعدات..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 font-droid-arabic-kufi mb-2">
                  إجراءات توفير التكاليف
                </label>
                <textarea
                  value={formData.cost_saving_measures}
                  onChange={(e) => updateField("cost_saving_measures", e.target.value)}
                  className="w-full p-3 border border-gray-300 rounded-lg font-droid-arabic-kufi resize-none focus:ring-2 focus:ring-green-500 print:border-0"
                  rows="4"
                  placeholder="الإجراءات المتخذة لتوفير التكاليف والنتائج..."
                />
              </div>
            </div>
          </div>

          {/* Sponsors */}
          <div className="bg-white p-6 rounded-lg shadow-lg">
            <h2 className="text-2xl font-bold text-gray-800 font-droid-arabic-kufi mb-6">
              الرعاة والشراكات
            </h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 font-droid-arabic-kufi mb-2">
                  قائمة الرعاة والشركاء
                </label>
                <textarea
                  value={formData.sponsors_list}
                  onChange={(e) => updateField("sponsors_list", e.target.value)}
                  className="w-full p-3 border border-gray-300 rounded-lg font-droid-arabic-kufi resize-none focus:ring-2 focus:ring-blue-500 print:border-0"
                  rows="4"
                  placeholder="أسماء الرعاة والشركاء ومستويات الرعاية..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 font-droid-arabic-kufi mb-2">
                  نتائج الشراكات
                </label>
                <textarea
                  value={formData.partnership_outcomes}
                  onChange={(e) => updateField("partnership_outcomes", e.target.value)}
                  className="w-full p-3 border border-gray-300 rounded-lg font-droid-arabic-kufi resize-none focus:ring-2 focus:ring-blue-500 print:border-0"
                  rows="4"
                  placeholder="الفوائد والنتائج المحققة من الشراكات..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 font-droid-arabic-kufi mb-2">
                  ملاحظات الرعاة
                </label>
                <textarea
                  value={formData.sponsor_feedback}
                  onChange={(e) => updateField("sponsor_feedback", e.target.value)}
                  className="w-full p-3 border border-gray-300 rounded-lg font-droid-arabic-kufi resize-none focus:ring-2 focus:ring-blue-500 print:border-0"
                  rows="4"
                  placeholder="تعليقات ورضا الرعاة عن الحدث..."
                />
              </div>
            </div>
          </div>
        </>
      );

    case "marketing":
      return (
        <>
          <div className="bg-white p-6 rounded-lg shadow-lg">
            <div className="flex items-center gap-2 mb-6">
              <Megaphone className="w-6 h-6 text-pink-600" />
              <h2 className="text-2xl font-bold text-gray-800 font-droid-arabic-kufi">
                التسويق والترويج
              </h2>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 font-droid-arabic-kufi mb-2">
                  قنوات التسويق المستخدمة
                </label>
                <textarea
                  value={formData.marketing_channels_used}
                  onChange={(e) => updateField("marketing_channels_used", e.target.value)}
                  className="w-full p-3 border border-gray-300 rounded-lg font-droid-arabic-kufi resize-none focus:ring-2 focus:ring-pink-500 print:border-0"
                  rows="4"
                  placeholder="وسائل التواصل، البريد، الإعلانات، المنشورات..."
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 font-droid-arabic-kufi mb-2">
                    الوصول عبر وسائل التواصل
                  </label>
                  <input
                    type="number"
                    value={formData.social_media_reach}
                    onChange={(e) => updateField("social_media_reach", e.target.value)}
                    className="w-full p-3 border border-gray-300 rounded-lg font-droid-arabic-kufi focus:ring-2 focus:ring-pink-500 print:border-0"
                    placeholder="عدد الأشخاص"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 font-droid-arabic-kufi mb-2">
                    التفاعل عبر وسائل التواصل
                  </label>
                  <input
                    type="number"
                    value={formData.social_media_engagement}
                    onChange={(e) => updateField("social_media_engagement", e.target.value)}
                    className="w-full p-3 border border-gray-300 rounded-lg font-droid-arabic-kufi focus:ring-2 focus:ring-pink-500 print:border-0"
                    placeholder="الإعجابات، التعليقات، المشاركات"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 font-droid-arabic-kufi mb-2">
                  فعالية التسويق
                </label>
                <textarea
                  value={formData.marketing_effectiveness}
                  onChange={(e) => updateField("marketing_effectiveness", e.target.value)}
                  className="w-full p-3 border border-gray-300 rounded-lg font-droid-arabic-kufi resize-none focus:ring-2 focus:ring-pink-500 print:border-0"
                  rows="4"
                  placeholder="تقييم فعالية الحملات التسويقية والنتائج..."
                />
              </div>
            </div>
          </div>

          {/* Media Coverage */}
          <div className="bg-white p-6 rounded-lg shadow-lg">
            <h2 className="text-2xl font-bold text-gray-800 font-droid-arabic-kufi mb-6">
              التغطية الإعلامية
            </h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 font-droid-arabic-kufi mb-2">
                  عدد الإشارات الإعلامية
                </label>
                <input
                  type="number"
                  value={formData.media_mentions}
                  onChange={(e) => updateField("media_mentions", e.target.value)}
                  className="w-full p-3 border border-gray-300 rounded-lg font-droid-arabic-kufi focus:ring-2 focus:ring-blue-500 print:border-0"
                  placeholder="0"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 font-droid-arabic-kufi mb-2">
                  وسائل الإعلام
                </label>
                <textarea
                  value={formData.media_outlets}
                  onChange={(e) => updateField("media_outlets", e.target.value)}
                  className="w-full p-3 border border-gray-300 rounded-lg font-droid-arabic-kufi resize-none focus:ring-2 focus:ring-blue-500 print:border-0"
                  rows="4"
                  placeholder="القنوات، الصحف، المواقع التي غطت الحدث..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 font-droid-arabic-kufi mb-2">
                  أبرز التغطيات الإعلامية
                </label>
                <textarea
                  value={formData.media_highlights}
                  onChange={(e) => updateField("media_highlights", e.target.value)}
                  className="w-full p-3 border border-gray-300 rounded-lg font-droid-arabic-kufi resize-none focus:ring-2 focus:ring-blue-500 print:border-0"
                  rows="4"
                  placeholder="أهم التقارير والتغطيات الإعلامية..."
                />
              </div>
            </div>
          </div>
        </>
      );

    case "feedback":
      return (
        <>
          <div className="bg-white p-6 rounded-lg shadow-lg">
            <div className="flex items-center gap-2 mb-6">
              <Star className="w-6 h-6 text-yellow-600" />
              <h2 className="text-2xl font-bold text-gray-800 font-droid-arabic-kufi">
                تقييم الحضور
              </h2>
            </div>
            
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 font-droid-arabic-kufi mb-2">
                التقييم العام للرضا (من 5)
              </label>
              <input
                type="number"
                step="0.1"
                min="0"
                max="5"
                value={formData.overall_satisfaction_rating}
                onChange={(e) => updateField("overall_satisfaction_rating", e.target.value)}
                className="w-full p-3 border border-gray-300 rounded-lg font-droid-arabic-kufi focus:ring-2 focus:ring-yellow-500 print:border-0"
                placeholder="0.0"
              />
            </div>

            <div className="space-y-4">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <ThumbsUp className="w-5 h-5 text-green-600" />
                  <label className="block text-sm font-medium text-gray-700 font-droid-arabic-kufi">
                    ملخص التعليقات الإيجابية
                  </label>
                </div>
                <textarea
                  value={formData.positive_feedback_summary}
                  onChange={(e) => updateField("positive_feedback_summary", e.target.value)}
                  className="w-full p-3 border border-gray-300 rounded-lg font-droid-arabic-kufi resize-none focus:ring-2 focus:ring-green-500 print:border-0"
                  rows="5"
                  placeholder="أهم التعليقات والآراء الإيجابية من الحضور..."
                />
              </div>

              <div>
                <div className="flex items-center gap-2 mb-2">
                  <ThumbsDown className="w-5 h-5 text-red-600" />
                  <label className="block text-sm font-medium text-gray-700 font-droid-arabic-kufi">
                    ملخص التعليقات السلبية
                  </label>
                </div>
                <textarea
                  value={formData.negative_feedback_summary}
                  onChange={(e) => updateField("negative_feedback_summary", e.target.value)}
                  className="w-full p-3 border border-gray-300 rounded-lg font-droid-arabic-kufi resize-none focus:ring-2 focus:ring-red-500 print:border-0"
                  rows="5"
                  placeholder="الشكاوى والانتقادات والمشاكل التي ذكرها الحضور..."
                />
              </div>

              <div>
                <div className="flex items-center gap-2 mb-2">
                  <MessageSquare className="w-5 h-5 text-blue-600" />
                  <label className="block text-sm font-medium text-gray-700 font-droid-arabic-kufi">
                    اقتراحات الحضور
                  </label>
                </div>
                <textarea
                  value={formData.attendee_suggestions}
                  onChange={(e) => updateField("attendee_suggestions", e.target.value)}
                  className="w-full p-3 border border-gray-300 rounded-lg font-droid-arabic-kufi resize-none focus:ring-2 focus:ring-blue-500 print:border-0"
                  rows="5"
                  placeholder="اقتراحات وأفكار الحضور للتحسين..."
                />
              </div>
            </div>
          </div>
        </>
      );

    case "analysis":
      return (
        <>
          {/* Positive/Negative Points */}
          <div className="bg-white p-6 rounded-lg shadow-lg">
            <div className="flex items-center gap-2 mb-6">
              <TrendingUp className="w-6 h-6 text-green-600" />
              <h2 className="text-2xl font-bold text-gray-800 font-droid-arabic-kufi">
                التحليل الشامل
              </h2>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 font-droid-arabic-kufi mb-2">
                  النقاط الإيجابية
                </label>
                <textarea
                  value={formData.positive_points}
                  onChange={(e) => updateField("positive_points", e.target.value)}
                  className="w-full p-3 border border-gray-300 rounded-lg font-droid-arabic-kufi resize-none focus:ring-2 focus:ring-green-500 print:border-0"
                  rows="5"
                  placeholder="اكتب النقاط الإيجابية للحدث..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 font-droid-arabic-kufi mb-2">
                  النقاط السلبية
                </label>
                <textarea
                  value={formData.negative_points}
                  onChange={(e) => updateField("negative_points", e.target.value)}
                  className="w-full p-3 border border-gray-300 rounded-lg font-droid-arabic-kufi resize-none focus:ring-2 focus:ring-red-500 print:border-0"
                  rows="5"
                  placeholder="اكتب النقاط السلبية والتحديات..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 font-droid-arabic-kufi mb-2">
                  التحديات التي واجهناها
                </label>
                <textarea
                  value={formData.challenges_faced}
                  onChange={(e) => updateField("challenges_faced", e.target.value)}
                  className="w-full p-3 border border-gray-300 rounded-lg font-droid-arabic-kufi resize-none focus:ring-2 focus:ring-orange-500 print:border-0"
                  rows="5"
                  placeholder="التحديات والعقبات التي واجهها الفريق..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 font-droid-arabic-kufi mb-2">
                  الحلول المطبقة
                </label>
                <textarea
                  value={formData.solutions_implemented}
                  onChange={(e) => updateField("solutions_implemented", e.target.value)}
                  className="w-full p-3 border border-gray-300 rounded-lg font-droid-arabic-kufi resize-none focus:ring-2 focus:ring-blue-500 print:border-0"
                  rows="5"
                  placeholder="الحلول التي تم تطبيقها لمواجهة التحديات..."
                />
              </div>
            </div>
          </div>

          {/* Lessons Learned */}
          <div className="bg-white p-6 rounded-lg shadow-lg">
            <div className="flex items-center gap-2 mb-6">
              <Lightbulb className="w-6 h-6 text-yellow-600" />
              <h2 className="text-2xl font-bold text-gray-800 font-droid-arabic-kufi">
                الدروس المستفادة
              </h2>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 font-droid-arabic-kufi mb-2">
                  ما الذي سار بشكل جيد؟
                </label>
                <textarea
                  value={formData.what_went_well}
                  onChange={(e) => updateField("what_went_well", e.target.value)}
                  className="w-full p-3 border border-gray-300 rounded-lg font-droid-arabic-kufi resize-none focus:ring-2 focus:ring-green-500 print:border-0"
                  rows="4"
                  placeholder="الجوانب والعمليات التي نجحت بشكل ممتاز..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 font-droid-arabic-kufi mb-2">
                  ما الذي لم يسر بشكل جيد؟
                </label>
                <textarea
                  value={formData.what_went_wrong}
                  onChange={(e) => updateField("what_went_wrong", e.target.value)}
                  className="w-full p-3 border border-gray-300 rounded-lg font-droid-arabic-kufi resize-none focus:ring-2 focus:ring-red-500 print:border-0"
                  rows="4"
                  placeholder="الجوانب التي لم تسر كما هو مخطط..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 font-droid-arabic-kufi mb-2">
                  النتائج غير المتوقعة
                </label>
                <textarea
                  value={formData.unexpected_outcomes}
                  onChange={(e) => updateField("unexpected_outcomes", e.target.value)}
                  className="w-full p-3 border border-gray-300 rounded-lg font-droid-arabic-kufi resize-none focus:ring-2 focus:ring-purple-500 print:border-0"
                  rows="4"
                  placeholder="المفاجآت والنتائج غير المتوقعة..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 font-droid-arabic-kufi mb-2">
                  أفضل الممارسات المحددة
                </label>
                <textarea
                  value={formData.best_practices_identified}
                  onChange={(e) => updateField("best_practices_identified", e.target.value)}
                  className="w-full p-3 border border-gray-300 rounded-lg font-droid-arabic-kufi resize-none focus:ring-2 focus:ring-blue-500 print:border-0"
                  rows="4"
                  placeholder="الممارسات الناجحة التي يجب تطبيقها مستقبلاً..."
                />
              </div>
            </div>
          </div>
        </>
      );

    case "future":
      return (
        <>
          {/* Future Tasks */}
          <div className="bg-white p-6 rounded-lg shadow-lg">
            <div className="flex items-center gap-2 mb-6">
              <Target className="w-6 h-6 text-blue-600" />
              <h2 className="text-2xl font-bold text-gray-800 font-droid-arabic-kufi">
                التخطيط المستقبلي
              </h2>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 font-droid-arabic-kufi mb-2">
                  المهام المستقبلية
                </label>
                <textarea
                  value={formData.future_tasks}
                  onChange={(e) => updateField("future_tasks", e.target.value)}
                  className="w-full p-3 border border-gray-300 rounded-lg font-droid-arabic-kufi resize-none focus:ring-2 focus:ring-blue-500 print:border-0"
                  rows="5"
                  placeholder="المهام والأعمال المطلوبة للمتابعة..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 font-droid-arabic-kufi mb-2">
                  التوصيات
                </label>
                <textarea
                  value={formData.recommendations}
                  onChange={(e) => updateField("recommendations", e.target.value)}
                  className="w-full p-3 border border-gray-300 rounded-lg font-droid-arabic-kufi resize-none focus:ring-2 focus:ring-green-500 print:border-0"
                  rows="5"
                  placeholder="التوصيات للأحداث القادمة..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 font-droid-arabic-kufi mb-2">
                  التحسينات المطلوبة
                </label>
                <textarea
                  value={formData.improvements_needed}
                  onChange={(e) => updateField("improvements_needed", e.target.value)}
                  className="w-full p-3 border border-gray-300 rounded-lg font-droid-arabic-kufi resize-none focus:ring-2 focus:ring-orange-500 print:border-0"
                  rows="5"
                  placeholder="المجالات التي تحتاج إلى تحسين..."
                />
              </div>
            </div>
          </div>

          {/* Action Items */}
          <div className="bg-white p-6 rounded-lg shadow-lg">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-gray-800 font-droid-arabic-kufi">
                بنود العمل
              </h2>
              <button
                type="button"
                onClick={addActionItem}
                className="no-print flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-droid-arabic-kufi transition"
              >
                <Plus className="w-5 h-5" />
                إضافة بند
              </button>
            </div>

            {formData.action_items.length === 0 ? (
              <p className="text-gray-500 font-droid-arabic-kufi text-center py-8">
                لا توجد بنود عمل. اضغط "إضافة بند" لإضافة مهمة جديدة.
              </p>
            ) : (
              <div className="space-y-4">
                {formData.action_items.map((item, index) => (
                  <div
                    key={index}
                    className="border-2 border-gray-200 rounded-lg p-4 print:border print:border-gray-400"
                  >
                    <div className="flex items-start justify-between mb-3">
                      <h3 className="font-semibold text-gray-700 font-droid-arabic-kufi text-lg">
                        بند {index + 1}
                      </h3>
                      <button
                        type="button"
                        onClick={() => removeActionItem(index)}
                        className="no-print text-red-600 hover:text-red-800 transition"
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-gray-700 font-droid-arabic-kufi mb-1">
                          المهمة *
                        </label>
                        <textarea
                          value={item.task}
                          onChange={(e) => updateActionItem(index, "task", e.target.value)}
                          className="w-full p-2 border border-gray-300 rounded-lg font-droid-arabic-kufi resize-none focus:ring-2 focus:ring-blue-500 print:border-0"
                          rows="2"
                          placeholder="وصف المهمة..."
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 font-droid-arabic-kufi mb-1">
                          الأولوية *
                        </label>
                        <select
                          value={item.priority}
                          onChange={(e) => updateActionItem(index, "priority", e.target.value)}
                          className="w-full p-2 border border-gray-300 rounded-lg font-droid-arabic-kufi focus:ring-2 focus:ring-blue-500 print:border-0"
                        >
                          <option value="high">عالية</option>
                          <option value="medium">متوسطة</option>
                          <option value="low">منخفضة</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 font-droid-arabic-kufi mb-1">
                          الموعد النهائي
                        </label>
                        <input
                          type="date"
                          value={item.deadline}
                          onChange={(e) => updateActionItem(index, "deadline", e.target.value)}
                          className="w-full p-2 border border-gray-300 rounded-lg font-droid-arabic-kufi focus:ring-2 focus:ring-blue-500 print:border-0"
                        />
                      </div>
                      <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-gray-700 font-droid-arabic-kufi mb-1">
                          المكلف
                        </label>
                        <input
                          type="text"
                          value={item.assignee}
                          onChange={(e) => updateActionItem(index, "assignee", e.target.value)}
                          className="w-full p-2 border border-gray-300 rounded-lg font-droid-arabic-kufi focus:ring-2 focus:ring-blue-500 print:border-0"
                          placeholder="اسم المسؤول عن المهمة..."
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Additional Notes */}
          <div className="bg-white p-6 rounded-lg shadow-lg">
            <h2 className="text-2xl font-bold text-gray-800 font-droid-arabic-kufi mb-6">
              ملاحظات إضافية
            </h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 font-droid-arabic-kufi mb-2">
                  ملاحظات عامة
                </label>
                <textarea
                  value={formData.general_notes}
                  onChange={(e) => updateField("general_notes", e.target.value)}
                  className="w-full p-3 border border-gray-300 rounded-lg font-droid-arabic-kufi resize-none focus:ring-2 focus:ring-gray-500 print:border-0"
                  rows="4"
                  placeholder="أي ملاحظات أو تعليقات إضافية..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 font-droid-arabic-kufi mb-2">
                  الخلاصة
                </label>
                <textarea
                  value={formData.conclusion}
                  onChange={(e) => updateField("conclusion", e.target.value)}
                  className="w-full p-3 border border-gray-300 rounded-lg font-droid-arabic-kufi resize-none focus:ring-2 focus:ring-blue-500 print:border-0"
                  rows="5"
                  placeholder="خلاصة شاملة للحدث والنتائج..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 font-droid-arabic-kufi mb-2">
                  شكر وتقدير
                </label>
                <textarea
                  value={formData.acknowledgments}
                  onChange={(e) => updateField("acknowledgments", e.target.value)}
                  className="w-full p-3 border border-gray-300 rounded-lg font-droid-arabic-kufi resize-none focus:ring-2 focus:ring-purple-500 print:border-0"
                  rows="4"
                  placeholder="شكر الأفراد والجهات المساهمة..."
                />
              </div>
            </div>
          </div>
        </>
      );

         default:
        return null;
    }
  }
}