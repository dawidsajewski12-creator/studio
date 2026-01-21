'use client';

import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

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

export default function ResearchJournal() {
  return (
    <div className="w-full max-w-screen-lg mx-auto p-4 sm:p-6 md:p-8 space-y-8">
       <header className="mb-6 md:mb-8">
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
