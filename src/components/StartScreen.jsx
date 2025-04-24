import React from 'react';
import * as motion from "motion/react-client"

const StartScreen = ({ onStartGame }) => {
  return (
    <div className="relative w-full h-screen bg-black text-yellow-400 font-pixel overflow-hidden p-10 flex flex-col items-center justify-center text-center">

      <motion.h1
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 1}}
            className="text-cyan-400 text-7xl drop-shadow-[6px_0_6px_rgba(0,255,255,0.75)] mb-10"
          >
            ARCHO
      </motion.h1>
      
      <motion.div
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 1, delay: 0.5 }}
          className="max-5xl text-xl drop-shadow-[6px_0_6px_rgba(255,238,88,0.75)]"
        >
          <p>USE WASD OR ARROW KEYS TO MOVE YOUR SHIP.</p>
          <p>SPACEBAR TO SHOOT. DESTROY ALL ASTEROIDS TO ADVANCE TO THE NEXT LEVEL.</p>
          <p>WATCH OUT! IF YOUR SHIP GETS HIT, YOU'LL LOSE A LIFE!</p>

      </motion.div>

      <motion.button
        initial={{scale: 0}}
        animate={{scale: 1}}
        transition={{type: "spring"}}
        onClick={onStartGame}
        className="z-10 mt-12 px-10 py-5 text-xl tracking-widest text-yellow-300 border-4 border-pink-800 bg-black hover:bg-pink-900 shadow-[0_0_25px_#ff00ff] transition-all animate-bounce"
      >
        START GAME

      </motion.button>
    </div>
  );
};


export default StartScreen;