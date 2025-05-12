import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';

import Home from '../screens/Home';
import Metering from '../screens/Metering';
import Patients from '../screens/Patients';
import FontAwesome5 from '@expo/vector-icons/FontAwesome5';

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

    return (
        <Tab.Navigator
            screenOptions={{ ...headerOptions, tabBarShowLabel: false }}
            initialRouteName="Metering"
        >
            <Tab.Screen
                name="Home"
                component={Home}
                options={{
                    tabBarIcon: ({ focused }) => (
                        <FontAwesome5 name="home" size={22} color={focused ? '#001d27' : 'gray'} />
                    ),
                    headerTitle: 'Últimas Auscultas',
                }}
            />
            <Tab.Screen
                name="Metering"
                component={Metering}
                options={{
                    tabBarIcon: ({ focused }) => (
                        <FontAwesome5
                            name="stethoscope"
                            size={22}
                            color={focused ? '#001d27' : 'gray'}
                        />
                    ),
                    headerTitle: 'Nova Ausculta',
                }}
            />
            <Tab.Screen
                name="Patients"
                component={Patients}
                options={{
                    tabBarIcon: ({ focused }) => (
                        <FontAwesome5
                            name="user-alt"
                            size={22}
                            color={focused ? '#001d27' : 'gray'}
                        />
                    ),
                    headerTitle: 'Pacientes',
                }}
            />
        </Tab.Navigator>
    );
}
