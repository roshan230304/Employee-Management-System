import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const DEFAULT_DEPARTMENTS = [
  'Engineering',
  'Design',
  'Product',
  'Marketing',
  'Sales',
  'Human Resources',
  'Finance',
  'Operations'
];

const EmployeeForm = ({
  initialData = null,
  onSubmit,
  isEdit = false,
  apiError = ''
}) => {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    department: '',
    salary: '',
    password: ''
  });

  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);

  // Populate form if in edit mode
  useEffect(() => {
    if (initialData) {
      setFormData({
        name: initialData.name || '',
        email: initialData.email || '',
        phone: initialData.phone || '',
        department: initialData.department || '',
        salary: initialData.salary !== undefined && initialData.salary !== null ? String(initialData.salary) : ''
      });
    }
  }, [initialData]);

  // Client-side validation
  const validate = () => {
    const errs = {};
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    // Name validation
    if (!formData.name.trim()) {
      errs.name = 'Full name is required.';
    } else if (formData.name.trim().length < 2) {
      errs.name = 'Name must be at least 2 characters.';
    } else if (formData.name.trim().length > 100) {
      errs.name = 'Name cannot exceed 100 characters.';
    }
    if (!isEdit && formData.password.length < 12) {
      errs.password = 'Login password must be at least 12 characters.';
    } else if (!isEdit && formData.password.length > 72) {
      errs.password = 'Login password cannot exceed 72 characters.';
    }

    // Email validation
    if (!formData.email.trim()) {
      errs.email = 'Email address is required.';
    } else if (!emailRegex.test(formData.email.trim())) {
      errs.email = 'Please enter a valid email address (e.g. name@company.com).';
    } else if (formData.email.trim().length > 150) {
      errs.email = 'Email cannot exceed 150 characters.';
    }

    // Phone validation
    if (formData.phone && formData.phone.trim().length > 15) {
      errs.phone = 'Phone number cannot exceed 15 characters.';
    }

    // Department validation
    // Salary validation
    if (formData.salary !== '' && formData.salary !== null && formData.salary !== undefined) {
      const numSalary = Number(formData.salary);
      if (isNaN(numSalary)) {
        errs.salary = 'Salary must be a valid number.';
      } else if (numSalary < 0) {
        errs.salary = 'Salary cannot be negative.';
      } else if (numSalary > 99999999.99) {
        errs.salary = 'Salary exceeds the supported maximum.';
      } else if (Number(numSalary.toFixed(2)) !== numSalary) {
        errs.salary = 'Salary cannot have more than two decimal places.';
      }
    }

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));

    // Clear error as user types
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: '' }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    setSubmitting(true);
    try {
      await onSubmit({
        name: formData.name.trim(),
        email: formData.email.trim(),
        phone: formData.phone.trim() || null,
        department: formData.department.trim() || null,
        salary: formData.salary === '' ? null : Number(formData.salary),
        ...(!isEdit && { password: formData.password })
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="employee-form-card">
      {/* Backend API Error Banner */}
      {apiError && (
        <div className="form-error-alert" role="alert">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="alert-icon">
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="8" x2="12" y2="12" />
            <line x1="12" y1="16" x2="12.01" y2="16" />
          </svg>
          <div className="alert-content">
            <strong>Operation Failed:</strong>
            <span>{apiError}</span>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} noValidate className="custom-form-layout">
        <div className="form-fields-grid">
          {/* Full Name Field */}
          <div className="form-field-group col-span-2">
            <label htmlFor="name" className="form-label">
              Full Name <span className="req-star">*</span>
            </label>
            <div className="input-icon-wrapper">
              <svg className="field-svg-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                <circle cx="12" cy="7" r="4" />
              </svg>
              <input
                id="name"
                name="name"
                type="text"
                placeholder="e.g. Jessica Pearson"
                value={formData.name}
                onChange={handleChange}
                className={`form-text-input ${errors.name ? 'has-error' : ''}`}
                maxLength={100}
                required
              />
            </div>
            {errors.name && <span className="error-message">{errors.name}</span>}
          </div>

          {/* Email Address Field */}
          <div className="form-field-group">
            <label htmlFor="email" className="form-label">
              Email Address <span className="req-star">*</span>
            </label>
            <div className="input-icon-wrapper">
              <svg className="field-svg-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
                <polyline points="22,6 12,13 2,6" />
              </svg>
              <input
                id="email"
                name="email"
                type="email"
                placeholder="jessica@company.com"
                value={formData.email}
                onChange={handleChange}
                className={`form-text-input ${errors.email ? 'has-error' : ''}`}
                maxLength={150}
                required
              />
            </div>
            {errors.email && <span className="error-message">{errors.email}</span>}
          </div>

          {!isEdit && (
            <div className="form-field-group col-span-2">
              <label htmlFor="employee-password" className="form-label">Initial login password <span className="req-star">*</span></label>
              <input
                id="employee-password"
                name="password"
                type="password"
                autoComplete="new-password"
                value={formData.password}
                onChange={handleChange}
                className={`form-text-input ${errors.password ? 'has-error' : ''}`}
                minLength={12}
                maxLength={72}
                required
              />
              <span className="field-help-text">The employee signs in with their email address and this password. Share it securely.</span>
              {errors.password && <span className="error-message">{errors.password}</span>}
            </div>
          )}

          {/* Phone Field */}
          <div className="form-field-group">
            <label htmlFor="phone" className="form-label">
              Phone Number
            </label>
            <div className="input-icon-wrapper">
              <svg className="field-svg-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
              </svg>
              <input
                id="phone"
                name="phone"
                type="tel"
                placeholder="e.g. +1 (555) 000-0000"
                value={formData.phone}
                onChange={handleChange}
                className={`form-text-input ${errors.phone ? 'has-error' : ''}`}
                maxLength={15}
              />
            </div>
            {errors.phone && <span className="error-message">{errors.phone}</span>}
          </div>

          {/* Department Field */}
          <div className="form-field-group">
            <label htmlFor="department" className="form-label">
              Department (optional)
            </label>
            <div className="input-icon-wrapper">
              <svg className="field-svg-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="2" y="7" width="20" height="14" rx="2" ry="2" />
                <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" />
              </svg>
              <select
                id="department"
                name="department"
                value={formData.department}
                onChange={handleChange}
                className={`form-select-input ${errors.department ? 'has-error' : ''}`}
                required
              >
                <option value="">— Select Department (optional) —</option>
                {DEFAULT_DEPARTMENTS.map((dept) => (
                  <option key={dept} value={dept}>
                    {dept}
                  </option>
                ))}
              </select>
            </div>
            {errors.department && <span className="error-message">{errors.department}</span>}
          </div>

          {/* Salary Field */}
          <div className="form-field-group">
            <label htmlFor="salary" className="form-label">
              Annual Salary (USD, optional)
            </label>
            <div className="input-icon-wrapper">
              <span className="field-prefix-symbol">$</span>
              <input
                id="salary"
                name="salary"
                type="number"
                step="0.01"
                min="0"
                max="99999999.99"
                placeholder="e.g. 85000"
                value={formData.salary}
                onChange={handleChange}
                className={`form-text-input has-prefix ${errors.salary ? 'has-error' : ''}`}
              />
            </div>
            {errors.salary && <span className="error-message">{errors.salary}</span>}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="form-button-toolbar">
          <button
            type="button"
            className="btn btn-secondary"
            onClick={() => navigate('/employees')}
            disabled={submitting}
          >
            Cancel
          </button>

          <button
            type="submit"
            className="btn btn-primary form-submit-btn"
            disabled={submitting}
          >
            {submitting ? (
              <>
                <span className="btn-spinner"></span>
                <span>{isEdit ? 'Saving Changes...' : 'Saving to MySQL...'}</span>
              </>
            ) : (
              <>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="btn-icon">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
                <span>{isEdit ? 'Update Employee' : 'Save Employee'}</span>
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

export default EmployeeForm;
