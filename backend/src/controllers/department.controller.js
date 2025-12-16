import { pool } from '../config/database.js';

export const getAllDepartments = async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT d.*, 
              u.first_name as head_first_name, u.last_name as head_last_name,
              COUNT(e.id) as employee_count
       FROM departments d
       LEFT JOIN users u ON d.head_doctor_id = u.id
       LEFT JOIN employees e ON d.id = e.department_id
       GROUP BY d.id, u.first_name, u.last_name
       ORDER BY d.name`
    );
    res.json(result.rows);
  } catch (error) {
    console.error('Get departments error:', error);
    res.status(500).json({ error: 'Failed to fetch departments' });
  }
};

export const getDepartmentById = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query(
      `SELECT d.*, 
              u.first_name as head_first_name, u.last_name as head_last_name
       FROM departments d
       LEFT JOIN users u ON d.head_doctor_id = u.id
       WHERE d.id = $1`,
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Department not found' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Get department error:', error);
    res.status(500).json({ error: 'Failed to fetch department' });
  }
};

export const createDepartment = async (req, res) => {
  try {
    const { name, description, head_doctor_id } = req.body;

    if (!name) {
      return res.status(400).json({ error: 'Department name is required' });
    }

    const result = await pool.query(
      `INSERT INTO departments (name, description, head_doctor_id)
       VALUES ($1, $2, $3)
       RETURNING *`,
      [name, description, head_doctor_id]
    );

    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Create department error:', error);
    if (error.code === '23505') {
      return res.status(400).json({ error: 'Department name already exists' });
    }
    res.status(500).json({ error: 'Failed to create department' });
  }
};

export const updateDepartment = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description, head_doctor_id } = req.body;

    const result = await pool.query(
      `UPDATE departments SET
        name = COALESCE($1, name),
        description = COALESCE($2, description),
        head_doctor_id = COALESCE($3, head_doctor_id)
       WHERE id = $4
       RETURNING *`,
      [name, description, head_doctor_id, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Department not found' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Update department error:', error);
    res.status(500).json({ error: 'Failed to update department' });
  }
};




