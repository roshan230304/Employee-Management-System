import React, { useCallback, useEffect, useState } from 'react';
import { getMyAttendance, markMyAttendance } from '../services/api';

const MyAttendance = () => {
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [marking, setMarking] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  const loadAttendance = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const response = await getMyAttendance();
      setRecords(response.data);
    } catch (requestError) {
      setError(requestError.response?.data?.message || 'Unable to load your attendance history.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadAttendance(); }, [loadAttendance]);
  const today = new Date().toISOString().slice(0, 10);
  const todayRecord = records.find((record) => String(record.attendance_date).slice(0, 10) === today);

  const markAttendance = async () => {
    setMarking(true);
    setError('');
    setMessage('');
    try {
      const response = await markMyAttendance();
      setMessage(`${response.message} Recorded ${String(response.data.attendance_date).slice(0, 10)} at ${response.data.check_in} UTC.`);
      await loadAttendance();
    } catch (requestError) {
      if (requestError.response?.status === 409 && requestError.response.data.data) {
        const existing = requestError.response.data.data;
        setMessage(`Attendance already recorded at ${existing.check_in} UTC.`);
        await loadAttendance();
      } else {
        setError(requestError.response?.data?.message || 'Unable to record attendance.');
      }
    } finally {
      setMarking(false);
    }
  };

  return (
    <section className="employee-portal-page fade-in">
      <header className="page-header-row"><div><h1 className="page-main-heading">My Attendance</h1><p className="page-sub-heading">Attendance entry date and time use UTC server time.</p></div>
        <button type="button" className="btn btn-primary" disabled={loading || marking || Boolean(todayRecord)} onClick={markAttendance}>
          {todayRecord ? `Marked at ${todayRecord.check_in} UTC` : marking ? 'Recording…' : 'Mark Attendance'}
        </button>
      </header>
      {error && <div className="alert-banner-box alert-danger" role="alert">{error}</div>}
      {message && <div className="alert-banner-box alert-success" role="status">{message}</div>}
      <div className="dashboard-section-card">
        <div className="section-card-header"><div><h2 className="section-title">Attendance history</h2><p className="section-subtitle">Only your own records are shown.</p></div></div>
        {loading ? <div className="loading-placeholder">Loading attendance history…</div> : records.length === 0 ? <div className="empty-sub-card"><p>No attendance has been recorded yet.</p></div> : (
          <div className="table-responsive"><table className="data-table"><thead><tr><th>Date (UTC)</th><th>Status</th><th>Entry time (UTC)</th></tr></thead><tbody>
            {records.map((record) => <tr key={record.id}><td>{String(record.attendance_date).slice(0, 10)}</td><td>{record.status}</td><td>{record.check_in || '—'}</td></tr>)}
          </tbody></table></div>
        )}
      </div>
    </section>
  );
};

export default MyAttendance;
