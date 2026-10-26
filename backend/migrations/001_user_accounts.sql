USE react_db;

CREATE TABLE IF NOT EXISTS user_accounts (
  id INT NOT NULL AUTO_INCREMENT,
  username VARCHAR(150) NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  role ENUM('admin', 'employee') NOT NULL,
  employee_id INT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_user_accounts_username (username),
  UNIQUE KEY uq_user_accounts_employee (employee_id),
  CONSTRAINT fk_user_accounts_employee
    FOREIGN KEY (employee_id) REFERENCES employees (id)
    ON DELETE CASCADE,
  CONSTRAINT chk_user_accounts_role_employee
    CHECK (
      (role = 'admin' AND employee_id IS NULL)
      OR (role = 'employee' AND employee_id IS NOT NULL)
    )
) ENGINE=InnoDB;
