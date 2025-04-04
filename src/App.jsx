import React, { useEffect, useState, useRef } from 'react';

const App = () => {
  // Game state
  const [gameStarted, setGameStarted] = useState(false);
  const [gameOver, setGameOver] = useState(false);
  const [score, setScore] = useState(0);
  const [lives, setLives] = useState(3);
  const [level, setLevel] = useState(1);
  const [isPaused, SetIsPaused] = useState(false);
  
  // Refs
  const canvasRef = useRef(null);
  const ctxRef = useRef(null);
  const requestRef = useRef(null);
  const lastTimeRef = useRef(0);
  
  // Game objects
  const shipRef = useRef({
    x: 0,
    y: 0,
    width: 40,
    height: 40,
    speed: 5,
    rotation: 0,
    dx: 0,
    dy: 0,
    thrust: 0.1,
    maxSpeed: 7,
    friction: 0.98,
    invulnerable: false,
    invulnerableTime: 0
  });
  
  const lasersRef = useRef([]);
  const asteroidsRef = useRef([]);
  const explosionsRef = useRef([]);
  const starsRef = useRef([]);
  const keysRef = useRef({});
  
  // Images
  const [images, setImages] = useState({
    ship: null,
    asteroid: null,
    background: null
  });
  
  // Audio
  const [sounds, setSounds] = useState({
    laser: null,
    explosion: null,
    thrust: null,
    gameOver: null,
    background: null
  });
  
  // Preload assets
  useEffect(() => {
    const shipImg = new Image();
    shipImg.src = '/ship.png';
    
    const asteroidImg = new Image();
    asteroidImg.src = '/ast.png';
    
    const backgroundImg = new Image();
    backgroundImg.src = 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 2 2"><rect width="2" height="2" fill="%23111"/></svg>';
    
    shipImg.onload = () => {
      setImages(prev => ({...prev, ship: shipImg}));
    };
    
    asteroidImg.onload = () => {
      setImages(prev => ({...prev, asteroid: asteroidImg}));
    };
    
    backgroundImg.onload = () => {
      setImages(prev => ({...prev, background: backgroundImg}));
    };
    
    const laserSound = new Audio("laser.mp3");
    const explosionSound = new Audio("explosion.mp3");
    const thrustSound = new Audio("thrust.mp3");
    const gameOverSound = new Audio("gameOver.mp3");
    const backgroundMusic = new Audio("bgm.mp3");
    
    backgroundMusic.loop = true; // Ensuring background music loops
    
    const sounds = {
      laser: { play: () => laserSound.play() },
      explosion: { play: () => explosionSound.play() },
      thrust: { play: () => thrustSound.play(), pause: () => thrustSound.pause() },
      gameOver: { play: () => gameOverSound.play() },
      background: { play: () => backgroundMusic.play(), pause: () => backgroundMusic.pause() }
    };
    
    setSounds(sounds);
    
    // Generate stars for background
    const newStars = [];
    for (let i = 0; i < 200; i++) {
      newStars.push({
        x: Math.random() * window.innerWidth,
        y: Math.random() * window.innerHeight,
        size: Math.random() * 2 + 1,
        speed: Math.random() * 0.5 + 0.1
      });
    }
    starsRef.current = newStars;
    
  }, []);
  
  // Initialize game
  useEffect(() => {
    if (!gameStarted || !canvasRef.current) return;
    
    const canvas = canvasRef.current;
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    
    const ctx = canvas.getContext('2d');
    ctxRef.current = ctx;
    
    // Reset game state
    const ship = shipRef.current;
    ship.x = canvas.width / 2;
    ship.y = canvas.height / 2;
    ship.dx = 0;
    ship.dy = 0;
    ship.rotation = 0;
    ship.invulnerable = false;
    
    lasersRef.current = [];
    asteroidsRef.current = [];
    explosionsRef.current = [];
    
    // Create initial asteroids
    createAsteroids(level);
    
    // Start game loop
    lastTimeRef.current = performance.now();
    requestRef.current = requestAnimationFrame(gameLoop);
    
    return () => {
      if (requestRef.current) {
        cancelAnimationFrame(requestRef.current);
      }
    };
  }, [gameStarted, level]);
  
  // Handle keyboard input
  useEffect(() => {
    if (!gameStarted) return;
    
    const handleKeyDown = (e) => {
      keysRef.current[e.key] = true;

      //Handle pause
      if (e.key === 'Escape' || e.key === 'p') {
        SetIsPaused(prev => !prev);
      }
      
      // Fire laser on spacebar
      if (e.key === ' ' && !gameOver && !isPaused) {
        fireLaser();
      }
    };
    
    const handleKeyUp = (e) => {
      keysRef.current[e.key] = false;
      
      // Stop thrust sound when releasing thrust key
      if ((e.key === 'ArrowUp' || e.key === 'w') && sounds.thrust) {
        sounds.thrust.pause();
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [gameStarted, gameOver, sounds, isPaused]);
  
  // Create asteroids
  const createAsteroids = (level) => {
    const canvas = canvasRef.current;
    const numAsteroids = level * 2 + 3; // More asteroids each level
    
    for (let i = 0; i < numAsteroids; i++) {
      // Create asteroids away from the ship
      let x, y;
      do {
        x = Math.random() * canvas.width;
        y = Math.random() * canvas.height;
      } while (
        Math.sqrt(
          Math.pow(x - shipRef.current.x, 2) + 
          Math.pow(y - shipRef.current.y, 2)
        ) < 200
      );
      
      const size = Math.random() * 30 + 40; // 40-70 pixel asteroids
      const speed = Math.random() * (0.5 + level * 0.1) + 0.5; // Faster with each level
      const angle = Math.random() * Math.PI * 2;
      
      asteroidsRef.current.push({
        x,
        y,
        size,
        dx: Math.cos(angle) * speed,
        dy: Math.sin(angle) * speed,
        rotation: 0,
        rotationSpeed: (Math.random() - 0.5) * 0.02,
        points: generateAsteroidPoints(size),
        type: 'large'
      });
    }
  };
  
  // Generate random asteroid points for varied shapes
  const generateAsteroidPoints = (size) => {
    const numPoints = Math.floor(Math.random() * 5) + 8; // 8-12 points
    const points = [];
    
    for (let i = 0; i < numPoints; i++) {
      const angle = (i / numPoints) * Math.PI * 2;
      const variation = (Math.random() * 0.3 + 0.8) * size / 2; // 80-110% of radius
      const x = Math.cos(angle) * variation;
      const y = Math.sin(angle) * variation;
      points.push({x, y});
    }
    
    return points;
  };
  
  // Fire laser from ship
  const fireLaser = () => {
    const ship = shipRef.current;
    
    // Calculate laser starting position at ship's nose
    const angle = ship.rotation;
    const offsetX = Math.sin(angle) * ship.width/2;
    const offsetY = -Math.cos(angle) * ship.height/2;
    
    lasersRef.current.push({
      x: ship.x + offsetX,
      y: ship.y + offsetY,
      dx: Math.sin(angle) * 10,
      dy: -Math.cos(angle) * 10,
      size: 3,
      life: 50 // Laser lifetime in frames
    });
    
    // Play laser sound
    if (sounds.laser) {
      sounds.laser.play();
    }
  };
  
  // Split asteroid into smaller pieces
  const splitAsteroid = (asteroid, index) => {
    const asteroids = asteroidsRef.current;
    
    // Remove original asteroid
    asteroids.splice(index, 1);
    
    // Play explosion sound
    if (sounds.explosion) {
      sounds.explosion.play();
    }
    
    // Create explosion effect
    explosionsRef.current.push({
      x: asteroid.x,
      y: asteroid.y,
      size: asteroid.size,
      life: 20, // Duration of explosion
      particles: createExplosionParticles(asteroid)
    });
    
    // Split into smaller asteroids if large enough
    if (asteroid.size > 25) {
      const numPieces = Math.floor(Math.random() * 2) + 2; // 2-3 pieces
      
      for (let i = 0; i < numPieces; i++) {
        const angle = Math.random() * Math.PI * 2;
        const speed = Math.random() * 2 + 1;
        
        asteroids.push({
          x: asteroid.x,
          y: asteroid.y,
          size: asteroid.size / 2,
          dx: Math.cos(angle) * speed,
          dy: Math.sin(angle) * speed,
          rotation: Math.random() * Math.PI * 2,
          rotationSpeed: (Math.random() - 0.5) * 0.04,
          points: generateAsteroidPoints(asteroid.size / 2),
          type: 'small'
        });
      }
    }
    
    // Increase score based on asteroid size
    setScore(prev => prev + Math.floor(asteroid.size));
    
    // Check if all asteroids are destroyed
    if (asteroids.length === 0) {
      // Move to next level
      setLevel(prev => prev + 1);
    }
  };
  
  // Create explosion particles
  const createExplosionParticles = (asteroid) => {
    const particles = [];
    const numParticles = Math.floor(asteroid.size / 2);
    
    for (let i = 0; i < numParticles; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = Math.random() * 3 + 1;
      
      particles.push({
        x: 0,
        y: 0,
        dx: Math.cos(angle) * speed,
        dy: Math.sin(angle) * speed,
        size: Math.random() * 3 + 1,
        life: Math.random() * 30 + 10
      });
    }
    
    return particles;
  };
  
  // Main game loop
  const gameLoop = (timestamp) => {
    if (gameOver || isPaused) return;
    
    const delta = timestamp - lastTimeRef.current;
    lastTimeRef.current = timestamp;
    
    // Clear canvas
    const canvas = canvasRef.current;
    const ctx = ctxRef.current;
    
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Draw background
    if (images.background) {
      const pattern = ctx.createPattern(images.background, 'repeat');
      ctx.fillStyle = pattern;
      ctx.fillRect(0, 0, canvas.width, canvas.height);
    } else {
      ctx.fillStyle = '#111';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
    }
    
    // Draw stars
    drawStars();
    
    // Update and draw ship
    updateShip(delta);
    drawShip();
    
    // Update and draw lasers
    updateLasers();
    drawLasers();
    
    // Update and draw asteroids
    updateAsteroids();
    drawAsteroids();
    
    // Update and draw explosions
    updateExplosions();
    drawExplosions();
    
    // Draw UI
    drawUI();
    
    // Check for collisions
    checkCollisions();
    
    // Continue game loop
    requestRef.current = requestAnimationFrame(gameLoop);
  };
  
  // Draw stars background
  const drawStars = () => {
    const ctx = ctxRef.current;
    const canvas = canvasRef.current;
    
    // Update star positions
    starsRef.current.forEach(star => {
      star.y += star.speed;
      if (star.y > canvas.height) {
        star.y = 0;
        star.x = Math.random() * canvas.width;
      }
      
      // Draw star
      ctx.fillStyle = `rgba(255, 255, 255, ${star.size / 3})`;
      ctx.beginPath();
      ctx.arc(star.x, star.y, star.size, 0, Math.PI * 2);
      ctx.fill();
    });
  };
  
  // Update ship position and physics
  const updateShip = (delta) => {
    if (isPaused) return;
    const ship = shipRef.current;
    const keys = keysRef.current;
    
    // Decrease invulnerability timer
    if (ship.invulnerable) {
      ship.invulnerableTime -= delta / 1000;
      if (ship.invulnerableTime <= 0) {
        ship.invulnerable = false;
      }
    }
    
    // Rotate ship
    if (keys.ArrowLeft || keys.a) {
      ship.rotation -= 0.1;
    }
    
    if (keys.ArrowRight || keys.d) {
      ship.rotation += 0.1;
    }
    
    // Apply thrust
    if (keys.ArrowUp || keys.w) {
      // Calculate thrust vector based on ship rotation
      const thrustX = Math.sin(ship.rotation) * ship.thrust;
      const thrustY = -Math.cos(ship.rotation) * ship.thrust;
      
      ship.dx += thrustX;
      ship.dy += thrustY;
      
      // Play thrust sound if not already playing
      if (sounds.thrust) {
        sounds.thrust.play();
      }
    }
    
    // Apply brakes/reverse thrust
    if (keys.ArrowDown || keys.s) {
      ship.dx *= 0.95;
      ship.dy *= 0.95;
    }
    
    // Apply friction
    ship.dx *= ship.friction;
    ship.dy *= ship.friction;
    
    // Cap maximum speed
    const speed = Math.sqrt(ship.dx * ship.dx + ship.dy * ship.dy);
    if (speed > ship.maxSpeed) {
      const ratio = ship.maxSpeed / speed;
      ship.dx *= ratio;
      ship.dy *= ratio;
    }
    
    // Update position
    ship.x += ship.dx;
    ship.y += ship.dy;
    
    // Screen wrapping
    const canvas = canvasRef.current;
    
    if (ship.x > canvas.width) ship.x = 0;
    if (ship.x < 0) ship.x = canvas.width;
    if (ship.y > canvas.height) ship.y = 0;
    if (ship.y < 0) ship.y = canvas.height;
  };
  
  // Draw ship
  const drawShip = () => {
    const ship = shipRef.current;
    const ctx = ctxRef.current;
    
    ctx.save();
    ctx.translate(ship.x, ship.y);
    ctx.rotate(ship.rotation);
    
    // Ship is blinking when invulnerable
    if (!ship.invulnerable || Math.floor(performance.now() / 100) % 2) {
      if (images.ship) {
        ctx.drawImage(images.ship, -ship.width/2, -ship.height/2, ship.width, ship.height);
      } else {
        // Draw ship as a triangle if image not loaded
        ctx.fillStyle = '#ddd';
        ctx.beginPath();
        ctx.moveTo(0, -ship.height/2);
        ctx.lineTo(-ship.width/2, ship.height/2);
        ctx.lineTo(ship.width/2, ship.height/2);
        ctx.closePath();
        ctx.fill();
        ctx.strokeStyle = '#333';
        ctx.lineWidth = 2;
        ctx.stroke();
      }
      
      // Draw thrust animation if moving forward
      if ((keysRef.current.ArrowUp || keysRef.current.w) && !gameOver) {
        ctx.fillStyle = '#f83';
        ctx.beginPath();
        ctx.moveTo(-ship.width/4, ship.height/2);
        ctx.lineTo(ship.width/4, ship.height/2);
        ctx.lineTo(0, ship.height/2 + Math.random() * 20 + 10);
        ctx.closePath();
        ctx.fill();
      }
    }
    
    ctx.restore();
  };
  
  // Update lasers
  const updateLasers = () => {
    if (isPaused) return;
    const canvas = canvasRef.current;
    const lasers = lasersRef.current;
    
    for (let i = lasers.length - 1; i >= 0; i--) {
      const laser = lasers[i];
      
      // Update position
      laser.x += laser.dx;
      laser.y += laser.dy;
      
      // Screen wrapping
      if (laser.x > canvas.width) laser.x = 0;
      if (laser.x < 0) laser.x = canvas.width;
      if (laser.y > canvas.height) laser.y = 0;
      if (laser.y < 0) laser.y = canvas.height;
      
      // Decrease lifetime
      laser.life--;
      
      // Remove if lifetime expired
      if (laser.life <= 0) {
        lasers.splice(i, 1);
      }
    }
  };
  
  // Draw lasers
  const drawLasers = () => {
    const ctx = ctxRef.current;
    const lasers = lasersRef.current;
    
    ctx.fillStyle = '#f55';
    lasers.forEach(laser => {
      ctx.beginPath();
      ctx.arc(laser.x, laser.y, laser.size, 0, Math.PI * 2);
      ctx.fill();
      
      // Add glow effect
      ctx.fillStyle = 'rgba(255, 50, 50, 0.3)';
      ctx.beginPath();
      ctx.arc(laser.x, laser.y, laser.size * 2, 0, Math.PI * 2);
      ctx.fill();
    });
  };
  
  // Update asteroids
  const updateAsteroids = () => {
    if (isPaused) return;
    const canvas = canvasRef.current;
    const asteroids = asteroidsRef.current;
    
    asteroids.forEach(asteroid => {
      // Update position
      asteroid.x += asteroid.dx;
      asteroid.y += asteroid.dy;
      
      // Update rotation
      asteroid.rotation += asteroid.rotationSpeed;
      
      // Screen wrapping
      if (asteroid.x > canvas.width + asteroid.size) asteroid.x = -asteroid.size;
      if (asteroid.x < -asteroid.size) asteroid.x = canvas.width + asteroid.size;
      if (asteroid.y > canvas.height + asteroid.size) asteroid.y = -asteroid.size;
      if (asteroid.y < -asteroid.size) asteroid.y = canvas.height + asteroid.size;
    });
  };
  
  // Draw asteroids
  const drawAsteroids = () => {
    const ctx = ctxRef.current;
    const asteroids = asteroidsRef.current;
    
    asteroids.forEach(asteroid => {
      ctx.save();
      ctx.translate(asteroid.x, asteroid.y);
      ctx.rotate(asteroid.rotation);
      
      if (images.asteroid) {
        ctx.drawImage(images.asteroid, -asteroid.size/2, -asteroid.size/2, asteroid.size, asteroid.size);
      } else {
        // Draw asteroid as a polygon if image not loaded
        ctx.fillStyle = '#888';
        ctx.beginPath();
        
        asteroid.points.forEach((point, index) => {
          if (index === 0) {
            ctx.moveTo(point.x, point.y);
          } else {
            ctx.lineTo(point.x, point.y);
          }
        });
        
        ctx.closePath();
        ctx.fill();
        ctx.strokeStyle = '#555';
        ctx.lineWidth = 1;
        ctx.stroke();
      }
      
      ctx.restore();
    });
  };
  
  // Update explosions
  const updateExplosions = () => {
    if (isPaused) return;
    const explosions = explosionsRef.current;
    
    for (let i = explosions.length - 1; i >= 0; i--) {
      const explosion = explosions[i];
      
      // Decrease lifetime
      explosion.life--;
      
      // Update particles
      explosion.particles.forEach(particle => {
        particle.x += particle.dx;
        particle.y += particle.dy;
        particle.life--;
      });
      
      // Remove if lifetime expired
      if (explosion.life <= 0) {
        explosions.splice(i, 1);
      }
    }
  };
  
  // Draw explosions
  const drawExplosions = () => {
    const ctx = ctxRef.current;
    
    explosionsRef.current.forEach(explosion => {
      explosion.particles.forEach(particle => {
        if (particle.life > 0) {
          const alpha = particle.life / 40; // Fade out
          
          ctx.save();
          ctx.translate(explosion.x, explosion.y);
          ctx.fillStyle = `rgba(255, ${150 + Math.random() * 100}, 50, ${alpha})`;
          ctx.beginPath();
          ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
          ctx.fill();
          ctx.restore();
        }
      });
    });
  };
  
  // Draw UI
  const drawUI = () => {
    const ctx = ctxRef.current;
    const canvas = canvasRef.current;
    
    // Score
    ctx.fillStyle = '#fff';
    ctx.font = '20px Arial';
    ctx.textAlign = 'left';
    ctx.fillText(`Score: ${score}`, 20, 40);
    
    // Level
    ctx.fillText(`Level: ${level}`, 20, 70);
    
    // Lives
    ctx.fillText('Lives:', 20, 100);
    
    for (let i = 0; i < lives; i++) {
      // Draw mini ships for lives
      ctx.save();
      ctx.translate(90 + i * 30, 95);
      
      if (images.ship) {
        ctx.drawImage(images.ship, -10, -10, 20, 20);
      } else {
        ctx.fillStyle = '#ddd';
        ctx.beginPath();
        ctx.moveTo(0, -10);
        ctx.lineTo(-10, 10);
        ctx.lineTo(10, 10);
        ctx.closePath();
        ctx.fill();
      }
      
      ctx.restore();
    }
  };
  
  // Check for collisions
  const checkCollisions = () => {
    if (isPaused) return;
    const ship = shipRef.current;
    const lasers = lasersRef.current;
    const asteroids = asteroidsRef.current;
    
    // Don't check collisions if ship is invulnerable
    if (!ship.invulnerable) {
      // Check ship-asteroid collisions
      for (let i = asteroids.length - 1; i >= 0; i--) {
        const asteroid = asteroids[i];
        const dx = ship.x - asteroid.x;
        const dy = ship.y - asteroid.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        if (distance < ship.width/2 + asteroid.size/2 - 10) { // -10 for more forgiving hitbox
          // Ship hit by asteroid
          splitAsteroid(asteroid, i);
          
          // Reduce lives
          setLives(prev => {
            const newLives = prev - 1;
            
            if (newLives <= 0) {
              // Game over
              endGame();
            } else {
              // Reset ship position and make invulnerable
              ship.x = canvasRef.current.width / 2;
              ship.y = canvasRef.current.height / 2;
              ship.dx = 0;
              ship.dy = 0;
              ship.invulnerable = true;
              ship.invulnerableTime = 3; // 3 seconds of invulnerability
            }
            
            return newLives;
          });
          
          break;
        }
      }
    }
    
    // Check laser-asteroid collisions
    for (let i = lasers.length - 1; i >= 0; i--) {
      const laser = lasers[i];
      
      for (let j = asteroids.length - 1; j >= 0; j--) {
        const asteroid = asteroids[j];
        const dx = laser.x - asteroid.x;
        const dy = laser.y - asteroid.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        if (distance < laser.size + asteroid.size/2) {
          // Laser hit asteroid
          lasers.splice(i, 1);
          splitAsteroid(asteroid, j);
          break;
        }
      }
    }
  };
  
  // End game
  const endGame = () => {
    setGameOver(true);
    
    if (sounds.gameOver) {
      sounds.gameOver.play();
    }
    
    if (sounds.background) {
      sounds.background.pause();
    }
  };
  
  // Start new game
  const startGame = () => {
    setScore(0);
    setLives(3);
    setLevel(1);
    setGameOver(false);
    setGameStarted(true)
    SetIsPaused(false);
    
    lasersRef.current = [];
    asteroidsRef.current = [];
    explosionsRef.current = [];
    
    if (sounds.background) {
      sounds.background.play();
    }
  };

  return (
    <div className="w-full h-screen bg-black overflow-hidden relative">
      {/* Game canvas */}
      <canvas 
        ref={canvasRef}
        className="w-full h-full absolute top-0 left-0"
      />
      
      {/* Start Screen */}
      {!gameStarted && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-black bg-opacity-70 text-white">
          <h1 className="text-6xl mb-6 font-bold">ARCHO</h1>
          <div className="mb-8 text-center max-w-md">
            <p className="mb-4">Use WASD or arrow keys to control your ship.</p>
            <p className="mb-4">Spacebar to shoot. Destroy all asteroids to advance to the next level.</p>
            <p>Watch out! If your ship gets hit, you'll lose a life!</p>
          </div>
          <button
            className="px-8 py-4 bg-blue-600 text-white text-xl rounded-lg hover:bg-blue-700 transition"
            onClick={startGame}
          >
            START GAME
          </button>
        </div>
      )}
      
      {/* Game Over Screen */}
      {gameOver && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-black bg-opacity-70 text-white">
          <h1 className="text-6xl mb-6 font-bold text-red-500">GAME OVER</h1>
          <p className="text-3xl mb-6">Final Score: {score}</p>
          <p className="text-xl mb-8">You reached level {level}</p>
          <button
            className="px-8 py-4 bg-blue-600 text-white text-xl rounded-lg hover:bg-blue-700 transition"
            onClick={startGame}
          >
            PLAY AGAIN
          </button>
        </div>
      )}
      {/* Pause Screen */}
      {isPaused && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-black bg-opacity-70 text-white">
          <h1 className="text-6xl mb-6 font-bold">PAUSED</h1>
          <p className="text-3xl mb-6">Game Paused</p>
          <button
            className="px-8 py-4 bg-blue-600 text-white text-xl rounded-lg hover:bg-blue-700 transition"
            onClick={() => setIsPaused(false)}
          >
            RESUME
          </button>
        </div>
      )}
    </div>
  );
};

export default App;