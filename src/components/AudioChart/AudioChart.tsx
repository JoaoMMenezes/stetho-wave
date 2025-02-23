import React, { useRef, useEffect } from 'react';
import { LineChart } from 'react-native-chart-kit';
import { Dimensions, View, ScrollView } from 'react-native';

interface AudioChartProps {
    data: number[];
}

const AudioChart: React.FC<AudioChartProps> = ({ data }) => {
    const screenWidth = Dimensions.get('window').width;
    const scrollViewRef = useRef<ScrollView>(null);

    // let modifiedData = data; //data.length > 2 ? data.slice(1, -1) : data;
    let modifiedData = data.map((value) => value + 160);

    useEffect(() => {
        if (scrollViewRef.current) {
            scrollViewRef.current.scrollToEnd({ animated: false });
        }
    }, [data]);

    return (
        <View style={{ backgroundColor: 'pink', borderRadius: 16 }}>
            <ScrollView
                horizontal
                ref={scrollViewRef} // Atribui a referência ao ScrollView
            >
                <LineChart
                    xAxisLabel="Time"
                    data={{
                        labels: [],
                        datasets: [
                            {
                                data: modifiedData,
                                color: (opacity = 1) => `rgb(255, 68, 0)`,
                            },
                        ],
                    }}
                    width={Math.max(screenWidth * 0.8, modifiedData.length)}
                    height={320}
                    withShadow={false}
                    withDots={false}
                    // withVerticalLabels={true}
                    // withHorizontalLabels={true}
                    // withVerticalLines={false}
                    yAxisInterval={1}
                    // transparent={true}
                    chartConfig={{
                        backgroundGradientFromOpacity: 0,
                        backgroundGradientToOpacity: 0,
                        decimalPlaces: 1,
                        color: (opacity = 1) => `gray`,
                        style: {
                            borderRadius: 16,
                        },
                    }}
                    bezier
                />
            </ScrollView>
        </View>
    );
};

export default AudioChart;
