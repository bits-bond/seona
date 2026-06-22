"use client";

import { Button, Card, CardContent } from "@heroui/react";
import { Download, ExternalLink } from "lucide-react";
import { useState } from "react";

interface Props {
  projectId: string;
  defaultLang?: "de" | "en";
}

export function ReportViewer({ projectId, defaultLang = "de" }: Props) {
  const [lang, setLang] = useState<"de" | "en">(defaultLang);
  const htmlUrl = `/api/projects/${projectId}/aeo/report?lang=${lang}&format=html`;
  const pdfUrl = `/api/projects/${projectId}/aeo/report?lang=${lang}&format=pdf`;

  return (
    <Card>
      <CardContent className="p-0">
        <div className="flex items-center justify-between p-3 border-b border-default-200 flex-wrap gap-2">
          <div className="text-sm font-medium">Kundenbericht</div>
          <div className="flex items-center gap-2">
            <div className="inline-flex rounded-lg border border-default-200 overflow-hidden text-xs">
              <button
                onClick={() => setLang("de")}
                className={`px-3 py-1.5 ${lang === "de" ? "bg-primary text-primary-foreground font-medium" : "bg-content1 text-default-600 hover:bg-default-100"}`}
              >
                Deutsch
              </button>
              <button
                onClick={() => setLang("en")}
                className={`px-3 py-1.5 ${lang === "en" ? "bg-primary text-primary-foreground font-medium" : "bg-content1 text-default-600 hover:bg-default-100"}`}
              >
                English
              </button>
            </div>
            <Button
              size="sm"
              variant="flat"
              as="a"
              href={htmlUrl}
              target="_blank"
              rel="noreferrer"
              startContent={<ExternalLink className="w-4 h-4" />}
            >
              Neuer Tab
            </Button>
            <Button
              size="sm"
              color="primary"
              as="a"
              href={pdfUrl}
              startContent={<Download className="w-4 h-4" />}
            >
              PDF
            </Button>
          </div>
        </div>
        <iframe
          src={htmlUrl}
          title="AEO Report"
          className="w-full h-[1000px] bg-white"
        />
      </CardContent>
    </Card>
  );
}
