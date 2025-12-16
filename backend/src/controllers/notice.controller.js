import { pool } from '../config/database.js';

export const getAllNotices = async (req, res) => {
  try {
    const { priority, target_audience } = req.query;
    const userRole = req.user?.role;

    let query = `
      SELECT n.*, 
             u.first_name as created_by_first_name, u.last_name as created_by_last_name
      FROM notices n
      LEFT JOIN users u ON n.created_by = u.id
      WHERE 1=1
    `;
    const params = [];
    let paramCount = 1;

    // Filter by target audience if user is not admin
    if (userRole && userRole !== 'admin') {
      query += ` AND (n.target_audience = 'all' OR n.target_audience = $${paramCount})`;
      params.push(userRole);
      paramCount++;
    }

    if (priority) {
      query += ` AND n.priority = $${paramCount}`;
      params.push(priority);
      paramCount++;
    }

    if (target_audience && userRole === 'admin') {
      query += ` AND n.target_audience = $${paramCount}`;
      params.push(target_audience);
      paramCount++;
    }

    query += ' ORDER BY n.created_at DESC';

    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (error) {
    console.error('Get notices error:', error);
    res.status(500).json({ error: 'Failed to fetch notices' });
  }
};

export const getNoticeById = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query(
      `SELECT n.*, 
              u.first_name as created_by_first_name, u.last_name as created_by_last_name
       FROM notices n
       LEFT JOIN users u ON n.created_by = u.id
       WHERE n.id = $1`,
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Notice not found' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Get notice error:', error);
    res.status(500).json({ error: 'Failed to fetch notice' });
  }
};

export const createNotice = async (req, res) => {
  try {
    const { title, content, priority, target_audience } = req.body;
    const created_by = req.user.id;

    if (!title || !content) {
      return res.status(400).json({ error: 'Title and content are required' });
    }

    const result = await pool.query(
      `INSERT INTO notices (title, content, priority, target_audience, created_by)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [title, content, priority || 'normal', target_audience || 'all', created_by]
    );

    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Create notice error:', error);
    res.status(500).json({ error: 'Failed to create notice' });
  }
};

export const updateNotice = async (req, res) => {
  try {
    const { id } = req.params;
    const { title, content, priority, target_audience } = req.body;

    const result = await pool.query(
      `UPDATE notices SET
        title = COALESCE($1, title),
        content = COALESCE($2, content),
        priority = COALESCE($3, priority),
        target_audience = COALESCE($4, target_audience),
        updated_at = CURRENT_TIMESTAMP
       WHERE id = $5
       RETURNING *`,
      [title, content, priority, target_audience, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Notice not found' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Update notice error:', error);
    res.status(500).json({ error: 'Failed to update notice' });
  }
};

export const deleteNotice = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query('DELETE FROM notices WHERE id = $1 RETURNING *', [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Notice not found' });
    }

    res.json({ message: 'Notice deleted successfully' });
  } catch (error) {
    console.error('Delete notice error:', error);
    res.status(500).json({ error: 'Failed to delete notice' });
  }
};




