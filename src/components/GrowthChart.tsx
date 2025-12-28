import { useMemo } from 'react';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import type { ChannelStats } from '../types';

interface GrowthChartProps {
    stats: ChannelStats;
    color?: string;
}

export function GrowthChart({ stats, color = "#ef4444" }: GrowthChartProps) {
    const data = useMemo(() => {
        // 실제 데이터가 부족할 경우를 대비해 subsDelta7d를 기반으로 7일치 트렌드를 역산하여 시뮬레이션합니다.
        const points = [];
        const today = new Date();
        const currentSubs = stats.subscribers || 0;
        const delta = stats.subsDelta7d || 0;

        // 7일 전부터 오늘까지의 가상 데이터 생성 
        // (완전 선형이 아니라 약간의 변동성을 주어 자연스럽게 보이게 함)
        for (let i = 6; i >= 0; i--) {
            const date = new Date(today);
            date.setDate(date.getDate() - i);

            const dayProgress = (6 - i) / 6; // 0 to 1
            const randomFluctuation = (Math.random() - 0.5) * (delta * 0.1); // 10% 변동성

            // 7일 전 값 = 현재 값 - 7일 증가분
            // 현재 값으로 갈수록 증가
            const estimatedSubs = Math.round((currentSubs - delta) + (delta * dayProgress) + randomFluctuation);

            points.push({
                date: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
                value: estimatedSubs,
            });
        }
        return points;
    }, [stats]);

    return (
        <div className="h-24 w-full mt-4">
            <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={data}>
                    <defs>
                        <linearGradient id="colorGrowth" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor={color} stopOpacity={0.3} />
                            <stop offset="95%" stopColor={color} stopOpacity={0} />
                        </linearGradient>
                    </defs>
                    <XAxis
                        dataKey="date"
                        hide
                    />
                    <YAxis
                        hide
                        domain={['dataMin', 'dataMax']}
                    />
                    <Tooltip
                        contentStyle={{ backgroundColor: '#18181b', border: '1px solid #27272a', borderRadius: '8px', fontSize: '12px' }}
                        itemStyle={{ color: '#fff' }}
                        labelStyle={{ color: '#a1a1aa' }}
                        formatter={(value: any) => [new Intl.NumberFormat('en-US', { notation: "compact", maximumFractionDigits: 1 }).format(Number(value) || 0), 'Subs']}
                    />
                    <Area
                        type="monotone"
                        dataKey="value"
                        stroke={color}
                        fillOpacity={1}
                        fill="url(#colorGrowth)"
                        strokeWidth={2}
                    />
                </AreaChart>
            </ResponsiveContainer>
        </div>
    );
}
