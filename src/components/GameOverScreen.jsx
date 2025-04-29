
import React from 'react';
import * as motion from "motion/react-client"


const GameOverScreen = ({ score, level, onRestart }) => {
  return (
    <div className="absolute inset-0 flex flex-col items-center justify-center bg-black bg-opacity-70 text-white text-center">
        <motion.h1
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{  duration: 1}}
              className="text-red-700 text-7xl drop-shadow-[6px_0_6px_rgba(255,0,0,0.75)] mb-10 "
            >
              GAME OVER
        </motion.h1>

        <motion.div
          initial={{ opacity: 0, scale: 0 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{
              duration: 0.4,
              scale: { type: "spring", visualDuration: 0.4, bounce: 0.5 }}}
          className="max-5xl text-xl drop-shadow-[6px_0_6px_rgba(255,238,88,0.75)]"
        >
        <p className="text-3xl mb-6 text-red-500">FINAL SCORE: {score}</p>
        <p className="text-xl mb-8 text-red-500">YOU REACHED LEVEL: {level}</p>
        
        </motion.div>
      <motion.button
        animate={{rotate: 360}}
        transition={{ duration: 1 }}
        whileHover={{scale: 1.1}}
        onClick={onRestart}
        className="z-10 mt-12 px-10 py-5 text-xl tracking-widest text-red-400 border-4 border-red-700 bg-black-500 hover:bg-blue-900 shadow-[0_0_100px_#0000ff] transition-all"
      >
        PLAY AGAIN
      </motion.button>

    </div>
  );
};

export default GameOverScreen;
