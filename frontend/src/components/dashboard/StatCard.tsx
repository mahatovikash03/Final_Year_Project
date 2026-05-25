import { motion } from 'framer-motion';

interface Props {
  label: string;
  value: string | number;
  unit?: string;
  icon: string;
  color: string;
  bgColor: string;
  change?: string;
  changeUp?: boolean;
  delay?: number;
}

export default function StatCard({ label, value, unit, icon, color, bgColor, change, changeUp, delay = 0 }: Props) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.5 }}
      className="glass-card-hover p-5"
    >
      <div className="flex items-start justify-between mb-4">
        <div className={`w-11 h-11 rounded-2xl ${bgColor} flex items-center justify-center text-xl`}>
          {icon}
        </div>
        {change && (
          <span className={`text-xs font-medium px-2 py-1 rounded-full ${changeUp ? 'badge-green' : 'badge-red'}`}>
            {changeUp ? '↑' : '↓'} {change}
          </span>
        )}
      </div>
      <p className={`text-3xl font-bold ${color} mb-1`}>
        {typeof value === 'number' ? value.toFixed(value % 1 === 0 ? 0 : 1) : value}
      </p>
      {unit && <p className="text-xs text-gray-500 mb-1">{unit}</p>}
      <p className="text-sm text-gray-400">{label}</p>
    </motion.div>
  );
}
