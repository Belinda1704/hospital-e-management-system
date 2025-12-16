import { pool } from '../config/database.js';

export const getAllAppointments = async (req, res) => {
  try {
    const { search, status, doctor_id, patient_id } = req.query;
    let query = `
      SELECT a.*, 
             pt.patient_id, p.first_name as patient_first_name, p.last_name as patient_last_name,
             d.first_name as doctor_first_name, d.last_name as doctor_last_name, d.doctor_id
      FROM appointments a
      JOIN patients pt ON a.patient_id = pt.id
      JOIN users p ON pt.user_id = p.id
      LEFT JOIN users d ON a.doctor_id = d.id
      WHERE 1=1
    `;
    const params = [];
    let paramCount = 1;

    // If user is a patient, only show their appointments
    if (req.user && req.user.role === 'patient') {
      const patientResult = await pool.query(
        'SELECT id FROM patients WHERE user_id = $1',
        [req.user.id]
      );
      if (patientResult.rows.length > 0) {
        query += ` AND a.patient_id = $${paramCount}`;
        params.push(patientResult.rows[0].id);
        paramCount++;
      }
    }

    if (search) {
      query += ` AND (p.first_name ILIKE $${paramCount} OR p.last_name ILIKE $${paramCount} OR pt.patient_id ILIKE $${paramCount})`;
      params.push(`%${search}%`);
      paramCount++;
    }

    if (status) {
      query += ` AND a.status = $${paramCount}`;
      params.push(status);
      paramCount++;
    }

    if (doctor_id) {
      query += ` AND a.doctor_id = $${paramCount}`;
      params.push(doctor_id);
      paramCount++;
    }

    if (patient_id && (!req.user || req.user.role !== 'patient')) {
      query += ` AND a.patient_id = $${paramCount}`;
      params.push(patient_id);
      paramCount++;
    }

    query += ' ORDER BY a.appointment_date DESC, a.appointment_time DESC';

    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (error) {
    console.error('Get appointments error:', error);
    res.status(500).json({ error: 'Failed to fetch appointments' });
  }
};

export const getAppointmentById = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query(
      `SELECT a.*, 
              pt.patient_id, p.first_name as patient_first_name, p.last_name as patient_last_name,
              d.first_name as doctor_first_name, d.last_name as doctor_last_name
       FROM appointments a
       JOIN patients pt ON a.patient_id = pt.id
       JOIN users p ON pt.user_id = p.id
       LEFT JOIN users d ON a.doctor_id = d.id
       WHERE a.id = $1`,
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Appointment not found' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Get appointment error:', error);
    res.status(500).json({ error: 'Failed to fetch appointment' });
  }
};

export const createAppointment = async (req, res) => {
  try {
    const { patient_id, doctor_id, appointment_date, appointment_time, reason } = req.body;

    if (!patient_id || !doctor_id || !appointment_date || !appointment_time) {
      return res.status(400).json({ error: 'Required fields missing' });
    }

    const result = await pool.query(
      `INSERT INTO appointments (patient_id, doctor_id, appointment_date, appointment_time, reason, status)
       VALUES ($1, $2, $3, $4, $5, 'scheduled')
       RETURNING *`,
      [patient_id, doctor_id, appointment_date, appointment_time, reason]
    );

    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Create appointment error:', error);
    res.status(500).json({ error: 'Failed to create appointment' });
  }
};

export const updateAppointment = async (req, res) => {
  try {
    const { id } = req.params;
    const { appointment_date, appointment_time, reason, notes, status } = req.body;

    const result = await pool.query(
      `UPDATE appointments SET
        appointment_date = COALESCE($1, appointment_date),
        appointment_time = COALESCE($2, appointment_time),
        reason = COALESCE($3, reason),
        notes = COALESCE($4, notes),
        status = COALESCE($5, status),
        updated_at = CURRENT_TIMESTAMP
       WHERE id = $6
       RETURNING *`,
      [appointment_date, appointment_time, reason, notes, status, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Appointment not found' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Update appointment error:', error);
    res.status(500).json({ error: 'Failed to update appointment' });
  }
};

export const cancelAppointment = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query(
      `UPDATE appointments SET status = 'cancelled', updated_at = CURRENT_TIMESTAMP
       WHERE id = $1 RETURNING *`,
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Appointment not found' });
    }

    res.json({ message: 'Appointment cancelled successfully', appointment: result.rows[0] });
  } catch (error) {
    console.error('Cancel appointment error:', error);
    res.status(500).json({ error: 'Failed to cancel appointment' });
  }
};

export const completeAppointment = async (req, res) => {
  try {
    const { id } = req.params;
    const { notes } = req.body;

    const result = await pool.query(
      `UPDATE appointments SET status = 'completed', notes = COALESCE($1, notes), updated_at = CURRENT_TIMESTAMP
       WHERE id = $2 RETURNING *`,
      [notes, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Appointment not found' });
    }

    res.json({ message: 'Appointment completed successfully', appointment: result.rows[0] });
  } catch (error) {
    console.error('Complete appointment error:', error);
    res.status(500).json({ error: 'Failed to complete appointment' });
  }
};

