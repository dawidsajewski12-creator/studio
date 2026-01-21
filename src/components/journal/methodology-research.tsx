'use client';

import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Lightbulb, TestTube2 } from "lucide-react";
import { Separator } from "../ui/separator";

const researchPosts = [
  {
    title: "Analiza hydrologiczna dorzecza rzeki Pad – Susza 2025",
    date: "Styczeń 2026",
    category: "Hydrology",
    abstract: "Wykorzystanie danych Sentinel-2 do oceny skali suszy w północnych Włoszech. W artykule przedstawiono metodykę analizy wskaźnika NDWI oraz porównanie z danymi historycznymi w celu identyfikacji obszarów najbardziej dotkniętych deficytem wody.",
  },
  {
    title: "Monitoring miejskich wysp ciepła w Warszawie",
    date: "Grudzień 2025",
    category: "Urban Planning",
    abstract: "Badanie wpływu terenów zielonych na redukcję temperatury w aglomeracji warszawskiej. Analiza oparta na danych termalnych z satelity Landsat 8 i wskaźniku NDBI z Sentinel-2.",
  },
  {
    title: "Ocena kondycji winnic w regionie Bordeaux przy użyciu NDVI",
    date: "Listopad 2025",
    category: "Agriculture",
    abstract: "Zastosowanie znormalizowanego różnicowego wskaźnika wegetacji (NDVI) do monitorowania stanu zdrowia winorośli. Artykuł demonstruje, jak dane satelitarne mogą wspierać rolnictwo precyzyjne i optymalizować zbiory.",
  }
];

export default function MethodologyAndResearch() {
  return (
    <div className="w-full max-w-screen-lg mx-auto p-4 sm:p-6 md:p-8 space-y-8">
       <Card className="bg-muted/20">
            <CardHeader>
                <CardTitle className="flex items-center gap-2 text-2xl">
                    <TestTube2 className="text-primary" />
                    Metodologia
                </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-muted-foreground">
                <p>
                    <strong>Monitoring Śniegu: NDSI vs. Obrazy RGB</strong><br/>
                    Chociaż obrazy w naturalnych kolorach (RGB) są intuicyjne, mają ograniczenia w precyzyjnym mapowaniu pokrywy śnieżnej. Cień rzucany przez góry może być mylony ze śniegiem, a cienka warstwa śniegu bywa niewidoczna. Wskaźnik <strong>NDSI (Normalized Difference Snow Index)</strong> jest znacznie bardziej niezawodny, ponieważ wykorzystuje różnicę w odbiciu światła między pasmem światła widzialnego (zielonym) a krótkofalową podczerwienią (SWIR), gdzie śnieg silnie absorbuje promieniowanie.
                </p>
                <p>
                    <strong>Filtrowanie Chmur za pomocą SCL (Scene Classification Layer)</strong><br/>
                    Dane z satelity Sentinel-2 zawierają warstwę klasyfikacji sceny (SCL), która identyfikuje każdy piksel jako np. roślinność, wodę, chmurę czy cień chmury. W naszej analizie aktywnie wykorzystujemy tę warstwę, aby maskować (usuwać) piksele oznaczone jako chmury. Gwarantuje to, że obliczenia wskaźnika NDSI są wykonywane tylko dla czystych, wolnych od chmur obserwacji, co znacząco podnosi jakość i wiarygodność danych.
                </p>
            </CardContent>
        </Card>

      <Separator />

       <header>
          <h1 className="text-3xl md:text-4xl font-bold text-primary font-headline">Badania i Artykuły</h1>
          <p className="text-muted-foreground mt-1">Zbiór analiz i publikacji na temat wykorzystania danych satelitarnych.</p>
        </header>
      {researchPosts.map((post, index) => (
        <Card key={index} className="w-full">
          <CardHeader>
            <div className="flex items-center justify-between mb-2">
              <CardTitle className="text-2xl font-bold text-primary">{post.title}</CardTitle>
              <Badge variant="secondary">{post.category}</Badge>
            </div>
            <CardDescription className="text-sm text-muted-foreground">{post.date}</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-foreground/80">{post.abstract}</p>
          </CardContent>
          <CardFooter>
            <Button variant="link" className="p-0">Read More &rarr;</Button>
          </CardFooter>
        </Card>
      ))}
    </div>
  );
}
