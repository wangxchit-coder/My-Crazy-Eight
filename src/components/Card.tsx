import React from 'react';
import { motion } from 'motion/react';
import { getSuitSymbol, getSuitColor } from '../utils/gameLogic';
import { CardData } from '../types';

interface CardProps {
  card: CardData;
  isFaceUp?: boolean;
  onClick?: () => void;
  disabled?: boolean;
  className?: string;
  isPlayable?: boolean;
}

export const Card: React.FC<CardProps> = ({ 
  card, 
  isFaceUp = true, 
  onClick, 
  disabled = false,
  className = "",
  isPlayable = false
}) => {
  const suitSymbol = getSuitSymbol(card.suit);
  const suitColor = getSuitColor(card.suit);

  return (
    <motion.div
      layout
      initial={{ scale: 0.8, opacity: 0, y: 20 }}
      animate={{ scale: 1, opacity: 1, y: 0 }}
      whileHover={isPlayable && !disabled ? { y: -15, scale: 1.05 } : {}}
      onClick={!disabled ? onClick : undefined}
      className={`
        relative w-24 h-36 md:w-32 md:h-48 rounded-xl cursor-pointer select-none transition-shadow
        ${isFaceUp ? 'bg-white' : 'bg-blue-900 border-2 border-blue-800'}
        ${isPlayable && !disabled ? 'ring-4 ring-emerald-400 shadow-lg shadow-emerald-400/20' : 'shadow-md'}
        ${disabled ? 'cursor-not-allowed opacity-80' : ''}
        ${className}
      `}
    >
      {isFaceUp ? (
        <div className={`flex flex-col h-full p-2 md:p-3 ${suitColor}`}>
          <div className="flex justify-between items-start">
            <span className="text-xl md:text-2xl font-bold leading-none">{card.rank}</span>
            <span className="text-lg md:text-xl leading-none">{suitSymbol}</span>
          </div>
          
          <div className="flex-grow flex items-center justify-center">
            <span className="text-4xl md:text-6xl">{suitSymbol}</span>
          </div>
          
          <div className="flex justify-between items-end rotate-180">
            <span className="text-xl md:text-2xl font-bold leading-none">{card.rank}</span>
            <span className="text-lg md:text-xl leading-none">{suitSymbol}</span>
          </div>
          
          {card.rank === '8' && (
            <div className="absolute inset-0 flex items-center justify-center opacity-10 pointer-events-none">
              <span className="text-8xl font-black">8</span>
            </div>
          )}
        </div>
      ) : (
        <div className="w-full h-full rounded-xl flex items-center justify-center overflow-hidden">
          <div className="w-full h-full bg-blue-900 flex items-center justify-center p-2">
             <div className="w-full h-full border-2 border-blue-800 rounded-lg flex items-center justify-center bg-blue-950/50">
                <div className="grid grid-cols-3 gap-1 opacity-20">
                   {[...Array(9)].map((_, i) => (
                     <div key={i} className="w-2 h-2 bg-blue-400 rounded-full" />
                   ))}
                </div>
             </div>
          </div>
        </div>
      )}
    </motion.div>
  );
};
