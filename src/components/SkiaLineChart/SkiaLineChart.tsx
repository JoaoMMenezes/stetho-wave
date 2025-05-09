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
        scrollViewRef.current?.scrollToEnd({ animated: true });
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

    if (!font) return null;

    const pointSpacing = 4;
    const maxY = Math.max(...data);
    const width = data.length * pointSpacing + padding * 2; // chart width

    const points = translateDataToPoints(data as number[]);
    const path = Skia.Path.Make();

    if (points.length > 0) {
        path.moveTo(points[0].x, points[0].y);
        points.slice(1).forEach((p) => path.lineTo(p.x, p.y));
    }

    function translateDataToPoints(data: number[]) {
        const maxY = Math.max(...data);

        return data.map((value, index) => ({
            x: index * pointSpacing + padding,
            y: (value / maxY) * (height - padding * 2) + padding,
        }));
    }

    const renderChart = (graphHeight: number) => (
        <View style={styles.chartContainer}>
            {/* Label y fixa */}
            <View
                style={[
                    styles.yAxis,
                    {
                        width: 40,
                        height: graphHeight,
                        paddingTop: padding / 2,
                        paddingBottom: padding,
                        justifyContent: 'space-around',
                    },
                ]}
            >
                {Array.from({ length: Math.floor(maxY / 20) + 1 }, (_, i) => {
                    const value = (Math.floor(maxY / 20) - i) * 20;
                    return (
                        <View key={`y-label-${i}`}>
                            <Text>{value}</Text>
                        </View>
                    );
                })}
            </View>

            <ScrollView
                horizontal
                ref={scrollViewRef}
                contentContainerStyle={[styles.scrollViewContent, { width, height: graphHeight }]}
            >
                <Canvas style={styles.canvas}>
                    {/* Grades horizontais */}
                    {Array.from({ length: Math.floor(maxY / 20) + 1 }, (_, i) => {
                        const value = i * 20;
                        const y =
                            graphHeight - ((value / maxY) * (graphHeight - padding * 2) + padding);
                        return (
                            <Line
                                key={`grid-h-${i}`}
                                p1={{ x: padding, y }}
                                p2={{ x: width - padding, y }}
                                color="#e0e0e0"
                                strokeWidth={1}
                            />
                        );
                    })}

                    {/* Grades verticais */}
                    {points
                        .filter((_, i) => i % 20 === 0)
                        .map((p, i) => (
                            <Line
                                key={`grid-v-${i}`}
                                p1={{ x: p.x, y: padding }}
                                p2={{ x: p.x, y: graphHeight - padding }}
                                color="#e0e0e0"
                                strokeWidth={1}
                            />
                        ))}

                    {/* Eixos */}
                    <Line
                        p1={{ x: padding, y: graphHeight - padding }}
                        p2={{ x: width - padding, y: graphHeight - padding }}
                        color="black"
                        strokeWidth={2}
                    />
                    <Line
                        p1={{ x: padding, y: padding }}
                        p2={{ x: padding, y: graphHeight - padding }}
                        color="black"
                        strokeWidth={2}
                    />

                    {/* Linha de dados */}
                    <Path path={path} color="blue" style="stroke" strokeWidth={2} />

                    {/* Labels X */}
                    {points
                        .filter((_, i) => i % 20 === 0)
                        .map((p, i) => (
                            <SkiaText
                                key={`x-label-${i}`}
                                x={p.x - 10}
                                y={graphHeight - padding + 20}
                                text={`${i * 20 || 0}`}
                                font={font}
                                color="black"
                            />
                        ))}
                </Canvas>
            </ScrollView>
        </View>
    );

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
