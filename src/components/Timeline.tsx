
import React, { useEffect, useRef } from 'react';
import { STAGES, STEP_ICONS } from '../constants.ts';
import { Stage } from '../types.ts';
import { Check } from 'lucide-react';

interface TimelineProps {
  currentStageId: string;
  onSelectStage: (stage: Stage) => void;
}

export const Timeline: React.FC<TimelineProps> = ({ currentStageId, onSelectStage }) => {
  const currentStageIndex = STAGES.findIndex(s => s.id === currentStageId);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      const activeElement = scrollRef.current.querySelector('[data-active="true"]');
      if (activeElement) {
        activeElement.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
      }
    }
  }, [currentStageId]);

  return (
    <div className="bg-white rounded-[2rem] shadow-sm border border-gray-200 w-full relative overflow-hidden shrink-0">
      <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-brand-900 via-brand-600 to-gold-500"></div>
      
      <div 
        ref={scrollRef}
        className="flex overflow-x-auto gap-3 p-4 scrollbar-hide snap-x"
        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
      >
        {STAGES.map((stage, index) => {
          const Icon = STEP_ICONS[stage.stepNumber] || STEP_ICONS['1'];
          const isActive = stage.id === currentStageId;
          const isCompleted = index < currentStageIndex;

          return (
            <div 
              key={stage.id}
              data-active={isActive}
              onClick={() => onSelectStage(stage)}
              className={`
                shrink-0 snap-center cursor-pointer transition-all duration-300
                flex flex-col items-center gap-2 p-3 rounded-2xl min-w-[130px] border
                ${isActive 
                  ? 'bg-brand-50 border-brand-200 shadow-md scale-105 z-10' 
                  : isCompleted
                    ? 'bg-gray-50 border-gold-100 opacity-80'
                    : 'bg-transparent border-transparent opacity-40 hover:opacity-100'
                }
              `}
            >
              <div 
                className={`
                  flex items-center justify-center w-10 h-10 rounded-xl border-2 transition-all shadow-sm
                  ${isActive 
                    ? 'border-brand-900 bg-brand-900 text-gold-400' 
                    : isCompleted 
                      ? 'border-gold-500 bg-gold-50 text-gold-600' 
                      : 'border-gray-200 bg-white text-gray-300'
                  }
                `}
              >
                {isCompleted ? <Check size={18} strokeWidth={3} /> : <Icon size={18} />}
              </div>
              
              <div className="flex flex-col items-center text-center">
                <span className={`text-[7px] uppercase font-black tracking-[0.2em] ${isActive ? 'text-brand-600' : 'text-gray-400'}`}>Passo {stage.stepNumber}</span>
                <h3 className={`text-[9px] font-black uppercase leading-tight mt-1 ${isActive ? 'text-brand-900' : 'text-gray-500'}`}>
                  {stage.title}
                </h3>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
