import { useEffect, useState } from "react";
import "./App.css";
import ListTeacher from "./components/listTeacher";

const defaultMessage = { type: "", text: "" };
const defaultPagination = { page: 1, limit: 10, total: 0, totalPages: 0 };
const limitOptions = [10, 20, 50];
const educationLevelRank = {
  "Tien si": 4,
  "Thac si": 3,
  "Cu nhan": 2,
  "Cao dang": 1,
  "Trung cap": 0,
  "Trung hoc": 0,
};
const educationLevelOptions = [
  { label: "Tiáº¿n sÄ©", value: "Tien si" },
  { label: "Tháº¡c sÄ©", value: "Thac si" },
  { label: "Cao Ä‘áº³ng", value: "Cao dang" },
  { label: "Trung há»c", value: "Trung hoc" },
];
const emptyEducationRow = {
  level: "",
  school: "",
  major: "",
  year: "",
  isGraduated: false,
};
const initialTeacherForm = {
  name: "",
  dob: "",
  phoneNumber: "",
  email: "",
  identity: "",
  address: "",
  isActive: true,
  teacherPositionsId: [],
  education: [],
};
const initialPositionForm = {
  code: "",
  name: "",
  des: "",
  isActive: true,
};

const getSelectedPositionsLabel = (selectedIds, positions) => {
  if (!selectedIds.length) {
    return "Chon vi tri cong tac";
  }

  const selectedPositions = positions.filter((position) =>
    selectedIds.includes(String(position.id)),
  );

  if (!selectedPositions.length) {
    return "Chon vi tri cong tac";
  }

  if (selectedPositions.length <= 2) {
    return selectedPositions.map((position) => position.name).join(", ");
  }

  return `${selectedPositions.length} vi tri duoc chon`;
};

const request = async (url, options = {}) => {
  const response = await fetch(url, {
    headers: {
      "Content-Type": "application/json",
      ...(options.headers || {}),
    },
    ...options,
  });

  const result = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(result.message || "Request failed");
  }

  return result;
};

const normalizeText = (value) =>
  value
    ?.normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim() ?? "";

const getInitials = (name = "") =>
  name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");

const getHighestEducation = (teacher) => {
  if (teacher.highestEducation) {
    return {
      title:
        educationLevelOptions.find(
          (item) => item.value === teacher.highestEducation.level,
        )?.label || teacher.highestEducation.level || "N/A",
      subtitle: teacher.highestEducation.school || "Chua cap nhat",
    };
  }

  if (!teacher.education?.length) {
    return { title: "N/A", subtitle: "Chua cap nhat" };
  }

  const sorted = [...teacher.education].sort((left, right) => {
    const levelDiff =
      (educationLevelRank[right.level] ?? -1) -
      (educationLevelRank[left.level] ?? -1);

    if (levelDiff !== 0) {
      return levelDiff;
    }

    return Number(right.year || 0) - Number(left.year || 0);
  });

  return {
    title:
      educationLevelOptions.find((item) => item.value === sorted[0].level)?.label ||
      sorted[0].level ||
      "N/A",
    subtitle: sorted[0].school || "Chua cap nhat",
  };
};

const getTeacherDepartment = (teacher) => {
  if (teacher.teacherPositionNames?.length) {
    return teacher.teacherPositionNames.join(", ");
  }

  if (!teacher.positions?.length) {
    return "N/A";
  }

  return teacher.positions.map((position) => position.name).join(", ");
};

const getTeacherWorkplace = (teacher) => {
  if (teacher.teacherPositionCodes?.length) {
    return teacher.teacherPositionCodes.join(", ");
  }

  if (!teacher.positions?.length) {
    return "Giao vien";
  }

  return teacher.positions.map((position) => position.code).join(", ");
};

const formatDate = (value) => {
  if (!value) {
    return "Chua cap nhat";
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return date.toLocaleDateString("vi-VN");
};

const getTeacherDetailFields = (teacher) => {
  const education = getHighestEducation(teacher);

  return [
    { label: "Ma giao vien", value: teacher.code || "Chua cap nhat" },
    { label: "Ho va ten", value: teacher.name || "Chua cap nhat" },
    { label: "Email", value: teacher.email || "Chua cap nhat" },
    { label: "So dien thoai", value: teacher.phoneNumber || "Chua cap nhat" },
    { label: "CCCD", value: teacher.identity || "Chua cap nhat" },
    { label: "Ngay sinh", value: formatDate(teacher.dob) },
    { label: "Dia chi", value: teacher.address || "Chua cap nhat" },
    { label: "Trang thai", value: teacher.statusLabel || (teacher.isActive ? "Dang cong tac" : "Ngung cong tac") },
    { label: "Vi tri cong tac", value: getTeacherDepartment(teacher) },
    { label: "Ma vi tri", value: getTeacherWorkplace(teacher) },
    { label: "Hoc vi", value: education.title },
    { label: "Truong", value: education.subtitle },
    {
      label: "Cong tac",
      value: `${formatDate(teacher.startDate)}${teacher.endDate ? ` - ${formatDate(teacher.endDate)}` : ""}`,
    },
  ];
};

const buildPageItems = (currentPage, totalPages) => {
  if (totalPages <= 1) {
    return [1];
  }

  const pages = new Set([1, totalPages, currentPage, currentPage - 1, currentPage + 1]);

  return [...pages].filter((page) => page >= 1 && page <= totalPages).sort((a, b) => a - b);
};

function App() {
  const [activeSection, setActiveSection] = useState("teachers");
  const [teachers, setTeachers] = useState([]);
  const [positions, setPositions] = useState([]);
  const [page, setPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState("");
  const [limit, setLimit] = useState(10);
  const [pagination, setPagination] = useState(defaultPagination);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState(defaultMessage);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [showPositionForm, setShowPositionForm] = useState(false);
  const [teacherForm, setTeacherForm] = useState(initialTeacherForm);
  const [positionForm, setPositionForm] = useState(initialPositionForm);
  const [expandedTeacherId, setExpandedTeacherId] = useState(null);

  const loadTeachers = async (currentPage = page, currentLimit = limit) => {
    const teachersResult = await request(`/teachers?page=${currentPage}&limit=${currentLimit}`);
    setTeachers(teachersResult.data || []);
    setPagination(teachersResult.pagination || defaultPagination);
  };

  const loadPositions = async () => {
    const positionsResult = await request("/teacher-positions");
    setPositions(positionsResult.data || []);
  };

  useEffect(() => {
    let active = true;

    const loadData = async () => {
      setLoading(true);

      try {
        const [teachersResult, positionsResult] = await Promise.all([
          request(`/teachers?page=${page}&limit=${limit}`),
          request("/teacher-positions"),
        ]);

        if (!active) {
          return;
        }

        setTeachers(teachersResult.data || []);
        setPagination(teachersResult.pagination || defaultPagination);
        setPositions(positionsResult.data || []);
      } catch (error) {
        if (active) {
          setMessage({ type: "error", text: error.message });
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    };

    loadData();

    return () => {
      active = false;
    };
  }, [page, limit]);

  const handleReload = async () => {
    setMessage(defaultMessage);
    setLoading(true);

    try {
      await Promise.all([loadTeachers(page, limit), loadPositions()]);
    } catch (error) {
      setMessage({ type: "error", text: error.message });
    } finally {
      setLoading(false);
    }
  };

  const handleTeacherChange = (event) => {
    const { name, value, type, checked, options } = event.target;

    if (name === "teacherPositionsId") {
      const selectedValues = Array.from(options)
        .filter((option) => option.selected)
        .map((option) => option.value);

      setTeacherForm((prev) => ({
        ...prev,
        teacherPositionsId: selectedValues,
      }));
      return;
    }

    setTeacherForm((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handlePositionChange = (event) => {
    const { name, value, type, checked } = event.target;
    setPositionForm((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleEducationChange = (index, field, value) => {
    setTeacherForm((prev) => ({
      ...prev,
      education: prev.education.map((item, currentIndex) =>
        currentIndex === index ? { ...item, [field]: value } : item,
      ),
    }));
  };

  const handleTeacherPositionToggle = (positionId) => {
    const normalizedId = String(positionId);

    setTeacherForm((prev) => ({
      ...prev,
      teacherPositionsId: prev.teacherPositionsId.includes(normalizedId)
        ? prev.teacherPositionsId.filter((id) => id !== normalizedId)
        : [...prev.teacherPositionsId, normalizedId],
    }));
  };

  const handleAddEducation = () => {
    setTeacherForm((prev) => ({
      ...prev,
      education: [...prev.education, { ...emptyEducationRow }],
    }));
  };

  const handleRemoveEducation = (index) => {
    setTeacherForm((prev) => ({
      ...prev,
      education: prev.education.filter((_, currentIndex) => currentIndex !== index),
    }));
  };

  const resetTeacherForm = () => {
    setTeacherForm(initialTeacherForm);
  };

  const resetPositionForm = () => {
    setPositionForm(initialPositionForm);
  };

const handleSubmitTeacher = async (event) => {
    event.preventDefault();
    setSubmitting(true);
    setMessage(defaultMessage);

    try {
      await request("/teachers", {
        method: "POST",
        body: JSON.stringify({
          name: teacherForm.name,
          dob: teacherForm.dob || null,
          phoneNumber: teacherForm.phoneNumber,
          email: teacherForm.email,
          identity: teacherForm.identity,
          address: teacherForm.address,
          isActive: teacherForm.isActive,
          teacherPositionsId: teacherForm.teacherPositionsId,
          education: teacherForm.education.map((item) => ({
            ...item,
            level: item.level || "",
          })),
        }),
      });

      resetTeacherForm();
      setShowCreateForm(false);
      setPage(1);
      await loadTeachers(1, limit);
      setMessage({ type: "success", text: "Tao thong tin giao vien thanh cong" });
    } catch (error) {
      setMessage({ type: "error", text: error.message });
    } finally {
      setSubmitting(false);
    }
  };

  const handleSubmitPosition = async (event) => {
    event.preventDefault();
    setSubmitting(true);
    setMessage(defaultMessage);

    try {
      await request("/teacher-positions", {
        method: "POST",
        body: JSON.stringify({
          code: positionForm.code,
          name: positionForm.name,
          des: positionForm.des,
          isActive: positionForm.isActive,
        }),
      });

      resetPositionForm();
      setShowPositionForm(false);
      await loadPositions();
      setMessage({ type: "success", text: "Tao vi tri cong tac thanh cong" });
    } catch (error) {
      setMessage({ type: "error", text: error.message });
    } finally {
      setSubmitting(false);
    }
  };

  const normalizedSearch = normalizeText(searchTerm);
  const filteredTeachers = teachers.filter((teacher) => {
    if (!normalizedSearch) {
      return true;
    }

    const education = getHighestEducation(teacher);
    const searchableContent = [
      teacher.code,
      teacher.name,
      teacher.email,
      teacher.phoneNumber,
      teacher.address,
      teacher.identity,
      getTeacherDepartment(teacher),
      getTeacherWorkplace(teacher),
      education.title,
      education.subtitle,
    ]
      .join(" ")
      .trim();

    return normalizeText(searchableContent).includes(normalizedSearch);
  });

  const pageItems = buildPageItems(pagination.page, pagination.totalPages || 1);

  return (
    <main className="app-shell layout-shell">
      <aside className="sidebar">
        <div className="sidebar-brand">
          <span className="sidebar-kicker">Quan tri</span>
          <strong>Nhan su giao vien</strong>
        </div>

        <nav className="sidebar-nav">
          <button
            type="button"
            className={`sidebar-link ${activeSection === "teachers" ? "active" : ""}`}
            onClick={() => setActiveSection("teachers")}
          >
            Danh sach giao vien
          </button>
          <button
            type="button"
            className={`sidebar-link ${activeSection === "positions" ? "active" : ""}`}
            onClick={() => setActiveSection("positions")}
          >
            Vi tri viec lam
          </button>
        </nav>
      </aside>

      <div className="content-shell">
        <section className="page-header">
          <div>
            <p className="page-kicker">Danh muc nhan su</p>
            <h1>
              {activeSection === "teachers" ? "Danh sach giao vien" : "Vi tri viec lam"}
            </h1>
            <p className="page-description">
              {activeSection === "teachers"
                ? "Xem danh sach giao vien va tao moi ho so voi thong tin ca nhan, vi tri cong tac va hoc vi."
                : "Quan ly danh muc vi tri cong tac de gan cho giao vien trong he thong."}
            </p>
          </div>
          {message.text ? (
            <div className={`message ${message.type}`}>{message.text}</div>
          ) : null}
        </section>

        {activeSection === "teachers" ? (
          <>
            <ListTeacher
              teachers={teachers}
              filteredTeachers={filteredTeachers}
              searchTerm={searchTerm}
              setSearchTerm={setSearchTerm}
              handleReload={handleReload}
              showCreateForm={showCreateForm}
              setShowCreateForm={setShowCreateForm}
              expandedTeacherId={expandedTeacherId}
              setExpandedTeacherId={setExpandedTeacherId}
              pagination={pagination}
              pageItems={pageItems}
              setPage={setPage}
              limit={limit}
              setLimit={setLimit}
              limitOptions={limitOptions}
              getInitials={getInitials}
              getHighestEducation={getHighestEducation}
              getTeacherDepartment={getTeacherDepartment}
              getTeacherWorkplace={getTeacherWorkplace}
              educationLevelOptions={educationLevelOptions}
              getTeacherDetailFields={getTeacherDetailFields}
            />
            {showCreateForm ? (
              <section className="create-panel">
                <div className="create-panel-header">
                  <h2>Tao thong tin giao vien</h2>
                  <button
                    type="button"
                    className="close-button"
                    onClick={() => {
                      resetTeacherForm();
                      setShowCreateForm(false);
                    }}
                  >
                    Dong
                  </button>
                </div>

                <form className="teacher-create-form" onSubmit={handleSubmitTeacher}>
                  <div className="teacher-create-top">
                    <div className="avatar-upload-card">
                      <div className="avatar-illustration">
                        {getInitials(teacherForm.name || "GV")}
                      </div>
                      <div className="avatar-upload-box">
                        <span>Tai anh</span>
                        <small>Khung giao dien mau</small>
                      </div>
                    </div>

                    <div className="section-block">
                      <div className="section-title">Thong tin ca nhan</div>
                      <div className="form-grid">
                        <label>
                          Ho va ten
                          <input
                            name="name"
                            value={teacherForm.name}
                            onChange={handleTeacherChange}
                            placeholder="VD: Nguyen Van A"
                            required
                          />
                        </label>
                        <label>
                          Ngay sinh
                          <input
                            type="date"
                            name="dob"
                            value={teacherForm.dob}
                            onChange={handleTeacherChange}
                          />
                        </label>
                        <label>
                          So dien thoai
                          <input
                            name="phoneNumber"
                            value={teacherForm.phoneNumber}
                            onChange={handleTeacherChange}
                            placeholder="Nhap so dien thoai"
                          />
                        </label>
                        <label>
                          Email
                          <input
                            type="email"
                            name="email"
                            value={teacherForm.email}
                            onChange={handleTeacherChange}
                            placeholder="example@school.edu.vn"
                            required
                          />
                        </label>
                        <label>
                          So CCCD
                          <input
                            name="identity"
                            value={teacherForm.identity}
                            onChange={handleTeacherChange}
                            placeholder="Nhap so CCCD"
                          />
                        </label>
                        <label>
                          Dia chi
                          <input
                            name="address"
                            value={teacherForm.address}
                            onChange={handleTeacherChange}
                            placeholder="Dia chi thuong tru"
                          />
                        </label>
                      </div>
                    </div>
                  </div>

                  <div className="section-block">
                    <div className="section-title">Thong tin cong tac</div>
                    <div className="form-grid single-column">
                      <label className="position-selector-field">
                        Vi tri cong tac
                        <div className="position-selector">
                          <div className="position-selector-summary">
                            {getSelectedPositionsLabel(teacherForm.teacherPositionsId, positions)}
                          </div>
                          <div className="position-selector-options" role="group" aria-label="Vi tri cong tac">
                            {positions.length === 0 ? (
                              <div className="position-selector-empty">Chua co vi tri cong tac</div>
                            ) : (
                              positions.map((position) => {
                                const isChecked = teacherForm.teacherPositionsId.includes(
                                  String(position.id),
                                );

                                return (
                                  <label
                                    key={position.id}
                                    className={`position-option ${isChecked ? "selected" : ""}`}
                                  >
                                    <input
                                      type="checkbox"
                                      checked={isChecked}
                                      onChange={() => handleTeacherPositionToggle(position.id)}
                                    />
                                    <span className="position-option-copy">
                                      <strong>{position.name}</strong>
                                      <small>{position.code}</small>
                                    </span>
                                  </label>
                                );
                              })
                            )}
                          </div>
                        </div>
                      </label>
                      <label className="checkbox-field">
                        <input
                          type="checkbox"
                          name="isActive"
                          checked={teacherForm.isActive}
                          onChange={handleTeacherChange}
                        />
                        Dang cong tac
                      </label>
                    </div>
                  </div>

                  <div className="section-block">
                    <div className="section-title row-title">
                      <span>Hoc vi</span>
                      <button
                        type="button"
                        className="inline-button"
                        onClick={handleAddEducation}
                      >
                        Them
                      </button>
                    </div>

                    <div className="education-table-wrap">
                      <table className="education-table">
                        <thead>
                          <tr>
                            <th>Bac</th>
                            <th>Truong</th>
                            <th>Chuyen nganh</th>
                            <th>Nam</th>
                            <th>Tot nghiep</th>
                            <th></th>
                          </tr>
                        </thead>
                        <tbody>
                          {teacherForm.education.length === 0 ? (
                            <tr>
                              <td colSpan="6" className="empty-cell">
                                Trong
                              </td>
                            </tr>
                          ) : (
                            teacherForm.education.map((item, index) => (
                              <tr key={index}>
                                <td>
                                <select
                                  value={item.level}
                                  onChange={(event) =>
                                    handleEducationChange(index, "level", event.target.value)
                                  }
                                >
                                  <option value="">Chon hoc vi</option>
                                  {educationLevelOptions.map((option) => (
                                    <option key={option.value} value={option.value}>
                                      {option.label}
                                    </option>
                                  ))}
                                </select>
                                </td>
                                <td>
                                  <input
                                    value={item.school}
                                    onChange={(event) =>
                                      handleEducationChange(index, "school", event.target.value)
                                    }
                                    placeholder="Ten truong"
                                  />
                                </td>
                                <td>
                                  <input
                                    value={item.major}
                                    onChange={(event) =>
                                      handleEducationChange(index, "major", event.target.value)
                                    }
                                    placeholder="Chuyen nganh"
                                  />
                                </td>
                                <td>
                                  <input
                                    value={item.year}
                                    onChange={(event) =>
                                      handleEducationChange(index, "year", event.target.value)
                                    }
                                    placeholder="2024"
                                  />
                                </td>
                                <td>
                                  <label className="checkbox-field compact">
                                    <input
                                      type="checkbox"
                                      checked={item.isGraduated}
                                      onChange={(event) =>
                                        handleEducationChange(
                                          index,
                                          "isGraduated",
                                          event.target.checked,
                                        )
                                      }
                                    />
                                    Co
                                  </label>
                                </td>
                                <td>
                                  <button
                                    type="button"
                                    className="inline-button danger-inline"
                                    onClick={() => handleRemoveEducation(index)}
                                  >
                                    Xoa
                                  </button>
                                </td>
                              </tr>
                            ))
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  <div className="form-actions">
                    <button type="submit" disabled={submitting}>
                      {submitting ? "Dang luu..." : "Luu"}
                    </button>
                  </div>
                </form>
              </section>
            ) : null}
          </>
        ) : null}

        {activeSection === "positions" ? (
          <section className="positions-section">
            <div className="positions-card">
              <div className="positions-toolbar">
                <div className="positions-toolbar-copy"><div className="positions-toolbar-title">Danh sach vi tri cong tac</div><div className="positions-toolbar-subtitle">Quan ly cac vi tri lam viec va trang thai su dung.</div></div>
                <div className="toolbar-actions">
                  <button
                    type="button"
                    className="toolbar-button secondary"
                    onClick={() => setShowPositionForm((prev) => !prev)}
                  >
                    {showPositionForm ? "Dong" : "+ Tao"}
                  </button>
                  <button
                    type="button"
                    className="toolbar-button secondary"
                    onClick={loadPositions}
                  >
                    Lam moi
                  </button>
                </div>
              </div>

              <div className="positions-table-wrap">
                <table className="positions-table">
                  <thead>
                    <tr>
                      <th>STT</th>
                      <th>Ma</th>
                      <th>Ten</th>
                      <th>Trang thai</th>
                      <th>Mo ta</th>
                      <th></th>
                    </tr>
                  </thead>
                  <tbody>
                    {positions.length === 0 ? (
                      <tr>
                        <td colSpan="6" className="empty-cell">
                          Chua co vi tri cong tac
                        </td>
                      </tr>
                    ) : (
                      positions.map((position, index) => (
                        <tr key={position.id}>
                          <td>{index + 1}</td>
                          <td>{position.code}</td>
                          <td>{position.name}</td>
                          <td>
                            <span
                              className={`status-chip ${position.isActive ? "active" : "inactive"}`}
                            >
                              {position.isActive ? "Hoat dong" : "Tam dung"}
                            </span>
                          </td>
                          <td>{position.des || "Chua cap nhat mo ta"}</td>
                          <td className="gear-cell">?</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {showPositionForm ? (
              <section className="position-form-panel">
                <div className="position-form-header">
                  <div className="position-form-heading">
                    <span className="position-form-close-mark">×</span>
                    <h2>Vi tri cong tac</h2>
                  </div>
                  <button
                    type="button"
                    className="close-button"
                    onClick={() => {
                      resetPositionForm();
                      setShowPositionForm(false);
                    }}
                  >
                    Dong
                  </button>
                </div>

                <form className="position-form-grid" onSubmit={handleSubmitPosition}>
                  <label>
                    Ma
                    <input
                      name="code"
                      value={positionForm.code}
                      onChange={handlePositionChange}
                      placeholder="GVBM"
                      required
                    />
                  </label>
                  <label>
                    Ten vi tri
                    <input
                      name="name"
                      value={positionForm.name}
                      onChange={handlePositionChange}
                      placeholder="Giao vien bo mon"
                      required
                    />
                  </label>
                  <label className="full-row">
                    Mo ta
                    <input
                      name="des"
                      value={positionForm.des}
                      onChange={handlePositionChange}
                      placeholder="Mo ta cong viec"
                    />
                  </label>
                  <div className="position-status-field full-row">
                    <span>Trang thai</span>
                    <div className="status-toggle">
                      <button
                        type="button"
                        className={`status-option ${positionForm.isActive ? "active" : ""}`}
                        onClick={() =>
                          setPositionForm((prev) => ({
                            ...prev,
                            isActive: true,
                          }))
                        }
                      >
                        Hoat dong
                      </button>
                      <button
                        type="button"
                        className={`status-option ${!positionForm.isActive ? "active" : ""}`}
                        onClick={() =>
                          setPositionForm((prev) => ({
                            ...prev,
                            isActive: false,
                          }))
                        }
                      >
                        Ngung
                      </button>
                    </div>
                  </div>
                  <div className="form-actions full-row">
                    <button type="submit" disabled={submitting}>
                      {submitting ? "Dang luu..." : "Luu vi tri"}
                    </button>
                  </div>
                </form>
              </section>
            ) : null}
          </section>
        ) : null}
      </div>

      {loading ? <div className="loading">Dang tai du lieu...</div> : null}
    </main>
  );
}

export default App;




