import { useState, useEffect } from 'react';
import api from '../services/api';

const defaultForm = {
  role: 'doctor',
  first_name: '',
  last_name: '',
  email: '',
  password: '',
  department_id: '',
  position: '',
  specialization: '',
  hire_date: '',
  salary: '',
};

const Staff = () => {
  const [staff, setStaff] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [form, setForm] = useState(defaultForm);

  useEffect(() => {
    fetchStaff();
    fetchDepartments();
  }, []);

  const fetchStaff = async () => {
    try {
      const response = await api.get('/staff');
      setStaff(response.data);
    } catch (error) {
      console.error('Failed to fetch staff:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchDepartments = async () => {
    try {
      const response = await api.get('/departments');
      setDepartments(response.data);
    } catch (error) {
      console.error('Failed to fetch departments:', error);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setSaving(true);
    try {
      if (!form.first_name || !form.last_name || !form.email || !form.password || !form.position || !form.hire_date) {
        setError('Please fill all required fields.');
        setSaving(false);
        return;
      }
      if (!['doctor', 'nurse', 'staff', 'admin'].includes(form.role)) {
        setError('Invalid role selected.');
        setSaving(false);
        return;
      }
      await api.post('/staff', form);
      setSuccess('Staff member created.');
      setForm(defaultForm);
      fetchStaff();
    } catch (err) {
      setError(err.response?.data?.error || err.message || 'Failed to create staff');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div>Loading...</div>;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-800">Staff Management</h1>
        <span className="text-sm text-gray-500">Admin can create doctors, nurses, staff, and admins here.</span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1 bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">Create Staff</h2>
          {error && <div className="mb-3 rounded bg-red-50 border border-red-200 text-red-700 text-sm p-3">{error}</div>}
          {success && <div className="mb-3 rounded bg-green-50 border border-green-200 text-green-700 text-sm p-3">{success}</div>}
          <form className="space-y-4" onSubmit={handleSubmit}>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Role</label>
              <div className="grid grid-cols-2 gap-2">
                {['doctor', 'nurse', 'staff', 'admin'].map((r) => (
                  <button
                    key={r}
                    type="button"
                    onClick={() => setForm((prev) => ({ ...prev, role: r }))}
                    className={`py-2 px-3 rounded border ${form.role === r ? 'bg-blue-600 text-white border-blue-600' : 'bg-gray-50 text-gray-700 border-gray-200'}`}
                  >
                    {r.charAt(0).toUpperCase() + r.slice(1)}
                  </button>
                ))}
              </div>
              <p className="text-xs text-gray-500 mt-1">Admin accounts should be created only by an existing admin.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">First name</label>
                <input name="first_name" value={form.first_name} onChange={handleChange} required className="w-full border rounded px-3 py-2" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Last name</label>
                <input name="last_name" value={form.last_name} onChange={handleChange} required className="w-full border rounded px-3 py-2" />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
              <input name="email" type="email" value={form.email} onChange={handleChange} required className="w-full border rounded px-3 py-2" />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
              <input name="password" type="password" value={form.password} onChange={handleChange} required className="w-full border rounded px-3 py-2" />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Position</label>
                <input name="position" value={form.position} onChange={handleChange} required className="w-full border rounded px-3 py-2" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Department</label>
                <select name="department_id" value={form.department_id} onChange={handleChange} className="w-full border rounded px-3 py-2">
                  <option value="">Select department</option>
                  {departments.map((dept) => (
                    <option key={dept.id} value={dept.id}>{dept.name}</option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Specialization (if doctor)</label>
              <input name="specialization" value={form.specialization} onChange={handleChange} className="w-full border rounded px-3 py-2" />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Hire date</label>
                <input name="hire_date" type="date" value={form.hire_date} onChange={handleChange} required className="w-full border rounded px-3 py-2" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Salary (RWF)</label>
                <input name="salary" type="number" min="0" step="1" value={form.salary} onChange={handleChange} className="w-full border rounded px-3 py-2" />
              </div>
            </div>

            <button
              type="submit"
              disabled={saving}
              className="w-full py-2 rounded bg-blue-600 text-white font-semibold hover:bg-blue-700 disabled:opacity-50"
            >
              {saving ? 'Saving...' : 'Create staff'}
            </button>
          </form>
        </div>

        <div className="lg:col-span-2 bg-white rounded-lg shadow overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b">
                <th className="p-4 text-left">Name</th>
                <th className="p-4 text-left">Role</th>
                <th className="p-4 text-left">Position</th>
                <th className="p-4 text-left">Department</th>
              </tr>
            </thead>
            <tbody>
              {staff.map((member) => (
                <tr key={member.id} className="border-b">
                  <td className="p-4">{member.first_name} {member.last_name}</td>
                  <td className="p-4 capitalize">{member.role}</td>
                  <td className="p-4">{member.position}</td>
                  <td className="p-4">{member.department_name}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Staff;

