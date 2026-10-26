import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { createEmployee } from '../services/api';
import EmployeeForm from '../components/EmployeeForm';

const AddEmployee = () => {
  const navigate = useNavigate();
  const [apiError, setApiError] = useState('');

  const handleCreate = async (employeeData) => {
    setApiError('');
    try {
      const response = await createEmployee(employeeData);
      if (response.success) {
        // Navigate to View Employees with a success flash message
        navigate('/employees', {
          state: {
            message: `Employee "${employeeData.name}" was successfully added to MySQL database!`
          }
        });
      }
    } catch (err) {
      console.error('Failed to create employee:', err);
      // Catch duplicate email or other backend errors
      const msg =
        err.response?.data?.message ||
        (err.response?.data?.errors ? Object.values(err.response.data.errors).join(', ') : null) ||
        'Failed to save employee to MySQL database. Please check backend logs.';
      setApiError(msg);
      throw err; // rethrow so form stops submit spinner
    }
  };

  return (
    <div className="form-page-container fade-in">
      <div className="form-page-header">
        <div className="header-meta-pill">Database Operation: INSERT</div>
        <h1 className="form-page-title">Add New Employee</h1>
        <p className="form-page-subtitle">
          Fill in the required information below to persist a new employee record into the MySQL <code>employees</code> table.
        </p>
      </div>

      <EmployeeForm
        onSubmit={handleCreate}
        isEdit={false}
        apiError={apiError}
      />
    </div>
  );
};

export default AddEmployee;
