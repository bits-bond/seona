"use client";

import { Button, Card, CardContent } from "@heroui/react";
import { Download, FileText, ScrollText, Shield } from "lucide-react";

interface Props {
  projectId: string;
}

const ARTIFACTS = [
  {
    file: "llms.txt",
    title: "llms.txt",
    desc: "In den Root deiner Domain hochladen — erreichbar unter /llms.txt",
    icon: ScrollText,
  },
  {
    file: "robots-patch.diff",
    title: "robots.txt-Patch",
    desc: "Unified-Diff zum Anwenden auf bestehende robots.txt (KI-Crawler explizit freigeben)",
    icon: Shield,
  },
  {
    file: "schema.jsonld",
    title: "JSON-LD-Schema",
    desc: "Organization-/Person-/Article-Markup für den <head>-Bereich",
    icon: FileText,
  },
  {
    file: "eeat-recommendations.md",
    title: "E-E-A-T-Empfehlungen",
    desc: "Priorisierte Maßnahmen für Erfahrung, Expertise, Autorität, Vertrauen",
    icon: FileText,
  },
];

export function ArtifactsPanel({ projectId }: Props) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
      {ARTIFACTS.map(({ file, title, desc, icon: Icon }) => (
        <Card key={file} shadow="none" className="border border-default-200">
          <CardContent className="flex flex-col gap-2">
            <div className="flex items-center gap-2">
              <Icon className="w-4 h-4 text-default-500" />
              <div className="font-medium text-sm">{title}</div>
            </div>
            <p className="text-xs text-default-500">{desc}</p>
            <div className="flex gap-2 pt-1">
              <Button
                size="sm"
                variant="flat"
                as="a"
                href={`/api/projects/${projectId}/aeo/artifacts/${file}`}
                target="_blank"
                rel="noreferrer"
              >
                Vorschau
              </Button>
              <Button
                size="sm"
                color="primary"
                variant="flat"
                as="a"
                href={`/api/projects/${projectId}/aeo/artifacts/${file}?download=1`}
                startContent={<Download className="w-3 h-3" />}
              >
                Download
              </Button>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
