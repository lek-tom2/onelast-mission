import { create } from 'zustand';
import { ImpactScenario, Asteroid, CameraState } from '../types/asteroid';
import * as THREE from 'three';

export type SortOption = 'nearest' | 'furthest' | 'highest_energy' | 'lowest_energy' | 'largest' | 'smallest' | 'most_dangerous' | 'least_dangerous';
export type FilterOption = 'all' | 'hazardous' | 'close_approach' | 'high_energy' | 'large_size';
export type GameMode = 'real_orbit' | 'destroy_earth';

interface AsteroidStore {
  // State
  selectedScenario: ImpactScenario | null;
  selectedAsteroidDetails: ImpactScenario | null;
  asteroids: Asteroid[];
  cameraState: CameraState;
  isPlaying: boolean;
  showTrajectories: boolean;
  showConsequences: boolean;
  gameMode: GameMode;
  
  // Filtering and sorting
  sortOption: SortOption;
  filterOption: FilterOption;
  selectedCity: {
    name: string;
    lat: number;
    lng: number;
    country: string;
    region: string;
    density: number;
  } | null;

  // Actions
  selectScenario: (scenario: ImpactScenario) => void;
  selectAsteroidDetails: (scenario: ImpactScenario | null) => void;
  clearScenario: () => void;
  addAsteroid: (asteroid: Asteroid) => void;
  removeAsteroid: (id: string) => void;
  updateCameraState: (state: Partial<CameraState>) => void;
  setPlaying: (playing: boolean) => void;
  toggleTrajectories: () => void;
  toggleConsequences: () => void;
  generateRandomAsteroids: (count: number) => void;
  setGameMode: (mode: GameMode) => void;
  
  // Filtering and sorting actions
  setSortOption: (option: SortOption) => void;
  setFilterOption: (option: FilterOption) => void;
  setSelectedCity: (city: {
    name: string;
    lat: number;
    lng: number;
    country: string;
    region: string;
    density: number;
  } | null) => void;
}

export const useAsteroidStore = create<AsteroidStore>((set) => ({
  // Initial state
  selectedScenario: null,
  selectedAsteroidDetails: null,
  asteroids: [],
  cameraState: {
    position: new THREE.Vector3(0, 0, 5),
    target: new THREE.Vector3(0, 0, 0),
    zoom: 1,
    mode: 'earth'
  },
  isPlaying: false,
  showTrajectories: true,
  showConsequences: true,
  gameMode: 'real_orbit',
  
  // Filtering and sorting
  sortOption: 'nearest',
  filterOption: 'all',
  selectedCity: null,

  // Actions
  selectScenario: (scenario) => set({ selectedScenario: scenario }),

  selectAsteroidDetails: (scenario) => set({ selectedAsteroidDetails: scenario }),

  clearScenario: () => set({ selectedScenario: null }),

  addAsteroid: (asteroid) => set((state) => ({
    asteroids: [...state.asteroids, asteroid]
  })),

  removeAsteroid: (id) => set((state) => ({
    asteroids: state.asteroids.filter(asteroid => asteroid.id !== id)
  })),

  updateCameraState: (newState) => set((state) => ({
    cameraState: { ...state.cameraState, ...newState }
  })),

  setPlaying: (playing) => set({ isPlaying: playing }),

  toggleTrajectories: () => set((state) => ({
    showTrajectories: !state.showTrajectories
  })),

  toggleConsequences: () => set((state) => ({
    showConsequences: !state.showConsequences
  })),

  generateRandomAsteroids: (count) => {
    const asteroids: Asteroid[] = [];

    for (let i = 0; i < count; i++) {
      const asteroid: Asteroid = {
        id: `asteroid-${i}`,
        name: `Asteroid ${i + 1}`,
        size: Math.random() * 1000 + 50, // 50-1050 meters
        position: new THREE.Vector3(
          (Math.random() - 0.5) * 20,
          (Math.random() - 0.5) * 20,
          (Math.random() - 0.5) * 20
        ),
        velocity: new THREE.Vector3(
          (Math.random() - 0.5) * 2,
          (Math.random() - 0.5) * 2,
          (Math.random() - 0.5) * 2
        ),
        composition: ['rock', 'metal', 'ice', 'mixed'][Math.floor(Math.random() * 4)] as 'rock' | 'metal' | 'ice' | 'mixed',
        threatLevel: ['low', 'medium', 'high', 'critical'][Math.floor(Math.random() * 4)] as 'low' | 'medium' | 'high' | 'critical',
        closestApproach: {
          date: new Date(Date.now() + Math.random() * 365 * 24 * 60 * 60 * 1000),
          distance: Math.random() * 1000000 + 10000 // 10,000 - 1,010,000 km
        }
      };

      asteroids.push(asteroid);
    }

    set({ asteroids });
  },

  // Filtering and sorting actions
  setSortOption: (option) => set({ sortOption: option }),
  setFilterOption: (option) => set({ filterOption: option }),
  setSelectedCity: (city: {
    name: string;
    lat: number;
    lng: number;
    country: string;
    region: string;
    density: number;
  } | null) => set({ selectedCity: city }),
  setGameMode: (mode) => set({ gameMode: mode })
}));
