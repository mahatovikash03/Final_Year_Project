import { motion } from 'framer-motion';
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale, LinearScale, PointElement,
  LineElement, Title, Tooltip, Legend, Filler,
} from 'chart.js';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, Filler);

interface Props {
  trend: { date: string; score: number }[];
}

export default function WellnessChart({ trend }: Props) {
  const labels = trend.map(t =>
    new Date(t.date).toLocaleDateString('en-IN', { weekday: 'short' })
  );
  const scores = trend.map(t => t.score);

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.2 }}
      className="backdrop-blur-md bg-white/5 border border-white/10 rounded-2xl p-5"
    >
      <h2 className="text-lg font-semibold mb-4 text-blue-300">Weekly Wellness Score</h2>
      <Line
        data={{
          labels,
          datasets: [{
            label: 'Wellness Score',
            data: scores,
            borderColor: '#60a5fa',
            backgroundColor: 'rgba(96,165,250,0.15)',
            fill: true,
            tension: 0.4,
            pointBackgroundColor: '#60a5fa',
            pointRadius: 5,
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
              grid: { color: 'rgba(255,255,255,0.05)' },
            },
          },
        }}
      />
    </motion.div>
  );
}
