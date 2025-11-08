import React, { useState, useMemo, useEffect, useRef } from 'react';
import { View, Text, Modal, TouchableOpacity, Button, Dimensions, ScrollView } from 'react-native';
import { Canvas, Path, Skia, useFont, Line, Text as SkiaText } from '@shopify/react-native-skia';
import { styles } from './_layout';
import * as ScreenOrientation from 'expo-screen-orientation';

interface SkiaLineChartProps {
    data: number[];
    height?: number;
    fullscreenEnabled?: boolean;
    scrollable?: boolean;
    playbackSampleIndex?: number;
    followPlayback?: boolean;
    recordingDurationSeconds?: number;
}

const SAMPLE_RATE = 20000; // Hz

function downsampleData(data: number[], targetPoints: number): number[] {
    if (data.length <= targetPoints || targetPoints <= 0) return data;
    const downsampled = [];
    const bucketSize = data.length / targetPoints;
    for (let i = 0; i < targetPoints; i++) {
        const bucketStart = Math.floor(i * bucketSize);
        const bucketEnd = Math.floor((i + 1) * bucketSize);
        const bucket = data.slice(bucketStart, bucketEnd);
        if (bucket.length === 0) continue;
        let peak = bucket[0];
        for (let j = 1; j < bucket.length; j++) {
            if (Math.abs(bucket[j]) > Math.abs(peak)) peak = bucket[j];
        }
        downsampled.push(peak);
    }
    return downsampled;
}

export default function SkiaLineChart({
    data,
    height = 300,
    fullscreenEnabled = false,
    scrollable = false,
    playbackSampleIndex,
    followPlayback = true,
    recordingDurationSeconds,
}: SkiaLineChartProps) {
    const font = useFont(require('../../../assets/fonts/SpaceMono-Regular.ttf'), 10);
    const [fullscreen, setFullscreen] = useState(false);

    useEffect(() => {
        async function changeOrientation() {
            if (fullscreen) {
                await ScreenOrientation.lockAsync(ScreenOrientation.OrientationLock.LANDSCAPE);
            } else {
                await ScreenOrientation.lockAsync(ScreenOrientation.OrientationLock.PORTRAIT_UP);
            }
        }
        changeOrientation();
    }, [fullscreen]);

    useEffect(() => {
        const subscription = Dimensions.addEventListener('change', () => {
            // Força re-render para atualizar largura/altura
            setFullscreen((prev) => prev);
        });
        return () => subscription?.remove();
    }, []);

    const scrollViewRef = useRef<ScrollView | null>(null);
    const chartContainerWidth = Dimensions.get('window').width * 0.8;
    const MAX_SCREEN_WIDTH = 8000;

    const maxAbsValue = useMemo(() => {
        return data.reduce((max, current) => Math.max(max, Math.abs(current)), 1e-6);
    }, [data]);

    const renderChart = (renderHeight: number, fullWidth?: number) => {
        const PADDING_TOP = 20;
        const PADDING_BOTTOM = 30;
        const PADDING_LEFT = 40;
        const PADDING_RIGHT = 20;

        const screenWidth = Dimensions.get('window').width;
        const canvasWidth = fullWidth || screenWidth * 0.8;
        const canvasHeight = renderHeight;

        const chartWidth = canvasWidth - PADDING_LEFT - PADDING_RIGHT;
        const chartHeight = canvasHeight - PADDING_TOP - PADDING_BOTTOM;

        const yAxisMaxFromData = Math.ceil(maxAbsValue * 1.1 * 100) / 100;
        const yAxisMax = Math.max(yAxisMaxFromData, 3);
        const linesOffset = yAxisMax / 2;

        const processedData = useMemo(() => {
            if (scrollable) {
                const MAX_POINTS_SCROLLABLE = 5000;
                return downsampleData(data, MAX_POINTS_SCROLLABLE);
            }
            return downsampleData(data, Math.max(2, Math.floor(chartWidth)));
        }, [data, chartWidth, scrollable]);

        const valueToY = (value: number) => {
            const chartZeroY = PADDING_TOP + chartHeight / 2;
            return chartZeroY - (value / yAxisMax) * (chartHeight / 2);
        };

        const scaleX = chartWidth / Math.max(1, processedData.length - 1);

        const path = useMemo(() => {
            if (processedData.length < 2) return Skia.Path.Make();
            const newPath = Skia.Path.Make();
            newPath.moveTo(PADDING_LEFT, valueToY(processedData[0]));
            processedData.forEach((value, index) => {
                if (index > 0) {
                    newPath.lineTo(PADDING_LEFT + index * scaleX, valueToY(value));
                }
            });
            return newPath;
        }, [processedData, chartWidth, scaleX]);

        const indicatorX = useMemo(() => {
            if (playbackSampleIndex == null || data.length < 2) return null;
            const originalMaxIndex = Math.max(1, data.length - 1);
            const processedMaxIndex = Math.max(1, processedData.length - 1);
            const processedIndex = Math.round(
                (playbackSampleIndex / originalMaxIndex) * processedMaxIndex
            );
            const x = PADDING_LEFT + processedIndex * scaleX;
            return { x, processedIndex };
        }, [playbackSampleIndex, data.length, processedData, scaleX]);

        const yAxisLabels = [];
        for (let i = yAxisMax; i >= -yAxisMax; i -= linesOffset) yAxisLabels.push(i);

        const xAxisLabels = [];
        const totalDurationSeconds = data.length / SAMPLE_RATE;

        // Se for 'scrollable' (pós-gravação), mostre todos os labels
        if (scrollable) {
            const secondsPerInterval = 0.5;

            for (let s = 0; s < totalDurationSeconds; s += secondsPerInterval) {
                const dataIndex = Math.floor(s * SAMPLE_RATE);
                const xPos = PADDING_LEFT + (dataIndex / (data.length - 1)) * chartWidth;

                xAxisLabels.push({
                    text: s.toFixed(1),
                    x: xPos,
                });
            }

            const lastDataIndex = data.length - 1;
            const lastSecond = (lastDataIndex / SAMPLE_RATE).toFixed(2); // Mais precisão
            const lastXPos = PADDING_LEFT + chartWidth;

            if (xAxisLabels.length === 0 || lastXPos - xAxisLabels[xAxisLabels.length - 1].x > 40) {
                xAxisLabels.push({ text: lastSecond, x: lastXPos });
            }
        }
        // Se NÃO for 'scrollable' (durante a gravação), mostre APENAS o tempo total
        else {
            // Usa o tempo total da gravação, ou (como fallback) a duração da janela atual
            const elapsedSeconds = recordingDurationSeconds ?? totalDurationSeconds;
            const lastXPos = PADDING_LEFT + chartWidth;

            xAxisLabels.push({
                // Mostra o tempo decorrido formatado (ex: "5.2s")
                text: elapsedSeconds.toFixed(1) + 's',
                x: lastXPos,
            });
        }

        if (!font || data.length < 2) {
            return (
                <View
                    style={{ height: canvasHeight, justifyContent: 'center', alignItems: 'center' }}
                >
                    <Text>Aguardando dados suficientes...</Text>
                </View>
            );
        }

        return (
            <Canvas style={{ width: canvasWidth, height: canvasHeight }}>
                <Line
                    p1={{ x: PADDING_LEFT, y: PADDING_TOP }}
                    p2={{ x: PADDING_LEFT, y: PADDING_TOP + chartHeight }}
                    color="grey"
                    strokeWidth={1}
                />
                <SkiaText
                    x={PADDING_LEFT - 35}
                    y={PADDING_TOP - 10}
                    text="(Pa)"
                    font={font}
                    color="grey"
                />

                {yAxisLabels.map((label, index) => {
                    const y = valueToY(label);
                    const isZeroAxis = label === 0;
                    const lineColor = isZeroAxis ? '#999999' : '#e0e0e0';
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

                <Path path={path} color="#6A5ACD" style="stroke" strokeWidth={2} />

                {indicatorX && (
                    <>
                        <Line
                            p1={{ x: indicatorX.x, y: PADDING_TOP }}
                            p2={{ x: indicatorX.x, y: PADDING_TOP + chartHeight }}
                            color="#FF5252"
                            strokeWidth={1.5}
                        />
                        <SkiaText
                            x={indicatorX.x - 20}
                            y={PADDING_TOP - 2}
                            text={`${((playbackSampleIndex ?? 0) / SAMPLE_RATE).toFixed(2)}s`}
                            font={font}
                            color="#FF5252"
                        />
                    </>
                )}
            </Canvas>
        );
    };

    // largura total para ScrollView (se scrollable)
    const totalWidth = scrollable
        ? Math.max(
              chartContainerWidth,
              data.length * (chartContainerWidth / Math.max(1, SAMPLE_RATE))
          )
        : chartContainerWidth;

    const chartElement = scrollable ? (
        <ScrollView
            ref={scrollViewRef}
            horizontal
            showsHorizontalScrollIndicator
            scrollEventThrottle={16}
        >
            {renderChart(height, Math.min(totalWidth, MAX_SCREEN_WIDTH))}
        </ScrollView>
    ) : (
        renderChart(height)
    );

    // Efeito para auto-scroll quando playbackSampleIndex muda
    useEffect(() => {
        if (!scrollable || !followPlayback || playbackSampleIndex == null) return;
        const PADDING_LEFT = 40;
        const PADDING_RIGHT = 20;
        const screenWidth = Dimensions.get('window').width;
        const canvasWidth = Math.min(totalWidth, MAX_SCREEN_WIDTH);
        const chartWidth = canvasWidth - PADDING_LEFT - PADDING_RIGHT;

        const processedData = scrollable
            ? downsampleData(data, 5000)
            : downsampleData(data, Math.max(2, Math.floor(chartWidth)));
        const scaleX = chartWidth / Math.max(1, processedData.length - 1);

        const originalMaxIndex = Math.max(1, data.length - 1);
        const processedMaxIndex = Math.max(1, processedData.length - 1);
        const processedIndex = Math.round(
            (playbackSampleIndex / originalMaxIndex) * processedMaxIndex
        );
        const x = PADDING_LEFT + processedIndex * scaleX;

        const viewportWidth = screenWidth * 0.8;
        const targetScrollX = Math.max(0, x - viewportWidth / 2);

        const maxScrollX = Math.max(0, canvasWidth - viewportWidth);

        const finalScrollX = Math.min(maxScrollX, targetScrollX);

        if (scrollViewRef.current && (scrollViewRef.current as any).scrollTo) {
            (scrollViewRef.current as any).scrollTo({ x: finalScrollX, animated: true });
        }
    }, [playbackSampleIndex, followPlayback, scrollable, data]);

    return (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
            {fullscreenEnabled && (
                <View style={styles.fullscreenHeader}>
                    <TouchableOpacity onPress={() => setFullscreen(true)}>
                        <Text style={styles.fullscreenButton}>⛶</Text>
                    </TouchableOpacity>
                </View>
            )}

            {chartElement}

            {fullscreenEnabled && (
                <Modal visible={fullscreen} animationType="slide">
                    <View style={[styles.modalContent]}>
                        <View
                            style={[styles.fullscreenHeader, { margin: 15, alignSelf: 'flex-end' }]}
                        >
                            <Button title="Fechar" onPress={() => setFullscreen(false)} />
                        </View>
                        {chartElement}
                    </View>
                </Modal>
            )}
        </View>
    );
}
