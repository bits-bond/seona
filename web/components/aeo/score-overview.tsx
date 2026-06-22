"use client";

import { Card, CardContent } from "@heroui/react";
import { ScoreGauge } from "./score-gauge";

interface ScoreData {
  overall: number;
  brandCitationRate: number;
  bestCompetitorRate: number;
  gapPoints: number;
  perProvider: Record<string, number>;
  interpretation: string;
}

interface Props {
  score: ScoreData;
  accentColor: string;
  brandName: string;
}

function rating(score: number): string {
  if (score >= 80) return "Ausgezeichnet";
  if (score >= 60) return "Gut";
  if (score >= 40) return "Mittelmäßig";
  if (score >= 20) return "Schwach";
  return "Kritisch";
}

export function ScoreOverview({ score, accentColor, brandName }: Props) {
  return (
    <Card>
      <CardContent className="p-6">
        <div className="grid grid-cols-1 md:grid-cols-[200px_1fr] gap-6 items-start">
          <div className="flex flex-col items-center">
            <ScoreGauge score={score.overall} accent={accentColor} />
            <div className="mt-2 text-sm font-semibold">{rating(score.overall)}</div>
          </div>
          <div className="flex flex-col gap-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="border border-default-200 rounded-lg p-3 bg-default-50">
                <div className="text-[10px] text-default-500 uppercase tracking-wider">
                  Marken-Zitationsrate
                </div>
                <div className="text-xl font-bold mt-1">
                  {Math.round(score.brandCitationRate * 100)}%
                </div>
                <div className="text-xs text-default-500 mt-0.5">{brandName}</div>
              </div>
              <div className="border border-default-200 rounded-lg p-3 bg-default-50">
                <div className="text-[10px] text-default-500 uppercase tracking-wider">
                  Stärkster Wettbewerber
                </div>
                <div className="text-xl font-bold mt-1">
                  {Math.round(score.bestCompetitorRate * 100)}%
                </div>
                <div className="text-xs text-default-500 mt-0.5">
                  Lücke: {Math.round(score.gapPoints)} Punkte
                </div>
              </div>
            </div>

            <div>
              <h4 className="text-xs font-semibold uppercase tracking-wider text-default-600 mb-2">
                Pro KI-Plattform
              </h4>
              <div className="flex flex-col gap-1.5">
                {Object.entries(score.perProvider).map(([provider, value]) => (
                  <div key={provider} className="flex items-center gap-3 text-xs">
                    <span className="w-20 text-default-500">{provider}</span>
                    <div className="flex-1 h-2 bg-default-100 rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full"
                        style={{ width: `${value}%`, background: accentColor }}
                      />
                    </div>
                    <span className="w-10 text-right font-semibold">{value}%</span>
                  </div>
                ))}
              </div>
            </div>

            <div
              className="border-l-3 pl-3 py-2 rounded-r-md"
              style={{ borderLeftColor: accentColor, background: `${accentColor}0d` }}
            >
              <div className="text-xs font-semibold text-default-600 mb-0.5">Einordnung</div>
              <div className="text-sm">{score.interpretation}</div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
