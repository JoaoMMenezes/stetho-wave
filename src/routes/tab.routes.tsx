import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';

import Home from '../screens/Home';
import Metering from '../screens/Metering';
import Patients from '../screens/Patients';
import FontAwesome5 from '@expo/vector-icons/FontAwesome5';
import { defaultTheme } from '@/themes/default';
import { View } from 'react-native';
import AudioBLEDebug from '@/components/TestBluetooth/AudioBLEDebug';

const Tab = createBottomTabNavigator();

export default function TabRoutes() {
    const headerOptions = {
        headerShown: true,
        headerTitleAlign: 'center' as 'center',
        headerTitleStyle: {
            fontSize: 30,
            color: 'white',
        },
        headerStyle: {
            shadowColor: '#000',
            height: 50,
            backgroundColor: '#228be6',
            shadowOffset: {
                width: 0,
                height: 10,
            },
        },
    };

    const getTabIcon =
        (iconName: string) =>
        ({ focused }: { focused: boolean }) =>
            (
                <View
                    style={{
                        borderColor: focused ? 'white' : 'transparent',
                        borderRadius: 25,
                        borderWidth: 2,
                        justifyContent: 'center',
                        alignItems: 'center',
                        height: 40,
                        width: 40,
                    }}
                >
                    <FontAwesome5
                        name={iconName}
                        size={20}
                        color={focused ? 'white' : defaultTheme.colors.background}
                    />
                </View>
            );

    return (
        <Tab.Navigator
            screenOptions={{
                ...headerOptions,
                tabBarShowLabel: false,
                tabBarStyle: {
                    height: 60,
                    marginHorizontal: '20%',
                    alignSelf: 'center',
                    position: 'absolute',
                    bottom: 16,
                    borderRadius: 15,
                    backgroundColor: defaultTheme.colors.primary,
                },
                tabBarItemStyle: {
                    height: 40,
                    alignSelf: 'center',
                },
                tabBarHideOnKeyboard: true,
            }}
            initialRouteName="Metering"
        >
            <Tab.Screen
                name="Home"
                component={Home}
                options={{
                    tabBarIcon: getTabIcon('home'),
                    headerTitle: 'Últimas Auscultas',
                }}
            />
            <Tab.Screen
                name="Metering"
                component={Metering}
                options={{
                    tabBarIcon: getTabIcon('stethoscope'),
                    headerTitle: 'Nova Ausculta',
                }}
            />
            <Tab.Screen
                name="Patients"
                component={Patients}
                options={{
                    tabBarIcon: getTabIcon('user-alt'),
                    headerTitle: 'Pacientes',
                }}
            />
        </Tab.Navigator>
    );
}
