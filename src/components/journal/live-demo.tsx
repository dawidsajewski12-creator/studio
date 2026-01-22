import { getProjectData } from '@/lib/data';
import { PROJECTS } from '@/lib/projects';
import type { IndexDataPoint, KpiData, Project, Station } from '@/lib/types';
import Dashboard from '@/components/sentinel-monitor/dashboard';
import TechnicalNote from '@/components/journal/technical-note';
import { notFound } from 'next/navigation';
import { format, parseISO } from 'date-fns';

const getDailyLakeAverage = (dataForDay: IndexDataPoint[], totalPoints: number) => {
    const validPoints = dataForDay.filter(d => d.indexValue !== null && !d.isInterpolated);
    if (validPoints.length === 0) {
        return { avgIndex: null, coverage: 0 };
    }
    const sum = validPoints.reduce((acc, curr) => acc + curr.indexValue!, 0);
    const coverage = (validPoints.length / totalPoints) * 100;
    return {
        avgIndex: sum / validPoints.length,
        coverage: coverage,
    };
};

const calculateBloomProbability = (ndci: number | null, temp: number | null): number | null => {
    if (ndci === null || temp === null) return null;

    let thermalFactor = 0;
    if (temp >= 12 && temp <= 25) {
        thermalFactor = (temp - 12) / 13;
    } else if (temp > 25) {
        thermalFactor = 1.0;
    }

    let biomassFactor = 0;
    if (ndci > 0 && ndci <= 0.4) {
        biomassFactor = ndci / 0.4;
    } else if (ndci > 0.4) {
        biomassFactor = 1.0;
    }

    return thermalFactor * biomassFactor * 100;
};

const processLakeAnalytics = (rawData: IndexDataPoint[], totalPoints: number): { aggregatedData: IndexDataPoint[], kpi: KpiData } => {
    const groupedByDate: { [date: string]: IndexDataPoint[] } = {};
    rawData.forEach(point => {
        const dateStr = format(parseISO(point.date), 'yyyy-MM-dd');
        if (!groupedByDate[dateStr]) {
            groupedByDate[dateStr] = [];
        }
        groupedByDate[dateStr].push(point);
    });

    const aggregatedSeries: IndexDataPoint[] = Object.entries(groupedByDate).map(([date, points]) => {
        const { avgIndex, coverage } = getDailyLakeAverage(points, totalPoints);
        const representativeTemp = points[0]?.temperature ?? null;
        const bloomProbability = calculateBloomProbability(avgIndex, representativeTemp);

        return {
            date: parseISO(date).toISOString(),
            stationId: 'lake-average',
            indexValue: avgIndex,
            isInterpolated: avgIndex === null,
            temperature: representativeTemp,
            spatialCoverage: coverage,
            bloomProbability,
        };
    });

    for (let i = 0; i < aggregatedSeries.length; i++) {
        if (aggregatedSeries[i].indexValue === null) {
            let prevIndex = i - 1;
            while (prevIndex >= 0 && aggregatedSeries[prevIndex].indexValue === null) prevIndex--;
            
            let nextIndex = i + 1;
            while (nextIndex < aggregatedSeries.length && aggregatedSeries[nextIndex].indexValue === null) nextIndex++;
            
            if (prevIndex >= 0 && nextIndex < aggregatedSeries.length) {
                const prevPoint = aggregatedSeries[prevIndex];
                const nextPoint = aggregatedSeries[nextIndex];
                if (prevPoint.indexValue !== null && nextPoint.indexValue !== null) {
                    const prevValue = prevPoint.indexValue;
                    const nextValue = nextPoint.indexValue;
                    const prevTime = parseISO(prevPoint.date).getTime();
                    const nextTime = parseISO(nextPoint.date).getTime();
                    const currentTime = parseISO(aggregatedSeries[i].date).getTime();
                    const fraction = (currentTime - prevTime) / (nextTime - prevTime);
                    const interpolatedValue = prevValue + fraction * (nextValue - prevValue);
                    aggregatedSeries[i].indexValue = interpolatedValue;
                    aggregatedSeries[i].isInterpolated = true;

                    if (aggregatedSeries[i].temperature !== null) {
                        aggregatedSeries[i].bloomProbability = calculateBloomProbability(interpolatedValue, aggregatedSeries[i].temperature);
                    }
                }
            }
        }
    }

    const latestValidReading = [...aggregatedSeries]
        .filter(d => !d.isInterpolated && d.indexValue !== null)
        .pop();

    const kpi: KpiData = {
      stationId: 'lake-average',
      name: 'Lake-Wide Average',
      latestIndexValue: latestValidReading?.indexValue ?? null,
      latestDate: latestValidReading?.date ?? null,
      spatialCoverage: latestValidReading?.spatialCoverage ?? 0,
      riskValue: latestValidReading?.bloomProbability ?? null,
      riskLabel: 'Bloom Risk',
    };

    return { aggregatedData: aggregatedSeries, kpi };
};

const processVineyardAnalytics = (rawData: IndexDataPoint[]): IndexDataPoint[] => {
    return rawData.map(d => {
        let waterStress: number | null = null;
        const ndvi = d.indexValue; // indexValue is NDVI for vineyards
        const ndmi = d.ndmiValue;

        if (ndvi !== null && ndmi !== null) {
            // Dormancy Filter: If NDVI is below 0.5, the vine is likely dormant.
            if (ndvi < 0.5) {
                waterStress = 0;
            } else {
                // Active Season: Calculate stress based on NDMI.
                // High Stress (Wilting Point) at NDMI <= -0.1 (100% risk)
                // No Stress (Well Watered) at NDMI >= 0.2 (0% risk)
                // Linear interpolation between these points.
                const risk = (0.2 - ndmi) / 0.3 * 100; // (0.2 - (-0.1)) = 0.3
                waterStress = Math.max(0, Math.min(100, risk));
            }
        }
        
        return {
            ...d,
            waterStress: waterStress,
        };
    });
};


export default async function LiveDemo({ projectId }: { projectId: string }) {
  const project = PROJECTS.find(p => p.id === projectId);

  if (!project) {
    notFound();
  }

  const rawIndexData = await getProjectData(project);
  
  let kpiData: KpiData[] = [];
  let chartData: { raw: IndexDataPoint[], aggregated: IndexDataPoint[] } = { raw: [], aggregated: [] };
  let mapFeatures: (Station & { latestIndexValue: number | null, latestNdmiValue?: number | null, bloomProbability?: number | null })[] = [];

  if (project.id.includes('lake')) {
      const { aggregatedData, kpi } = processLakeAnalytics(rawIndexData, project.stations.length);
      kpiData.push(kpi);
      chartData = { raw: rawIndexData, aggregated: aggregatedData.filter(d => d.temperature !== null && d.indexValue !== null) };

      const latestAggregatedTemp = aggregatedData.filter(d => d.temperature !== null).pop()?.temperature ?? null;

      mapFeatures = project.stations.map(station => {
        const latestReading = [...rawIndexData]
            .filter(d => d.stationId === station.id && d.indexValue !== null && !d.isInterpolated)
            .pop();
        const probability = calculateBloomProbability(latestReading?.indexValue ?? null, latestAggregatedTemp);
        return {
            ...station,
            latestIndexValue: latestReading?.indexValue ?? null,
            bloomProbability: probability,
        };
      });

  } else if (project.id.includes('vineyard')) {
    const processedData = processVineyardAnalytics(rawIndexData);
    kpiData = project.stations.map(station => {
        const stationData = processedData.filter(d => d.stationId === station.id);
        const latestReading = [...stationData]
          .filter(d => d.indexValue !== null && !d.isInterpolated)
          .pop();
        return {
            stationId: station.id,
            name: station.name,
            latestIndexValue: latestReading?.indexValue ?? null,
            latestNdmiValue: latestReading?.ndmiValue ?? null,
            latestDate: latestReading?.date ?? null,
        }
    });
    chartData = { raw: processedData, aggregated: [] };
    
    mapFeatures = project.stations.map(station => {
        const latestReading = [...processedData]
          .filter(d => d.stationId === station.id && d.indexValue !== null && !d.isInterpolated)
          .pop();
        return {
            ...station,
            latestIndexValue: latestReading?.indexValue ?? null,
            latestNdmiValue: latestReading?.ndmiValue ?? null,
        }
    });

  } else { 
      kpiData = project.stations.map(station => {
          const stationData = rawIndexData.filter(d => d.stationId === station.id);
          const latestReading = [...stationData]
            .filter(d => d.indexValue !== null && !d.isInterpolated)
            .pop();
          return {
              stationId: station.id,
              name: station.name,
              latestIndexValue: latestReading?.indexValue ?? null,
              latestDate: latestReading?.date ?? null,
          }
      });
      chartData = { raw: rawIndexData, aggregated: [] };

      mapFeatures = project.stations.map(station => {
        const latestReading = [...rawIndexData]
            .filter(d => d.stationId === station.id && d.indexValue !== null && !d.isInterpolated)
            .pop();
        return {
            ...station,
            latestIndexValue: latestReading?.indexValue ?? null,
        };
      });
  }


  return (
    <div className="flex min-h-screen flex-col items-center p-4 sm:p-6 md:p-8 bg-background">
      <div className="w-full max-w-screen-2xl">
        <header className="mb-6 md:mb-8">
          <h1 className="text-3xl md:text-4xl font-bold text-primary font-headline">{project.name}</h1>
          <p className="text-muted-foreground mt-1">{project.description}</p>
        </header>
        <Dashboard 
          key={project.id}
          project={project}
          chartData={chartData}
          kpiData={kpiData}
          mapFeatures={mapFeatures}
        />
        <TechnicalNote project={project} />
      </div>
    </div>
  );
}
