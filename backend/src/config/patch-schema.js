import { pool } from './database.js';

// One-time patcher to add missing columns if they weren't created in older tables.
const patch = async () => {
  try {
    console.log('Patching schema if needed...');

    // patients.status
    await pool.query(`
      ALTER TABLE patients
      ADD COLUMN IF NOT EXISTS status VARCHAR(50) DEFAULT 'active' CHECK (status IN ('active', 'discharged', 'transferred'));
    `);
    await pool.query(`
      ALTER TABLE patients
      ADD COLUMN IF NOT EXISTS patient_id VARCHAR(50) UNIQUE;
    `);
    await pool.query(`
      UPDATE patients
      SET patient_id = CONCAT('PAT', EXTRACT(EPOCH FROM CURRENT_TIMESTAMP)::bigint, '-', id)
      WHERE patient_id IS NULL;
    `);

    // departments.head_doctor_id
    await pool.query(`
      ALTER TABLE departments
      ADD COLUMN IF NOT EXISTS head_doctor_id INTEGER REFERENCES users(id);
    `);

    // employees.specialization
    await pool.query(`
      ALTER TABLE employees
      ADD COLUMN IF NOT EXISTS specialization VARCHAR(100);
    `);

    // employees.status
    await pool.query(`
      ALTER TABLE employees
      ADD COLUMN IF NOT EXISTS status VARCHAR(50) DEFAULT 'active' CHECK (status IN ('active', 'on_leave', 'terminated'));
    `);

    // appointments.status
    await pool.query(`
      ALTER TABLE appointments
      ADD COLUMN IF NOT EXISTS status VARCHAR(50) DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'completed', 'cancelled', 'rescheduled'));
    `);

    // appointments.appointment_time (some older tables may be missing this column)
    await pool.query(`
      ALTER TABLE appointments
      ADD COLUMN IF NOT EXISTS appointment_time TIME;
    `);

    // payroll missing columns (allowances, deductions, bonus, net_salary, status)
    await pool.query(`
      ALTER TABLE payroll
      ADD COLUMN IF NOT EXISTS allowances DECIMAL(10,2) DEFAULT 0,
      ADD COLUMN IF NOT EXISTS deductions DECIMAL(10,2) DEFAULT 0,
      ADD COLUMN IF NOT EXISTS bonus DECIMAL(10,2) DEFAULT 0,
      ADD COLUMN IF NOT EXISTS net_salary DECIMAL(10,2) DEFAULT 0,
      ADD COLUMN IF NOT EXISTS status VARCHAR(50) DEFAULT 'pending' CHECK (status IN ('pending', 'paid', 'cancelled'));
    `);

    // users.must_change_password
    await pool.query(`
      ALTER TABLE users
      ADD COLUMN IF NOT EXISTS must_change_password BOOLEAN DEFAULT false;
    `);

    // users.role constraint to include staff
    await pool.query(`
      DO $$
      BEGIN
        IF EXISTS (
          SELECT 1 FROM information_schema.table_constraints
          WHERE constraint_name = 'users_role_check'
            AND table_name = 'users'
        ) THEN
          ALTER TABLE users DROP CONSTRAINT users_role_check;
        END IF;
      END$$;
    `);
    await pool.query(`
      ALTER TABLE users
      ADD CONSTRAINT users_role_check CHECK (role IN ('patient','doctor','nurse','staff','admin'));
    `);

    // patients assigned_doctor_id and assigned_nurse_id
    await pool.query(`
      ALTER TABLE patients
      ADD COLUMN IF NOT EXISTS assigned_doctor_id INTEGER REFERENCES users(id),
      ADD COLUMN IF NOT EXISTS assigned_nurse_id INTEGER REFERENCES users(id);
    `);

    console.log('Schema patch completed.');
    process.exit(0);
  } catch (err) {
    console.error('Schema patch failed:', err);
    process.exit(1);
  }
};

patch();

