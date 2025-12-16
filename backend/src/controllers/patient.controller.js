import { pool } from '../config/database.js';

export const getAllPatients = async (req, res) => {
  try {
    const { search, status } = req.query;
    let query = `
      SELECT p.*, u.first_name, u.last_name, u.email, u.profile_picture,
             doc.first_name as assigned_doctor_name, doc.last_name as assigned_doctor_last_name,
             nurse.first_name as assigned_nurse_name, nurse.last_name as assigned_nurse_last_name
      FROM patients p
      JOIN users u ON p.user_id = u.id
      LEFT JOIN users doc ON p.assigned_doctor_id = doc.id
      LEFT JOIN users nurse ON p.assigned_nurse_id = nurse.id
      WHERE 1=1
    `;
    const params = [];
    let paramCount = 1;

    if (search) {
      query += ` AND (p.patient_id ILIKE $${paramCount} OR u.first_name ILIKE $${paramCount} OR u.last_name ILIKE $${paramCount} OR u.email ILIKE $${paramCount})`;
      params.push(`%${search}%`);
      paramCount++;
    }

    if (status) {
      query += ` AND p.status = $${paramCount}`;
      params.push(status);
      paramCount++;
    }

    query += ' ORDER BY p.created_at DESC';

    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (error) {
    console.error('Get patients error:', error);
    res.status(500).json({ error: 'Failed to fetch patients' });
  }
};

export const getPatientById = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query(
      `SELECT p.*, u.first_name, u.last_name, u.email, u.profile_picture
       FROM patients p
       JOIN users u ON p.user_id = u.id
       WHERE p.id = $1`,
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Patient not found' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Get patient error:', error);
    res.status(500).json({ error: 'Failed to fetch patient' });
  }
};

export const createPatient = async (req, res) => {
  try {
    const {
      email, password, first_name, last_name,
      date_of_birth, gender, phone, address,
      emergency_contact_name, emergency_contact_phone,
      blood_type, allergies, medical_history
    } = req.body;

    if (!email || !password || !first_name || !last_name) {
      return res.status(400).json({ error: 'Required fields missing' });
    }

    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      // Create user
      const bcrypt = (await import('bcryptjs')).default;
      const hashedPassword = await bcrypt.hash(password, 10);

      const userResult = await client.query(
        `INSERT INTO users (email, password, first_name, last_name, role)
         VALUES ($1, $2, $3, $4, 'patient')
         RETURNING id`,
        [email, hashedPassword, first_name, last_name]
      );

      const userId = userResult.rows[0].id;

      // Generate patient_id
      const patientId = `PAT${Date.now()}`;

      // Create patient
      const patientResult = await client.query(
        `INSERT INTO patients (
          user_id, patient_id, date_of_birth, gender, phone, address,
          emergency_contact_name, emergency_contact_phone,
          blood_type, allergies, medical_history
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
        RETURNING *`,
        [
          userId, patientId, date_of_birth, gender, phone, address,
          emergency_contact_name, emergency_contact_phone,
          blood_type, allergies, medical_history
        ]
      );

      await client.query('COMMIT');
      res.status(201).json(patientResult.rows[0]);
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('Create patient error:', error);
    res.status(500).json({ error: 'Failed to create patient' });
  }
};

export const updatePatient = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      first_name, last_name, date_of_birth, gender, phone, address,
      emergency_contact_name, emergency_contact_phone,
      blood_type, allergies, medical_history,
      assigned_doctor_id, assigned_nurse_id
    } = req.body;

    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      // Update user
      if (first_name || last_name) {
        await client.query(
          `UPDATE users SET first_name = COALESCE($1, first_name), 
           last_name = COALESCE($2, last_name), updated_at = CURRENT_TIMESTAMP
           WHERE id = (SELECT user_id FROM patients WHERE id = $3)`,
          [first_name, last_name, id]
        );
      }

      // Update patient
      const result = await client.query(
        `UPDATE patients SET
          date_of_birth = COALESCE($1, date_of_birth),
          gender = COALESCE($2, gender),
          phone = COALESCE($3, phone),
          address = COALESCE($4, address),
          emergency_contact_name = COALESCE($5, emergency_contact_name),
          emergency_contact_phone = COALESCE($6, emergency_contact_phone),
          blood_type = COALESCE($7, blood_type),
          allergies = COALESCE($8, allergies),
          medical_history = COALESCE($9, medical_history),
          assigned_doctor_id = COALESCE($10, assigned_doctor_id),
          assigned_nurse_id = COALESCE($11, assigned_nurse_id),
          updated_at = CURRENT_TIMESTAMP
         WHERE id = $12
         RETURNING *`,
        [
          date_of_birth, gender, phone, address,
          emergency_contact_name, emergency_contact_phone,
          blood_type, allergies, medical_history,
          assigned_doctor_id, assigned_nurse_id, id
        ]
      );

      await client.query('COMMIT');
      res.json(result.rows[0]);
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('Update patient error:', error);
    res.status(500).json({ error: 'Failed to update patient' });
  }
};

export const dischargePatient = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query(
      `UPDATE patients SET status = 'discharged', updated_at = CURRENT_TIMESTAMP
       WHERE id = $1 RETURNING *`,
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Patient not found' });
    }

    res.json({ message: 'Patient discharged successfully', patient: result.rows[0] });
  } catch (error) {
    console.error('Discharge patient error:', error);
    res.status(500).json({ error: 'Failed to discharge patient' });
  }
};

export const transferPatient = async (req, res) => {
  try {
    const { id } = req.params;
    const { department_id } = req.body;

    // For now, just update status - can be extended later
    const result = await pool.query(
      `UPDATE patients SET status = 'transferred', updated_at = CURRENT_TIMESTAMP
       WHERE id = $1 RETURNING *`,
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Patient not found' });
    }

    res.json({ message: 'Patient transferred successfully', patient: result.rows[0] });
  } catch (error) {
    console.error('Transfer patient error:', error);
    res.status(500).json({ error: 'Failed to transfer patient' });
  }
};

