import { useState, useEffect } from 'react';
import api from '../services/api';

const Departments = () => {
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDepartments();
  }, []);

  const fetchDepartments = async () => {
    try {
      const response = await api.get('/departments');
      setDepartments(response.data);
    } catch (error) {
      console.error('Failed to fetch departments:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div>Loading...</div>;

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-gray-800">Departments</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {departments.map((dept) => (
          <div key={dept.id} className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-xl font-bold mb-2">{dept.name}</h3>
            <p className="text-gray-600 mb-4">{dept.description}</p>
            {dept.head_first_name && (
              <p className="text-sm text-gray-500">
                Head: {dept.head_first_name} {dept.head_last_name}
              </p>
            )}
            <p className="text-sm text-gray-500 mt-2">
              Employees: {dept.employee_count || 0}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Departments;




