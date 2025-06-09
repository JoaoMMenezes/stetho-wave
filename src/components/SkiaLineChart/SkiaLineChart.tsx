import React, { useEffect, useState, useMemo } from 'react';
import { View, Text, Modal, TouchableOpacity, Button, Dimensions } from 'react-native';
import { Canvas, Path, Skia, useFont, Line, Text as SkiaText } from '@shopify/react-native-skia';
import * as ScreenOrientation from 'expo-screen-orientation';
import { styles } from './_layout'; // Seus estilos

interface SkiaLineChartProps {
    data: number[];
    height?: number;
    // O padding agora é gerenciado internamente, então podemos simplificar as props
    fullscreenEnabled?: boolean;
}

// A função de downsampling que criamos anteriormente continua útil
function downsampleData(data: number[], targetPoints: number): number[] {
    if (data.length <= targetPoints || targetPoints <= 0) {
        return data;
    }
    const downsampled = [];
    const bucketSize = data.length / targetPoints;
    for (let i = 0; i < targetPoints; i++) {
        const bucketStart = Math.floor(i * bucketSize);
        const bucketEnd = Math.floor((i + 1) * bucketSize);
        const bucket = data.slice(bucketStart, bucketEnd);
        if (bucket.length === 0) continue;
        let peak = bucket[0];
        for (let j = 1; j < bucket.length; j++) {
            if (Math.abs(bucket[j]) > Math.abs(peak)) {
                peak = bucket[j];
            }
        }
        downsampled.push(peak);
    }
    return downsampled;
}

export default function SkiaLineChart({
    data,
    height = 300,
    fullscreenEnabled = false,
}: SkiaLineChartProps) {
    const font = useFont(require('../../../assets/fonts/SpaceMono-Regular.ttf'), 10); // Ajuste o tamanho da fonte se necessário
    const [fullscreen, setFullscreen] = useState(false);

    const renderChart = (renderHeight: number) => {
        // --- Definição da Área do Gráfico ---
        const PADDING_TOP = 20;
        const PADDING_BOTTOM = 30;
        const PADDING_LEFT = 40;
        const PADDING_RIGHT = 20;

        const screenWidth = Dimensions.get('window').width;

        const canvasWidth = screenWidth * 0.8;
        const canvasHeight = renderHeight;

        const chartWidth = canvasWidth - PADDING_LEFT - PADDING_RIGHT;
        const chartHeight = canvasHeight - PADDING_TOP - PADDING_BOTTOM;

        const yAxisMax = 1.5;

        const processedData = useMemo(
            () => downsampleData(data, Math.floor(chartWidth)),
            [data, chartWidth]
        );

        const valueToY = (value: number) => {
            const chartZeroY = PADDING_TOP + chartHeight / 2;
            return chartZeroY - (value / yAxisMax) * (chartHeight / 2);
        };

        const path = useMemo(() => {
            if (processedData.length < 2) return Skia.Path.Make();
            const newPath = Skia.Path.Make();
            const scaleX = chartWidth / (processedData.length - 1);
            newPath.moveTo(PADDING_LEFT, valueToY(processedData[0]));
            processedData.forEach((value, index) => {
                if (index > 0) {
                    newPath.lineTo(PADDING_LEFT + index * scaleX, valueToY(value));
                }
            });
            return newPath;
        }, [processedData, chartWidth]);

        const yAxisLabels = [];
        for (let i = yAxisMax; i >= -yAxisMax; i -= 0.25) {
            yAxisLabels.push(i);
        }

        const xAxisLabels = [];
        const numLabelsX = 5;
        for (let i = 0; i < numLabelsX; i++) {
            const dataIndex = Math.floor((data.length / (numLabelsX - 1)) * i);
            const xPos = PADDING_LEFT + (chartWidth / (numLabelsX - 1)) * i;
            xAxisLabels.push({ text: `${dataIndex}`, x: xPos });
        }
        if (xAxisLabels.length > 0) {
            xAxisLabels[xAxisLabels.length - 1] = {
                text: `${data.length - 1}`,
                x: PADDING_LEFT + chartWidth,
            };
        }

        if (!font || data.length < 2) {
            return (
                <View
                    style={{ height: canvasHeight, alignSelf: 'center', justifyContent: 'center' }}
                >
                    <Text>Aguardando dados suficientes...</Text>
                </View>
            );
        }

        return (
            <Canvas style={{ width: canvasWidth, height: canvasHeight }}>
                {/* Eixo Y vertical */}
                <Line
                    p1={{ x: PADDING_LEFT, y: PADDING_TOP }}
                    p2={{ x: PADDING_LEFT, y: PADDING_TOP + chartHeight }}
                    color="grey"
                    strokeWidth={1}
                />

                {/* NOVO: Label de unidade do Eixo Y (Pascal) */}
                <SkiaText
                    x={PADDING_LEFT - 35}
                    y={PADDING_TOP - 10}
                    text="(Pa)"
                    font={font}
                    color="grey"
                />

                {/* Linhas Guia Horizontais e Labels do Eixo Y */}
                {yAxisLabels.map((label, index) => {
                    const y = valueToY(label);

                    // ALTERAÇÃO: Condicional para destacar a linha do zero
                    const isZeroAxis = label === 0;
                    const lineColor = isZeroAxis ? '#999999' : '#e0e0e0'; // Cinza mais escuro para o eixo zero
                    const lineWidth = isZeroAxis ? 1 : 0.5;

                    return (
                        <React.Fragment key={index}>
                            <Line
                                p1={{ x: PADDING_LEFT, y }}
                                p2={{ x: PADDING_LEFT + chartWidth, y }}
                                color={lineColor}
                                strokeWidth={lineWidth}
                            />
                            <SkiaText
                                x={PADDING_LEFT - 35}
                                y={y + 4}
                                text={label.toFixed(2)}
                                font={font}
                                color="grey"
                            />
                        </React.Fragment>
                    );
                })}

                {/* Labels do Eixo X */}
                {xAxisLabels.map((label, index) => (
                    <SkiaText
                        key={index}
                        x={label.x - 10}
                        y={PADDING_TOP + chartHeight + 20}
                        text={label.text}
                        font={font}
                        color="grey"
                    />
                ))}

                {/* Path Principal com os dados */}
                <Path path={path} color="#6A5ACD" style="stroke" strokeWidth={2} />
            </Canvas>
        );
    };

    return (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
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
