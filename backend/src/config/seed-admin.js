import bcrypt from 'bcryptjs';
import { pool } from './database.js';

const seedAdmin = async () => {
  try {
    console.log('Creating default admin account...');

    // Check if admin already exists
    const existingAdmin = await pool.query(
      "SELECT id FROM users WHERE email = 'admin@hospital.com'"
    );

    if (existingAdmin.rows.length > 0) {
      console.log('Admin account already exists');
      console.log('Email: admin@hospital.com');
      console.log('Password: Admin123!');
      console.log('You can login with these credentials');
      process.exit(0);
    }

    // Hash password
    const hashedPassword = await bcrypt.hash('Admin123!', 10);

    // Create admin user
    await pool.query(
      `INSERT INTO users (email, password, first_name, last_name, role) 
       VALUES ($1, $2, $3, $4, $5)`,
      ['admin@hospital.com', hashedPassword, 'System', 'Administrator', 'admin']
    );

    console.log('Admin account created successfully!');
    console.log('');
    console.log('DEFAULT ADMIN CREDENTIALS');
    console.log('Email: admin@hospital.com');
    console.log('Password: Admin123!');
    console.log('');
    console.log('IMPORTANT: Change this password after first login');
    
    process.exit(0);
  } catch (error) {
    console.error('Error creating admin account:', error);
    process.exit(1);
  }
};

seedAdmin();




