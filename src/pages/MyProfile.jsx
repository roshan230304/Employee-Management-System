import React from 'react';
import { useAuth } from '../auth/AuthContext';

const MyProfile = () => {
  const { user } = useAuth();
  const employee = user?.employee;
  if (!employee) return <div className="alert-banner-box alert-danger" role="alert">Employee profile is unavailable.</div>;
  const fields = [
    ['Employee ID', employee.id],
    ['Name', employee.name],
    ['Email / login', employee.email],
    ['Phone', employee.phone || 'Not provided'],
    ['Department', employee.department || 'Not assigned'],
    ['Salary', employee.salary === null ? 'Not provided' : new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(Number(employee.salary))]
  ];
  return (
    <section className="employee-portal-page fade-in">
      <div><h1 className="page-main-heading">My Profile</h1><p className="page-sub-heading">Your employee record is private to your authenticated account.</p></div>
      <div className="employee-details-card"><dl className="employee-details-grid">
        {fields.map(([label, value]) => <div className="employee-details-item" key={label}><dt>{label}</dt><dd>{value}</dd></div>)}
      </dl></div>
    </section>
  );
};

export default MyProfile;
