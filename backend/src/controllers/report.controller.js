import { pool } from '../config/database.js';

export const getDashboardStats = async (req, res) => {
  try {
    const userRole = req.user.role;
    const userId = req.user.id;

    let stats = {};

    if (userRole === 'admin') {
      // Admin sees all stats
      const [
        patientsCount,
        appointmentsCount,
        employeesCount,
        departmentsCount,
        recentAppointments
      ] = await Promise.all([
        pool.query("SELECT COUNT(*) as count FROM patients WHERE status = 'active'"),
        pool.query("SELECT COUNT(*) as count FROM appointments WHERE status = 'scheduled'"),
        pool.query("SELECT COUNT(*) as count FROM employees WHERE status = 'active'"),
        pool.query('SELECT COUNT(*) as count FROM departments'),
        pool.query(`
          SELECT a.*, 
                 pt.patient_id, p.first_name as patient_first_name, p.last_name as patient_last_name,
                 d.first_name as doctor_first_name, d.last_name as doctor_last_name
          FROM appointments a
          JOIN patients pt ON a.patient_id = pt.id
          JOIN users p ON pt.user_id = p.id
          LEFT JOIN users d ON a.doctor_id = d.id
          ORDER BY a.appointment_date DESC, a.appointment_time DESC
          LIMIT 5
        `)
      ]);

      stats = {
        totalPatients: parseInt(patientsCount.rows[0].count),
        totalAppointments: parseInt(appointmentsCount.rows[0].count),
        totalEmployees: parseInt(employeesCount.rows[0].count),
        totalDepartments: parseInt(departmentsCount.rows[0].count),
        recentAppointments: recentAppointments.rows
      };
    } else if (userRole === 'doctor') {
      // Doctor sees their own stats
      const [
        myAppointmentsCount,
        myPatientsCount,
        myPrescriptionsCount,
        recentAppointments
      ] = await Promise.all([
        pool.query("SELECT COUNT(*) as count FROM appointments WHERE doctor_id = $1 AND status = 'scheduled'", [userId]),
        pool.query('SELECT COUNT(DISTINCT patient_id) as count FROM appointments WHERE doctor_id = $1', [userId]),
        pool.query("SELECT COUNT(*) as count FROM prescriptions WHERE doctor_id = $1 AND status = 'active'", [userId]),
        pool.query(`
          SELECT a.*, 
                 pt.patient_id, p.first_name as patient_first_name, p.last_name as patient_last_name
          FROM appointments a
          JOIN patients pt ON a.patient_id = pt.id
          JOIN users p ON pt.user_id = p.id
          WHERE a.doctor_id = $1
          ORDER BY a.appointment_date DESC, a.appointment_time DESC
          LIMIT 5
        `, [userId])
      ]);

      stats = {
        myAppointments: parseInt(myAppointmentsCount.rows[0].count),
        myPatients: parseInt(myPatientsCount.rows[0].count),
        myPrescriptions: parseInt(myPrescriptionsCount.rows[0].count),
        recentAppointments: recentAppointments.rows
      };
    } else if (userRole === 'nurse') {
      // Nurse sees general stats
      const [
        patientsCount,
        appointmentsCount,
        recentAppointments
      ] = await Promise.all([
        pool.query("SELECT COUNT(*) as count FROM patients WHERE status = 'active'"),
        pool.query("SELECT COUNT(*) as count FROM appointments WHERE status = 'scheduled'"),
        pool.query(`
          SELECT a.*, 
                 pt.patient_id, p.first_name as patient_first_name, p.last_name as patient_last_name,
                 d.first_name as doctor_first_name, d.last_name as doctor_last_name
          FROM appointments a
          JOIN patients pt ON a.patient_id = pt.id
          JOIN users p ON pt.user_id = p.id
          LEFT JOIN users d ON a.doctor_id = d.id
          ORDER BY a.appointment_date DESC, a.appointment_time DESC
          LIMIT 5
        `)
      ]);

      stats = {
        totalPatients: parseInt(patientsCount.rows[0].count),
        totalAppointments: parseInt(appointmentsCount.rows[0].count),
        recentAppointments: recentAppointments.rows
      };
    } else if (userRole === 'patient') {
      // Patient sees their own stats
      const patientRecord = await pool.query('SELECT id FROM patients WHERE user_id = $1', [userId]);
      if (patientRecord.rows.length > 0) {
        const patientId = patientRecord.rows[0].id;
        const [
          myAppointmentsCount,
          myPrescriptionsCount,
          myRecordsCount,
          recentAppointments
        ] = await Promise.all([
          pool.query("SELECT COUNT(*) as count FROM appointments WHERE patient_id = $1 AND status = 'scheduled'", [patientId]),
          pool.query("SELECT COUNT(*) as count FROM prescriptions WHERE patient_id = $1 AND status = 'active'", [patientId]),
          pool.query('SELECT COUNT(*) as count FROM medical_records WHERE patient_id = $1', [patientId]),
          pool.query(`
            SELECT a.*, 
                   d.first_name as doctor_first_name, d.last_name as doctor_last_name
            FROM appointments a
            LEFT JOIN users d ON a.doctor_id = d.id
            WHERE a.patient_id = $1
            ORDER BY a.appointment_date DESC, a.appointment_time DESC
            LIMIT 5
          `, [patientId])
        ]);

        stats = {
          myAppointments: parseInt(myAppointmentsCount.rows[0].count),
          myPrescriptions: parseInt(myPrescriptionsCount.rows[0].count),
          myRecords: parseInt(myRecordsCount.rows[0].count),
          recentAppointments: recentAppointments.rows
        };
      }
    }

    res.json(stats);
  } catch (error) {
    console.error('Get dashboard stats error:', error);
    res.status(500).json({ error: 'Failed to fetch dashboard stats' });
  }
};

export const getAppointmentStats = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    let query = `
      SELECT 
        DATE(appointment_date) as date,
        COUNT(*) as count,
        status
      FROM appointments
      WHERE 1=1
    `;
    const params = [];
    let paramCount = 1;

    if (startDate) {
      query += ` AND appointment_date >= $${paramCount}`;
      params.push(startDate);
      paramCount++;
    }

    if (endDate) {
      query += ` AND appointment_date <= $${paramCount}`;
      params.push(endDate);
      paramCount++;
    }

    query += ' GROUP BY DATE(appointment_date), status ORDER BY date DESC';

    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (error) {
    console.error('Get appointment stats error:', error);
    res.status(500).json({ error: 'Failed to fetch appointment stats' });
  }
};

