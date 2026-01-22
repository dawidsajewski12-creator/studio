import { getLatestVisual } from "@/lib/data";
import { PROJECTS } from "@/lib/projects";
import Image from "next/image";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { CloudOff } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";

export default async function VisualProof({ projectId }: { projectId: string }) {
    const project = PROJECTS.find(p => p.id === projectId);

    if (!project || project.stations.length === 0) {
        return null;
    }

    // Use the first station of the project for the visual proof.
    const stationForVisual = project.stations[0]; 

    const imageUrl = await getLatestVisual(stationForVisual);

    return (
        <Card className="bg-transparent border-0 shadow-none">
            <CardHeader className="p-0 mb-2">
                <CardTitle className="text-sm font-semibold text-sidebar-foreground">Live Visual ({stationForVisual.name})</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
                {imageUrl ? (
                    <Image
                        src={imageUrl}
                        alt={`Latest satellite image of ${stationForVisual.name}`}
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
