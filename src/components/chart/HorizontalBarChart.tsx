"use client"

import { useState } from "react"
import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
} from "@/components/ui/card"

const contributions = [
    { label: "Person 1", percent: 85, color: "#dc2626", amount: "₹75,000" },
    { label: "Person 2", percent: 55, color: "#2563eb", amount: "₹55,000" },
]

export function ChartBarHorizontal() {
    const [hoveredIndex, setHoveredIndex] = useState<number | null>(null)

    return (
        <Card>
            <CardHeader>
                <CardTitle className="text-xl font-bold">Capital & Contributions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-5">
                {contributions.map((item, index) => (
                    <div key={item.label} className="flex items-center gap-4">
                        <span className="text-base text-gray-700 font-medium w-20 shrink-0">
                            {item.label}
                        </span>
                        <div
                            className="flex-1 relative"
                            onMouseEnter={() => setHoveredIndex(index)}
                            onMouseLeave={() => setHoveredIndex(null)}
                        >
                            <div className="h-6 bg-gray-100 rounded-sm overflow-hidden">
                                <div
                                    className="h-full rounded-sm transition-all duration-700 ease-out"
                                    style={{
                                        width: `${item.percent}%`,
                                        backgroundColor: item.color,
                                    }}
                                />
                            </div>
                            {/* Tooltip */}
                            {hoveredIndex === index && (
                                <div
                                    className="absolute -top-14 bg-white border border-gray-200 text-sm rounded-lg shadow-md px-3 py-2 whitespace-nowrap z-10 pointer-events-none"
                                    style={{ left: `${item.percent / 2}%`, transform: 'translateX(-50%)' }}
                                >
                                    <div className="flex items-center gap-2">
                                        <span
                                            className="inline-block w-2.5 h-2.5 rounded-[2px] shrink-0"
                                            style={{ backgroundColor: item.color }}
                                        />
                                        <span className="text-gray-500">{item.label}</span>
                                        <span className="font-semibold text-gray-900 ml-1">{item.amount}</span>
                                    </div>
                                    <div className="absolute left-1/2 -translate-x-1/2 top-full w-0 h-0 border-l-[6px] border-r-[6px] border-t-[6px] border-l-transparent border-r-transparent border-t-gray-200" />
                                </div>
                            )}
                        </div>
                    </div>
                ))}
                <p className="text-sm text-gray-400 pt-1">Amount invested by each person</p>
            </CardContent>
        </Card>
    )
}
