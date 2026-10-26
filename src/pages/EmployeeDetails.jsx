import React, { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { getEmployeeById } from '../services/api';

const EmployeeDetails = () => {
  const { id } = useParams();
  const [employee, setEmployee] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError('');
    getEmployeeById(id)
      .then((response) => {
        if (active && response.success) setEmployee(response.data);
      })
      .catch((requestError) => {
        if (active) {
          setError(requestError.response?.data?.message || 'Unable to load this employee from the database.');
        }
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => { active = false; };
  }, [id]);

  if (loading) {
    return <div className="form-loading-state"><div className="spinner-large"></div><p>Loading employee details...</p></div>;
  }

  if (error || !employee) {
    return (
      <div className="form-error-state-card" role="alert">
        <h2>Employee details unavailable</h2>
        <p>{error || 'The requested employee was not found.'}</p>
        <Link to="/employees" className="btn btn-primary">Back to Employees</Link>
      </div>
    );
  }

  const fields = [
    ['Employee ID', `#${employee.id}`],
    ['Full name', employee.name],
    ['Email address', employee.email],
    ['Phone number', employee.phone || 'Not provided'],
    ['Department', employee.department || 'Not assigned'],
    ['Annual salary', employee.salary === null ? 'Not provided' : new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(Number(employee.salary))]
  ];

  return (
    <section className="employee-details-page fade-in">
      <div className="page-header-row">
        <div>
          <h1 className="page-main-heading">Employee Details</h1>
          <p className="page-sub-heading">Complete record from <code>react_db.employees</code>.</p>
        </div>
        <div className="page-header-actions">
          <Link to="/employees" className="btn btn-secondary">Back to Employees</Link>
          <Link to={`/edit-employee/${employee.id}`} className="btn btn-primary">Edit Employee</Link>
        </div>
      </div>

      <div className="employee-details-card">
        <div className="employee-details-heading">
          <div className="employee-details-avatar">
            {employee.name.split(' ').map((part) => part[0]).slice(0, 2).join('').toUpperCase()}
          </div>
          <div>
            <h2>{employee.name}</h2>
            <a href={`mailto:${employee.email}`}>{employee.email}</a>
          </div>
        </div>
        <dl className="employee-details-grid">
          {fields.map(([label, value]) => (
            <div key={label} className="employee-details-item">
              <dt>{label}</dt>
              <dd>{value}</dd>
            </div>
          ))}
        </dl>
      </div>
    </section>
  );
};

export default EmployeeDetails;
