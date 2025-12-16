import { pool } from '../config/database.js';

export const getAllEmployees = async (req, res) => {
  try {
    const { search, department_id, position, status } = req.query;
    let query = `
      SELECT e.*, 
             u.first_name, u.last_name, u.email, u.role, u.profile_picture,
             d.name as department_name
      FROM employees e
      JOIN users u ON e.user_id = u.id
      LEFT JOIN departments d ON e.department_id = d.id
      WHERE 1=1
    `;
    const params = [];
    let paramCount = 1;

    if (search) {
      query += ` AND (e.employee_id ILIKE $${paramCount} OR u.first_name ILIKE $${paramCount} OR u.last_name ILIKE $${paramCount} OR e.position ILIKE $${paramCount})`;
      params.push(`%${search}%`);
      paramCount++;
    }

    if (department_id) {
      query += ` AND e.department_id = $${paramCount}`;
      params.push(department_id);
      paramCount++;
    }

    if (position) {
      query += ` AND e.position = $${paramCount}`;
      params.push(position);
      paramCount++;
    }

    if (status) {
      query += ` AND e.status = $${paramCount}`;
      params.push(status);
      paramCount++;
    }

    query += ' ORDER BY e.created_at DESC';

    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (error) {
    console.error('Get employees error:', error);
    res.status(500).json({ error: 'Failed to fetch employees' });
  }
};

export const getEmployeeById = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query(
      `SELECT e.*, 
              u.first_name, u.last_name, u.email, u.role, u.profile_picture,
              d.name as department_name
       FROM employees e
       JOIN users u ON e.user_id = u.id
       LEFT JOIN departments d ON e.department_id = d.id
       WHERE e.id = $1`,
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Employee not found' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Get employee error:', error);
    res.status(500).json({ error: 'Failed to fetch employee' });
  }
};

export const getMyEmployeeInfo = async (req, res) => {
  try {
    const userId = req.user.id;
    const result = await pool.query(
      `SELECT e.*, 
              u.first_name, u.last_name, u.email, u.role, u.profile_picture,
              d.name as department_name
       FROM employees e
       JOIN users u ON e.user_id = u.id
       LEFT JOIN departments d ON e.department_id = d.id
       WHERE e.user_id = $1`,
      [userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Employee record not found' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Get my employee info error:', error);
    res.status(500).json({ error: 'Failed to fetch employee info' });
  }
};

export const createEmployee = async (req, res) => {
  try {
    const {
      email, password, first_name, last_name, role,
      department_id, position, specialization, hire_date, salary
    } = req.body;

    if (!email || !password || !first_name || !last_name || !role || !position || !hire_date) {
      return res.status(400).json({ error: 'Required fields missing' });
    }

    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      // Create user
      const bcrypt = (await import('bcryptjs')).default;
      const hashedPassword = await bcrypt.hash(password, 10);

      let doctor_id = null;
      if (role === 'doctor') {
        doctor_id = `DOC${Date.now()}`;
      }

      const userResult = await client.query(
        `INSERT INTO users (email, password, first_name, last_name, role, doctor_id)
         VALUES ($1, $2, $3, $4, $5, $6)
         RETURNING id`,
        [email, hashedPassword, first_name, last_name, role, doctor_id]
      );

      const userId = userResult.rows[0].id;

      // Generate employee_id
      const employeeId = `EMP${Date.now()}`;

      // Create employee
      const employeeResult = await client.query(
        `INSERT INTO employees (user_id, employee_id, department_id, position, specialization, hire_date, salary, status)
         VALUES ($1, $2, $3, $4, $5, $6, $7, 'active')
         RETURNING *`,
        [userId, employeeId, department_id, position, specialization, hire_date, salary]
      );

      await client.query('COMMIT');
      res.status(201).json(employeeResult.rows[0]);
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('Create employee error:', error);
    res.status(500).json({ error: 'Failed to create employee' });
  }
};

export const updateEmployee = async (req, res) => {
  try {
    const { id } = req.params;
    const { department_id, position, specialization, salary, status } = req.body;

    const result = await pool.query(
      `UPDATE employees SET
        department_id = COALESCE($1, department_id),
        position = COALESCE($2, position),
        specialization = COALESCE($3, specialization),
        salary = COALESCE($4, salary),
        status = COALESCE($5, status),
        updated_at = CURRENT_TIMESTAMP
       WHERE id = $6
       RETURNING *`,
      [department_id, position, specialization, salary, status, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Employee not found' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Update employee error:', error);
    res.status(500).json({ error: 'Failed to update employee' });
  }
};




