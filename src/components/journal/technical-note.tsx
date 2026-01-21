import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Lightbulb } from "lucide-react";

export default function TechnicalNote() {
    return (
        <div className="w-full max-w-screen-2xl mt-6">
            <Card className="bg-muted/20">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Lightbulb className="text-primary" />
                        Nota Techniczna
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
        </div>
    );
}
