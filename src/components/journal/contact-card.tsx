'use client';

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Github, Linkedin, Mail, Paperclip } from "lucide-react";
import { Separator } from "@/components/ui/separator";

export default function ContactCard() {
  return (
    <div className="w-full max-w-screen-md mx-auto p-4 sm:p-6 md:p-8">
      <Card className="overflow-hidden">
        <CardHeader className="bg-muted/30 p-6">
          <div className="flex items-center gap-6">
            <Avatar className="h-24 w-24 border-4 border-background">
              <AvatarImage src="https://github.com/shadcn.png" alt="User Avatar" />
              <AvatarFallback>GIS</AvatarFallback>
            </Avatar>
            <div>
              <h1 className="text-3xl font-bold text-primary">Twój Specjalista GIS</h1>
              <p className="text-lg text-muted-foreground">Data Analyst / GIS Specialist</p>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-6">
          <p className="mb-6 text-foreground/80">
            Pasjonat analizy danych geoprzestrzennych i wizualizacji. Specjalizuję się w przetwarzaniu danych satelitarnych (Copernicus, Landsat) w celu monitorowania środowiska i wspierania zrównoważonego rozwoju. Otwarty na nowe wyzwania i innowacyjne projekty.
          </p>
          <Separator className="my-6" />
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-primary">Nawiążmy współpracę</h3>
            <p className="text-muted-foreground">
              Masz pomysł na projekt lub potrzebujesz wsparcia w analizie danych? Skontaktuj się ze mną.
            </p>
            <div className="flex flex-wrap gap-2">
              <Button asChild variant="outline">
                <a href="#" target="_blank" rel="noopener noreferrer">
                  <Linkedin className="mr-2 h-4 w-4" /> LinkedIn
                </a>
              </Button>
              <Button asChild variant="outline">
                <a href="#" target="_blank" rel="noopener noreferrer">
                  <Github className="mr-2 h-4 w-4" /> GitHub
                </a>
              </Button>
              <Button asChild variant="outline">
                <a href="#" target="_blank" rel="noopener noreferrer">
                  <Paperclip className="mr-2 h-4 w-4" /> Portfolio
                </a>
              </Button>
               <Button asChild>
                <a href="mailto:example@example.com">
                  <Mail className="mr-2 h-4 w-4" /> Napisz e-mail
                </a>
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
