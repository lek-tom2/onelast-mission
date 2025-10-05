'use client';
import { useAsteroidStore, GameMode } from '@/lib/stores/useAsteroidStore';

interface GameModeSelectorProps {
  embedded?: boolean;
}

export default function GameModeSelector({ embedded = false }: GameModeSelectorProps) {
    const { gameMode, setGameMode } = useAsteroidStore();

    const modes: { key: GameMode; label: string; description: string; icon: string; gradient: string }[] = [
        {
            key: 'real_orbit',
            label: 'Real Orbit',
            description: 'View real asteroid orbital mechanics only',
            icon: '🛰️',
            gradient: 'from-blue-600 to-purple-600'
        },
        {
            key: 'destroy_earth',
            label: 'Destroy Earth',
            description: 'Real orbit + course modification controls',
            icon: '💥',
            gradient: 'from-red-600 to-orange-600'
        }
    ];

    if (embedded) {
        return (
            <div className="space-y-2">
                {modes.map((mode) => (
                    <button
                        key={mode.key}
                        onClick={() => setGameMode(mode.key)}
                        className={`w-full p-3 rounded-lg text-left transition-all duration-200 relative overflow-hidden ${
                            gameMode === mode.key
                                ? 'bg-gradient-to-r ' + mode.gradient + ' shadow-lg scale-105'
                                : 'bg-gray-700/50 hover:bg-gray-600/50 border border-gray-600/50'
                        }`}
                    >
                        {gameMode === mode.key && (
                            <div className="absolute inset-0 bg-gradient-to-r from-white/10 to-transparent animate-pulse" />
                        )}
                        <div className="flex items-center space-x-3 relative z-10">
                            <span className="text-xl">{mode.icon}</span>
                            <div className="flex-1">
                                <div className="font-semibold text-sm text-white">{mode.label}</div>
                                <div className="text-xs text-gray-200">{mode.description}</div>
                            </div>
                            {gameMode === mode.key && (
                                <div className="text-white/90 text-lg">✓</div>
                            )}
                        </div>
                    </button>
                ))}
            </div>
        );
    }

    return (
        <div className="fixed bottom-6 right-6 bg-black/90 backdrop-blur-sm rounded-lg p-4 text-white min-w-80 z-40">
            <h3 className="text-lg font-semibold mb-3 text-red-400">Game Mode</h3>

            <div className="space-y-2">
                {modes.map((mode) => (
                    <button
                        key={mode.key}
                        onClick={() => setGameMode(mode.key)}
                        className={`w-full p-3 rounded-lg text-left transition-all duration-200 relative overflow-hidden ${
                            gameMode === mode.key
                                ? 'bg-gradient-to-r ' + mode.gradient + ' shadow-lg'
                                : 'bg-gray-700 hover:bg-gray-600 border-2 border-transparent'
                        }`}
                    >
                        {gameMode === mode.key && (
                            <div className="absolute inset-0 bg-gradient-to-r from-white/10 to-transparent animate-pulse" />
                        )}
                        <div className="flex items-center space-x-3 relative z-10">
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
