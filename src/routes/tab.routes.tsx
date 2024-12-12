import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';

import Home from '../screens/Home';
import Metering from '../screens/Metering';
import Profile from '../screens/Profile';
import FontAwesome5 from '@expo/vector-icons/FontAwesome5';

const Tab = createBottomTabNavigator();

export default function TabRoutes() {
    return (
        <Tab.Navigator screenOptions={{ headerShown: false }}>
            <Tab.Screen
                name="Home"
                component={Home}
                options={{
                    tabBarIcon: ({ focused }) => (
                        <FontAwesome5 name="home" size={22} color={focused ? '#001d27' : 'gray'} />
                    ),
                    tabBarShowLabel: false,
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
                    tabBarShowLabel: false,
                }}
            />
            <Tab.Screen
                name="Profile"
                component={Profile}
                options={{
                    tabBarIcon: ({ focused }) => (
                        <FontAwesome5
                            name="user-alt"
                            size={22}
                            color={focused ? '#001d27' : 'gray'}
                        />
                    ),
                    tabBarShowLabel: false,
                }}
            />
        </Tab.Navigator>
    );
}
