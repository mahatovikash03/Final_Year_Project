import { motion } from 'framer-motion';
import { Bar } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend,
} from 'chart.js';

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

interface Props {
  trend: { date: string; score: number }[];
}

export default function ScoreBarChart({ trend }: Props) {
  const labels = trend.map(t =>
    new Date(t.date).toLocaleDateString('en-IN', { weekday: 'short' })
  );
  const scores = trend.map(t => t.score);

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.3 }}
      className="backdrop-blur-md bg-white/5 border border-white/10 rounded-2xl p-5"
    >
      <h2 className="text-lg font-semibold mb-4 text-purple-300">Daily Score Breakdown</h2>
      <Bar
        data={{
          labels,
          datasets: [{
            label: 'Score',
            data: scores,
            backgroundColor: scores.map(s =>
              s >= 70 ? 'rgba(52,211,153,0.7)' :
              s >= 50 ? 'rgba(251,191,36,0.7)' :
                        'rgba(248,113,113,0.7)'
            ),
            borderRadius: 8,
            borderSkipped: false,
          }],
        }}
        options={{
          responsive: true,
          plugins: { legend: { display: false } },
          scales: {
            y: {
              min: 0,
              max: 100,
              ticks: { color: '#94a3b8' },
              grid: { color: 'rgba(255,255,255,0.05)' },
            },
            x: {
              ticks: { color: '#94a3b8' },
              grid: { display: false },
            },
          },
        }}
      />
    </motion.div>
  );
}
