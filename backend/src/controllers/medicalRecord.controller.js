import { pool } from '../config/database.js';

export const getAllMedicalRecords = async (req, res) => {
  try {
    const { search, patient_id, doctor_id, record_type } = req.query;
    let query = `
      SELECT mr.*, 
             pt.patient_id, p.first_name as patient_first_name, p.last_name as patient_last_name,
             d.first_name as doctor_first_name, d.last_name as doctor_last_name
      FROM medical_records mr
      JOIN patients pt ON mr.patient_id = pt.id
      JOIN users p ON pt.user_id = p.id
      LEFT JOIN users d ON mr.doctor_id = d.id
      WHERE 1=1
    `;
    const params = [];
    let paramCount = 1;

    if (search) {
      query += ` AND (mr.diagnosis ILIKE $${paramCount} OR mr.record_type ILIKE $${paramCount} OR p.first_name ILIKE $${paramCount} OR p.last_name ILIKE $${paramCount})`;
      params.push(`%${search}%`);
      paramCount++;
    }

    if (patient_id) {
      query += ` AND mr.patient_id = $${paramCount}`;
      params.push(patient_id);
      paramCount++;
    }

    if (doctor_id) {
      query += ` AND mr.doctor_id = $${paramCount}`;
      params.push(doctor_id);
      paramCount++;
    }

    if (record_type) {
      query += ` AND mr.record_type = $${paramCount}`;
      params.push(record_type);
      paramCount++;
    }

    query += ' ORDER BY mr.record_date DESC';

    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (error) {
    console.error('Get medical records error:', error);
    res.status(500).json({ error: 'Failed to fetch medical records' });
  }
};

export const getMedicalRecordById = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query(
      `SELECT mr.*, 
              pt.patient_id, p.first_name as patient_first_name, p.last_name as patient_last_name,
              d.first_name as doctor_first_name, d.last_name as doctor_last_name
       FROM medical_records mr
       JOIN patients pt ON mr.patient_id = pt.id
       JOIN users p ON pt.user_id = p.id
       LEFT JOIN users d ON mr.doctor_id = d.id
       WHERE mr.id = $1`,
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Medical record not found' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Get medical record error:', error);
    res.status(500).json({ error: 'Failed to fetch medical record' });
  }
};

export const createMedicalRecord = async (req, res) => {
  try {
    const { patient_id, doctor_id, record_type, diagnosis, symptoms, treatment, notes } = req.body;

    if (!patient_id || !doctor_id || !record_type) {
      return res.status(400).json({ error: 'Required fields missing' });
    }

    const result = await pool.query(
      `INSERT INTO medical_records (patient_id, doctor_id, record_type, diagnosis, symptoms, treatment, notes)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING *`,
      [patient_id, doctor_id, record_type, diagnosis, symptoms, treatment, notes]
    );

    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Create medical record error:', error);
    res.status(500).json({ error: 'Failed to create medical record' });
  }
};

export const updateMedicalRecord = async (req, res) => {
  try {
    const { id } = req.params;
    const { record_type, diagnosis, symptoms, treatment, notes } = req.body;

    const result = await pool.query(
      `UPDATE medical_records SET
        record_type = COALESCE($1, record_type),
        diagnosis = COALESCE($2, diagnosis),
        symptoms = COALESCE($3, symptoms),
        treatment = COALESCE($4, treatment),
        notes = COALESCE($5, notes),
        updated_at = CURRENT_TIMESTAMP
       WHERE id = $6
       RETURNING *`,
      [record_type, diagnosis, symptoms, treatment, notes, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Medical record not found' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Update medical record error:', error);
    res.status(500).json({ error: 'Failed to update medical record' });
  }
};

export const deleteMedicalRecord = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query('DELETE FROM medical_records WHERE id = $1 RETURNING *', [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Medical record not found' });
    }

    res.json({ message: 'Medical record deleted successfully' });
  } catch (error) {
    console.error('Delete medical record error:', error);
    res.status(500).json({ error: 'Failed to delete medical record' });
  }
};

