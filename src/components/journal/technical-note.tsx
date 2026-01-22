import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { type Project } from "@/lib/types";
import { Lightbulb } from "lucide-react";

export default function TechnicalNote({ project }: { project: Project }) {
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
                        <strong>Metodologia: Interpolacja Liniowa</strong><br />
                        Stosujemy interpolację liniową dla luk w szeregach czasowych spowodowanych zachmurzeniem (po filtracji SCL), co pozwala na ciągły monitoring trendów i lepsze zrozumienie rocznych cykli, np. topnienia pokrywy śnieżnej czy dynamiki zakwitów alg. Punkty na wykresie oznaczają rzeczywiste, bezchmurne odczyty z satelity.
                    </p>
                </CardContent>
            </Card>
        </div>
    );
}
