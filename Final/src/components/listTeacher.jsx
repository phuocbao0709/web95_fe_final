import { Fragment } from "react";

const ListTeacher = ({
  teachers,
  filteredTeachers,
  searchTerm,
  setSearchTerm,
  handleReload,
  showCreateForm,
  setShowCreateForm,
  expandedTeacherId,
  setExpandedTeacherId,
  pagination,
  pageItems,
  setPage,
  limit,
  setLimit,
  limitOptions,
  getInitials,
  getHighestEducation,
  getTeacherDepartment,
  getTeacherWorkplace,
  educationLevelOptions,
  getTeacherDetailFields,
}) => {
  return (
    <section className="list-panel clean-panel">
      <div className="list-toolbar compact">
        <div className="search-box compact">
          <span className="search-icon">⌕</span>
          <input
            value={searchTerm}
            onChange={(event) => setSearchTerm(event.target.value)}
            placeholder="Tìm kiếm thông tin"
          />
        </div>

        <div className="toolbar-actions">
          <button type="button" className="toolbar-button secondary" onClick={handleReload}>
            Tải lại
          </button>
          <button
            type="button"
            className="toolbar-button"
            onClick={() => setShowCreateForm((prev) => !prev)}
          >
            {showCreateForm ? "Đóng" : "Tạo mới"}
          </button>
        </div>
      </div>

      <div className="teacher-table-wrap">
        <table className="teacher-table clean-table">
          <thead>
            <tr>
              <th>Mã</th>
              <th>Giáo viên</th>
              <th>Trình độ</th>
              <th>Bộ môn</th>
              <th>TT công tác</th>
              <th>Địa chỉ</th>
              <th>Trạng thái</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {filteredTeachers.length === 0 ? (
              <tr>
                <td colSpan="8" className="empty-cell">
                  {teachers.length === 0 ? "Chưa có giáo viên" : "Không tìm thấy giáo viên phù hợp"}
                </td>
              </tr>
            ) : (
              filteredTeachers.map((teacher) => {
                const education = getHighestEducation(teacher);

                return (
                  <Fragment key={teacher.id}>
                    <tr>
                      <td className="code-cell">{teacher.code}</td>
                      <td>
                        <div className="teacher-cell">
                          <div className="teacher-avatar">{getInitials(teacher.name)}</div>
                          <div className="teacher-meta">
                            <strong>{teacher.name}</strong>
                            <span>{teacher.email}</span>
                            <span>{teacher.phoneNumber || "Chưa cập nhật số điện thoại"}</span>
                          </div>
                        </div>
                      </td>
                      <td>
                        <div className="stacked-text">
                          <strong>{education.title}</strong>
                          <span>{education.subtitle}</span>
                        </div>
                      </td>
                      <td>{getTeacherDepartment(teacher)}</td>
                      <td>{getTeacherWorkplace(teacher)}</td>
                      <td>{teacher.address || "Chưa cập nhật"}</td>
                      <td>
                        <span
                          className={`status-chip ${teacher.isActive ? "active" : "inactive"}`}
                        >
                          {teacher.statusLabel ||
                            (teacher.isActive ? "Đang công tác" : "Ngừng công tác")}
                        </span>
                      </td>
                      <td className="action-cell">
                        <button
                          type="button"
                          className="toolbar-button secondary"
                          onClick={() =>
                            setExpandedTeacherId((current) =>
                              current === teacher.id ? null : teacher.id,
                            )
                          }
                        >
                          {expandedTeacherId === teacher.id ? "Đóng" : "Chi tiết"}
                        </button>
                      </td>
                    </tr>
                    {expandedTeacherId === teacher.id ? (
                      <tr className="detail-row">
                        <td colSpan="8">
                          <div className="teacher-detail-panel">
                            <div className="teacher-detail-head">
                              <div>
                                <strong>{teacher.name || "Chưa cập nhật"}</strong>
                                <span>
                                  {teacher.code || "Chưa cập nhật"} -{" "}
                                  {teacher.email || "Chưa cập nhật"}
                                </span>
                              </div>
                              <span
                                className={`status-chip ${teacher.isActive ? "active" : "inactive"}`}
                              >
                                {teacher.statusLabel ||
                                  (teacher.isActive ? "Đang công tác" : "Ngừng công tác")}
                              </span>
                            </div>

                            <div className="teacher-detail-grid">
                              {getTeacherDetailFields(teacher).map((field) => (
                                <div key={field.label} className="teacher-detail-item">
                                  <span>{field.label}</span>
                                  <strong>{field.value}</strong>
                                </div>
                              ))}
                            </div>

                            <div className="teacher-detail-education">
                              <span>Hồ sơ học vấn</span>
                              {teacher.education?.length ? (
                                <div className="teacher-detail-education-list">
                                  {teacher.education.map((item, index) => (
                                    <div
                                      key={`${teacher.id}-edu-${index}`}
                                      className="teacher-detail-education-item"
                                    >
                                      <strong>
                                        {educationLevelOptions.find(
                                          (option) => option.value === item.level,
                                        )?.label || item.level || "Chưa cập nhật"}
                                      </strong>
                                      <span>
                                        {item.school || "Chưa cập nhật"}{" "}
                                        {item.major ? `- ${item.major}` : ""}
                                        {item.year ? `, ${item.year}` : ""}
                                        {item.isGraduated ? " - Đã tốt nghiệp" : ""}
                                      </span>
                                    </div>
                                  ))}
                                </div>
                              ) : (
                                <div className="teacher-detail-empty">Chưa có học vấn</div>
                              )}
                            </div>
                          </div>
                        </td>
                      </tr>
                    ) : null}
                  </Fragment>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      <div className="pagination-bar compact">
        <div className="pagination-summary">Tổng: {pagination.total}</div>

        <div className="pagination-controls">
          <button
            type="button"
            className="page-nav"
            disabled={pagination.page <= 1}
            onClick={() => setPage((prev) => Math.max(1, prev - 1))}
          >
            &lt;
          </button>

          {pageItems.map((item) => (
            <button
              key={item}
              type="button"
              className={`page-number ${item === pagination.page ? "current" : ""}`}
              onClick={() => setPage(item)}
            >
              {item}
            </button>
          ))}

          <button
            type="button"
            className="page-nav"
            disabled={pagination.page >= (pagination.totalPages || 1)}
            onClick={() => setPage((prev) => Math.min(pagination.totalPages || 1, prev + 1))}
          >
            &gt;
          </button>

          <label className="limit-control">
            <select
              value={limit}
              onChange={(event) => {
                const nextLimit = Number(event.target.value);
                setLimit(nextLimit);
                setPage(1);
              }}
            >
              {limitOptions.map((option) => (
                <option key={option} value={option}>
                  {option} / trang
                </option>
              ))}
            </select>
          </label>
        </div>
      </div>
    </section>
  );
};

export default ListTeacher;
