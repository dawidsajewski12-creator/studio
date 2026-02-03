export type SiteConfig = typeof siteConfig

export const siteConfig = {
    methodology: {
        title: "Metodologia",
        ndsi: {
            title: "Monitoring Śniegu: NDSI (Normalized Difference Snow Index)",
            description: "Chociaż obrazy w naturalnych kolorach (RGB) są intuicyjne, mają ograniczenia w precyzyjnym mapowaniu pokrywy śnieżnej. Cień rzucany przez góry może być mylony ze śniegiem, a cienka warstwa śniegu bywa niewidoczna. Wskaźnik NDSI jest znacznie bardziej niezawodny, ponieważ wykorzystuje różnicę w odbiciu światła między pasmem światła widzialnego (zielonym) a krótkofalową podczerwienią (SWIR), gdzie śnieg silnie absorbuje promieniowanie."
        },
        ndci: {
            title: "Monitoring Wody: NDCI (Normalized Difference Chlorophyll Index)",
            description: "Wskaźnik NDCI jest używany do oceny stężenia chlorofilu-a w wodzie, co jest kluczowym wskaźnikiem obecności fitoplanktonu i potencjalnych zakwitów alg. Oblicza się go na podstawie różnicy w odbiciu światła między pasmem \"red-edge\" (B05) a pasmem czerwonym (B04). Wysokie wartości NDCI wskazują na dużą ilość chlorofilu i mogą sygnalizować ryzyko eutrofizacji (przeżyźnienia) zbiornika wodnego."
        },
        scl: {
            title: "Filtrowanie Danych za pomocą SCL (Scene Classification Layer)",
            description: "Dane z satelity Sentinel-2 zawierają warstwę klasyfikacji sceny (SCL), która identyfikuje każdy piksel jako np. roślinność, wodę, chmurę czy cień chmury. W naszej analizie aktywnie wykorzystujemy tę warstwę, aby maskować (usuwać) piksele niepożądane — np. chmury w przypadku analizy śniegu, czy ląd i chmury w przypadku analizy wody. Gwarantuje to, że obliczenia wskaźników są wykonywane tylko dla czystych, odpowiednich obserwacji, co znacząco podnosi jakość i wiarygodność danych."
        }
    },
    research: {
        title: "Badania i Artykuły",
        description: "Zbiór analiz i publikacji na temat wykorzystania danych satelitarnych."
    }
}
