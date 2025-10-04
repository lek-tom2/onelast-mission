'use client';
import { useAsteroidStore, GameMode } from '@/lib/stores/useAsteroidStore';

export default function GameModeSelector() {
    const { gameMode, setGameMode } = useAsteroidStore();

    const modes: { key: GameMode; label: string; description: string; icon: string }[] = [
        {
            key: 'destroy_earth',
            label: 'Destroy Earth',
            description: 'Real orbit + course modification controls',
            icon: '💥'
        },
        {
            key: 'real_orbit',
            label: 'Real Orbit',
            description: 'View real asteroid orbital mechanics only',
            icon: '🛰️'
        }
    ];

    return (
        <div className="absolute top-4 left-4 bg-black/90 backdrop-blur-sm rounded-lg p-4 text-white min-w-80">
            <h3 className="text-lg font-semibold mb-3 text-red-400">Game Mode</h3>

            <div className="space-y-2">
                {modes.map((mode) => (
                    <button
                        key={mode.key}
                        onClick={() => setGameMode(mode.key)}
                        className={`w-full p-3 rounded-lg text-left transition-all duration-200 ${gameMode === mode.key
                            ? 'bg-red-600 border-2 border-red-400'
                            : 'bg-gray-700 hover:bg-gray-600 border-2 border-transparent'
                            }`}
                    >
                        <div className="flex items-center space-x-3">
                            <span className="text-2xl">{mode.icon}</span>
                            <div>
                                <div className="font-semibold text-sm">{mode.label}</div>
                                <div className="text-xs text-gray-300">{mode.description}</div>
                            </div>
                            {gameMode === mode.key && (
                                <div className="ml-auto">
                                    <span className="text-green-400 text-lg">✓</span>
                                </div>
                            )}
                        </div>
                    </button>
                ))}
            </div>

            <div className="mt-4 p-3 bg-gray-800 rounded text-xs text-gray-300">
                <div className="font-semibold mb-1">Current Mode:</div>
                <div>
                    {gameMode === 'destroy_earth' ? (
                        <>
                            <span className="text-red-400">Destroy Earth</span> - Real orbit with course modification controls
                        </>
                    ) : (
                        <>
                            <span className="text-blue-400">Real Orbit</span> - View actual asteroid orbital mechanics with real distance scaling
                        </>
                    )}
                </div>
            </div>
        </div>
    );
}
