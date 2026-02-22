import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Trophy, RotateCcw, Info, User, Cpu, ChevronRight } from 'lucide-react';
import { Card } from './components/Card';
import { SuitSelector } from './components/SuitSelector';
import { 
  CardData, 
  Suit, 
  Rank, 
  GameStatus, 
  GameState 
} from './types';
import { 
  createDeck, 
  canPlayCard, 
  getSuitSymbol, 
  getSuitColor 
} from './utils/gameLogic';

const INITIAL_HAND_SIZE = 8;

export default function App() {
  const [gameState, setGameState] = useState<GameState>({
    deck: [],
    playerHand: [],
    aiHand: [],
    discardPile: [],
    currentSuit: 'hearts',
    currentRank: null,
    status: 'dealing',
    winner: null,
    message: '正在准备游戏...'
  });

  const [showSuitSelector, setShowSuitSelector] = useState(false);
  const [pendingWildCard, setPendingWildCard] = useState<CardData | null>(null);

  // Initialize Game
  const initGame = useCallback(() => {
    const fullDeck = createDeck();
    const playerHand = fullDeck.splice(0, INITIAL_HAND_SIZE);
    const aiHand = fullDeck.splice(0, INITIAL_HAND_SIZE);
    
    // Find first non-8 card for discard pile
    let firstDiscardIndex = 0;
    while (fullDeck[firstDiscardIndex].rank === '8') {
      firstDiscardIndex++;
    }
    const firstDiscard = fullDeck.splice(firstDiscardIndex, 1)[0];

    setGameState({
      deck: fullDeck,
      playerHand,
      aiHand,
      discardPile: [firstDiscard],
      currentSuit: firstDiscard.suit,
      currentRank: firstDiscard.rank,
      status: 'player_turn',
      winner: null,
      message: '轮到你了！出牌或摸牌。'
    });
  }, []);

  useEffect(() => {
    initGame();
  }, [initGame]);

  // Player Actions
  const handlePlayCard = (card: CardData) => {
    if (gameState.status !== 'player_turn') return;
    
    if (!canPlayCard(card, gameState.currentSuit, gameState.currentRank)) {
      setGameState(prev => ({ ...prev, message: '这张牌不能出！' }));
      return;
    }

    if (card.rank === '8') {
      setPendingWildCard(card);
      setShowSuitSelector(true);
      setGameState(prev => ({ ...prev, status: 'suit_selection' }));
      return;
    }

    executeMove('player', card);
  };

  const handleDrawCard = () => {
    if (gameState.status !== 'player_turn') return;

    if (gameState.deck.length === 0) {
      setGameState(prev => ({ 
        ...prev, 
        status: 'ai_turn', 
        message: '摸牌堆已空，跳过回合。' 
      }));
      return;
    }

    const newDeck = [...gameState.deck];
    const drawnCard = newDeck.pop()!;
    
    setGameState(prev => ({
      ...prev,
      deck: newDeck,
      playerHand: [...prev.playerHand, drawnCard],
      message: `你摸了一张 ${drawnCard.rank}${getSuitSymbol(drawnCard.suit)}`,
      status: canPlayCard(drawnCard, prev.currentSuit, prev.currentRank) ? 'player_turn' : 'ai_turn'
    }));
  };

  const handleSuitSelect = (suit: Suit) => {
    if (!pendingWildCard) return;

    const newPlayerHand = gameState.playerHand.filter(c => c.id !== pendingWildCard.id);
    
    setGameState(prev => ({
      ...prev,
      playerHand: newPlayerHand,
      discardPile: [pendingWildCard, ...prev.discardPile],
      currentSuit: suit,
      currentRank: null,
      status: newPlayerHand.length === 0 ? 'game_over' : 'ai_turn',
      winner: newPlayerHand.length === 0 ? 'player' : null,
      message: `你出了 8，指定花色为 ${suit.toUpperCase()}`
    }));

    setShowSuitSelector(false);
    setPendingWildCard(null);
  };

  const executeMove = (who: 'player' | 'ai', card: CardData, newSuit?: Suit) => {
    const isPlayer = who === 'player';
    const hand = isPlayer ? gameState.playerHand : gameState.aiHand;
    const newHand = hand.filter(c => c.id !== card.id);
    
    setGameState(prev => ({
      ...prev,
      [isPlayer ? 'playerHand' : 'aiHand']: newHand,
      discardPile: [card, ...prev.discardPile],
      currentSuit: newSuit || card.suit,
      currentRank: card.rank === '8' ? null : card.rank,
      status: newHand.length === 0 ? 'game_over' : (isPlayer ? 'ai_turn' : 'player_turn'),
      winner: newHand.length === 0 ? who : null,
      message: isPlayer ? 'AI 正在思考...' : `AI 出了 ${card.rank}${getSuitSymbol(card.suit)}`
    }));
  };

  // AI Logic
  useEffect(() => {
    if (gameState.status === 'ai_turn' && !gameState.winner) {
      const timer = setTimeout(() => {
        const playableCards = gameState.aiHand.filter(c => 
          canPlayCard(c, gameState.currentSuit, gameState.currentRank)
        );

        if (playableCards.length > 0) {
          // AI Strategy: Play non-8 cards first
          const nonEight = playableCards.find(c => c.rank !== '8');
          const cardToPlay = nonEight || playableCards[0];

          if (cardToPlay.rank === '8') {
            // AI picks suit it has most of
            const suitCounts: Record<Suit, number> = { hearts: 0, diamonds: 0, clubs: 0, spades: 0 };
            gameState.aiHand.forEach(c => {
              if (c.id !== cardToPlay.id) suitCounts[c.suit]++;
            });
            const bestSuit = (Object.keys(suitCounts) as Suit[]).reduce((a, b) => 
              suitCounts[a] > suitCounts[b] ? a : b
            );
            executeMove('ai', cardToPlay, bestSuit);
          } else {
            executeMove('ai', cardToPlay);
          }
        } else {
          // AI must draw
          if (gameState.deck.length > 0) {
            const newDeck = [...gameState.deck];
            const drawnCard = newDeck.pop()!;
            const canPlayDrawn = canPlayCard(drawnCard, gameState.currentSuit, gameState.currentRank);
            
            setGameState(prev => ({
              ...prev,
              deck: newDeck,
              aiHand: [...prev.aiHand, drawnCard],
              message: 'AI 摸了一张牌',
              status: canPlayDrawn ? 'ai_turn' : 'player_turn'
            }));
          } else {
            setGameState(prev => ({
              ...prev,
              status: 'player_turn',
              message: 'AI 无法出牌且摸牌堆已空，跳过回合。'
            }));
          }
        }
      }, 1500);
      return () => clearTimeout(timer);
    }
  }, [gameState.status, gameState.aiHand, gameState.currentSuit, gameState.currentRank, gameState.deck, gameState.winner]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-between p-4 md:p-8 relative overflow-hidden">
      {/* Background Decor */}
      <div className="absolute top-0 left-0 w-full h-full opacity-10 pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-600 rounded-full blur-[120px]" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-indigo-500 rounded-full blur-[120px]" />
      </div>

      {/* Header */}
      <header className="w-full max-w-6xl flex justify-between items-center z-10">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-emerald-500 rounded-xl flex items-center justify-center shadow-lg shadow-emerald-500/20">
            <span className="text-2xl font-black text-white">8</span>
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight">eason&nalu</h1>
            <p className="text-xs text-blue-400 font-mono uppercase tracking-widest">Crazy Eights Edition</p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="hidden md:flex flex-col items-end mr-4">
            <span className="text-xs text-blue-500 uppercase font-bold tracking-tighter">Current Suit</span>
            <div className={`flex items-center gap-1 text-xl font-bold ${getSuitColor(gameState.currentSuit)}`}>
              {getSuitSymbol(gameState.currentSuit)}
              <span className="capitalize text-sm">{gameState.currentSuit}</span>
            </div>
          </div>
          <button 
            onClick={initGame}
            className="p-3 rounded-xl bg-blue-900 hover:bg-blue-800 text-blue-300 transition-colors border border-blue-800"
          >
            <RotateCcw size={20} />
          </button>
        </div>
      </header>

      {/* Game Area */}
      <main className="flex-grow w-full max-w-7xl flex flex-col justify-center gap-8 md:gap-12 z-10">
        
        {/* AI Hand */}
        <div className="flex flex-col items-center gap-4">
          <div className="flex items-center gap-2 px-4 py-1 bg-blue-900/50 rounded-full border border-blue-800">
            <Cpu size={14} className="text-blue-400" />
            <span className="text-xs font-mono text-blue-400">AI OPPONENT ({gameState.aiHand.length})</span>
          </div>
          <div className="flex justify-center -space-x-12 md:-space-x-16">
            <AnimatePresence>
              {gameState.aiHand.map((card, index) => (
                <Card 
                  key={card.id} 
                  card={card} 
                  isFaceUp={false} 
                  disabled 
                  className="scale-75 md:scale-90"
                />
              ))}
            </AnimatePresence>
          </div>
        </div>

        {/* Center Table */}
        <div className="flex flex-col md:flex-row items-center justify-center gap-8 md:gap-24">
          {/* Draw Pile */}
          <div className="relative group">
            <div className="absolute -inset-4 bg-emerald-500/5 rounded-full blur-2xl opacity-0 group-hover:opacity-100 transition-opacity" />
            <div 
              onClick={handleDrawCard}
              className={`
                relative w-24 h-36 md:w-32 md:h-48 rounded-xl border-2 border-dashed border-blue-700 
                flex flex-col items-center justify-center cursor-pointer hover:border-emerald-500 transition-all
                ${gameState.status !== 'player_turn' ? 'opacity-50 cursor-not-allowed' : ''}
              `}
            >
              {gameState.deck.length > 0 ? (
                <>
                  <div className="absolute inset-0 bg-blue-900 rounded-xl -rotate-2 translate-x-1 translate-y-1 border border-blue-800" />
                  <div className="absolute inset-0 bg-blue-900 rounded-xl rotate-1 -translate-x-1 -translate-y-1 border border-blue-800" />
                  <div className="relative w-full h-full bg-blue-900 rounded-xl border-2 border-blue-800 flex items-center justify-center overflow-hidden">
                     <div className="w-12 h-12 rounded-full bg-blue-950 flex items-center justify-center border border-blue-800">
                        <span className="text-xl font-bold text-blue-500">{gameState.deck.length}</span>
                     </div>
                  </div>
                </>
              ) : (
                <span className="text-blue-600 font-mono text-xs">EMPTY</span>
              )}
              <span className="absolute -bottom-6 text-[10px] font-mono text-blue-500 uppercase tracking-widest">Draw Pile</span>
            </div>
          </div>

          {/* Discard Pile */}
          <div className="relative">
            <div className="absolute -inset-8 bg-blue-500/5 rounded-full blur-3xl" />
            <div className="relative w-24 h-36 md:w-32 md:h-48">
              <AnimatePresence mode="popLayout">
                {gameState.discardPile.slice(0, 3).reverse().map((card, i) => (
                  <motion.div
                    key={card.id}
                    initial={{ scale: 0.8, opacity: 0, rotate: i * 5 }}
                    animate={{ scale: 1, opacity: 1, rotate: i * 2 }}
                    exit={{ scale: 1.2, opacity: 0 }}
                    className="absolute inset-0"
                  >
                    <Card card={card} disabled className="shadow-2xl" />
                  </motion.div>
                ))}
              </AnimatePresence>
              <span className="absolute -bottom-6 left-1/2 -translate-x-1/2 text-[10px] font-mono text-blue-500 uppercase tracking-widest whitespace-nowrap">Discard Pile</span>
            </div>
          </div>
        </div>

        {/* Player Hand */}
        <div className="flex flex-col items-center gap-6">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 px-4 py-1 bg-blue-900/50 rounded-full border border-blue-800">
              <User size={14} className="text-emerald-400" />
              <span className="text-xs font-mono text-blue-400 uppercase tracking-wider">Your Hand ({gameState.playerHand.length})</span>
            </div>
            <div className="h-4 w-px bg-blue-800" />
            <div className="text-sm font-medium text-emerald-400 animate-pulse">
              {gameState.message}
            </div>
          </div>
          
          <div className="flex justify-center flex-wrap gap-2 md:gap-4 max-w-4xl px-4">
            <AnimatePresence>
              {gameState.playerHand.map((card) => (
                <Card 
                  key={card.id} 
                  card={card} 
                  onClick={() => handlePlayCard(card)}
                  isPlayable={gameState.status === 'player_turn' && canPlayCard(card, gameState.currentSuit, gameState.currentRank)}
                  disabled={gameState.status !== 'player_turn'}
                />
              ))}
            </AnimatePresence>
          </div>
        </div>
      </main>

      {/* Footer / Status Bar */}
      <footer className="w-full max-w-6xl mt-8 flex justify-between items-center text-blue-500 text-[10px] font-mono uppercase tracking-widest z-10">
        <div className="flex gap-4">
          <span>Rules: Crazy Eights</span>
          <span>•</span>
          <span>Wild Card: 8</span>
        </div>
        <div className="flex gap-4">
          <div className="flex items-center gap-1">
             <div className="w-2 h-2 rounded-full bg-emerald-500" />
             <span>Connected</span>
          </div>
        </div>
      </footer>

      {/* Modals */}
      <AnimatePresence>
        {showSuitSelector && (
          <SuitSelector onSelect={handleSuitSelect} />
        )}

        {gameState.winner && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-md p-4"
          >
            <motion.div 
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              className="bg-blue-950 border border-blue-800 p-12 rounded-[2rem] shadow-2xl max-w-md w-full text-center"
            >
              <div className={`w-24 h-24 mx-auto mb-6 rounded-3xl flex items-center justify-center ${gameState.winner === 'player' ? 'bg-emerald-500' : 'bg-red-500'} shadow-2xl`}>
                <Trophy size={48} className="text-white" />
              </div>
              <h2 className="text-4xl font-black mb-2 text-white">
                {gameState.winner === 'player' ? '你赢了！' : '游戏结束'}
              </h2>
              <p className="text-blue-400 mb-8">
                {gameState.winner === 'player' ? '太棒了，你清空了所有手牌！' : 'AI 赢得了这一局。再试一次？'}
              </p>
              <button 
                onClick={initGame}
                className="w-full py-4 bg-white text-blue-950 font-bold rounded-2xl hover:bg-emerald-400 transition-colors flex items-center justify-center gap-2"
              >
                <RotateCcw size={20} />
                重新开始
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Mobile Suit Indicator */}
      <div className="md:hidden fixed bottom-4 right-4 z-50">
         <div className="bg-blue-900/80 backdrop-blur border border-blue-800 p-3 rounded-2xl shadow-xl flex items-center gap-2">
            <span className="text-[10px] font-mono text-blue-500 uppercase">Suit</span>
            <span className={`text-2xl ${getSuitColor(gameState.currentSuit)}`}>{getSuitSymbol(gameState.currentSuit)}</span>
         </div>
      </div>
    </div>
  );
}
