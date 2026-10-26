import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { getEmployeeById, updateEmployee } from '../services/api';
import EmployeeForm from '../components/EmployeeForm';

const EditEmployee = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [initialData, setInitialData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState('');
  const [apiError, setApiError] = useState('');

  // Load existing employee from MySQL
  useEffect(() => {
    const fetchEmployee = async () => {
      setLoading(true);
      setFetchError('');
      try {
        const response = await getEmployeeById(id);
        if (response.success && response.data) {
          setInitialData(response.data);
        } else {
          setFetchError(`Employee #${id} could not be found in the database.`);
        }
      } catch (err) {
        console.error('Failed to load employee details:', err);
        setFetchError(err.response?.data?.message || `Failed to fetch employee #${id} from MySQL.`);
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchEmployee();
    }
  }, [id]);

  const handleUpdate = async (employeeData) => {
    setApiError('');
    try {
      const response = await updateEmployee(id, employeeData);
      if (response.success) {
        // Navigate to View Employees with success flash message
        navigate('/employees', {
          state: {
            message: `Employee "${employeeData.name}" (#${id}) was successfully updated in MySQL database!`
          }
        });
      }
    } catch (err) {
      console.error('Failed to update employee:', err);
      const msg =
        err.response?.data?.message ||
        (err.response?.data?.errors ? Object.values(err.response.data.errors).join(', ') : null) ||
        'Failed to update employee in MySQL. Please check backend logs.';
      setApiError(msg);
      throw err;
    }
  };

  if (loading) {
    return (
      <div className="form-page-container fade-in">
        <div className="form-loading-state">
          <div className="spinner-large"></div>
          <p>Loading employee record #{id} from MySQL database...</p>
        </div>
      </div>
    );
  }

  if (fetchError) {
    return (
      <div className="form-page-container fade-in">
        <div className="form-error-state-card">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="error-icon-state">
            <circle cx="12" cy="12" r="10" />
            <line x1="15" y1="9" x2="9" y2="15" />
            <line x1="9" y1="9" x2="15" y2="15" />
          </svg>
          <h2>Record Not Found</h2>
          <p>{fetchError}</p>
          <Link to="/employees" className="btn btn-primary" style={{ marginTop: '1rem' }}>
            Back to Employee Directory
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="form-page-container fade-in">
      <div className="form-page-header">
        <div className="header-meta-pill">Database Operation: UPDATE</div>
        <h1 className="form-page-title">
          Edit Employee <span className="highlight-id">#{id}</span>
        </h1>
        <p className="form-page-subtitle">
          Modify the details below and save to update the record in MySQL table <code>employees</code>.
        </p>
      </div>

      <EmployeeForm
        initialData={initialData}
        onSubmit={handleUpdate}
        isEdit={true}
        apiError={apiError}
      />
    </div>
  );
};

export default EditEmployee;
