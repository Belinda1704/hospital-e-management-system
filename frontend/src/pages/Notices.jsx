import { useState, useEffect } from 'react';
import api from '../services/api';

const Notices = () => {
  const [notices, setNotices] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchNotices();
  }, []);

  const fetchNotices = async () => {
    try {
      const response = await api.get('/notices');
      setNotices(response.data);
    } catch (error) {
      console.error('Failed to fetch notices:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div>Loading...</div>;

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-gray-800">Notices</h1>
      <div className="space-y-4">
        {notices.map((notice) => (
          <div key={notice.id} className="bg-white p-6 rounded-lg shadow">
            <div className="flex justify-between items-start mb-2">
              <h3 className="text-xl font-bold">{notice.title}</h3>
              <span className={`px-2 py-1 rounded text-xs ${
                notice.priority === 'urgent' ? 'bg-red-100 text-red-800' :
                notice.priority === 'high' ? 'bg-orange-100 text-orange-800' :
                'bg-blue-100 text-blue-800'
              }`}>
                {notice.priority}
              </span>
            </div>
            <p className="text-gray-600 mb-2">{notice.content}</p>
            <p className="text-sm text-gray-500">
              {new Date(notice.created_at).toLocaleDateString()}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Notices;




