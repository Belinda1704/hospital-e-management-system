import { pool } from '../config/database.js';

export const getAllPayroll = async (req, res) => {
  try {
    const { employee_id, month, year, status } = req.query;
    let query = `
      SELECT py.*, 
             e.employee_id, e.position,
             u.first_name, u.last_name, u.email
      FROM payroll py
      JOIN employees e ON py.employee_id = e.id
      JOIN users u ON e.user_id = u.id
      WHERE 1=1
    `;
    const params = [];
    let paramCount = 1;

    if (employee_id) {
      query += ` AND py.employee_id = $${paramCount}`;
      params.push(employee_id);
      paramCount++;
    }

    if (month) {
      query += ` AND py.month = $${paramCount}`;
      params.push(month);
      paramCount++;
    }

    if (year) {
      query += ` AND py.year = $${paramCount}`;
      params.push(year);
      paramCount++;
    }

    if (status) {
      query += ` AND py.status = $${paramCount}`;
      params.push(status);
      paramCount++;
    }

    query += ' ORDER BY py.year DESC, py.month DESC';

    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (error) {
    console.error('Get payroll error:', error);
    res.status(500).json({ error: 'Failed to fetch payroll' });
  }
};

export const getMyPayroll = async (req, res) => {
  try {
    const userId = req.user.id;
    const { month, year } = req.query;

    let query = `
      SELECT py.*, 
             e.employee_id, e.position,
             u.first_name, u.last_name
      FROM payroll py
      JOIN employees e ON py.employee_id = e.id
      JOIN users u ON e.user_id = u.id
      WHERE e.user_id = $1
    `;
    const params = [userId];
    let paramCount = 2;

    if (month) {
      query += ` AND py.month = $${paramCount}`;
      params.push(month);
      paramCount++;
    }

    if (year) {
      query += ` AND py.year = $${paramCount}`;
      params.push(year);
      paramCount++;
    }

    query += ' ORDER BY py.year DESC, py.month DESC';

    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (error) {
    console.error('Get my payroll error:', error);
    res.status(500).json({ error: 'Failed to fetch payroll' });
  }
};

export const createPayroll = async (req, res) => {
  try {
    const { employee_id, month, year, base_salary, allowances, deductions, bonus } = req.body;

    if (!employee_id || !month || !year || !base_salary) {
      return res.status(400).json({ error: 'Required fields missing' });
    }

    const netSalary = (parseFloat(base_salary) || 0) + 
                     (parseFloat(allowances) || 0) + 
                     (parseFloat(bonus) || 0) - 
                     (parseFloat(deductions) || 0);

    const result = await pool.query(
      `INSERT INTO payroll (employee_id, month, year, base_salary, allowances, deductions, bonus, net_salary, status)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 'pending')
       RETURNING *`,
      [employee_id, month, year, base_salary, allowances || 0, deductions || 0, bonus || 0, netSalary]
    );

    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Create payroll error:', error);
    if (error.code === '23505') {
      return res.status(400).json({ error: 'Payroll record already exists for this employee, month, and year' });
    }
    res.status(500).json({ error: 'Failed to create payroll' });
  }
};

export const updatePayroll = async (req, res) => {
  try {
    const { id } = req.params;
    const { base_salary, allowances, deductions, bonus, status, payment_date } = req.body;

    let netSalary = null;
    if (base_salary !== undefined || allowances !== undefined || deductions !== undefined || bonus !== undefined) {
      const current = await pool.query('SELECT base_salary, allowances, deductions, bonus FROM payroll WHERE id = $1', [id]);
      if (current.rows.length > 0) {
        const base = parseFloat(base_salary !== undefined ? base_salary : current.rows[0].base_salary) || 0;
        const allow = parseFloat(allowances !== undefined ? allowances : current.rows[0].allowances) || 0;
        const deduct = parseFloat(deductions !== undefined ? deductions : current.rows[0].deductions) || 0;
        const bon = parseFloat(bonus !== undefined ? bonus : current.rows[0].bonus) || 0;
        netSalary = base + allow + bon - deduct;
      }
    }

    const result = await pool.query(
      `UPDATE payroll SET
        base_salary = COALESCE($1, base_salary),
        allowances = COALESCE($2, allowances),
        deductions = COALESCE($3, deductions),
        bonus = COALESCE($4, bonus),
        net_salary = COALESCE($5, net_salary),
        status = COALESCE($6, status),
        payment_date = COALESCE($7, payment_date),
        updated_at = CURRENT_TIMESTAMP
       WHERE id = $8
       RETURNING *`,
      [base_salary, allowances, deductions, bonus, netSalary, status, payment_date, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Payroll record not found' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Update payroll error:', error);
    res.status(500).json({ error: 'Failed to update payroll' });
  }
};




