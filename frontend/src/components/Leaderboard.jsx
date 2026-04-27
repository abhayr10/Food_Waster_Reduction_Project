import React, { useState, useEffect } from 'react';
import { Trophy, Medal, Award } from 'lucide-react';

const Leaderboard = () => {
  const [leaders, setLeaders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Fetch the top donors from the Flask backend
    fetch('http://localhost:5000/api/donations/leaderboard')
      .then(res => res.json())
      .then(data => {
        if (data.status === 'Success') {
          setLeaders(data.leaderboard);
        }
        setLoading(false);
      })
      .catch(err => {
        console.error("Error fetching leaderboard:", err);
        setLoading(false);
      });
  }, []);

  // Helper to give gold, silver, and bronze icons
  const getRankIcon = (index) => {
    switch(index) {
      case 0: return <Trophy className="w-6 h-6 text-yellow-500" />;
      case 1: return <Medal className="w-6 h-6 text-gray-400" />;
      case 2: return <Medal className="w-6 h-6 text-amber-600" />;
      default: return <Award className="w-6 h-6 text-blue-400" />;
    }
  };

  if (loading) {
    return <div className="text-center py-4 text-gray-500">Loading Leaderboard...</div>;
  }

  return (
    <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-100 max-w-md mx-auto my-8 w-full">
      <div className="flex items-center justify-center gap-3 mb-6 pb-4 border-b border-gray-100">
        <Trophy className="w-8 h-8 text-yellow-500" />
        <h2 className="text-2xl font-bold text-gray-800">Top Zero-Waste Heroes</h2>
      </div>
      
      <div className="space-y-4">
        {leaders.length > 0 ? (
          leaders.map((leader, index) => (
            <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors border border-gray-100">
              <div className="flex items-center gap-4">
                <div className="flex items-center justify-center w-8">
                  {getRankIcon(index)}
                </div>
                <span className="font-semibold text-gray-700 text-lg">{leader.name}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="bg-green-100 text-green-800 py-1 px-3 rounded-full text-sm font-bold shadow-sm">
                  {leader.donations} Rescues
                </span>
              </div>
            </div>
          ))
        ) : (
          <p className="text-center text-gray-500 italic py-4">No donations completed yet. Be the first to top the board!</p>
        )}
      </div>
    </div>
  );
};

export default Leaderboard;