export const generatePrintableHTML = (event, formData, reportMetadata) => {
  const formatDate = (dateString) => {
    if (!dateString) return "-";
    return new Date(dateString).toLocaleDateString("ar-DZ", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const formatDateTime = (dateString) => {
    if (!dateString) return "-";
    return new Date(dateString).toLocaleDateString("ar-DZ", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getPriorityBadge = (priority) => {
    const badges = {
      high: { text: "عالية", color: "#dc2626" },
      medium: { text: "متوسطة", color: "#f59e0b" },
      low: { text: "منخفضة", color: "#10b981" },
    };
    return badges[priority] || badges.medium;
  };

  return `
<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>تقرير الحدث - ${event?.name || ""}</title>
    <style>
        @import url('https://fonts.googleapis.com/css2?family=Cairo:wght@300;400;600;700;900&display=swap');
        
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        
        body {
            font-family: 'Cairo', 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            line-height: 1.8;
            color: #1f2937;
            background: white;
            direction: rtl;
            text-align: right;
        }
        
        .container {
            max-width: 210mm;
            margin: 0 auto;
            padding: 20mm;
        }
        
        /* Header Section */
        .header {
            text-align: center;
            border-bottom: 4px solid #2563eb;
            padding-bottom: 30px;
            margin-bottom: 40px;
        }
        
        .header h1 {
            font-size: 36px;
            font-weight: 900;
            color: #1e40af;
            margin-bottom: 15px;
            text-transform: uppercase;
            letter-spacing: 1px;
        }
        
        .header h2 {
            font-size: 28px;
            font-weight: 700;
            color: #374151;
            margin-bottom: 10px;
        }
        
        .header .event-date {
            font-size: 18px;
            color: #6b7280;
            font-weight: 600;
        }
        
        .status-badge {
            display: inline-block;
            padding: 10px 25px;
            background: #dcfce7;
            color: #166534;
            border-radius: 25px;
            font-weight: 700;
            font-size: 16px;
            margin-top: 20px;
            border: 2px solid #16a34a;
        }
        
        /* Metadata Section */
        .metadata {
            background: #f9fafb;
            padding: 20px;
            border-radius: 10px;
            margin-bottom: 40px;
            border: 1px solid #e5e7eb;
        }
        
        .metadata-grid {
            display: grid;
            grid-template-columns: repeat(2, 1fr);
            gap: 15px;
        }
        
        .metadata-item {
            font-size: 14px;
            color: #4b5563;
        }
        
        .metadata-item strong {
            color: #1f2937;
            font-weight: 700;
        }
        
        /* Section */
        .section {
            margin-bottom: 40px;
            page-break-inside: avoid;
        }
        
        .section-header {
            background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
            color: white;
            padding: 15px 25px;
            border-radius: 10px;
            margin-bottom: 20px;
            display: flex;
            align-items: center;
            gap: 15px;
            box-shadow: 0 4px 6px rgba(37, 99, 235, 0.2);
        }
        
        .section-header h2 {
            font-size: 24px;
            font-weight: 700;
        }
        
        .section-icon {
            width: 35px;
            height: 35px;
            background: rgba(255, 255, 255, 0.2);
            border-radius: 8px;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 20px;
        }
        
        .section-content {
            padding: 20px;
            background: white;
            border: 1px solid #e5e7eb;
            border-radius: 8px;
        }
        
        /* Subsection */
        .subsection {
            margin-bottom: 30px;
        }
        
        .subsection-title {
            font-size: 18px;
            font-weight: 700;
            color: #1f2937;
            margin-bottom: 12px;
            padding-bottom: 8px;
            border-bottom: 2px solid #e5e7eb;
        }
        
        .subsection-content {
            font-size: 15px;
            color: #374151;
            line-height: 2;
            white-space: pre-wrap;
        }
        
        /* Stats Grid */
        .stats-grid {
            display: grid;
            grid-template-columns: repeat(4, 1fr);
            gap: 20px;
            margin-bottom: 20px;
        }
        
        .stat-card {
            background: #f9fafb;
            padding: 20px;
            border-radius: 10px;
            text-align: center;
            border: 2px solid #e5e7eb;
        }
        
        .stat-card.blue {
            background: #eff6ff;
            border-color: #3b82f6;
        }
        
        .stat-card.green {
            background: #f0fdf4;
            border-color: #10b981;
        }
        
        .stat-card.red {
            background: #fef2f2;
            border-color: #ef4444;
        }
        
        .stat-card.orange {
            background: #fff7ed;
            border-color: #f97316;
        }
        
        .stat-label {
            font-size: 13px;
            color: #6b7280;
            font-weight: 600;
            margin-bottom: 8px;
        }
        
        .stat-value {
            font-size: 28px;
            font-weight: 900;
            color: #1f2937;
        }
        
        /* Two Column Layout */
        .two-column {
            display: grid;
            grid-template-columns: repeat(2, 1fr);
            gap: 20px;
        }
        
        .three-column {
            display: grid;
            grid-template-columns: repeat(3, 1fr);
            gap: 20px;
        }
        
        /* Table */
        .data-table {
            width: 100%;
            border-collapse: collapse;
            margin-top: 15px;
        }
        
        .data-table th {
            background: #f3f4f6;
            padding: 12px;
            text-align: right;
            font-weight: 700;
            color: #374151;
            border: 1px solid #e5e7eb;
        }
        
        .data-table td {
            padding: 12px;
            border: 1px solid #e5e7eb;
            color: #4b5563;
        }
        
        .data-table tr:nth-child(even) {
            background: #f9fafb;
        }
        
        /* Assignment Card */
        .assignment-card {
            background: #f9fafb;
            border: 2px solid #e5e7eb;
            border-radius: 10px;
            padding: 20px;
            margin-bottom: 15px;
        }
        
        .assignment-header {
            font-size: 16px;
            font-weight: 700;
            color: #1f2937;
            margin-bottom: 12px;
            padding-bottom: 10px;
            border-bottom: 2px solid #d1d5db;
        }
        
        .assignment-details {
            display: grid;
            grid-template-columns: repeat(2, 1fr);
            gap: 10px;
            margin-bottom: 10px;
        }
        
        .assignment-field {
            font-size: 14px;
        }
        
        .assignment-field label {
            font-weight: 600;
            color: #6b7280;
            display: block;
            margin-bottom: 4px;
        }
        
        .assignment-field value {
            color: #1f2937;
            display: block;
        }
        
        /* Action Item Card */
        .action-item {
            background: white;
            border: 2px solid #e5e7eb;
            border-right: 4px solid #3b82f6;
            border-radius: 8px;
            padding: 15px;
            margin-bottom: 12px;
        }
        
        .action-item-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 10px;
        }
        
        .action-item-title {
            font-weight: 700;
            color: #1f2937;
            font-size: 15px;
        }
        
        .priority-badge {
            padding: 5px 15px;
            border-radius: 20px;
            font-size: 12px;
            font-weight: 700;
            color: white;
        }
        
        .action-item-details {
            display: grid;
            grid-template-columns: repeat(3, 1fr);
            gap: 10px;
            font-size: 13px;
            color: #6b7280;
        }
        
        /* Highlights */
        .highlight-box {
            background: #fef3c7;
            border-right: 4px solid #f59e0b;
            padding: 20px;
            border-radius: 8px;
            margin: 15px 0;
        }
        
        .highlight-box.success {
            background: #dcfce7;
            border-right-color: #10b981;
        }
        
        .highlight-box.error {
            background: #fee2e2;
            border-right-color: #ef4444;
        }
        
        .highlight-box.info {
            background: #dbeafe;
            border-right-color: #3b82f6;
        }
        
        /* Empty State */
        .empty-state {
            text-align: center;
            padding: 40px;
            color: #9ca3af;
            font-style: italic;
        }
        
        /* Page Break */
        .page-break {
            page-break-after: always;
        }
        
        /* Print Styles */
        @media print {
            body {
                margin: 0;
                padding: 0;
            }
            
            .container {
                max-width: 100%;
                padding: 0;
            }
            
            .section {
                page-break-inside: avoid;
            }
            
            .header {
                page-break-after: avoid;
            }
            
            .section-header {
                page-break-after: avoid;
            }
        }
        
        /* Watermark for Draft */
        ${formData.report_status === "draft" ? `
        body::before {
            content: "مسودة";
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%) rotate(-45deg);
            font-size: 120px;
            font-weight: 900;
            color: rgba(239, 68, 68, 0.1);
            z-index: -1;
            pointer-events: none;
        }
        ` : ""}
    </style>
</head>
<body>
    <div class="container">
        <!-- Header -->
        <div class="header">
            <h1>تقرير شامل للحدث</h1>
            <h2>${event?.name || ""}</h2>
            <div class="event-date">
                التاريخ: ${formatDate(event?.start_date || event?.date)}
            </div>
            ${
              formData.report_status === "approved"
                ? '<div class="status-badge">✓ تقرير معتمد</div>'
                : ""
            }
        </div>

        <!-- Metadata -->
        ${
          reportMetadata
            ? `
        <div class="metadata">
            <div class="metadata-grid">
                ${
                  reportMetadata.created_by
                    ? `
                <div class="metadata-item">
                    <strong>أنشئ بواسطة:</strong> ${reportMetadata.created_by.name}
                </div>
                `
                    : ""
                }
                ${
                  reportMetadata.created_at
                    ? `
                <div class="metadata-item">
                    <strong>تاريخ الإنشاء:</strong> ${formatDateTime(reportMetadata.created_at)}
                </div>
                `
                    : ""
                }
                ${
                  reportMetadata.updated_by
                    ? `
                <div class="metadata-item">
                    <strong>آخر تعديل بواسطة:</strong> ${reportMetadata.updated_by.name}
                </div>
                `
                    : ""
                }
                ${
                  reportMetadata.approved_by
                    ? `
                <div class="metadata-item">
                    <strong>اعتمد بواسطة:</strong> ${reportMetadata.approved_by.name}
                </div>
                `
                    : ""
                }
            </div>
        </div>
        `
            : ""
        }

        <!-- Executive Summary -->
        ${
          formData.executive_summary ||
          formData.key_achievements ||
          formData.critical_issues
            ? `
        <div class="section">
            <div class="section-header">
                <div class="section-icon">📋</div>
                <h2>الملخص التنفيذي</h2>
            </div>
            <div class="section-content">
                ${
                  formData.executive_summary
                    ? `
                <div class="subsection">
                    <div class="subsection-title">نظرة عامة</div>
                    <div class="subsection-content">${formData.executive_summary}</div>
                </div>
                `
                    : ""
                }
                
                ${
                  formData.key_achievements
                    ? `
                <div class="subsection">
                    <div class="subsection-title">🏆 الإنجازات الرئيسية</div>
                    <div class="highlight-box success">
                        <div class="subsection-content">${formData.key_achievements}</div>
                    </div>
                </div>
                `
                    : ""
                }
                
                ${
                  formData.critical_issues
                    ? `
                <div class="subsection">
                    <div class="subsection-title">⚠️ القضايا الحرجة</div>
                    <div class="highlight-box error">
                        <div class="subsection-content">${formData.critical_issues}</div>
                    </div>
                </div>
                `
                    : ""
                }
            </div>
        </div>
        `
            : ""
        }

        <!-- Event Overview -->
        <div class="section">
            <div class="section-header">
                <div class="section-icon">📊</div>
                <h2>نظرة عامة على الحدث</h2>
            </div>
            <div class="section-content">
                ${
                  formData.total_attendees ||
                  formData.registered_attendees ||
                  formData.actual_attendees
                    ? `
                <div class="stats-grid">
                    ${
                      formData.total_attendees
                        ? `
                    <div class="stat-card blue">
                        <div class="stat-label">إجمالي الحضور المتوقع</div>
                        <div class="stat-value">${formData.total_attendees}</div>
                    </div>
                    `
                        : ""
                    }
                    ${
                      formData.registered_attendees
                        ? `
                    <div class="stat-card green">
                        <div class="stat-label">عدد المسجلين</div>
                        <div class="stat-value">${formData.registered_attendees}</div>
                    </div>
                    `
                        : ""
                    }
                    ${
                      formData.actual_attendees
                        ? `
                    <div class="stat-card orange">
                        <div class="stat-label">الحضور الفعلي</div>
                        <div class="stat-value">${formData.actual_attendees}</div>
                    </div>
                    `
                        : ""
                    }
                    ${
                      formData.registered_attendees && formData.actual_attendees
                        ? `
                    <div class="stat-card">
                        <div class="stat-label">نسبة الحضور</div>
                        <div class="stat-value">${((formData.actual_attendees / formData.registered_attendees) * 100).toFixed(1)}%</div>
                    </div>
                    `
                        : ""
                    }
                </div>
                `
                    : ""
                }
                
                ${
                  formData.venue_name
                    ? `
                <div class="subsection">
                    <div class="subsection-title">📍 المكان</div>
                    <div class="subsection-content"><strong>${formData.venue_name}</strong></div>
                </div>
                `
                    : ""
                }
                
                ${
                  formData.venue_feedback
                    ? `
                <div class="subsection">
                    <div class="subsection-title">تقييم المكان</div>
                    <div class="subsection-content">${formData.venue_feedback}</div>
                </div>
                `
                    : ""
                }
            </div>
        </div>

        <!-- Performance Metrics -->
        ${
          formData.total_appointments ||
          formData.completed_appointments ||
          formData.cancelled_appointments ||
          formData.no_show_appointments
            ? `
        <div class="section">
            <div class="section-header">
                <div class="section-icon">📈</div>
                <h2>مقاييس الأداء</h2>
            </div>
            <div class="section-content">
                <div class="stats-grid">
                    ${
                      formData.total_appointments
                        ? `
                    <div class="stat-card blue">
                        <div class="stat-label">إجمالي المواعيد</div>
                        <div class="stat-value">${formData.total_appointments}</div>
                    </div>
                    `
                        : ""
                    }
                    ${
                      formData.completed_appointments
                        ? `
                    <div class="stat-card green">
                        <div class="stat-label">المواعيد المكتملة</div>
                        <div class="stat-value">${formData.completed_appointments}</div>
                    </div>
                    `
                        : ""
                    }
                    ${
                      formData.cancelled_appointments
                        ? `
                    <div class="stat-card red">
                        <div class="stat-label">المواعيد الملغاة</div>
                        <div class="stat-value">${formData.cancelled_appointments}</div>
                    </div>
                    `
                        : ""
                    }
                    ${
                      formData.no_show_appointments
                        ? `
                    <div class="stat-card orange">
                        <div class="stat-label">عدم الحضور</div>
                        <div class="stat-value">${formData.no_show_appointments}</div>
                    </div>
                    `
                        : ""
                    }
                </div>
                
                ${
                  formData.total_appointments && formData.completed_appointments
                    ? `
                <div class="highlight-box info">
                    <strong>نسبة الإنجاز:</strong> ${((formData.completed_appointments / formData.total_appointments) * 100).toFixed(1)}%
                </div>
                `
                    : ""
                }
                
                ${
                  formData.program_highlights
                    ? `
                <div class="subsection">
                    <div class="subsection-title">أبرز فقرات البرنامج</div>
                    <div class="subsection-content">${formData.program_highlights}</div>
                </div>
                `
                    : ""
                }
                
                ${
                  formData.speaker_performance
                    ? `
                <div class="subsection">
                    <div class="subsection-title">أداء المتحدثين</div>
                    <div class="subsection-content">${formData.speaker_performance}</div>
                </div>
                `
                    : ""
                }
            </div>
        </div>
        `
            : ""
        }

        <div class="page-break"></div>

        <!-- Team Performance -->
        ${
          formData.total_staff ||
          formData.total_volunteers ||
          formData.team_performance_notes ||
          formData.outstanding_team_members
            ? `
        <div class="section">
            <div class="section-header">
                <div class="section-icon">👥</div>
                <h2>الفريق والأداء</h2>
            </div>
            <div class="section-content">
                ${
                  formData.total_staff || formData.total_volunteers
                    ? `
                <div class="two-column">
                    ${
                      formData.total_staff
                        ? `
                    <div class="stat-card blue">
                        <div class="stat-label">عدد الموظفين</div>
                        <div class="stat-value">${formData.total_staff}</div>
                    </div>
                    `
                        : ""
                    }
                    ${
                      formData.total_volunteers
                        ? `
                    <div class="stat-card green">
                        <div class="stat-label">عدد المتطوعين</div>
                        <div class="stat-value">${formData.total_volunteers}</div>
                    </div>
                    `
                        : ""
                    }
                </div>
                `
                    : ""
                }
                
                ${
                  formData.team_performance_notes
                    ? `
                <div class="subsection">
                    <div class="subsection-title">ملاحظات أداء الفريق</div>
                    <div class="subsection-content">${formData.team_performance_notes}</div>
                </div>
                `
                    : ""
                }
                
                ${
                  formData.outstanding_team_members
                    ? `
                <div class="subsection">
                    <div class="subsection-title">⭐ أعضاء الفريق المتميزين</div>
                    <div class="highlight-box success">
                        <div class="subsection-content">${formData.outstanding_team_members}</div>
                    </div>
                </div>
                `
                    : ""
                }
            </div>
        </div>
        `
            : ""
        }

        <!-- Assignments -->
        ${
          formData.assignments && formData.assignments.length > 0
            ? `
        <div class="section">
            <div class="section-header">
                <div class="section-icon">📋</div>
                <h2>التكليفات والمسؤوليات</h2>
            </div>
            <div class="section-content">
                ${formData.assignments
                  .map(
                    (assignment, index) => `
                <div class="assignment-card">
                    <div class="assignment-header">تكليف ${index + 1}</div>
                    <div class="assignment-details">
                        <div class="assignment-field">
                            <label>الاسم:</label>
                            <value>${assignment.name || "-"}</value>
                        </div>
                        <div class="assignment-field">
                            <label>رقم الهاتف:</label>
                            <value>${assignment.phone || "-"}</value>
                        </div>
                        ${
                          assignment.role
                            ? `
                        <div class="assignment-field">
                            <label>الدور:</label>
                            <value>${assignment.role}</value>
                        </div>
                        `
                            : ""
                        }
                        <div class="assignment-field">
                            <label>المهمة:</label>
                            <value>${assignment.task || "-"}</value>
                        </div>
                    </div>
                    ${
                      assignment.performance_notes
                        ? `
                    <div class="assignment-field" style="margin-top: 10px;">
                        <label>ملاحظات الأداء:</label>
                        <value>${assignment.performance_notes}</value>
                    </div>
                    `
                        : ""
                    }
                </div>
                `
                  )
                  .join("")}
            </div>
        </div>
        `
            : ""
        }

        <!-- Logistics -->
        ${
          formData.logistics_summary ||
          formData.transportation_notes ||
          formData.accommodation_notes ||
          formData.catering_notes ||
          formData.equipment_notes
            ? `
        <div class="section">
            <div class="section-header">
                <div class="section-icon">🚚</div>
                <h2>اللوجستيات والعمليات</h2>
            </div>
            <div class="section-content">
                ${
                  formData.logistics_summary
                    ? `
                <div class="subsection">
                    <div class="subsection-title">ملخص اللوجستيات</div>
                    <div class="subsection-content">${formData.logistics_summary}</div>
                </div>
                `
                    : ""
                }
                
                <div class="two-column">
                    ${
                      formData.transportation_notes
                        ? `
                    <div class="subsection">
                        <div class="subsection-title">🚗 النقل والمواصلات</div>
                        <div class="subsection-content">${formData.transportation_notes}</div>
                    </div>
                    `
                        : ""
                    }
                    
                    ${
                      formData.accommodation_notes
                        ? `
                    <div class="subsection">
                        <div class="subsection-title">🏨 الإقامة</div>
                        <div class="subsection-content">${formData.accommodation_notes}</div>
                    </div>
                    `
                        : ""
                    }
                    
                    ${
                      formData.catering_notes
                        ? `
                    <div class="subsection">
                        <div class="subsection-title">🍽️ الضيافة والطعام</div>
                        <div class="subsection-content">${formData.catering_notes}</div>
                    </div>
                    `
                        : ""
                    }
                    
                    ${
                      formData.equipment_notes
                        ? `
                    <div class="subsection">
                        <div class="subsection-title">🎤 المعدات والتجهيزات</div>
                        <div class="subsection-content">${formData.equipment_notes}</div>
                    </div>
                    `
                        : ""
                    }
                </div>
            </div>
        </div>
        `
            : ""
        }

        <div class="page-break"></div>

        <!-- Financial Summary -->
        ${
          formData.planned_budget ||
          formData.actual_expenses ||
          formData.major_expenses ||
          formData.cost_saving_measures
            ? `
        <div class="section">
            <div class="section-header">
                <div class="section-icon">💰</div>
                <h2>الملخص المالي</h2>
            </div>
            <div class="section-content">
                ${
                  formData.planned_budget ||
                  formData.actual_expenses ||
                  (formData.planned_budget && formData.actual_expenses)
                    ? `
                <div class="three-column">
                    ${
                      formData.planned_budget
                        ? `
                    <div class="stat-card blue">
                        <div class="stat-label">الميزانية المخططة</div>
                        <div class="stat-value">${parseFloat(formData.planned_budget).toLocaleString()} دج</div>
                    </div>
                    `
                        : ""
                    }
                    ${
                      formData.actual_expenses
                        ? `
                    <div class="stat-card red">
                        <div class="stat-label">النفقات الفعلية</div>
                        <div class="stat-value">${parseFloat(formData.actual_expenses).toLocaleString()} دج</div>
                    </div>
                    `
                        : ""
                    }
                    ${
                      formData.planned_budget && formData.actual_expenses
                        ? `
                    <div class="stat-card ${parseFloat(formData.actual_expenses) <= parseFloat(formData.planned_budget) ? "green" : "orange"}">
                        <div class="stat-label">الفرق</div>
                        <div class="stat-value">${(parseFloat(formData.actual_expenses) - parseFloat(formData.planned_budget)).toLocaleString()} دج</div>
                    </div>
                    `
                        : ""
                    }
                </div>
                `
                    : ""
                }
                
                ${
                  formData.major_expenses
                    ? `
                <div class="subsection">
                    <div class="subsection-title">النفقات الرئيسية</div>
                    <div class="subsection-content">${formData.major_expenses}</div>
                </div>
                `
                    : ""
                }
                
                ${
                  formData.cost_saving_measures
                    ? `
                <div class="subsection">
                    <div class="subsection-title">💡 إجراءات توفير التكاليف</div>
                    <div class="highlight-box success">
                        <div class="subsection-content">${formData.cost_saving_measures}</div>
                    </div>
                </div>
                `
                    : ""
                }
            </div>
        </div>
        `
            : ""
        }

        <!-- Sponsors & Partnerships -->
        ${
          formData.sponsors_list ||
          formData.partnership_outcomes ||
          formData.sponsor_feedback
            ? `
        <div class="section">
            <div class="section-header">
                <div class="section-icon">🤝</div>
                <h2>الرعاة والشراكات</h2>
            </div>
            <div class="section-content">
                ${
                  formData.sponsors_list
                    ? `
                <div class="subsection">
                    <div class="subsection-title">قائمة الرعاة والشركاء</div>
                    <div class="subsection-content">${formData.sponsors_list}</div>
                </div>
                `
                    : ""
                }
                ${
                  formData.partnership_outcomes
                    ? `
                <div class="subsection">
                    <div class="subsection-title">نتائج الشراكات</div>
                    <div class="subsection-content">${formData.partnership_outcomes}</div>
                </div>
                `
                    : ""
                }
                ${
                  formData.sponsor_feedback
                    ? `
                <div class="subsection">
                    <div class="subsection-title">ملاحظات الرعاة</div>
                    <div class="subsection-content">${formData.sponsor_feedback}</div>
                </div>
                `
                    : ""
                }
            </div>
        </div>
        `
            : ""
        }

        <!-- Marketing & Media -->
        ${
          formData.marketing_channels_used ||
          formData.social_media_reach ||
          formData.marketing_effectiveness ||
          formData.media_mentions ||
          formData.media_outlets
            ? `
        <div class="section">
            <div class="section-header">
                <div class="section-icon">📢</div>
                <h2>التسويق والإعلام</h2>
            </div>
            <div class="section-content">
                ${
                  formData.social_media_reach || formData.social_media_engagement
                    ? `
                <div class="two-column">
                    ${
                      formData.social_media_reach
                        ? `
                    <div class="stat-card blue">
                        <div class="stat-label">الوصول عبر وسائل التواصل</div>
                        <div class="stat-value">${formData.social_media_reach.toLocaleString()}</div>
                    </div>
                    `
                        : ""
                    }
                    ${
                      formData.social_media_engagement
                        ? `
                    <div class="stat-card green">
                        <div class="stat-label">التفاعل</div>
                        <div class="stat-value">${formData.social_media_engagement.toLocaleString()}</div>
                    </div>
                    `
                        : ""
                    }
                </div>
                `
                    : ""
                }
                
                ${
                  formData.marketing_channels_used
                    ? `
                <div class="subsection">
                    <div class="subsection-title">قنوات التسويق المستخدمة</div>
                    <div class="subsection-content">${formData.marketing_channels_used}</div>
                </div>
                `
                    : ""
                }
                
                ${
                  formData.marketing_effectiveness
                    ? `
                <div class="subsection">
                    <div class="subsection-title">فعالية التسويق</div>
                    <div class="subsection-content">${formData.marketing_effectiveness}</div>
                </div>
                `
                    : ""
                }
                
                ${
                  formData.media_mentions
                    ? `
                <div class="highlight-box info">
                    <strong>عدد الإشارات الإعلامية:</strong> ${formData.media_mentions}
                </div>
                `
                    : ""
                }
                
                ${
                  formData.media_outlets
                    ? `
                <div class="subsection">
                    <div class="subsection-title">وسائل الإعلام</div>
                    <div class="subsection-content">${formData.media_outlets}</div>
                </div>
                `
                    : ""
                }
                
                ${
                  formData.media_highlights
                    ? `
                <div class="subsection">
                    <div class="subsection-title">أبرز التغطيات الإعلامية</div>
                    <div class="subsection-content">${formData.media_highlights}</div>
                </div>
                `
                    : ""
                }
            </div>
        </div>
        `
            : ""
        }

        <div class="page-break"></div>

        <!-- Feedback & Satisfaction -->
        ${
          formData.overall_satisfaction_rating ||
          formData.positive_feedback_summary ||
          formData.negative_feedback_summary ||
          formData.attendee_suggestions
            ? `
        <div class="section">
            <div class="section-header">
                <div class="section-icon">⭐</div>
                <h2>التقييم والملاحظات</h2>
            </div>
            <div class="section-content">
                ${
                  formData.overall_satisfaction_rating
                    ? `
                <div class="stat-card blue" style="max-width: 300px; margin: 0 auto 30px;">
                    <div class="stat-label">التقييم العام للرضا</div>
                    <div class="stat-value">${formData.overall_satisfaction_rating} / 5.0</div>
                </div>
                `
                    : ""
                }
                
                ${
                  formData.positive_feedback_summary
                    ? `
                <div class="subsection">
                    <div class="subsection-title">👍 التعليقات الإيجابية</div>
                    <div class="highlight-box success">
                        <div class="subsection-content">${formData.positive_feedback_summary}</div>
                    </div>
                </div>
                `
                    : ""
                }
                
                ${
                  formData.negative_feedback_summary
                    ? `
                <div class="subsection">
                    <div class="subsection-title">👎 التعليقات السلبية</div>
                    <div class="highlight-box error">
                        <div class="subsection-content">${formData.negative_feedback_summary}</div>
                    </div>
                </div>
                `
                    : ""
                }
                
                ${
                  formData.attendee_suggestions
                    ? `
                <div class="subsection">
                    <div class="subsection-title">💭 اقتراحات الحضور</div>
                    <div class="highlight-box info">
                        <div class="subsection-content">${formData.attendee_suggestions}</div>
                    </div>
                </div>
                `
                    : ""
                }
            </div>
        </div>
        `
            : ""
        }

        <!-- Analysis -->
        ${
          formData.positive_points ||
          formData.negative_points ||
          formData.challenges_faced ||
          formData.solutions_implemented
            ? `
        <div class="section">
            <div class="section-header">
                <div class="section-icon">📊</div>
                <h2>التحليل الشامل</h2>
            </div>
            <div class="section-content">
                ${
                  formData.positive_points
                    ? `
                <div class="subsection">
                    <div class="subsection-title">✅ النقاط الإيجابية</div>
                    <div class="highlight-box success">
                        <div class="subsection-content">${formData.positive_points}</div>
                    </div>
                </div>
                `
                    : ""
                }
                
                ${
                  formData.negative_points
                    ? `
                <div class="subsection">
                    <div class="subsection-title">❌ النقاط السلبية</div>
                    <div class="highlight-box error">
                        <div class="subsection-content">${formData.negative_points}</div>
                    </div>
                </div>
                `
                    : ""
                }
                
                ${
                  formData.challenges_faced
                    ? `
                <div class="subsection">
                    <div class="subsection-title">⚠️ التحديات</div>
                    <div class="subsection-content">${formData.challenges_faced}</div>
                </div>
                `
                    : ""
                }
                
                ${
                  formData.solutions_implemented
                    ? `
                <div class="subsection">
                    <div class="subsection-title">💡 الحلول المطبقة</div>
                    <div class="highlight-box info">
                        <div class="subsection-content">${formData.solutions_implemented}</div>
                    </div>
                </div>
                `
                    : ""
                }
            </div>
        </div>
        `
            : ""
        }

        <!-- Lessons Learned -->
        ${
          formData.what_went_well ||
          formData.what_went_wrong ||
          formData.unexpected_outcomes ||
          formData.best_practices_identified
            ? `
        <div class="section">
            <div class="section-header">
                <div class="section-icon">💡</div>
                <h2>الدروس المستفادة</h2>
            </div>
            <div class="section-content">
                ${
                  formData.what_went_well
                    ? `
                <div class="subsection">
                    <div class="subsection-title">✨ ما الذي سار بشكل جيد</div>
                    <div class="highlight-box success">
                        <div class="subsection-content">${formData.what_went_well}</div>
                    </div>
                </div>
                `
                    : ""
                }
                
                ${
                  formData.what_went_wrong
                    ? `
                <div class="subsection">
                    <div class="subsection-title">⚡ ما الذي لم يسر بشكل جيد</div>
                    <div class="highlight-box error">
                        <div class="subsection-content">${formData.what_went_wrong}</div>
                    </div>
                </div>
                `
                    : ""
                }
                
                ${
                  formData.unexpected_outcomes
                    ? `
                <div class="subsection">
                    <div class="subsection-title">🎯 النتائج غير المتوقعة</div>
                    <div class="subsection-content">${formData.unexpected_outcomes}</div>
                </div>
                `
                    : ""
                }
                
                ${
                  formData.best_practices_identified
                    ? `
                <div class="subsection">
                    <div class="subsection-title">🏆 أفضل الممارسات المحددة</div>
                    <div class="highlight-box info">
                        <div class="subsection-content">${formData.best_practices_identified}</div>
                    </div>
                </div>
                `
                    : ""
                }
            </div>
        </div>
        `
            : ""
        }

        <!-- Technical & Security -->
        ${
          formData.technical_issues ||
          formData.technical_solutions ||
          formData.infrastructure_notes ||
          formData.security_measures ||
          formData.safety_incidents ||
          formData.health_protocols
            ? `
        <div class="section">
            <div class="section-header">
                <div class="section-icon">🔧</div>
                <h2>التقنية والأمن</h2>
            </div>
            <div class="section-content">
                ${
                  formData.technical_issues
                    ? `
                <div class="subsection">
                    <div class="subsection-title">⚙️ المشاكل التقنية</div>
                    <div class="subsection-content">${formData.technical_issues}</div>
                </div>
                `
                    : ""
                }
                
                ${
                  formData.technical_solutions
                    ? `
                <div class="subsection">
                    <div class="subsection-title">🔧 الحلول التقنية</div>
                    <div class="subsection-content">${formData.technical_solutions}</div>
                </div>
                `
                    : ""
                }
                
                ${
                  formData.infrastructure_notes
                    ? `
                <div class="subsection">
                    <div class="subsection-title">🏗️ البنية التحتية</div>
                    <div class="subsection-content">${formData.infrastructure_notes}</div>
                </div>
                `
                    : ""
                }
                
                ${
                  formData.security_measures
                    ? `
                <div class="subsection">
                    <div class="subsection-title">🛡️ الإجراءات الأمنية</div>
                    <div class="subsection-content">${formData.security_measures}</div>
                </div>
                `
                    : ""
                }
                
                ${
                  formData.safety_incidents
                    ? `
                <div class="subsection">
                    <div class="subsection-title">⚠️ حوادث السلامة</div>
                    <div class="highlight-box error">
                        <div class="subsection-content">${formData.safety_incidents}</div>
                    </div>
                </div>
                `
                    : ""
                }
                
                ${
                  formData.health_protocols
                    ? `
                <div class="subsection">
                    <div class="subsection-title">🏥 البروتوكولات الصحية</div>
                    <div class="subsection-content">${formData.health_protocols}</div>
                </div>
                `
                    : ""
                }
            </div>
        </div>
        `
            : ""
        }

        <div class="page-break"></div>

        <!-- Future Planning -->
        ${
          formData.future_tasks ||
          formData.recommendations ||
          formData.improvements_needed
            ? `
        <div class="section">
            <div class="section-header">
                <div class="section-icon">🎯</div>
                <h2>التخطيط المستقبلي</h2>
            </div>
            <div class="section-content">
                ${
                  formData.future_tasks
                    ? `
                <div class="subsection">
                    <div class="subsection-title">📋 المهام المستقبلية</div>
                    <div class="subsection-content">${formData.future_tasks}</div>
                </div>
                `
                    : ""
                }
                
                ${
                  formData.recommendations
                    ? `
                <div class="subsection">
                    <div class="subsection-title">💡 التوصيات</div>
                    <div class="highlight-box info">
                        <div class="subsection-content">${formData.recommendations}</div>
                    </div>
                </div>
                `
                    : ""
                }
                
                ${
                  formData.improvements_needed
                    ? `
                <div class="subsection">
                    <div class="subsection-title">🔄 التحسينات المطلوبة</div>
                    <div class="highlight-box">
                        <div class="subsection-content">${formData.improvements_needed}</div>
                    </div>
                </div>
                `
                    : ""
                }
            </div>
        </div>
        `
            : ""
        }

        <!-- Action Items -->
        ${
          formData.action_items && formData.action_items.length > 0
            ? `
        <div class="section">
            <div class="section-header">
                <div class="section-icon">✅</div>
                <h2>بنود العمل</h2>
            </div>
            <div class="section-content">
                ${formData.action_items
                  .map((item, index) => {
                    const priority = getPriorityBadge(item.priority);
                    return `
                <div class="action-item">
                    <div class="action-item-header">
                        <div class="action-item-title">${index + 1}. ${item.task || "-"}</div>
                        <div class="priority-badge" style="background-color: ${priority.color}">
                            ${priority.text}
                        </div>
                    </div>
                    <div class="action-item-details">
                        ${
                          item.assignee
                            ? `
                        <div><strong>المكلف:</strong> ${item.assignee}</div>
                        `
                            : ""
                        }
                        ${
                          item.deadline
                            ? `
                        <div><strong>الموعد النهائي:</strong> ${formatDate(item.deadline)}</div>
                        `
                            : ""
                        }
                    </div>
                </div>
                `;
                  })
                  .join("")}
            </div>
        </div>
        `
            : ""
        }

        <!-- Conclusion -->
        ${
          formData.general_notes ||
          formData.conclusion ||
          formData.acknowledgments
            ? `
        <div class="section">
            <div class="section-header">
                <div class="section-icon">📝</div>
                <h2>الخاتمة</h2>
            </div>
            <div class="section-content">
                ${
                  formData.general_notes
                    ? `
                <div class="subsection">
                    <div class="subsection-title">ملاحظات عامة</div>
                    <div class="subsection-content">${formData.general_notes}</div>
                </div>
                `
                    : ""
                }
                
                ${
                  formData.conclusion
                    ? `
                <div class="subsection">
                    <div class="subsection-title">الخلاصة</div>
                    <div class="highlight-box info">
                        <div class="subsection-content">${formData.conclusion}</div>
                    </div>
                </div>
                `
                    : ""
                }
                
                ${
                  formData.acknowledgments
                    ? `
                <div class="subsection">
                    <div class="subsection-title">🙏 شكر وتقدير</div>
                    <div class="highlight-box success">
                        <div class="subsection-content">${formData.acknowledgments}</div>
                    </div>
                </div>
                `
                    : ""
                }
            </div>
        </div>
        `
            : ""
        }

        <!-- Footer -->
        <div style="margin-top: 60px; padding-top: 30px; border-top: 2px solid #e5e7eb; text-align: center; color: #6b7280; font-size: 14px;">
            <p>تم إنشاء هذا التقرير بتاريخ ${formatDateTime(new Date())}</p>
            ${
              reportMetadata && reportMetadata.created_by
                ? `<p>بواسطة: ${reportMetadata.created_by.name}</p>`
                : ""
            }
        </div>
    </div>
</body>
</html>
  `;
};