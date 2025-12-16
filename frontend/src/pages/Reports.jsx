import { useState, useEffect } from 'react';
import api from '../services/api';

const Reports = () => {
  const [stats, setStats] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const response = await api.get('/reports/dashboard-stats');
      setStats(response.data);
    } catch (error) {
      console.error('Failed to fetch reports:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div>Loading...</div>;

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-gray-800">Reports</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-gray-600 text-sm font-medium mb-2">Total Patients</h3>
          <p className="text-3xl font-bold text-blue-600">{stats.totalPatients || 0}</p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-gray-600 text-sm font-medium mb-2">Appointments</h3>
          <p className="text-3xl font-bold text-green-600">{stats.totalAppointments || 0}</p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-gray-600 text-sm font-medium mb-2">Employees</h3>
          <p className="text-3xl font-bold text-purple-600">{stats.totalEmployees || 0}</p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-gray-600 text-sm font-medium mb-2">Departments</h3>
          <p className="text-3xl font-bold text-orange-600">{stats.totalDepartments || 0}</p>
        </div>
      </div>
    </div>
  );
};

export default Reports;




