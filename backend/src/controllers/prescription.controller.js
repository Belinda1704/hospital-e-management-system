import { pool } from '../config/database.js';

export const getAllPrescriptions = async (req, res) => {
  try {
    const { search, patient_id, doctor_id, status } = req.query;
    let query = `
      SELECT pr.*, 
             pt.patient_id, p.first_name as patient_first_name, p.last_name as patient_last_name,
             d.first_name as doctor_first_name, d.last_name as doctor_last_name
      FROM prescriptions pr
      JOIN patients pt ON pr.patient_id = pt.id
      JOIN users p ON pt.user_id = p.id
      LEFT JOIN users d ON pr.doctor_id = d.id
      WHERE 1=1
    `;
    const params = [];
    let paramCount = 1;

    // If user is a doctor, only show their prescriptions
    if (req.user && req.user.role === 'doctor') {
      query += ` AND pr.doctor_id = $${paramCount}`;
      params.push(req.user.id);
      paramCount++;
    }

    // If user is a patient, only show their prescriptions
    if (req.user && req.user.role === 'patient') {
      const patientResult = await pool.query(
        'SELECT id FROM patients WHERE user_id = $1',
        [req.user.id]
      );
      if (patientResult.rows.length > 0) {
        query += ` AND pr.patient_id = $${paramCount}`;
        params.push(patientResult.rows[0].id);
        paramCount++;
      }
    }

    if (search) {
      query += ` AND (pr.medication_name ILIKE $${paramCount} OR p.first_name ILIKE $${paramCount} OR p.last_name ILIKE $${paramCount})`;
      params.push(`%${search}%`);
      paramCount++;
    }

    if (patient_id && (!req.user || req.user.role !== 'patient')) {
      query += ` AND pr.patient_id = $${paramCount}`;
      params.push(patient_id);
      paramCount++;
    }

    if (doctor_id && (!req.user || req.user.role !== 'doctor')) {
      query += ` AND pr.doctor_id = $${paramCount}`;
      params.push(doctor_id);
      paramCount++;
    }

    if (status) {
      query += ` AND pr.status = $${paramCount}`;
      params.push(status);
      paramCount++;
    }

    query += ' ORDER BY pr.prescribed_date DESC';

    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (error) {
    console.error('Get prescriptions error:', error);
    res.status(500).json({ error: 'Failed to fetch prescriptions' });
  }
};

export const getPrescriptionById = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query(
      `SELECT pr.*, 
              pt.patient_id, p.first_name as patient_first_name, p.last_name as patient_last_name,
              d.first_name as doctor_first_name, d.last_name as doctor_last_name
       FROM prescriptions pr
       JOIN patients pt ON pr.patient_id = pt.id
       JOIN users p ON pt.user_id = p.id
       LEFT JOIN users d ON pr.doctor_id = d.id
       WHERE pr.id = $1`,
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Prescription not found' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Get prescription error:', error);
    res.status(500).json({ error: 'Failed to fetch prescription' });
  }
};

export const createPrescription = async (req, res) => {
  try {
    const { patient_id, doctor_id, medication_name, dosage, frequency, duration, instructions } = req.body;

    if (!patient_id || !doctor_id || !medication_name) {
      return res.status(400).json({ error: 'Required fields missing' });
    }

    const result = await pool.query(
      `INSERT INTO prescriptions (patient_id, doctor_id, medication_name, dosage, frequency, duration, instructions, status)
       VALUES ($1, $2, $3, $4, $5, $6, $7, 'active')
       RETURNING *`,
      [patient_id, doctor_id, medication_name, dosage, frequency, duration, instructions]
    );

    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Create prescription error:', error);
    res.status(500).json({ error: 'Failed to create prescription' });
  }
};

export const updatePrescription = async (req, res) => {
  try {
    const { id } = req.params;
    const { medication_name, dosage, frequency, duration, instructions, status } = req.body;

    const result = await pool.query(
      `UPDATE prescriptions SET
        medication_name = COALESCE($1, medication_name),
        dosage = COALESCE($2, dosage),
        frequency = COALESCE($3, frequency),
        duration = COALESCE($4, duration),
        instructions = COALESCE($5, instructions),
        status = COALESCE($6, status),
        updated_at = CURRENT_TIMESTAMP
       WHERE id = $7
       RETURNING *`,
      [medication_name, dosage, frequency, duration, instructions, status, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Prescription not found' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Update prescription error:', error);
    res.status(500).json({ error: 'Failed to update prescription' });
  }
};

export const deletePrescription = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query('DELETE FROM prescriptions WHERE id = $1 RETURNING *', [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Prescription not found' });
    }

    res.json({ message: 'Prescription deleted successfully' });
  } catch (error) {
    console.error('Delete prescription error:', error);
    res.status(500).json({ error: 'Failed to delete prescription' });
  }
};

