'use client';
import { useEffect, useState } from 'react';
import { useAsteroidStore } from '@/lib/stores/useAsteroidStore';
import { trajectoryCalculator } from '@/lib/services/trajectoryCalculator';
import { ImpactScenario } from '@/lib/types/asteroid';
import { NASAObject } from '@/lib/services/nasaApi';

interface CollisionDetectorProps {
  asteroids: NASAObject[]; // NASA objects
  onCollisionDetected: (scenario: ImpactScenario) => void;
}

export default function CollisionDetector({ asteroids, onCollisionDetected }: CollisionDetectorProps) {
  const { gameMode, activateGameMode } = useAsteroidStore();
  const [checkedAsteroids, setCheckedAsteroids] = useState<Set<string>>(new Set());

  useEffect(() => {
    // Only check for collisions in real_orbit mode
    if (gameMode !== 'real_orbit') return;

    console.log('🔍 Collision Detection Status:');
    console.log('  - Game Mode:', gameMode);
    console.log('  - Number of asteroids to check:', asteroids.length);
    console.log('  - Sample asteroids:', asteroids.slice(0, 3).map(a => ({
      id: a.id,
      name: a.name,
      missDistance: a.close_approach_data[0]?.miss_distance?.kilometers
    })));

    const checkCollisions = () => {
      if (asteroids.length === 0) {
        console.log('⚠️ No asteroids to check for collision');
        return;
      }

      console.log(`🔍 Checking ${asteroids.length} asteroids for collision course...`);
      
      for (const asteroid of asteroids) {
        // Skip if we already checked this asteroid
        if (checkedAsteroids.has(asteroid.id)) continue;

        console.log(`Checking asteroid ${asteroid.name}:`);
        
        // Check if asteroid is on collision course
        // Let's use a more relaxed threshold for testing: 50 million km
        const isColliding = trajectoryCalculator.isOnCollisionCourse(asteroid, 50000000); // 50 million km threshold
        const threatLevel = trajectoryCalculator.getCollisionThreatLevel(asteroid);
        
        const missDistance = asteroid.close_approach_data[0]?.miss_distance?.kilometers;
        console.log(`  - Miss Distance: ${missDistance} km`);
        console.log(`  - Is Colliding (< 50M km): ${isColliding}`);
        console.log(`  - Threat Level: ${threatLevel}`);
        
        // Force trigger if miss distance is small enough for testing
        if (parseFloat(missDistance) < 5000000) {
          console.log(`🚨 FORCING COLLISION TRIGGER for ${asteroid.name} (${missDistance} km)`);
        }

        if (isColliding || parseFloat(missDistance) < 5000000) { // Also force for small distances
          console.log(`🚨 COLLISION COURSE DETECTED: ${asteroid.name}`);
          console.log(`Threat Level: ${threatLevel}`);
          console.log(`Miss Distance: ${asteroid.close_approach_data[0]?.miss_distance?.kilometers} km`);

          // Create impact scenario for game mode
          const scenario = trajectoryCalculator.convertToImpactScenario(asteroid, {
            lat: 0, // Default to equator
            lng: 0, // Default to prime meridian
            name: 'Earth'
          });

          // Mark as checked
          setCheckedAsteroids(prev => new Set([...prev, asteroid.id]));

          // Notify parent and activate game mode
          onCollisionDetected(scenario);
          activateGameMode(scenario);
          
          // Show notification
          showCollisionNotification(asteroid, threatLevel);
          
          break; // Only process one collision at a time
        } else {
          console.log(`  - ❌ Not on collision course (distance: ${missDistance} km, level: ${threatLevel})`);
        }
      }
    };

    // Check collisions every few seconds
    const interval = setInterval(checkCollisions, 3000);
    checkCollisions(); // Initial check

    return () => clearInterval(interval);
  }, [asteroids, gameMode, checkedAsteroids, activateGameMode, onCollisionDetected]);

  // Show browser notification for collision detection
  const showCollisionNotification = (asteroid: any, threatLevel: string) => {
    if ('Notification' in window) {
      // Request permission if not granted
      if (Notification.permission === 'default') {
        Notification.requestPermission().then(permission => {
          if (permission === 'granted') {
            createNotification(asteroid, threatLevel);
          }
        });
      } else if (Notification.permission === 'granted') {
        createNotification(asteroid, threatLevel);
      }
    }

    // Also show in-app notification
    const notification = document.createElement('div');
    notification.innerHTML = `
      <div style="
        position: fixed;
        top: 20px;
        right: 20px;
        background: linear-gradient(135deg, #ff4444, #cc0000);
        color: white;
        padding: 20px;
        border-radius: 10px;
        box-shadow: 0 4px 20px rgba(255, 68, 68, 0.3);
        z-index: 10000;
        max-width: 300px;
        animation: slideIn 0.5s ease-out;
      ">
        <div style="font-size: 24px; margin-bottom: 10px;">🚨 COLLISION ALERT!</div>
        <div style="font-weight: bold; margin-bottom: 5px;">${asteroid.name}</div>
        <div style="font-size: 14px; margin-bottom: 10px;">Threat Level: ${threatLevel.toUpperCase()}</div>
        <div style="font-size: 12px; opacity: 0.9;">Entering Earth Destruction Mode...</div>
      </div>
    `;

    // Add animation keyframes
    const style = document.createElement('style');
    style.textContent = `
      @keyframes slideIn {
        from { transform: translateX(100%); opacity: 0; }
        to { transform: translateX(0); opacity: 1; }
      }
    `;
    document.head.appendChild(style);

    document.body.appendChild(notification);

    // Remove notification after 5 seconds
    setTimeout(() => {
      if (notification.parentNode) {
        notification.style.animation = 'slideIn 0.5s ease-out reverse';
        setTimeout(() => {
          notification.remove();
          style.remove();
        }, 500);
      }
    }, 5000);
  };

  const createNotification = (asteroid: any, threatLevel: string) => {
    new Notification('🚨 Asteroid Collision Alert!', {
      body: `${asteroid.name} is on collision course with Earth!\nThreat Level: ${threatLevel.toUpperCase()}\n\nEntering Earth Destruction Mode...`,
      icon: '/favicon.ico',
      tag: 'collision-alert',
      requireInteraction: true
    });
  };

  // Reset checked asteroids when switching modes
  useEffect(() => {
    if (gameMode === 'real_orbit') {
      setCheckedAsteroids(new Set());
    }
  }, [gameMode]);

  return null; // This component doesn't render anything
}

// Hook for easy collision detection in components
export function useCollisionDetection(asteroids: NASAObject[]) {
  const [collisionScenario, setCollisionScenario] = useState<ImpactScenario | null>(null);
  const { isGameModeActive } = useAsteroidStore();

  const handleCollisionDetected = (scenario: ImpactScenario) => {
    setCollisionScenario(scenario);
  };

  const clearCollision = () => {
    setCollisionScenario(null);
  };

  return {
    collisionScenario,
    isGameModeActive,
    clearCollision,
    CollisionDetector: ({ children }: { children?: React.ReactNode }) => (
      <>
        <CollisionDetector 
          asteroids={asteroids}
          onCollisionDetected={handleCollisionDetected}
        />
        {children}
      </>
    )
  };
}