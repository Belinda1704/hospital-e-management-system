import { useState, useEffect } from 'react';
import api from '../services/api';

const Card = ({ title, value, accent }) => (
  <div className="bg-white p-5 rounded-lg shadow-sm border border-gray-100 flex flex-col gap-2">
    <span className="text-xs uppercase tracking-wide text-gray-500">{title}</span>
    <span className={`text-3xl font-semibold ${accent}`}>{value}</span>
  </div>
);

const Dashboard = () => {
  const [stats, setStats] = useState({});
  const [loading, setLoading] = useState(true);
  
  let user = {};
  try {
    const userStr = localStorage.getItem('user') || sessionStorage.getItem('user') || '{}';
    user = JSON.parse(userStr);
  } catch (e) {
    console.error('Error parsing user data:', e);
  }
  const role = user.role || 'patient';

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const response = await api.get('/reports/dashboard-stats');
      setStats(response.data);
    } catch (error) {
      console.error('Failed to fetch stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const summaryCards = () => {
    if (role === 'admin') {
      return [
        { title: 'Total Patients', value: stats.totalPatients || 0, accent: 'text-blue-600' },
        { title: 'Appointments', value: stats.totalAppointments || 0, accent: 'text-amber-600' },
        { title: 'Employees', value: stats.totalEmployees || 0, accent: 'text-emerald-600' },
        { title: 'Departments', value: stats.totalDepartments || 0, accent: 'text-rose-600' },
      ];
    }
    if (role === 'doctor') {
      return [
        { title: 'My Appointments', value: stats.myAppointments || 0, accent: 'text-blue-600' },
        { title: 'My Patients', value: stats.myPatients || 0, accent: 'text-emerald-600' },
        { title: 'Active Prescriptions', value: stats.myPrescriptions || 0, accent: 'text-purple-600' },
      ];
    }
    return [
      { title: 'My Appointments', value: stats.myAppointments || 0, accent: 'text-blue-600' },
      { title: 'My Prescriptions', value: stats.myPrescriptions || 0, accent: 'text-emerald-600' },
      { title: 'Medical Records', value: stats.myRecords || 0, accent: 'text-purple-600' },
    ];
  };

  const listRecentAppointments = stats.recentAppointments || [];

  if (loading) {
    return <div className="text-center py-8">Loading...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">Dashboard</h1>
          <p className="text-sm text-gray-500">Overview tailored for your role</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm text-gray-600">
            Role: <span className="font-semibold capitalize">{role}</span>
          </div>
          <div className="px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm text-gray-600">
            User: <span className="font-semibold">{user.first_name} {user.last_name}</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {summaryCards().map((c) => (
          <Card key={c.title} title={c.title} value={c.value} accent={c.accent} />
        ))}
      </div>

      {role === 'admin' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <div className="lg:col-span-2 bg-white rounded-lg shadow-sm border border-gray-100 p-5">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-800">Earning Reports</h2>
              <span className="text-xs text-gray-500">Monthly trend</span>
            </div>
            <div className="h-40 flex items-center justify-center text-gray-400 text-sm">
              Chart placeholder (add real chart later)
            </div>
          </div>
          <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-5">
            <h2 className="text-lg font-semibold text-gray-800 mb-3">Recent Patients</h2>
            <div className="space-y-3">
              {listRecentAppointments.slice(0, 5).map((apt) => (
                <div key={apt.id} className="flex items-center justify-between text-sm border-b border-gray-100 pb-2 last:border-0 last:pb-0">
                  <div>
                    <p className="font-semibold text-gray-800">{apt.patient_first_name} {apt.patient_last_name}</p>
                    <p className="text-gray-500">{new Date(apt.appointment_date).toLocaleDateString()}</p>
                  </div>
                  <span className="text-xs text-blue-600">{apt.appointment_time}</span>
                </div>
              ))}
              {listRecentAppointments.length === 0 && <p className="text-gray-500 text-sm">No recent data</p>}
            </div>
          </div>
        </div>
      )}

      {(role === 'doctor' || role === 'nurse' || role === 'patient') && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-5">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-lg font-semibold text-gray-800">Recent Appointments</h2>
            <span className="text-xs text-gray-500">Last 5</span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="text-left p-2">Patient</th>
                  <th className="text-left p-2">Doctor</th>
                  <th className="text-left p-2">Date</th>
                  <th className="text-left p-2">Time</th>
                  <th className="text-left p-2">Status</th>
                </tr>
              </thead>
              <tbody>
                {listRecentAppointments.slice(0, 5).map((apt) => (
                  <tr key={apt.id} className="border-b">
                    <td className="p-2">{apt.patient_first_name} {apt.patient_last_name}</td>
                    <td className="p-2">{apt.doctor_first_name} {apt.doctor_last_name}</td>
                    <td className="p-2">{new Date(apt.appointment_date).toLocaleDateString()}</td>
                    <td className="p-2">{apt.appointment_time}</td>
                    <td className="p-2">
                      <span className={`px-2 py-1 rounded text-xs ${
                        apt.status === 'scheduled' ? 'bg-blue-100 text-blue-800' :
                        apt.status === 'completed' ? 'bg-emerald-100 text-emerald-800' :
                        'bg-rose-100 text-rose-800'
                      }`}>
                        {apt.status}
                      </span>
                    </td>
                  </tr>
                ))}
                {listRecentAppointments.length === 0 && (
                  <tr>
                    <td className="p-3 text-gray-500" colSpan={5}>No recent appointments</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;

