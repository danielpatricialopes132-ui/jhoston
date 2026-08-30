"use client"
import { useEffect } from 'react';

export default function EasterEggs() {
  useEffect(() => {
    // Konami code: up up down down left right left right B A
    const konamiCode = [
      'ArrowUp', 'ArrowUp', 'ArrowDown', 'ArrowDown',
      'ArrowLeft', 'ArrowRight', 'ArrowLeft', 'ArrowRight',
      'b', 'a'
    ];
    let konamiIndex = 0;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === konamiCode[konamiIndex]) {
        konamiIndex++;
        if (konamiIndex === konamiCode.length) {
          triggerKonamiEgg();
          konamiIndex = 0;
        }
      } else {
        konamiIndex = 0;
      }

      // Matrix easter egg trick key
      if (e.ctrlKey && e.shiftKey && e.key === 'M') {
        document.body.classList.toggle('matrix-mode');
      }
    };

    const triggerKonamiEgg = () => {
      alert("🌊 VOCÊ DESBLOQUEOU O MASTER LEVEL DA JHOSTON TEC! 🌊");
      document.body.classList.add('do-a-barrel-roll');
      setTimeout(() => {
        document.body.classList.remove('do-a-barrel-roll');
      }, 1500);
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  return null;
}
