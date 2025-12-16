import bcrypt from 'bcryptjs';
import { pool } from '../config/database.js';

export const createStaff = async (req, res) => {
  try {
    const {
      email, password, first_name, last_name, role,
      department_id, position, specialization, hire_date, salary
    } = req.body;

    if (!email || !password || !first_name || !last_name || !role || !position || !hire_date) {
      return res.status(400).json({ error: 'Required fields missing' });
    }

    if (!['doctor', 'nurse', 'staff', 'admin'].includes(role)) {
      return res.status(400).json({ error: 'Invalid role. Allowed: doctor, nurse, staff, admin' });
    }

    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      // Check if user exists
      const existingUser = await client.query('SELECT id FROM users WHERE email = $1', [email]);
      if (existingUser.rows.length > 0) {
        await client.query('ROLLBACK');
        return res.status(400).json({ error: 'User with this email already exists' });
      }

      // Hash password
      const hashedPassword = await bcrypt.hash(password, 10);

      // Generate doctor_id if doctor
      let doctor_id = null;
      if (role === 'doctor') {
        doctor_id = `DOC${Date.now()}`;
      }

      // Create user
      const userResult = await client.query(
        `INSERT INTO users (email, password, first_name, last_name, role, doctor_id, must_change_password)
         VALUES ($1, $2, $3, $4, $5, $6, true)
         RETURNING id, email, first_name, last_name, role, doctor_id, must_change_password`,
        [email, hashedPassword, first_name, last_name, role, doctor_id]
      );

      const userId = userResult.rows[0].id;

      // Generate employee_id
      const employeeId = `EMP${Date.now()}`;

      // Create employee record
      const employeeResult = await client.query(
        `INSERT INTO employees (user_id, employee_id, department_id, position, specialization, hire_date, salary, status)
         VALUES ($1, $2, $3, $4, $5, $6, $7, 'active')
         RETURNING *`,
        [userId, employeeId, department_id, position, specialization, hire_date, salary]
      );

      await client.query('COMMIT');
      res.status(201).json({
        message: 'Staff member created successfully',
        user: userResult.rows[0],
        employee: employeeResult.rows[0]
      });
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('Create staff error:', error);
    res.status(500).json({ error: 'Failed to create staff member' });
  }
};

export const getAllStaff = async (req, res) => {
  try {
    const { role, department_id } = req.query;
    let query = `
      SELECT u.id, u.email, u.first_name, u.last_name, u.role, u.doctor_id, u.profile_picture,
             e.employee_id, e.department_id, e.position, e.specialization, e.hire_date, e.status,
             d.name as department_name
      FROM users u
      JOIN employees e ON u.id = e.user_id
      LEFT JOIN departments d ON e.department_id = d.id
      WHERE u.role IN ('doctor', 'nurse', 'staff', 'admin')
    `;
    const params = [];
    let paramCount = 1;

    if (role) {
      query += ` AND u.role = $${paramCount}`;
      params.push(role);
      paramCount++;
    }

    if (department_id) {
      query += ` AND e.department_id = $${paramCount}`;
      params.push(department_id);
      paramCount++;
    }

    query += ' ORDER BY u.created_at DESC';

    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (error) {
    console.error('Get staff error:', error);
    res.status(500).json({ error: 'Failed to fetch staff' });
  }
};

