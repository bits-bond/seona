"use client";

import { Card, CardContent } from "@heroui/react";

interface Recommendation {
  promptId: string | null;
  competitor: string | null;
  gapDescription: string | null;
  recommendations: string[];
}

interface Props {
  recommendations: Recommendation[];
}

export function CompetitorGaps({ recommendations }: Props) {
  if (recommendations.length === 0) {
    return (
      <Card>
        <CardContent className="text-sm text-default-500 py-6 text-center">
          Keine Wettbewerber-Gaps identifiziert. Mögliche Ursachen: keine Gaps {">"} 15 %,
          kein anthropic-Key gesetzt, oder Wettbewerber-Sites nicht erreichbar.
        </CardContent>
      </Card>
    );
  }
  return (
    <div className="flex flex-col gap-3">
      {recommendations.map((rec, i) => (
        <Card key={i} shadow="none" className="border border-default-200">
          <CardContent className="py-4">
            <h4 className="font-semibold text-sm">{rec.competitor}</h4>
            {rec.gapDescription && (
              <p className="text-xs text-default-500 mt-1">{rec.gapDescription}</p>
            )}
            {rec.recommendations.length > 0 && (
              <ol className="list-decimal pl-5 mt-2 flex flex-col gap-1">
                {rec.recommendations.map((r, j) => (
                  <li key={j} className="text-sm">
                    {r}
                  </li>
                ))}
              </ol>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
