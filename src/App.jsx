import { useState, useEffect } from 'react'
import WeatherWidget from './components/WeatherWidget'
import NewsFeed from './components/NewsFeed'
import TrailsGuide from './components/TrailsGuide'
import SatelliteMap from './components/SatelliteMap'
import EnvironmentalMap from './components/EnvironmentalMap'
import InteractiveMap from './components/InteractiveMap'
import TrailSuggester from './components/TrailSuggester'
import SmartTrailFilters from './components/SmartTrailFilters'
import CommunityReportsTicker from './components/CommunityReportsTicker'
import LocalRiskInfo from './components/LocalRiskInfo'
import ChecklistPrep from './components/ChecklistPrep'
import TidesAndMoon from './components/TidesAndMoon'
import { trails } from './data/trails'
import { calculateTrailScore } from './utils/scoringAlgorithm'

function App() {
    const [weather, setWeather] = useState(null);
    const [loading, setLoading] = useState(true);
    const [alerts, setAlerts] = useState([]);
    const [filters, setFilters] = useState({
        weather: 'any',
        difficulty: 'any',
        duration: 'any',
        signal: false,
        noMud: false
    });
    const [selectedTrail, setSelectedTrail] = useState(null);

    const handleTrailSelect = (trail) => {
        setSelectedTrail(trail);
        // Scroll to map
        const mapElement = document.getElementById('interactive-map');
        if (mapElement) {
            mapElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
    };

    useEffect(() => {
        const fetchWeather = () => {
            const lat = -27.5969;
            const lon = -48.5495;
            const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,relative_humidity_2m,apparent_temperature,precipitation,weather_code,surface_pressure,wind_speed_10m,wind_direction_10m,wind_gusts_10m,is_day,visibility&daily=weather_code,temperature_2m_max,temperature_2m_min,precipitation_sum,sunrise,sunset&hourly=temperature_2m,weather_code,uv_index&timezone=America%2FSao_Paulo`;

            fetch(url)
                .then(res => res.json())
                .then(data => {
                    const enrichedWeather = {
                        ...data,
                        recentRain24h: data.daily.precipitation_sum[0] || 0
                    };
                    setWeather(enrichedWeather);
                    setLoading(false);
                })
                .catch(err => {
                    console.error("Error fetching weather:", err);
                    setLoading(false);
                });
        };

        fetchWeather();
        const interval = setInterval(fetchWeather, 300000); // 5 minutes

        return () => clearInterval(interval);
    }, []);

    useEffect(() => {
        const scrollToHashTrail = () => {
            const hash = window.location.hash.replace('#', '');
            if (!hash.startsWith('trail-')) return;
            const trailId = parseInt(hash.replace('trail-', ''), 10);
            const foundTrail = trails.find(t => t.id === trailId);
            if (foundTrail) {
                setSelectedTrail(foundTrail);
            }
            setTimeout(() => {
                const element = document.getElementById(hash);
                if (element) {
                    document.querySelectorAll('.card-selected').forEach(c => c.classList.remove('card-selected'));
                    element.scrollIntoView({ behavior: 'smooth', block: 'center' });
                    element.classList.add('card-selected');
                }
            }, 350);
        };

        scrollToHashTrail();
        window.addEventListener('hashchange', scrollToHashTrail);
        return () => window.removeEventListener('hashchange', scrollToHashTrail);
    }, []);

    const scoredTrails = weather ? trails.map(trail => {
        const extraction = calculateTrailScore(trail, weather, alerts);
        return { ...trail, algorithm: extraction };
    }) : trails;

    const filteredTrails = scoredTrails.filter(trail => {
        if (filters.difficulty !== 'any' && trail.technical.difficulty !== filters.difficulty) return false;
        if (filters.signal && !trail.technical.cellSignal) return false;
        if (filters.duration !== 'any') {
            const mins = trail.technical.durationMins;
            if (filters.duration === 'short' && mins >= 60) return false;
            if (filters.duration === 'medium' && (mins < 60 || mins > 180)) return false;
            if (filters.duration === 'long' && mins <= 180) return false;
        }
        if (filters.noMud && weather?.recentRain24h > 2) return false;
        return true;
    }).sort((a, b) => {
        const difficultyOrder = { 'easy': 1, 'medium': 2, 'hard': 3 };
        const diffA = difficultyOrder[a.technical.difficulty] || 4;
        const diffB = difficultyOrder[b.technical.difficulty] || 4;
        return diffA - diffB;
    });

    return (
        <div className="container dashboard-pro" style={{
            minHeight: '100vh',
            color: '#1d1d1f'
        }}>
            <header style={{
                padding: '5rem 0',
                marginBottom: '3rem',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center',
                alignItems: 'center',
                textAlign: 'center',
                backgroundImage: 'linear-gradient(rgba(0,0,0,0.2), rgba(0,0,0,0.5)), url("/header-bg-nature.png")',
                backgroundSize: 'cover',
                backgroundPosition: 'center 35%',
                borderRadius: '24px',
                color: '#fff',
                boxShadow: '0 20px 40px -10px rgba(0,0,0,0.3)',
                maxWidth: '800px',
                width: '100%',
                margin: '0 auto 3rem auto',
                position: 'relative'
            }}>
                <a
                    href="https://t.me/floripahikingpro"
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{
                        position: 'absolute',
                        top: '1.5rem',
                        right: '1.5rem',
                        color: '#fff',
                        opacity: 0.8,
                        transition: 'opacity 0.2s',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        padding: '0.6rem', // Slightly larger padding
                        background: 'rgba(255,255,255,0.15)', // Slightly more visible bg
                        borderRadius: '50%',
                        backdropFilter: 'blur(4px)',
                        boxShadow: '0 4px 12px rgba(0,0,0,0.1)' // Soft shadow for depth
                    }}
                    onMouseEnter={(e) => {
                        e.currentTarget.style.opacity = '1';
                        e.currentTarget.style.background = 'rgba(255,255,255,0.25)';
                        e.currentTarget.style.transform = 'scale(1.05)';
                    }}
                    onMouseLeave={(e) => {
                        e.currentTarget.style.opacity = '0.8';
                        e.currentTarget.style.background = 'rgba(255,255,255,0.15)';
                        e.currentTarget.style.transform = 'scale(1)';
                    }}
                    title="Наш Telegram канал"
                >
                    <svg
                        xmlns="http://www.w3.org/2000/svg"
                        viewBox="0 0 24 24"
                        width="24"
                        height="24"
                        fill="currentColor"
                        style={{ display: 'block' }}
                    >
                        <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm4.64 6.8c-.15 1.58-.8 5.42-1.13 7.19-.14.75-.42 1-.68 1.03-.58.05-1.02-.38-1.58-.75-.88-.58-1.38-.94-2.23-1.5-.99-.65-.35-1.01.22-1.59.15-.15 2.71-2.48 2.76-2.69a.2.2 0 00-.05-.18c-.06-.05-.14-.03-.21-.02-.09.02-1.49.95-4.22 2.79-.4.27-.76.41-1.08.4-.36-.01-1.04-.2-1.55-.37-.63-.2-1.12-.31-1.08-.66.02-.18.27-.36.74-.55 2.92-1.27 4.86-2.11 5.83-2.51 2.78-1.16 3.35-1.36 3.73-1.36.08 0 .27.02.39.12.1.08.13.19.14.27-.01.06.01.24 0 .24z" />
                    </svg>
                </a>
                <div style={{ marginBottom: '1.5rem', textShadow: '0 2px 4px rgba(0,0,0,0.4)' }}>
                    <div style={{ fontSize: '0.9rem', textTransform: 'uppercase', letterSpacing: '0.2em', color: '#f0fdf4', fontWeight: 700, marginBottom: '0.5rem', opacity: 0.9 }}>
                        Осн. 2026 • Санта-Катарина
                    </div>
                    <h1 style={{
                        fontSize: '4.5rem',
                        margin: 0,
                        fontWeight: 400,
                        letterSpacing: '-0.03em',
                        color: '#fff',
                        fontFamily: '"Georgia", serif',
                        lineHeight: 1
                    }}>
                        Floripa Hiking PRO
                    </h1>
                    <p style={{
                        fontSize: '1.25rem',
                        color: '#f0fdf4',
                        margin: '1rem 0 0 0',
                        fontWeight: 400,
                        fontStyle: 'italic',
                        fontFamily: '"Georgia", serif',
                        lineHeight: 1.6,
                        opacity: 0.95
                    }}>
                        Оперативное руководство по диким тропам острова.
                    </p>
                </div>

                <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.75rem',
                    fontSize: '0.85rem',
                    fontWeight: 600,
                    background: 'rgba(255, 255, 255, 0.15)',
                    padding: '0.5rem 1rem',
                    borderRadius: '999px',
                    border: '1px solid rgba(255, 255, 255, 0.25)',
                    color: '#fff',
                    backdropFilter: 'blur(4px)'
                }}>
                    <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#4ade80', boxShadow: '0 0 10px #4ade80' }}></span>
                    <span style={{ letterSpacing: '0.05em', textTransform: 'uppercase' }}>В РАБОТЕ / БЕЗОПАСНО</span>
                </div>
            </header>

            {/* SINGLE COLUMN LAYOUT (Mobile Optimized Order 1-11) */}
            <main style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', maxWidth: '800px', margin: '0 auto' }}>

                {/* 1) Прогноз погоды */}
                <WeatherWidget weatherData={weather} loading={loading} />

                {/* 2) Рекомендации недели */}
                <TrailSuggester />

                {/* 3) 📰 Новости хайкинга Флорипы */}
                <NewsFeed weather={weather} />

                {/* 4) 🗺️ ИНТЕРАКТИВНАЯ КАРТА МАРШРУТОВ */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    <h2 style={{ fontSize: '1rem', fontWeight: 800, margin: '0.5rem 0 0 0' }}>🗺️ ИНТЕРАКТИВНАЯ КАРТА МАРШРУТОВ</h2>
                    <InteractiveMap selectedTrail={selectedTrail} />
                </div>

                {/* 5) Умные фильтры (PRO) и 🏔️ Оперативный статус маршрутов */}
                <div className="card" style={{ padding: 0, overflow: 'visible' }}>
                    <SmartTrailFilters onFilterChange={setFilters} />
                    <TrailsGuide trails={filteredTrails} onTrailSelect={handleTrailSelect} />
                </div>

                {/* 6) 🌱 ЭКОЛОГИЧЕСКАЯ ОБСТАНОВКА */}
                <EnvironmentalMap />

                {/* 7) 🌪️ Карта Ветра и Циклонов (Live) */}
                <SatelliteMap />

                {/* 8) Офлайн-чеклисты */}
                <ChecklistPrep />

                {/* 9) ⚖️ Правила принятия решений */}
                <div className="card" style={{ borderLeft: '4px solid #ef4444' }}>
                    <h3 style={{ fontSize: '0.9rem', marginBottom: '1rem', color: '#ef4444', fontWeight: 800, textTransform: 'uppercase' }}>
                        ⚖️ Правила принятия решений
                    </h3>
                    <ul style={{ paddingLeft: '1.25rem', fontSize: '0.85rem', color: '#4a5568', lineHeight: '1.6', margin: 0 }}>
                        <li style={{ marginBottom: '0.5rem' }}><b>ПОСЛЕ ДОЖДЯ:</b> Не выходить в течение 48ч после сильных ливней (риск оползней и селей).</li>
                        <li style={{ marginBottom: '0.5rem' }}><b>ВЕТЕР:</b> При порывах {'>'} 30км/ч избегать открытых гребней (Coroa) и скалистых берегов (Matadeiro).</li>
                        <li style={{ marginBottom: '0.5rem' }}><b>ЖАРА:</b> В пик {'>'} 30°C только лесные маршруты (Costa da Lagoa, Peri).</li>
                    </ul>
                </div>

                {/* 10) 🛡️ Сводка локальных рисков */}
                <div className="glass-panel" style={{ padding: '1.5rem', background: 'rgba(255,255,255,0.4)', border: '1px solid rgba(255,255,255,0.4)' }}>
                    <LocalRiskInfo />
                </div>



                {/* 11) Оперативные отчеты сообщества */}
                <CommunityReportsTicker />

            </main>

            <footer style={{ textAlign: 'center', marginTop: '4rem', padding: '3rem', color: '#94a3b8', fontSize: '0.75rem', borderTop: '1px solid #e2e8f0' }}>
                <div style={{ display: 'flex', justifyContent: 'center', gap: '2rem', marginBottom: '1.5rem' }}>
                    <span>OFFICIAL DATA: Open-Meteo API</span>
                    <span>SAFETY: Defesa Civil SC</span>
                    <span>ENV: IMA/SC</span>
                </div>
                <p>FLORIPA HIKING PRO ENGINE v2.6.3 • 2026 Operational Dashboard</p>
                <p style={{ marginTop: '0.5rem', opacity: 0.6 }}>Данный инструмент предназначен исключительно для опытных хайкеров. <br />Разработчики не несут ответственности за ваши решения в горах.</p>
            </footer>
        </div >
    )
}

export default App
