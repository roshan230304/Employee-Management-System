import React, { useCallback, useEffect, useState } from 'react';
import { getAttendance, getEmployees, getTodayAttendance } from '../services/api';

const Attendance = () => {
  const [records, setRecords] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [todayData, setTodayData] = useState(null);
  const [filterEmployee, setFilterEmployee] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [filterDate, setFilterDate] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadData = useCallback(async () => {
    setLoading(true);
    setError('');
    const filters = {};
    if (filterEmployee) filters.employee_id = filterEmployee;
    if (filterStatus) filters.status = filterStatus;
    if (filterDate) filters.date = filterDate;
    try {
      const [attendance, employeeList, today] = await Promise.all([
        getAttendance(filters),
        getEmployees(),
        getTodayAttendance()
      ]);
      setRecords(attendance.data);
      setEmployees(employeeList.data);
      setTodayData(today.data);
    } catch (requestError) {
      setError(requestError.response?.data?.message || 'Unable to load attendance records.');
    } finally {
      setLoading(false);
    }
  }, [filterEmployee, filterStatus, filterDate]);

  useEffect(() => { loadData(); }, [loadData]);

  return (
    <section className="attendance-page fade-in">
      <header className="page-header-row">
        <div><h1 className="page-main-heading">Attendance Management</h1><p className="page-sub-heading">Review attendance records and employees not yet marked present today.</p></div>
        <button type="button" className="btn btn-secondary" disabled={loading} onClick={loadData}>Refresh</button>
      </header>
      {error && <div className="alert-banner-box alert-danger" role="alert">{error}</div>}
      {todayData && (
        <>
          <div className="attendance-summary-row">
            <article className="att-summary-card"><div className="att-summary-count">{todayData.present}</div><div className="att-summary-label">Present today</div></article>
            <article className="att-summary-card"><div className="att-summary-count">{todayData.notMarkedPresent}</div><div className="att-summary-label">Not marked present</div></article>
          </div>
          <div className="dashboard-section-card">
            <div className="section-card-header"><div><h2 className="section-title">Today’s employee attendance</h2><p className="section-subtitle">{todayData.date} (UTC)</p></div></div>
            <div className="table-responsive"><table className="data-table"><thead><tr><th>Employee</th><th>Employee ID</th><th>Status</th><th>Entry time (UTC)</th></tr></thead><tbody>
              {todayData.employees.map((entry) => <tr key={entry.employee_id}><td>{entry.employee_name}</td><td>#{entry.employee_id}</td><td>{entry.status || 'Not marked'}</td><td>{entry.check_in || '—'}</td></tr>)}
            </tbody></table></div>
          </div>
        </>
      )}
      <div className="filters-bar">
        <select className="form-select filter-select" value={filterEmployee} onChange={(event) => setFilterEmployee(event.target.value)}>
          <option value="">All employees</option>{employees.map((employee) => <option key={employee.id} value={employee.id}>{employee.name}</option>)}
        </select>
        <select className="form-select filter-select" value={filterStatus} onChange={(event) => setFilterStatus(event.target.value)}>
          <option value="">All statuses</option><option>Present</option><option>Absent</option><option>Late</option><option>Leave</option>
        </select>
        <input aria-label="Filter attendance date" type="date" className="form-input filter-date-input" value={filterDate} onChange={(event) => setFilterDate(event.target.value)} />
        {(filterEmployee || filterStatus || filterDate) && <button className="btn btn-secondary" onClick={() => { setFilterEmployee(''); setFilterStatus(''); setFilterDate(''); }}>Clear filters</button>}
      </div>
      <div className="dashboard-section-card">
        <div className="section-card-header"><div><h2 className="section-title">Attendance history</h2><p className="section-subtitle">Employee entry records from MySQL.</p></div></div>
        {loading ? <div className="loading-placeholder">Loading attendance…</div> : records.length === 0 ? <div className="empty-sub-card"><p>No attendance records match these filters.</p></div> : (
          <div className="table-responsive"><table className="data-table"><thead><tr><th>Employee</th><th>Employee ID</th><th>Department</th><th>Date (UTC)</th><th>Status</th><th>Entry time (UTC)</th></tr></thead><tbody>
            {records.map((record) => <tr key={record.id}><td>{record.employee_name}</td><td>#{record.employee_id}</td><td>{record.department || '—'}</td><td>{String(record.attendance_date).slice(0, 10)}</td><td>{record.status}</td><td>{record.check_in || '—'}</td></tr>)}
          </tbody></table></div>
        )}
      </div>
    </section>
  );
};

export default Attendance;
