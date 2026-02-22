import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { getSuitSymbol, getSuitColor } from '../utils/gameLogic';
import { Suit } from '../types';

interface SuitSelectorProps {
  onSelect: (suit: Suit) => void;
}

export const SuitSelector: React.FC<SuitSelectorProps> = ({ onSelect }) => {
  const suits: Suit[] = ['hearts', 'diamonds', 'clubs', 'spades'];

  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
    >
      <div className="bg-blue-950 p-8 rounded-3xl border border-blue-800 shadow-2xl max-w-md w-full mx-4">
        <h2 className="text-2xl font-bold text-center mb-6 text-white">选择一个花色</h2>
        <div className="grid grid-cols-2 gap-4">
          {suits.map((suit) => (
            <button
              key={suit}
              onClick={() => onSelect(suit)}
              className={`
                flex flex-col items-center justify-center p-6 rounded-2xl border-2 border-blue-800 
                hover:border-emerald-500 hover:bg-blue-900 transition-all group
              `}
            >
              <span className={`text-6xl mb-2 ${getSuitColor(suit)} group-hover:scale-110 transition-transform`}>
                {getSuitSymbol(suit)}
              </span>
              <span className="text-slate-400 capitalize font-medium">{suit}</span>
            </button>
          ))}
        </div>
      </div>
    </motion.div>
  );
};
