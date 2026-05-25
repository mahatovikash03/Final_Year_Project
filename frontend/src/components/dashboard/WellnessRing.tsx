import { motion } from 'framer-motion';

interface Props {
  score: number;
  size?: number;
}

export default function WellnessRing({ score, size = 140 }: Props) {
  const radius = (size - 20) / 2;
  const circ   = 2 * Math.PI * radius;
  const offset = circ - (score / 100) * circ;
  const color  = score >= 70 ? '#34d399' : score >= 50 ? '#fbbf24' : '#f87171';
  const label  = score >= 70 ? 'Excellent' : score >= 50 ? 'Good' : 'Needs Work';

  return (
    <div className="flex flex-col items-center">
      <motion.svg
        width={size}
        height={size}
        initial={{ rotate: -90 }}
        animate={{ rotate: -90 }}
        className="drop-shadow-lg"
      >
        {/* Track */}
        <circle cx={size/2} cy={size/2} r={radius} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth={10} />
        {/* Progress */}
        <motion.circle
          cx={size/2} cy={size/2} r={radius}
          fill="none"
          stroke={color}
          strokeWidth={10}
          strokeLinecap="round"
          strokeDasharray={circ}
          initial={{ strokeDashoffset: circ }}
          animate={{ strokeDashoffset: offset }}
          transition={{ duration: 1.2, ease: 'easeOut' }}
          style={{ filter: `drop-shadow(0 0 6px ${color})` }}
        />
        {/* Center text */}
        <text x={size/2} y={size/2 - 6} textAnchor="middle" fill="white" fontSize={size/5} fontWeight="800" transform={`rotate(90, ${size/2}, ${size/2})`}>
          {score}
        </text>
        <text x={size/2} y={size/2 + 14} textAnchor="middle" fill={color} fontSize={size/12} transform={`rotate(90, ${size/2}, ${size/2})`}>
          {label}
        </text>
      </motion.svg>
      <p className="text-gray-400 text-xs mt-2">Wellness Score</p>
    </div>
  );
}
