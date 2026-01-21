import { getLatestVisual } from "@/lib/data";
import { PROJECTS } from "@/lib/projects";
import Image from "next/image";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { CloudOff } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";

export default async function VisualProof() {
    // For simplicity, let's always get proof for the "Glacier" station
    const project = PROJECTS.find(p => p.id === 'snow-watch');
    const glacierStation = project?.stations.find(s => s.id === 'theodul');

    if (!glacierStation) {
        return null;
    }

    const imageUrl = await getLatestVisual(glacierStation);

    return (
        <Card className="bg-transparent border-0 shadow-none">
            <CardHeader className="p-0 mb-2">
                <CardTitle className="text-sm font-semibold text-sidebar-foreground">Live Visual (Glacier)</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
                {imageUrl ? (
                    <Image
                        src={imageUrl}
                        alt="Latest satellite image of Theodul Glacier"
                        width={512}
                        height={512}
                        className="rounded-md w-full h-auto"
                    />
                ) : (
                    <Alert variant="default" className="bg-sidebar-accent/50 border-sidebar-border text-sidebar-accent-foreground">
                        <CloudOff className="h-4 w-4" />
                        <AlertTitle className="text-xs font-bold">No Clear Image</AlertTitle>
                        <AlertDescription className="text-xs">
                            Could not retrieve a recent, cloud-free visual.
                        </AlertDescription>
                    </Alert>
                )}
            </CardContent>
        </Card>
    );
}
