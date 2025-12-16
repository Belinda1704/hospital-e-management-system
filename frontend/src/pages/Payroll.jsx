import { useState, useEffect } from 'react';
import api from '../services/api';

const formatRWF = (value) => {
  const num = Number(value) || 0;
  return new Intl.NumberFormat('en-RW', { style: 'currency', currency: 'RWF', maximumFractionDigits: 0 }).format(num);
};

const defaultForm = {
  employee_id: '',
  month: new Date().getMonth() + 1,
  year: new Date().getFullYear(),
  base_salary: '',
  allowances: '0',
  deductions: '0',
  bonus: '0',
};

const Payroll = () => {
  const [payroll, setPayroll] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [form, setForm] = useState(defaultForm);
  
  let user = {};
  try {
    const userStr = localStorage.getItem('user') || sessionStorage.getItem('user') || '{}';
    user = JSON.parse(userStr);
  } catch (e) {
    console.error('Error parsing user data:', e);
  }

  const isAdmin = user.role === 'admin';

  useEffect(() => {
    fetchPayroll();
    if (isAdmin) {
      fetchEmployees();
    }
  }, []);

  const fetchPayroll = async () => {
    try {
      const endpoint = isAdmin ? '/payroll' : '/payroll/me';
      const response = await api.get(endpoint);
      setPayroll(response.data);
    } catch (error) {
      console.error('Failed to fetch payroll:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchEmployees = async () => {
    try {
      const response = await api.get('/employees');
      setEmployees(response.data);
    } catch (error) {
      console.error('Failed to fetch employees:', error);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    // Cast numeric fields to numbers
    if (['month', 'year', 'base_salary', 'allowances', 'deductions', 'bonus'].includes(name)) {
      setForm((prev) => ({ ...prev, [name]: value === '' ? '' : Number(value) }));
    } else {
      setForm((prev) => ({ ...prev, [name]: value }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setSaving(true);
    try {
      if (!form.employee_id || !form.month || !form.year || !form.base_salary) {
        setError('Please fill all required fields.');
        setSaving(false);
        return;
      }
      await api.post('/payroll', form);
      setSuccess('Payroll record created successfully.');
      setForm(defaultForm);
      fetchPayroll();
    } catch (err) {
      setError(err.response?.data?.error || err.message || 'Failed to create payroll');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div>Loading...</div>;

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-gray-800">Payroll</h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {isAdmin && (
          <div className="lg:col-span-1 bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">Create Payroll</h2>
            {error && <div className="mb-3 rounded bg-red-50 border border-red-200 text-red-700 text-sm p-3">{error}</div>}
            {success && <div className="mb-3 rounded bg-green-50 border border-green-200 text-green-700 text-sm p-3">{success}</div>}
            <form className="space-y-4" onSubmit={handleSubmit}>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Employee *</label>
                <select name="employee_id" value={form.employee_id} onChange={handleChange} required className="w-full border rounded px-3 py-2">
                  <option value="">Select employee</option>
                  {employees.map((emp) => (
                    <option key={emp.id} value={emp.id}>
                      {emp.first_name} {emp.last_name} - {emp.position}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Month *</label>
                  <select name="month" value={form.month} onChange={handleChange} required className="w-full border rounded px-3 py-2">
                    {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => (
                      <option key={m} value={m}>{new Date(2000, m - 1).toLocaleString('default', { month: 'long' })}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Year *</label>
                  <input name="year" type="number" min="2020" max="2100" value={form.year} onChange={handleChange} required className="w-full border rounded px-3 py-2" />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Base Salary (RWF) *</label>
                <input name="base_salary" type="number" min="0" step="1" value={form.base_salary} onChange={handleChange} required className="w-full border rounded px-3 py-2" />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Allowances (RWF)</label>
                <input name="allowances" type="number" min="0" step="1" value={form.allowances} onChange={handleChange} className="w-full border rounded px-3 py-2" />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Deductions (RWF)</label>
                <input name="deductions" type="number" min="0" step="1" value={form.deductions} onChange={handleChange} className="w-full border rounded px-3 py-2" />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Bonus (RWF)</label>
                <input name="bonus" type="number" min="0" step="1" value={form.bonus} onChange={handleChange} className="w-full border rounded px-3 py-2" />
              </div>

              <button
                type="submit"
                disabled={saving}
                className="w-full py-2 rounded bg-blue-600 text-white font-semibold hover:bg-blue-700 disabled:opacity-50"
              >
                {saving ? 'Creating...' : 'Create Payroll'}
              </button>
            </form>
          </div>
        )}

        <div className={isAdmin ? 'lg:col-span-2' : 'lg:col-span-3'}>
          <div className="bg-white rounded-lg shadow overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="p-4 text-left">Employee</th>
                  <th className="p-4 text-left">Month/Year</th>
                  <th className="p-4 text-left">Base Salary (RWF)</th>
                  <th className="p-4 text-left">Net Salary (RWF)</th>
                  <th className="p-4 text-left">Status</th>
                </tr>
              </thead>
              <tbody>
                {payroll.map((pay) => (
                  <tr key={pay.id} className="border-b">
                    <td className="p-4">{pay.first_name} {pay.last_name}</td>
                    <td className="p-4">{pay.month}/{pay.year}</td>
                    <td className="p-4">{formatRWF(pay.base_salary)}</td>
                    <td className="p-4">{formatRWF(pay.net_salary)}</td>
                    <td className="p-4">
                      <span className={`px-2 py-1 rounded text-xs ${
                        pay.status === 'paid' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                      }`}>
                        {pay.status}
                      </span>
                    </td>
                  </tr>
                ))}
                {payroll.length === 0 && (
                  <tr>
                    <td className="p-4 text-gray-500 text-sm" colSpan={5}>No payroll records yet.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Payroll;

