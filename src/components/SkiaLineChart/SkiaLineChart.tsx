import React, { useRef, useEffect, useState } from 'react';
import { View, ScrollView, Text, Modal, TouchableOpacity, Button, Dimensions } from 'react-native';
import { Canvas, Path, Skia, Text as SkiaText, useFont, Line } from '@shopify/react-native-skia';
import * as ScreenOrientation from 'expo-screen-orientation';
import { styles } from './_layout';

interface SkiaLineChartProps {
    data: number[];
    height?: number;
    padding?: number;
    fullscreenEnabled?: boolean;
}

export default function SkiaLineChart({
    data,
    height = 300,
    padding = 40,
    fullscreenEnabled = false,
}: SkiaLineChartProps) {
    const scrollViewRef = useRef<ScrollView>(null);
    const font = useFont(require('../../../assets/fonts/SpaceMono-Regular.ttf'), 12);
    const [fullscreen, setFullscreen] = useState(false);

    useEffect(() => {
        if (data.length > 200) {
            // Evita scroll no início com poucos dados
            scrollViewRef.current?.scrollToEnd({ animated: true });
        }
    }, [data]);

    // Controle de orientação em fullscreen
    useEffect(() => {
        if (!fullscreenEnabled || !fullscreen) return;
        (async () => {
            await ScreenOrientation.lockAsync(ScreenOrientation.OrientationLock.LANDSCAPE_RIGHT);
        })();

        // get height of screen when in fullscreen
        const dimensions = Dimensions.get('window');
        const newHeight = dimensions.height;
        if (newHeight !== height) {
            height = newHeight;
        }

        return () => {
            ScreenOrientation.unlockAsync();
        };
    }, [fullscreen, fullscreenEnabled]);

    if (!font || data.length < 2)
        return (
            <View style={{ height }}>
                <Text>Aguardando dados...</Text>
            </View>
        ); // <-- Melhor feedback inicial

    const chartHeight = height - padding * 2;
    const chartWidth = data.length * 2; // Usaremos pointSpacing fixo de 2
    const canvasWidth = chartWidth + padding * 2;

    // 1. Encontrar a amplitude máxima absoluta para escalar o gráfico verticalmente
    // const absoluteMax = Math.max(...data.map(Math.abs));

    // Se todos os dados forem zero, evitamos divisão por zero.
    // const yAxisMax = absoluteMax === 0 ? 1 : absoluteMax;
    const yAxisMax = 24000;

    // 2. Definir a posição do eixo zero (bem no meio do gráfico)
    const zeroAxisY = padding + chartHeight / 2;

    // 3. Função de mapeamento de dados para pontos na tela (nova lógica)
    function translateDataToPoints(rawData: number[]) {
        return rawData.map((value, index) => {
            const x = index * 2 + padding;
            const y = zeroAxisY - (value / yAxisMax) * (chartHeight / 2);

            // 3. O mapeamento está correto para um valor negativo?
            if (index === 0 && value < 0) {
                // Log apenas para o primeiro ponto negativo que encontrar
                console.log(`Valor negativo ${value} foi mapeado para y = ${y}`);
            }
            return { x, y };
        });
    }

    const points = translateDataToPoints(data);
    const path = Skia.Path.Make();

    if (points.length > 0) {
        path.moveTo(points[0].x, points[0].y);
        points.slice(1).forEach((p) => path.lineTo(p.x, p.y));
    }

    const renderChart = (renderHeight: number) => {
        // Recalcular posições com base na altura de renderização
        const currentChartHeight = renderHeight - padding * 2;
        const currentZeroAxisY = padding + currentChartHeight / 2;

        return (
            <View style={styles.chartContainer}>
                {/* Labels do Eixo Y (Positivo e Negativo) */}
                <View
                    style={[
                        styles.yAxis,
                        {
                            height: renderHeight,
                            justifyContent: 'space-between',
                            paddingTop: padding,
                            paddingBottom: padding,
                        },
                    ]}
                >
                    <Text>{yAxisMax.toFixed(0)}</Text>
                    <Text>0</Text>
                    <Text>{(-yAxisMax).toFixed(0)}</Text>
                </View>

                <ScrollView
                    horizontal
                    ref={scrollViewRef}
                    contentContainerStyle={{ width: canvasWidth, height: renderHeight }}
                >
                    <Canvas style={styles.canvas}>
                        {/* EIXO ZERO HORIZONTAL (LINHA CENTRAL) */}
                        <Line
                            p1={{ x: padding, y: currentZeroAxisY }}
                            p2={{ x: canvasWidth - padding, y: currentZeroAxisY }}
                            color="#e0e0e0"
                            strokeWidth={1.5}
                        />

                        {/* Linha de dados */}
                        <Path path={path} color="blue" style="stroke" strokeWidth={2} />
                    </Canvas>
                </ScrollView>
            </View>
        );
    };

    return (
        <View style={{ flex: 1 }}>
            {fullscreenEnabled && (
                <View style={styles.fullscreenHeader}>
                    <TouchableOpacity onPress={() => setFullscreen(true)}>
                        <Text style={styles.fullscreenButton}>⛶</Text>
                    </TouchableOpacity>
                </View>
            )}

            {renderChart(height)}

            {fullscreenEnabled && (
                <Modal visible={fullscreen} animationType="slide">
                    <View style={styles.modalContent}>
                        <View style={[styles.fullscreenHeader, { margin: 10 }]}>
                            <Button title="Fechar" onPress={() => setFullscreen(false)} />
                        </View>
                        {renderChart(height)}
                    </View>
                </Modal>
            )}
        </View>
    );
}
