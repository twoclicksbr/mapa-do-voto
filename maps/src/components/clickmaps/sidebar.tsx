import { useState } from "react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { SidebarHeader } from "@/components/layouts/layout-33/components/sidebar-header";
import { SidebarFooter } from "@/components/layouts/layout-33/components/sidebar-footer";
import { useLayout } from "@/components/layouts/layout-33/components/context";
import { CandidateSearch } from "@/components/map/candidate-search";
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Progress } from "@/components/ui/progress";
import { ChevronDownIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { Checkbox } from "@/components/ui/checkbox";

const elections = [
  { value: "2008", label: "2008", description: "Vereador · Caraguatatuba · SP" },
  { value: "2012", label: "2012", description: "Vereador · Caraguatatuba · SP" },
  { value: "2022", label: "2022", description: "Deputado Estadual · SP" },
  { value: "2024", label: "2024", description: "Prefeito · Caraguatatuba · SP" },
];

const hasTwoRounds = ['Prefeito', 'Governador', 'Presidente'];

const cities = [
  { value: "caraguatatuba", label: "Caraguatatuba" },
  { value: "ubatuba", label: "Ubatuba" },
  { value: "sao-sebastiao", label: "São Sebastião" },
];

const electionStats = {
  votes: 9999,
  percentage: 42.3,
  details: [
    { label: "Abstenção", value: "18,2%" },
    { label: "Votos nulos", value: "3,1%" },
    { label: "Votos brancos", value: "1,4%" },
    { label: "Total de eleitores", value: "102.450" },
    { label: "Seções apuradas", value: "100%" },
  ],
};

export function ClickMapsSidebarContent() {
  const { isMobile } = useLayout();
  const [selectedElectionValue, setSelectedElectionValue] = useState("2024");
  const [turno, setTurno] = useState<1 | 2>(1);
  const [statsOpen, setStatsOpen] = useState(false);

  const selectedElection = elections.find((e) => e.value === selectedElectionValue) ?? elections[3];
  const showTurno = hasTwoRounds.some((c) => selectedElection.description.includes(c));
  const hasFixedCity = ['Prefeito', 'Vereador'].some((c) => selectedElection.description.includes(c));

  return (
    <div className="flex flex-col items-stretch grow">
      {!isMobile && <SidebarHeader />}
      <ScrollArea className="shrink-0 h-[calc(100vh-3.5rem)] lg:h-[calc(100vh-8.5rem)]">
        <div className="px-4 py-3 flex flex-col gap-1">
          <label className="text-xs font-medium text-gray-500">Candidato:</label>
          <CandidateSearch variant="sidebar" onSelect={(candidate) => console.log(candidate)} />
        </div>
        <div className="px-4 py-3 flex flex-col gap-1 mt-1">
          <label className="text-xs font-medium text-gray-500">Eleição:</label>
          <Select defaultValue="2024" onValueChange={(v) => { setSelectedElectionValue(v); setTurno(1); }}>
            <SelectTrigger className="w-full h-auto py-2">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectGroup>
                {elections.map((e) => (
                  <SelectItem key={e.value} value={e.value} className="[&_svg]:text-primary">
                    <span className="flex flex-col items-start gap-px">
                      <span className="font-medium">{e.label}</span>
                      <small className="text-muted-foreground text-xs">{e.description}</small>
                    </span>
                  </SelectItem>
                ))}
              </SelectGroup>
            </SelectContent>
          </Select>
        </div>
        {showTurno && (
          <div className="px-4 flex flex-col gap-1 mt-1">
            <label className="text-xs font-medium text-gray-500">Turno:</label>
            <div className="flex w-full">
              <Button
                variant={turno === 1 ? 'primary' : 'outline'}
                size="sm"
                className="flex-1 rounded-r-none border-r-0"
                onClick={() => setTurno(1)}
              >
                1° turno
              </Button>
              <Button
                variant={turno === 2 ? 'primary' : 'outline'}
                size="sm"
                className="flex-1 rounded-l-none"
                onClick={() => setTurno(2)}
              >
                2° turno
              </Button>
            </div>
          </div>
        )}
        <div className="px-4 mt-3 pb-6">
          <Collapsible open={statsOpen} onOpenChange={setStatsOpen} className="relative">
            <Card>
              <CardHeader className="px-4 min-h-0 py-3">
                <CardTitle className="text-sm font-medium">
                  Quantidade de Votos: <b>{electionStats.votes.toLocaleString('pt-BR')}</b>
                </CardTitle>
              </CardHeader>
              <CardContent className="px-4 py-3 space-y-4">
                <div className="bg-muted/60 border border-border rounded-lg space-y-2 p-3">
                  <div className="flex justify-between text-sm font-medium">
                    <span>{electionStats.percentage}% dos votos válidos</span>
                  </div>
                  <Progress
                    value={electionStats.percentage}
                    className="h-1.5 bg-primary/20"
                  />
                </div>
                <CollapsibleContent>
                  <div className="flex flex-col gap-2.5 pt-2">
                    {electionStats.details.map((item) => (
                      <div key={item.label} className="flex justify-between text-xs">
                        <span className="text-muted-foreground font-medium">{item.label}</span>
                        <span className="font-medium">{item.value}</span>
                      </div>
                    ))}
                  </div>
                  <div className="pt-2 border-t border-border mt-2">
                    {hasFixedCity ? (
                      <div className="flex justify-between text-xs">
                        <span className="text-muted-foreground font-medium">Cidade</span>
                        <span className="font-medium">Caraguatatuba</span>
                      </div>
                    ) : (
                      <div className="flex flex-col gap-1">
                        <span className="text-xs text-muted-foreground font-medium">Cidade</span>
                        <Select defaultValue="caraguatatuba">
                          <SelectTrigger className="w-full">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectGroup>
                              {cities.map((c) => (
                                <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>
                              ))}
                            </SelectGroup>
                          </SelectContent>
                        </Select>
                      </div>
                    )}
                  </div>
                </CollapsibleContent>
              </CardContent>
            </Card>
            <div className="absolute -bottom-3.5 left-1/2 -translate-x-1/2">
              <CollapsibleTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  mode="icon"
                  className="bg-background rounded-full shadow-sm w-7 h-7"
                >
                  <ChevronDownIcon className={cn("size-3.5 transition-transform", statsOpen && "rotate-180")} />
                  <span className="sr-only">Ver detalhes</span>
                </Button>
              </CollapsibleTrigger>
            </div>
          </Collapsible>
        </div>
        <div className="px-4 mt-3 pb-6 flex flex-col gap-2">
          {[
            { id: "zonas", label: "Zonas Eleitorais" },
            { id: "colegio", label: "Colégio Eleitoral" },
            { id: "calor", label: "Mapa de Calor" },
          ].map((item) => (
            <label key={item.id} className="flex items-center gap-2 text-sm cursor-pointer">
              <Checkbox id={item.id} size="sm" />
              {item.label}
            </label>
          ))}
        </div>
      </ScrollArea>
      <SidebarFooter />
    </div>
  );
}
